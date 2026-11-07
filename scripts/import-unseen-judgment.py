#!/usr/bin/env python3
"""Importe les verdicts natifs des 20 phrases inédites.

Usage :
    python3 scripts/import-unseen-judgment.py --dry-run
    python3 scripts/import-unseen-judgment.py

Lit `data/review/unseen_judgment.csv` (rempli par un natif) et met à jour
`docs/UNSEEN_JUDGMENT.csv`. Valeurs acceptées : `acceptable`, `trompeur`,
`faux`. Un verdict exige un relecteur et une date ISO.
"""

from __future__ import annotations

import argparse
import csv
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / "data" / "review" / "unseen_judgment.csv"
CANONICAL = ROOT / "docs" / "UNSEEN_JUDGMENT.csv"
LANGS = ("fub", "ewo", "dua")
VERDICTS = {"acceptable", "trompeur", "faux"}


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


def iso_date(value: str) -> bool:
    try:
        date.fromisoformat(value)
        return True
    except (TypeError, ValueError):
        return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--review", type=Path, default=REVIEW)
    parser.add_argument("--canonical", type=Path, default=CANONICAL)
    args = parser.parse_args()

    if not args.review.exists():
        print(f"Fiche de jugement introuvable : {args.review}", file=sys.stderr)
        return 1
    fields, canonical_rows = read_csv(args.canonical)
    _, review_rows = read_csv(args.review)
    canonical = {row["id"]: row for row in canonical_rows}
    errors: list[str] = []
    counts = {lang: 0 for lang in LANGS}

    for index, row in enumerate(review_rows, start=2):
        row_id = (row.get("id") or "").strip()
        target = canonical.get(row_id)
        if target is None:
            errors.append(f"ligne {index}: id inconnu {row_id!r}")
            continue
        for lang in LANGS:
            verdict = (row.get(f"verdict_{lang}") or "").strip()
            if not verdict:
                continue
            if verdict not in VERDICTS:
                errors.append(
                    f"ligne {index}/{lang}: verdict inconnu {verdict!r}"
                )
                continue
            reviewer = (row.get(f"reviewer_{lang}") or "").strip()
            reviewed_at = (row.get(f"date_{lang}") or "").strip()
            if not reviewer:
                errors.append(
                    f"ligne {index}/{lang}: reviewer obligatoire"
                )
            if not iso_date(reviewed_at):
                errors.append(
                    f"ligne {index}/{lang}: date ISO obligatoire"
                )
            target[f"verdict_{lang}"] = verdict
            target[f"commentaire_{lang}"] = (
                row.get(f"commentaire_{lang}") or ""
            ).strip()
            target[f"reviewer_{lang}"] = reviewer
            target[f"date_{lang}"] = reviewed_at
            counts[lang] += 1

    if errors:
        print("Import refusé :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 2

    if not any(counts.values()):
        print("Aucun verdict rempli : rien à importer.")
        return 0

    if args.dry_run:
        print(
            "Mode dry-run : "
            f"fub {counts['fub']}, ewo {counts['ewo']}, "
            f"dua {counts['dua']} verdict(s)."
        )
        return 0

    write_csv(args.canonical, fields, canonical_rows)
    print(
        f"Verdicts importés : fub {counts['fub']}, ewo {counts['ewo']}, "
        f"dua {counts['dua']}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
