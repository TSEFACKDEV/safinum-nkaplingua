#!/usr/bin/env python3
"""Vérifie que les classeurs natifs T1/T2 sont synchronisés avec les sources."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / "data" / "review"
LABELS = {"fub": "fulfulde", "ewo": "ewondo", "dua": "duala"}
EXPECTED = {"fub": 212, "ewo": 130, "dua": 130}


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> int:
    errors: list[str] = []
    manifest_path = REVIEW / "manifest.json"
    if not manifest_path.exists():
        print("manifest.json manquant : lancez scripts/make-native-kit.py")
        return 1
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    for code, label in LABELS.items():
        t1_path = REVIEW / f"{label}.t1.csv"
        t2_path = REVIEW / f"{label}.t2.csv"
        if not t1_path.exists() or not t2_path.exists():
            errors.append(f"{code}: classeur T1 ou T2 manquant")
            continue
        t1 = read_csv(t1_path)
        t2 = read_csv(t2_path)
        if len(t1) != EXPECTED[code]:
            errors.append(
                f"{code}: {len(t1)} lignes, {EXPECTED[code]} attendues"
            )
        model = {row["item_id"]: row for row in t1}
        if len(model) != len(t1):
            errors.append(f"{code}: item_id dupliqué dans T1")
        counterpart = {row["item_id"]: row for row in t2}
        if set(model) != set(counterpart):
            errors.append(f"{code}: T1 et T2 ne couvrent pas les mêmes items")
        for item_id, row in model.items():
            other = counterpart.get(item_id)
            if other is None:
                continue
            if row["source_fr"] != other["source_fr"]:
                errors.append(f"{code}/{item_id}: sources T1/T2 différentes")
            if row["type"] not in {"glossaire", "message", "phrase"}:
                errors.append(f"{code}/{item_id}: type inconnu")
            if row["priorite"] not in {"P0", "P1", "P2"}:
                errors.append(f"{code}/{item_id}: priorité inconnue")
            if row.get("provenance") != "human":
                errors.append(f"{code}/{item_id}: provenance human attendue")
            if not row.get("source_fr"):
                errors.append(f"{code}/{item_id}: source vide")

        expected_manifest = manifest.get("languages", {}).get(code, {})
        if expected_manifest.get("rows") != len(t1):
            errors.append(f"{code}: manifest.rows désynchronisé")

    if not (REVIEW / "unseen_judgment.csv").exists():
        errors.append("unseen_judgment.csv manquant")
    else:
        unseen = read_csv(REVIEW / "unseen_judgment.csv")
        if len(unseen) != 20:
            errors.append(f"unseen_judgment : {len(unseen)} lignes, 20 attendues")

    if errors:
        print("Kit natif invalide :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(
        "Kit natif OK — fulfulde 212, ewondo 130, duala 130, "
        "unseen 20, manifeste synchronisé"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
