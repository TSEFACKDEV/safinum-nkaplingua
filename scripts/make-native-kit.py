#!/usr/bin/env python3
"""Génère les classeurs de traduction native T1/T2 et la fiche d'arbitrage.

Sortie par défaut : `data/review/`.

- `<langue>.t1.csv` : traducteur 1 ;
- `<langue>.t2.csv` : traducteur 2, identique au départ, à remplir sans voir T1 ;
- `unseen_judgment.csv` : copie de la fiche de jugement des 20 phrases inédites ;
- `manifest.json` : nombres de lignes, priorités et empreintes des sources.

Aucune traduction n'est inventée : les colonnes `target` restent vides.
"""

from __future__ import annotations

import csv
import hashlib
import json
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "review"
LANGS = {"fub": "fulfulde", "ewo": "ewondo", "dua": "duala"}
PRIORITY_RANK = {"P0": 0, "P1": 1, "P2": 2}
TYPE_RANK = {"glossaire": 0, "message": 1, "phrase": 2}

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


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def glossary_rows() -> list[dict]:
    rows = read_csv(ROOT / "data" / "glossary.template.csv")
    result = []
    for index, row in enumerate(rows, start=1):
        domain = (row.get("domain") or "general").strip()
        note = (row.get("note") or "").strip()
        priority = "P0" if domain in {"security", "kyc", "mobile_money"} else "P1"
        context = domain + (f" — {note}" if note else "")
        result.append(
            {
                "item_id": f"G{index:02d}",
                "type": "glossaire",
                "priorite": priority,
                "source_fr": (row.get("source_fr") or "").strip(),
                "source_en": (row.get("source_en") or "").strip(),
                "contexte": context,
                "consigne": (
                    "Terme isolé. Garder FCFA, PIN, OTP et KYC tels quels. "
                    "Indiquer si vous choisissez un mot local ou un emprunt."
                ),
                "target": "",
                "commentaire": "",
                "reviewer": "",
                "reviewed_at": "",
                "license": "",
                "provenance": "human",
            }
        )
    return result


def message_rows() -> list[dict]:
    rows = read_csv(ROOT / "data" / "site-officiel" / "messages.fr-en.csv")
    result = []
    for row in rows:
        niveau = (row.get("niveau") or "").strip()
        result.append(
            {
                "item_id": (row.get("id") or "").strip(),
                "type": "message",
                "priorite": "P0" if niveau == "A" else "P1",
                "source_fr": (row.get("source_fr") or "").strip(),
                "source_en": (row.get("source_en") or "").strip(),
                "contexte": (
                    f"niveau {niveau} · site officiel · "
                    f"{(row.get('id') or '').strip()}"
                ),
                "consigne": (
                    "Message du site officiel. Traduire le sens, pas mot à mot. "
                    "Conserver les jetons et les termes critiques."
                ),
                "target": "",
                "commentaire": "",
                "reviewer": "",
                "reviewed_at": "",
                "license": "",
                "provenance": "human",
            }
        )
    return result


def pack_rows(code: str) -> list[dict]:
    rows = read_csv(ROOT / "data" / "language-packs" / f"{code}.csv")
    result = []
    for index, row in enumerate(rows, start=1):
        # Les 37 premières lignes fulfulde sont le chemin critique (K3).
        priority = "P0" if code != "fub" or index <= 37 else "P1"
        result.append(
            {
                "item_id": f"{code.upper()}-{index:03d}",
                "type": "phrase",
                "priorite": priority,
                "source_fr": (row.get("source") or "").strip(),
                "source_en": "",
                "contexte": (row.get("context") or "finance").strip(),
                "consigne": (
                    "Phrase d'interface. Conserver [[NUM_n]], [[NAME_n]], "
                    "FCFA, PIN, OTP et KYC exactement."
                ),
                "target": "",
                "commentaire": "",
                "reviewer": "",
                "reviewed_at": "",
                "license": "",
                "provenance": "human",
            }
        )
    return result


def sorted_rows(rows: list[dict]) -> list[dict]:
    return sorted(
        rows,
        key=lambda row: (
            PRIORITY_RANK.get(row["priorite"], 9),
            TYPE_RANK.get(row["type"], 9),
            row["item_id"],
        ),
    )


def write_workbook(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=FIELDS, lineterminator="\n"
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in FIELDS})


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "generated_at": datetime.now().astimezone().isoformat(
            timespec="seconds"
        ),
        "version": "0.6.0",
        "languages": {},
        "sources": {},
        "notes": (
            "T1 et T2 sont identiques au départ. Chaque traducteur remplit "
            "sans voir l'autre. L'arbitre utilise ensuite "
            "scripts/merge-native-reviews.py."
        ),
    }

    for code, label in LANGS.items():
        rows = sorted_rows(
            glossary_rows() + message_rows() + pack_rows(code)
        )
        t1 = OUT / f"{label}.t1.csv"
        t2 = OUT / f"{label}.t2.csv"
        write_workbook(t1, rows)
        write_workbook(t2, rows)
        manifest["languages"][code] = {
            "label": label,
            "t1": str(t1.relative_to(ROOT)),
            "t2": str(t2.relative_to(ROOT)),
            "rows": len(rows),
            "p0": sum(1 for row in rows if row["priorite"] == "P0"),
            "p1": sum(1 for row in rows if row["priorite"] == "P1"),
        }

    unseen_source = ROOT / "docs" / "UNSEEN_JUDGMENT.csv"
    unseen_target = OUT / "unseen_judgment.csv"
    shutil.copyfile(unseen_source, unseen_target)
    manifest["unseen"] = {
        "file": str(unseen_target.relative_to(ROOT)),
        "rows": len(read_csv(unseen_target)),
    }

    for name in (
        "data/glossary.template.csv",
        "data/site-officiel/messages.fr-en.csv",
        "data/language-packs/fub.csv",
        "data/language-packs/ewo.csv",
        "data/language-packs/dua.csv",
        "data/unseen_finance.txt",
        "docs/UNSEEN_JUDGMENT.csv",
    ):
        path = ROOT / name
        manifest["sources"][name] = sha256(path)

    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    for code, info in manifest["languages"].items():
        print(
            f"{code}: {info['rows']} lignes "
            f"(P0={info['p0']}, P1={info['p1']}) -> {info['t1']}"
        )
    print(f"fiche inédite : {manifest['unseen']['rows']} lignes")
    print(f"manifeste : {OUT / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
