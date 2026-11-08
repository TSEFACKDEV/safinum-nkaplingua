#!/usr/bin/env python3
"""Test réel de scripts/audit-native-reviews.py.

Fixtures fictives : une ligne « Tafsiri », une copie du français, une
traduction propre et un T2 identique à T1. Aucun contenu natif réel.
"""

from __future__ import annotations

import csv
import runpy
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "audit-native-reviews.py"

FIELDS = [
    "item_id",
    "type",
    "priorite",
    "source_fr",
    "source_en",
    "contexte",
    "consigne",
    "target",
    "commentaire",
    "reviewer",
    "reviewed_at",
    "license",
    "provenance",
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def write_rows(path: Path, rows: list[list[str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(FIELDS)
        writer.writerows(rows)


def main() -> int:
    audit = runpy.run_path(str(SCRIPT), run_name="auditmod")
    check_target = audit["check_target"]
    is_technical = audit["is_technical"]

    # 1. Détection directe des signaux.
    assert_true(
        "mt_prefix" in check_target("Bonjour", "Tafsiri: Bonjour", "fub"),
        "préfixe machine non détecté",
    )
    assert_true(
        "source_copy" in check_target("Facture électricité", "Facture électricité", "ewo"),
        "copie du français non détectée",
    )
    assert_true(
        "source_copy_truncated"
        in check_target("Le numéro du bénéficiaire", "Le numéro", "fub"),
        "troncature non détectée",
    )
    assert_true(
        "dnt_missing" in check_target("Code PIN obligatoire", "Code obligatoire", "dua"),
        "PIN perdu non détecté",
    )
    assert_true(
        is_technical("Code PIN", "code PIN"),
        "Code PIN devrait être technique",
    )
    assert_true(
        is_technical("[[NUM_0]] FCFA", "[[NUM_0]] FCFA"),
        "montant seul devrait être technique",
    )

    with tempfile.TemporaryDirectory() as temporary:
        review = Path(temporary)
        rows = [
            [
                "FUB-001",
                "phrase",
                "P0",
                "Bonjour",
                "Hello",
                "test",
                "",
                "Tafsiri: Bonjour",
                "",
                "T1",
                "2026-11-08",
                "CC-BY-4.0",
                "human",
            ],
            [
                "FUB-002",
                "phrase",
                "P0",
                "Facture électricité",
                "Electricity bill",
                "test",
                "",
                "Facture électricité",
                "",
                "T1",
                "2026-11-08",
                "CC-BY-4.0",
                "human",
            ],
            [
                "FUB-003",
                "phrase",
                "P0",
                "Solde disponible",
                "Available balance",
                "test",
                "",
                "Jawdindi ndi yami",
                "",
                "T1",
                "2026-11-08",
                "CC-BY-4.0",
                "human",
            ],
        ]
        write_rows(review / "fulfulde.t1.csv", rows)
        # T2 identique à T1 : l'audit doit conclure « copié ».
        write_rows(review / "fulfulde.t2.csv", rows)
        audit["audit_language"].__globals__["REVIEW"] = review
        report = audit["audit_language"]("fub")
        assert_true(
            report["t1"]["hard_rows"] >= 2,
            f"lignes dures T1 : {report['t1']['hard_rows']}",
        )
        assert_true(
            report["independence"]["verdict"] == "copied",
            f"indépendance : {report['independence']}",
        )
        assert_true(
            report["independence"]["exact"] == 3,
            "T1/T2 devraient être identiques",
        )

    print("audit-native-reviews OK — préfixe, copie, troncature, PIN, indépendance")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
