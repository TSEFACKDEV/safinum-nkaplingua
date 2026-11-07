#!/usr/bin/env python3
"""Enregistre un classeur T1 rempli comme brouillon, sans validation.

Usage :
    python3 scripts/import-draft-kit.py --lang fub
    python3 scripts/import-draft-kit.py --lang ewo --dry-run

Ce mode est prévu quand un seul natif est disponible. Il permet de conserver
son travail dans les fichiers canoniques, mais **aucune ligne ne passe en
`validated`** : l'extension continue d'afficher l'original tant que T2 et
l'arbitre n'ont pas terminé TRAPD.

Le script refuse un jeton ou un terme critique modifié.
"""

from __future__ import annotations

import argparse
import csv
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / "data" / "review"
LABELS = {"fub": "fulfulde", "ewo": "ewondo", "dua": "duala"}
TOKEN_RE = re.compile(r"\[\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\]", re.I)
DNT_TERMS = ("FCFA", "XAF", "PIN", "OTP", "KYC", "FINAKA")


def read_csv(path: Path) -> tuple[list[str], list[dict]]:
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fields: list[str], rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=fields, lineterminator="\n"
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


def tokens(text: str) -> list[str]:
    return [
        f"[[{match.group(1).upper()}_{match.group(2)}]]"
        for match in TOKEN_RE.finditer(text)
    ]


def has_term(text: str, term: str) -> bool:
    return bool(
        re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text, flags=re.I)
    )


def check_text(source: str, target: str, label: str) -> list[str]:
    errors: list[str] = []
    for token in tokens(source):
        if target.count(token) != 1:
            errors.append(f"{label}: jeton {token} absent ou dupliqué")
    for term in DNT_TERMS:
        if has_term(source, term) and not has_term(target, term):
            errors.append(f"{label}: terme critique {term} manquant")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=sorted(LABELS), required=True)
    parser.add_argument("--file", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    label = LABELS[args.lang]
    source_path = args.file or REVIEW / f"{label}.t1.csv"
    if not source_path.exists():
        print(f"Classeur introuvable : {source_path}", file=sys.stderr)
        return 1

    _, kit_rows = read_csv(source_path)
    errors: list[str] = []
    filled = [row for row in kit_rows if (row.get("target") or "").strip()]
    for index, row in enumerate(kit_rows, start=2):
        target = (row.get("target") or "").strip()
        if not target:
            continue
        errors.extend(
            check_text(
                (row.get("source_fr") or "").strip(),
                target,
                f"{row.get('item_id')} (ligne {index})",
            )
        )
    if errors:
        print("Import brouillon refusé :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 2
    if not filled:
        print("Aucune cible remplie : rien à importer.")
        return 0

    glossary_path = ROOT / "data" / "glossary.template.csv"
    glossary_fields, glossary_rows = read_csv(glossary_path)
    messages_path = ROOT / "data" / "site-officiel" / "messages.fr-en.csv"
    message_fields, message_rows = read_csv(messages_path)
    pack_path = ROOT / "data" / "language-packs" / f"{args.lang}.csv"
    pack_fields, pack_rows = read_csv(pack_path)
    messages_by_id = {row["id"]: row for row in message_rows}
    prefix = args.lang.upper()
    counts = {"glossaire": 0, "message": 0, "phrase": 0}

    for row in filled:
        item_id = (row.get("item_id") or "").strip()
        target = (row.get("target") or "").strip()
        reviewer = (row.get("reviewer") or "").strip()
        reviewed_at = (row.get("reviewed_at") or "").strip()
        license_id = (row.get("license") or "").strip()
        item_type = row.get("type")
        if item_type == "glossaire":
            match = re.fullmatch(r"G(\d+)", item_id)
            if not match:
                continue
            canonical = glossary_rows[int(match.group(1)) - 1]
            if canonical["source_fr"] != row["source_fr"]:
                errors.append(f"{item_id}: source désynchronisée")
                continue
            canonical[f"target_{args.lang}"] = target
            if reviewer:
                canonical[f"reviewer_{args.lang}"] = reviewer
            if canonical.get("status") == "a_traduire":
                canonical["status"] = "en_cours"
            counts["glossaire"] += 1
        elif item_type == "message":
            canonical = messages_by_id.get(item_id)
            if canonical is None:
                continue
            if canonical["source_fr"] != row["source_fr"]:
                errors.append(f"{item_id}: source désynchronisée")
                continue
            canonical[f"target_{args.lang}"] = target
            canonical[f"statut_{args.lang}"] = "en_cours"
            if reviewer:
                canonical[f"reviewer_{args.lang}"] = reviewer
            if reviewed_at:
                canonical[f"reviewed_at_{args.lang}"] = reviewed_at
            if license_id:
                canonical[f"license_{args.lang}"] = license_id
            canonical[f"provenance_{args.lang}"] = "human"
            counts["message"] += 1
        elif item_type == "phrase":
            match = re.fullmatch(rf"{prefix}-(\d+)", item_id)
            if not match:
                continue
            canonical = pack_rows[int(match.group(1)) - 1]
            if canonical["source"] != row["source_fr"]:
                errors.append(f"{item_id}: source désynchronisée")
                continue
            if canonical.get("status") == "validated":
                continue
            canonical["target"] = target
            canonical["status"] = "draft"
            if reviewer:
                canonical["reviewer"] = reviewer
            if reviewed_at:
                canonical["reviewed_at"] = reviewed_at
            if license_id:
                canonical["license"] = license_id
            canonical["provenance"] = "human"
            counts["phrase"] += 1

    if errors:
        print("Import brouillon refusé :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 2

    # Recalcul des statuts globaux sans jamais valider.
    for row in message_rows:
        statuses = [
            (row.get(f"statut_{lang}") or "").strip() for lang in LABELS
        ]
        if any(status == "valide" for status in statuses):
            row["statut"] = "partiel" if not all(
                status == "valide" for status in statuses
            ) else "valide"
        elif any(status == "en_cours" for status in statuses):
            row["statut"] = "en_cours"
        else:
            row["statut"] = "a_traduire"

    if args.dry_run:
        print(
            f"Mode dry-run : {counts['glossaire']} glossaire, "
            f"{counts['message']} messages, {counts['phrase']} phrases."
        )
        return 0

    write_csv(glossary_path, glossary_fields, glossary_rows)
    write_csv(messages_path, message_fields, message_rows)
    write_csv(pack_path, pack_fields, pack_rows)

    result = subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts" / "import-language-pack.py"),
            str(pack_path),
            "--allow-draft",
        ],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        print(f"Échec de l'import du pack :\n{result.stderr}", file=sys.stderr)
        return 3
    print(result.stdout.strip())
    print(
        f"{label} : {counts['glossaire']} glossaire, "
        f"{counts['message']} messages, {counts['phrase']} phrases "
        "enregistrés comme brouillons. Aucune validation."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
