#!/usr/bin/env python3
"""Test réel de scripts/check-pack-collisions.py.

Chaque cas écrit des packs temporaires et exécute le script en sous-processus.
Aucune donnée réelle n'est utilisée.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "check-pack-collisions.py"


def write_pack(directory: Path, name: str, entries: list[dict]) -> None:
    (directory / f"{name}.json").write_text(
        json.dumps(
            {"code": name, "label": name, "entries": entries},
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def run(
    directory: Path, allowlist: Path | None = None
) -> subprocess.CompletedProcess[str]:
    command = [sys.executable, str(SCRIPT), "--dir", str(directory)]
    if allowlist is not None:
        command.extend(["--allowlist", str(allowlist)])
    return subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
    )


def main() -> int:
    checks = 0

    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary)

        # 1. Cibles distinctes : aucune collision.
        write_pack(
            directory,
            "a",
            [
                {"source": "Solde", "target": "Nde"},
                {"source": "Frais", "target": "Nje"},
            ],
        )
        result = run(directory)
        assert result.returncode == 0, result.stderr
        assert "aucune collision non arbitrée" in result.stdout, result.stdout
        checks += 1

    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary)

        # 2. Deux sources différentes, même cible : collision.
        write_pack(
            directory,
            "a",
            [{"source": "Votre solde", "target": "Nde nje"}],
        )
        write_pack(
            directory,
            "b",
            [{"source": "Le total", "target": "Nde nje"}],
        )
        result = run(directory)
        assert result.returncode == 1, result.stderr
        assert "cible « Nde nje »" in result.stderr, result.stderr
        assert "Votre solde" in result.stderr, result.stderr
        assert "Le total" in result.stderr, result.stderr
        checks += 1

        # 3. Normalisation : casse et espaces ne créent pas de faux négatif.
        write_pack(
            directory,
            "c",
            [{"source": "Le montant", "target": "  nde   NJE "}],
        )
        result = run(directory)
        assert result.returncode == 1, result.stderr
        assert "3 sources" in result.stderr, result.stderr
        checks += 1

    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary)

        # 4. Même source répétée : pas une collision.
        write_pack(
            directory,
            "a",
            [
                {"source": "Solde", "target": "Nde"},
                {"source": "Solde", "target": "Nde"},
            ],
        )
        result = run(directory)
        assert result.returncode == 0, result.stderr
        checks += 1

    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary)

        # 5. JSON invalide : erreur distincte, code 2.
        (directory / "broken.json").write_text("{", encoding="utf-8")
        result = run(directory)
        assert result.returncode == 2, result.stderr
        assert "JSON invalide" in result.stderr, result.stderr
        checks += 1

    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary)

        # 6. Format sans entries : erreur distincte, code 2.
        (directory / "empty.json").write_text(
            json.dumps({"code": "empty"}), encoding="utf-8"
        )
        result = run(directory)
        assert result.returncode == 2, result.stderr
        assert "entries" in result.stderr, result.stderr
        checks += 1

    with tempfile.TemporaryDirectory() as temporary:
        directory = Path(temporary)

        # 7. Collision explicitement acceptée par allowlist.
        write_pack(
            directory,
            "a",
            [{"source": "Votre solde", "target": "Nde nje"}],
        )
        write_pack(
            directory,
            "b",
            [{"source": "Le total", "target": "Nde nje"}],
        )
        allowlist = directory / "allowlist.csv"
        allowlist.write_text(
            "target,source,reason\n"
            "Nde nje,Votre solde,synonymes acceptés\n"
            "Nde nje,Le total,synonymes acceptés\n",
            encoding="utf-8",
        )
        result = run(directory, allowlist)
        assert result.returncode == 0, result.stderr
        assert "explicitement acceptée" in result.stderr, result.stderr
        checks += 1

    print(f"check-pack-collisions OK — {checks} cas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
