#!/usr/bin/env python3
"""Détecte les collisions de cibles dans les packs linguistiques.

Une collision existe quand deux sources différentes (après normalisation)
partagent la même cible normalisée. Ce n'est pas toujours une erreur : deux
formulations peuvent légitimement converger. En revanche, une collision
interdit toute validation automatique : l'arbitre doit trancher.

Normalisation appliquée aux sources et aux cibles : Unicode NFC, espaces
réduits, casse repliée. Aucune traduction n'est modifiée.

Codes de sortie :
  0  aucune collision ;
  1  au moins une collision ;
  2  pack illisible ou format invalide.

Usage :
    python3 scripts/check-pack-collisions.py
    python3 scripts/check-pack-collisions.py --dir extension/language-packs
"""

from __future__ import annotations

import argparse
import json
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DIR = ROOT / "extension" / "language-packs"


def normalize(text: str) -> str:
    """Normalisation déterministe, sans toucher au contenu affiché."""
    value = unicodedata.normalize("NFC", str(text or ""))
    value = " ".join(value.split())
    return value.casefold()


def load_packs(directory: Path) -> tuple[dict[str, list], list[str]]:
    packs: dict[str, list] = {}
    errors: list[str] = []

    if not directory.is_dir():
        return packs, [f"dossier introuvable : {directory}"]

    for path in sorted(directory.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as error:  # JSON invalide ou fichier illisible
            errors.append(f"{path.name}: JSON invalide ({error})")
            continue

        entries = data.get("entries") if isinstance(data, dict) else None
        if not isinstance(entries, list):
            errors.append(f"{path.name}: champ entries absent ou invalide")
            continue

        packs[path.name] = entries

    return packs, errors


def find_collisions(packs: dict[str, list]) -> list[dict]:
    """Retourne les cibles normalisées portées par plusieurs sources."""
    index: dict[str, dict] = {}

    for filename, entries in packs.items():
        for position, entry in enumerate(entries, start=1):
            if not isinstance(entry, dict):
                continue
            source = str(entry.get("source") or "").strip()
            target = str(entry.get("target") or "").strip()
            if not source or not target:
                continue

            target_key = normalize(target)
            source_key = normalize(source)
            bucket = index.setdefault(
                target_key,
                {"target": target, "sources": {}},
            )
            bucket["sources"].setdefault(source_key, []).append(
                {
                    "file": filename,
                    "position": position,
                    "source": source,
                }
            )

    collisions: list[dict] = []
    for target_key, bucket in index.items():
        sources = bucket["sources"]
        if len(sources) < 2:
            continue
        collisions.append(
            {
                "target": bucket["target"],
                "target_key": target_key,
                "sources": [
                    occurrence
                    for occurrences in sources.values()
                    for occurrence in occurrences
                ],
            }
        )

    collisions.sort(key=lambda item: item["target_key"])
    return collisions


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Détecte deux sources différentes pour une même cible."
    )
    parser.add_argument(
        "--dir",
        type=Path,
        default=DEFAULT_DIR,
        help="dossier des packs JSON (défaut : extension/language-packs)",
    )
    args = parser.parse_args()

    packs, errors = load_packs(args.dir)
    collisions = find_collisions(packs)

    if errors:
        print("Packs illisibles :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 2

    if collisions:
        print("Collisions de cibles :", file=sys.stderr)
        for collision in collisions:
            print(
                f"  - cible « {collision['target']} » "
                f"({len(collision['sources'])} sources) :",
                file=sys.stderr,
            )
            for occurrence in collision["sources"]:
                print(
                    f"      {occurrence['file']}#{occurrence['position']} : "
                    f"« {occurrence['source']} »",
                    file=sys.stderr,
                )
        print(
            "Une collision n'est pas toujours une erreur, mais elle interdit "
            "la validation automatique : l'arbitre doit trancher.",
            file=sys.stderr,
        )
        return 1

    print(
        f"Collisions OK — {len(packs)} pack(s), aucune cible partagée par "
        "deux sources différentes"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
