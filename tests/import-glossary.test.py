#!/usr/bin/env python3
"""Test réel du contrôle lexical glossaire à l'import (M5).

Crée un glossaire et des packs temporaires, exécute
scripts/import-language-pack.py et vérifie les refus/acceptations.
"""

from __future__ import annotations

import csv
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "import-language-pack.py"

GLOSSARY_HEADER = [
    "source_fr",
    "source_en",
    "target_fub",
    "target_ewo",
    "target_dua",
    "domain",
    "note",
    "status",
    "reviewer_fub",
    "reviewer_ewo",
    "reviewer_dua",
]
PACK_HEADER = [
    "source",
    "target",
    "status",
    "reviewer",
    "license",
    "provenance",
    "reviewed_at",
    "context",
]


def write_csv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)


def run(csv_path: Path, glossary: Path, output: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            str(csv_path),
            "--glossary",
            str(glossary),
            "--output",
            str(output),
        ],
        capture_output=True,
        text=True,
        check=False,
    )


def main() -> int:
    checks = 0
    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary)
        glossary = directory / "glossary.csv"
        write_csv(
            glossary,
            GLOSSARY_HEADER,
            [
                [
                    "solde disponible",
                    "available balance",
                    "Nde nje woni.",
                    "",
                    "",
                    "mobile_money",
                    "",
                    "validated",
                    "T1",
                    "",
                    "",
                ]
            ],
        )

        # 1. Terme du glossaire absent de la cible : import refusé.
        csv_path = directory / "fub.csv"
        write_csv(
            csv_path,
            PACK_HEADER,
            [
                [
                    "Votre solde disponible est prêt.",
                    "Nde nje",
                    "validated",
                    "T1",
                    "CC0-1.0",
                    "human",
                    "2026-11-08",
                    "finance",
                ]
            ],
        )
        result = run(csv_path, glossary, directory / "out.json")
        assert result.returncode == 2, result.stderr
        assert "glossaire" in result.stderr, result.stderr
        assert not (directory / "out.json").exists(), "sortie écrite malgré le refus"
        checks += 1

        # 2. Terme du glossaire présent : import accepté.
        write_csv(
            csv_path,
            PACK_HEADER,
            [
                [
                    "Votre solde disponible est prêt.",
                    "Nde nje woni.",
                    "validated",
                    "T1",
                    "CC0-1.0",
                    "human",
                    "2026-11-08",
                    "finance",
                ]
            ],
        )
        output = directory / "out-ok.json"
        result = run(csv_path, glossary, output)
        assert result.returncode == 0, result.stderr
        payload = json.loads(output.read_text(encoding="utf-8"))
        assert payload["entries"][0]["target"] == "Nde nje woni.", payload
        checks += 1

        # 3. Glossaire non validé : aucune contrainte.
        draft_glossary = directory / "glossary-draft.csv"
        write_csv(
            draft_glossary,
            GLOSSARY_HEADER,
            [
                [
                    "solde disponible",
                    "",
                    "Nde nje woni.",
                    "",
                    "",
                    "mobile_money",
                    "",
                    "a_traduire",
                    "",
                    "",
                    "",
                ]
            ],
        )
        write_csv(
            csv_path,
            PACK_HEADER,
            [
                [
                    "Votre solde disponible est prêt.",
                    "Nde nje",
                    "validated",
                    "T1",
                    "CC0-1.0",
                    "human",
                    "2026-11-08",
                    "finance",
                ]
            ],
        )
        result = run(csv_path, draft_glossary, directory / "out-draft.json")
        assert result.returncode == 0, result.stderr
        checks += 1

        # 4. Langue cible différente : target_ewo vide, pas de contrainte.
        csv_path = directory / "ewo.csv"
        write_csv(
            csv_path,
            PACK_HEADER,
            [
                [
                    "Votre solde disponible est prêt.",
                    "Nde nje",
                    "validated",
                    "T1",
                    "CC0-1.0",
                    "human",
                    "2026-11-08",
                    "finance",
                ]
            ],
        )
        result = run(csv_path, glossary, directory / "out-ewo.json")
        assert result.returncode == 0, result.stderr
        checks += 1

        # 5. Terme critique FCFA traduit : refus existant conservé.
        csv_path = directory / "dua.csv"
        write_csv(
            csv_path,
            PACK_HEADER,
            [
                [
                    "Les frais sont de 1 000 FCFA.",
                    "Nde nje 1 000 francs.",
                    "validated",
                    "T1",
                    "CC0-1.0",
                    "human",
                    "2026-11-08",
                    "finance",
                ]
            ],
        )
        result = run(csv_path, glossary, directory / "out-dua.json")
        assert result.returncode == 2, result.stderr
        assert "FCFA" in result.stderr, result.stderr
        checks += 1

    print(f"import-glossary OK — {checks} cas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
