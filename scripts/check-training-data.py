#!/usr/bin/env python3
"""Vérifie le manifeste des données d'entraînement et refuse les fichiers.

Aucun fichier d'entraînement ne doit être versionné dans `data/training/`.
Une source ne peut être `usable` que si sa licence et ses preuves sont
renseignées. Voir docs/TRAINING_DATA_AUDIT.md.
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRAINING = ROOT / "data" / "training"
SOURCES = TRAINING / "sources.csv"
ALLOWED_LICENSES = {"CC0-1.0", "CC-BY-4.0", "public-domain", "MIT"}
VERDICTS = {"blocked", "permission_required", "usable"}
REQUIRED = {
    "file",
    "sha256",
    "format",
    "rows",
    "source_url",
    "license_claim",
    "rights_holder",
    "evidence_url",
    "verdict",
    "notes",
}
ALLOWED_DATA_SUFFIXES = {
    ".parquet",
    ".jsonl",
    ".txt",
    ".tsv",
    ".xlsx",
    ".wav",
    ".mp3",
    ".ogg",
}


def main() -> int:
    errors: list[str] = []
    if not SOURCES.exists():
        print(f"Manifeste introuvable : {SOURCES}", file=sys.stderr)
        return 1

    with SOURCES.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        fields = set(reader.fieldnames or [])
        rows = list(reader)

    missing = REQUIRED - fields
    if missing:
        errors.append(
            f"sources.csv: colonnes manquantes {', '.join(sorted(missing))}"
        )

    counts = {verdict: 0 for verdict in VERDICTS}
    for index, row in enumerate(rows, start=2):
        verdict = (row.get("verdict") or "").strip()
        if verdict not in VERDICTS:
            errors.append(f"sources.csv#{index}: verdict inconnu {verdict!r}")
            continue
        counts[verdict] += 1
        if verdict != "usable":
            continue
        license_claim = (row.get("license_claim") or "").strip()
        if license_claim not in ALLOWED_LICENSES:
            errors.append(
                f"sources.csv#{index}: licence {license_claim!r} non autorisée"
            )
        for field in ("rights_holder", "evidence_url"):
            if not (row.get(field) or "").strip():
                errors.append(f"sources.csv#{index}: {field} manquant")

    for path in TRAINING.iterdir():
        if path.name in {"README.md", "sources.csv"}:
            continue
        if path.suffix.lower() in ALLOWED_DATA_SUFFIXES:
            errors.append(
                f"fichier de données versionné interdit : {path.name}"
            )

    if errors:
        print("Données d'entraînement invalides :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(
        f"Manifeste d'entraînement OK — {len(rows)} sources : "
        f"{counts['blocked']} bloquées, "
        f"{counts['permission_required']} sous autorisation, "
        f"{counts['usable']} utilisables ; aucun fichier de données versionné."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
