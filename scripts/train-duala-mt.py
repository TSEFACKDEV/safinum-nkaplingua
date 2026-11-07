#!/usr/bin/env python3
"""Entraîne un modèle Marian anglais → duala sur les paires OPUS MT560.

Les données doivent être licenciées CC-BY-4.0 (dataset
`michsethowusu/english-duala_sentence-pairs_mt560`, original OPUS MT560).
Le script refuse de démarrer si le fichier n'est pas explicitement autorisé
dans `data/training/sources.csv`.

Usage (avec le venv du backend) :
    server/.venv/bin/python scripts/train-duala-mt.py \
      --csv "/home/klein/.tmp/opencode/langue-zip/Langue/Duala/texte/Duala_anglais.csv" \
      --output dist/models/duala-en --max-pairs 2000 --epochs 1

Pilote rapide :
    server/.venv/bin/python scripts/train-duala-mt.py --csv ... --dry-run
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import random
import re
import sys
import time
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "training" / "sources.csv"
ALLOWED_LICENSES = {"CC0-1.0", "CC-BY-4.0", "public-domain", "MIT"}


def clean(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    # Recoller les diacritiques séparés par une espace dans la source.
    text = re.sub(r"\s+([\u0300-\u036f])", r"\1", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def load_pairs(path: Path) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fields = set(reader.fieldnames or [])
        if not {"eng", "dua"}.issubset(fields):
            raise SystemExit(
                "Le CSV doit contenir les colonnes eng et dua ; "
                f"trouvé : {sorted(fields)}"
            )
        for row in reader:
            src = clean(row.get("eng") or "")
            tgt = clean(row.get("dua") or "")
            if len(src) < 2 or len(tgt) < 2:
                continue
            if len(src) > 400 or len(tgt) > 400:
                continue
            key = (src, tgt)
            if key in seen:
                continue
            seen.add(key)
            pairs.append(key)
    return pairs


def check_license() -> list[str]:
    errors: list[str] = []
    if not SOURCES.exists():
        return [f"manifeste introuvable : {SOURCES}"]
    with SOURCES.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    duala = [
        row
        for row in rows
        if "duala" in (row.get("file") or "").lower()
        or "duala" in (row.get("source_url") or "").lower()
    ]
    if not duala:
        return ["aucune source Duala dans data/training/sources.csv"]
    for row in duala:
        if row.get("verdict") != "usable":
            errors.append(
                f"{row.get('file')}: verdict {row.get('verdict')!r}, "
                "attendu usable"
            )
        if (row.get("license_claim") or "").strip() not in ALLOWED_LICENSES:
            errors.append(
                f"{row.get('file')}: licence "
                f"{row.get('license_claim')!r} non autorisée"
            )
        if not (row.get("evidence_url") or "").strip():
            errors.append(f"{row.get('file')}: evidence_url manquant")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--base-model", default="Helsinki-NLP/opus-mt-en-fr")
    parser.add_argument("--max-pairs", type=int, default=0)
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--max-length", type=int, default=96)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--freeze-encoder", action="store_true", default=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    errors = check_license()
    if errors:
        print("Entraînement refusé :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 2
    if not args.csv.exists():
        print(f"CSV introuvable : {args.csv}", file=sys.stderr)
        return 1

    pairs = load_pairs(args.csv)
    random.Random(args.seed).shuffle(pairs)
    if args.max_pairs:
        pairs = pairs[: args.max_pairs]
    if len(pairs) < 10:
        print("Pas assez de paires après nettoyage.", file=sys.stderr)
        return 1

    split = int(len(pairs) * 0.9)
    val_split = int(len(pairs) * 0.95)
    train = pairs[:split]
    valid = pairs[split:val_split]
    print(
        f"{len(pairs)} paires propres · train {len(train)} · "
        f"valid {len(valid)} · base {args.base_model}"
    )
    for src, tgt in train[:3]:
        print(f"  EN: {src[:100]}")
        print(f"  DUA: {tgt[:100]}")
    if args.dry_run:
        return 0

    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    import torch
    from transformers import MarianMTModel, MarianTokenizer

    torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))
    device = torch.device("cpu")
    tokenizer = MarianTokenizer.from_pretrained(args.base_model)
    model = MarianMTModel.from_pretrained(args.base_model).to(device)
    if args.freeze_encoder:
        for parameter in model.model.encoder.parameters():
            parameter.requires_grad = False
    model.train()

    optimizer = torch.optim.AdamW(
        [p for p in model.parameters() if p.requires_grad],
        lr=args.lr,
    )

    def encode(batch: list[tuple[str, str]]):
        sources = [item[0] for item in batch]
        targets = [item[1] for item in batch]
        model_inputs = tokenizer(
            sources,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=args.max_length,
        ).to(device)
        labels = tokenizer(
            text_target=targets,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=args.max_length,
        ).input_ids.to(device)
        labels[labels == tokenizer.pad_token_id] = -100
        return model_inputs, labels

    def batches(items: list[tuple[str, str]]):
        for start in range(0, len(items), args.batch_size):
            yield items[start : start + args.batch_size]

    started = time.time()
    history = []
    global_step = 0
    for epoch in range(1, args.epochs + 1):
        epoch_loss = 0.0
        steps = 0
        for batch in batches(train):
            model_inputs, labels = encode(batch)
            outputs = model(**model_inputs, labels=labels)
            loss = outputs.loss
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(
                [p for p in model.parameters() if p.requires_grad], 1.0
            )
            optimizer.step()
            epoch_loss += float(loss)
            steps += 1
            global_step += 1
            if steps % 20 == 0:
                print(
                    f"epoch {epoch} step {steps}/{math.ceil(len(train)/args.batch_size)} "
                    f"loss {epoch_loss/steps:.3f}",
                    flush=True,
                )
        train_loss = epoch_loss / max(1, steps)
        model.eval()
        val_loss = 0.0
        val_steps = 0
        with torch.no_grad():
            for batch in batches(valid):
                model_inputs, labels = encode(batch)
                val_loss += float(model(**model_inputs, labels=labels).loss)
                val_steps += 1
        val_loss = val_loss / max(1, val_steps)
        history.append(
            {
                "epoch": epoch,
                "train_loss": round(train_loss, 4),
                "valid_loss": round(val_loss, 4),
                "steps": global_step,
            }
        )
        print(
            f"epoch {epoch} terminé · train {train_loss:.4f} · "
            f"valid {val_loss:.4f}",
            flush=True,
        )
        model.train()

    args.output.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(args.output)
    tokenizer.save_pretrained(args.output)
    metrics = {
        "base_model": args.base_model,
        "data": "michsethowusu/english-duala_sentence-pairs_mt560",
        "data_license": "CC-BY-4.0",
        "pairs_total": len(pairs),
        "pairs_train": len(train),
        "pairs_valid": len(valid),
        "max_pairs": args.max_pairs,
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "lr": args.lr,
        "freeze_encoder": args.freeze_encoder,
        "history": history,
        "duration_seconds": round(time.time() - started, 1),
    }
    (args.output / "metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (args.output / "MODEL_CARD.md").write_text(
        "# NkapLingua — modèle anglais → duala\n\n"
        "- Base : `Helsinki-NLP/opus-mt-en-fr` (Apache-2.0).\n"
        "- Données : `michsethowusu/english-duala_sentence-pairs_mt560` "
        "(CC-BY-4.0), original OPUS MT560.\n"
        "- Usage : expérimental, niveau B/C uniquement. Le niveau A reste "
        "réservé aux packs validés par des natifs.\n"
        "- Limite : texte religieux, pas finance ; qualité à évaluer.\n",
        encoding="utf-8",
    )

    # Quelques exemples de génération.
    model.eval()
    sample = valid[:3]
    if sample:
        model_inputs, _ = encode(sample)
        with torch.no_grad():
            generated = model.generate(
                **model_inputs,
                max_length=args.max_length,
                num_beams=2,
            )
        decoded = tokenizer.batch_decode(generated, skip_special_tokens=True)
        for (src, ref), hyp in zip(sample, decoded):
            print(f"EN: {src[:100]}")
            print(f"REF: {ref[:100]}")
            print(f"HYP: {hyp[:100]}")
    print(f"Modèle écrit dans {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
