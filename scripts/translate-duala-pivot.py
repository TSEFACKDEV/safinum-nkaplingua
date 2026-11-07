#!/usr/bin/env python3
"""Traduction expérimentale français → anglais → duala.

Le modèle duala est celui entraîné par `scripts/train-duala-mt.py`. Le pivot
français → anglais utilise `Helsinki-NLP/opus-mt-fr-en` (Apache-2.0).

Usage :
    server/.venv/bin/python scripts/translate-duala-pivot.py \
      --model dist/models/duala-en-pilot \
      --text "Votre solde est disponible."

Ce script est une démonstration hors extension. Il ne doit pas être utilisé
pour le niveau A (solde, frais, PIN/OTP, erreurs, confirmation, sécurité).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--text", default=None)
    parser.add_argument("--input", type=Path, default=None)
    parser.add_argument("--pivot-model", default="Helsinki-NLP/opus-mt-fr-en")
    parser.add_argument("--max-length", type=int, default=128)
    args = parser.parse_args()

    if not args.model.exists():
        print(f"Modèle duala introuvable : {args.model}", file=sys.stderr)
        return 1
    if not args.text and not args.input:
        print("Fournir --text ou --input.", file=sys.stderr)
        return 1

    import torch
    from transformers import MarianMTModel, MarianTokenizer

    device = torch.device("cpu")
    pivot_tok = MarianTokenizer.from_pretrained(args.pivot_model)
    pivot_model = MarianMTModel.from_pretrained(args.pivot_model).to(device)
    duala_tok = MarianTokenizer.from_pretrained(args.model)
    duala_model = MarianMTModel.from_pretrained(args.model).to(device)

    texts = [args.text] if args.text else [
        line.strip()
        for line in args.input.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

    for text in texts:
        with torch.no_grad():
            pivot_inputs = pivot_tok(
                [text],
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=args.max_length,
            ).to(device)
            english_ids = pivot_model.generate(
                **pivot_inputs,
                max_length=args.max_length,
                num_beams=4,
            )
            english = pivot_tok.batch_decode(
                english_ids, skip_special_tokens=True
            )[0]

            duala_inputs = duala_tok(
                [english],
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=args.max_length,
            ).to(device)
            duala_ids = duala_model.generate(
                **duala_inputs,
                max_length=args.max_length,
                num_beams=4,
            )
            duala = duala_tok.batch_decode(
                duala_ids, skip_special_tokens=True
            )[0]

        print(f"FR: {text}")
        print(f"EN: {english}")
        print(f"DUA: {duala}")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
