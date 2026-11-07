#!/usr/bin/env python3
"""Fusionne les traductions T1 et T2 et prépare la fiche d'arbitrage TRAPD.

Usage :
    python3 scripts/merge-native-reviews.py --lang fub
    python3 scripts/merge-native-reviews.py --lang ewo
    python3 scripts/merge-native-reviews.py --lang dua

Le script ne choisit aucune traduction. Il aligne les deux propositions,
calcule l'accord et laisse les colonnes `decision`, `statut`, `arbitre`,
`date` et `license` à remplir par l'arbitre.
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / "data" / "review"
LABELS = {"fub": "fulfulde", "ewo": "ewondo", "dua": "duala"}
FIELDS = [
    "item_id",
    "type",
    "priorite",
    "source_fr",
    "source_en",
    "contexte",
    "consigne",
    "target_t1",
    "target_t2",
    "commentaire_t1",
    "commentaire_t2",
    "reviewer_t1",
    "reviewed_at_t1",
    "license_t1",
    "reviewer_t2",
    "reviewed_at_t2",
    "license_t2",
    "accord",
    "decision",
    "statut",
    "arbitre",
    "date",
    "license",
]


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip()).casefold()


def agreement(left: str, right: str) -> str:
    left = (left or "").strip()
    right = (right or "").strip()
    if not left and not right:
        return ""
    if not left or not right:
        return "incomplet"
    return "oui" if normalize(left) == normalize(right) else "non"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=sorted(LABELS), required=True)
    parser.add_argument("--t1", type=Path, default=None)
    parser.add_argument("--t2", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    label = LABELS[args.lang]
    t1_path = args.t1 or REVIEW / f"{label}.t1.csv"
    t2_path = args.t2 or REVIEW / f"{label}.t2.csv"
    out_path = args.out or REVIEW / f"{label}.arbitrage.csv"

    for path in (t1_path, t2_path):
        if not path.exists():
            print(f"Fichier introuvable : {path}", file=sys.stderr)
            return 1

    t1_rows = read_csv(t1_path)
    t2_rows = read_csv(t2_path)
    t1 = {row["item_id"]: row for row in t1_rows}
    t2 = {row["item_id"]: row for row in t2_rows}

    if set(t1) != set(t2):
        missing_t1 = sorted(set(t2) - set(t1))
        missing_t2 = sorted(set(t1) - set(t2))
        print("Les classeurs T1 et T2 ne couvrent pas les mêmes items.", file=sys.stderr)
        if missing_t1:
            print(f"  - absents de T1 : {', '.join(missing_t1)}", file=sys.stderr)
        if missing_t2:
            print(f"  - absents de T2 : {', '.join(missing_t2)}", file=sys.stderr)
        return 2

    rows = []
    both = 0
    agreed = 0
    disagreements = 0
    incomplete = 0
    p0_missing = 0
    for item_id in t1:
        left = t1[item_id]
        right = t2[item_id]
        if left["source_fr"] != right["source_fr"]:
            print(
                f"Source désynchronisée pour {item_id} : "
                "régénérez les classeurs.",
                file=sys.stderr,
            )
            return 2
        target_t1 = (left.get("target") or "").strip()
        target_t2 = (right.get("target") or "").strip()
        accord = agreement(target_t1, target_t2)
        if target_t1 and target_t2:
            both += 1
        if accord == "oui":
            agreed += 1
        elif accord == "non":
            disagreements += 1
        elif accord == "incomplet":
            incomplete += 1
        if left["priorite"] == "P0" and not target_t1:
            p0_missing += 1
        rows.append(
            {
                "item_id": item_id,
                "type": left["type"],
                "priorite": left["priorite"],
                "source_fr": left["source_fr"],
                "source_en": left.get("source_en", ""),
                "contexte": left.get("contexte", ""),
                "consigne": left.get("consigne", ""),
                "target_t1": target_t1,
                "target_t2": target_t2,
                "commentaire_t1": (left.get("commentaire") or "").strip(),
                "commentaire_t2": (right.get("commentaire") or "").strip(),
                "reviewer_t1": (left.get("reviewer") or "").strip(),
                "reviewed_at_t1": (left.get("reviewed_at") or "").strip(),
                "license_t1": (left.get("license") or "").strip(),
                "reviewer_t2": (right.get("reviewer") or "").strip(),
                "reviewed_at_t2": (right.get("reviewed_at") or "").strip(),
                "license_t2": (right.get("license") or "").strip(),
                "accord": accord,
                "decision": "",
                "statut": "",
                "arbitre": "",
                "date": "",
                "license": "",
            }
        )

    rows.sort(
        key=lambda row: (
            {"P0": 0, "P1": 1, "P2": 2}.get(row["priorite"], 9),
            row["item_id"],
        )
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=FIELDS, lineterminator="\n"
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Arbitrage prêt : {out_path}")
    print(
        f"  {len(rows)} items · T1+T2 remplis : {both} · "
        f"accord : {agreed} · désaccord : {disagreements} · "
        f"incomplet : {incomplete}"
    )
    if p0_missing:
        print(f"  attention : {p0_missing} item(s) P0 sans traduction T1")
    print(
        "  L'arbitre remplit decision, statut=valide/rejete, arbitre, date, "
        "license, puis lance scripts/import-native-reviews.py."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
