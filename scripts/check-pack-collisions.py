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
import csv
import json
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DIR = ROOT / "extension" / "language-packs"
DEFAULT_ALLOWLIST = ROOT / "data" / "reference" / "collision-allowlist.csv"


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


def load_allowlist(path: Path) -> dict[str, set[str]]:
    """Charge les collisions explicitement acceptées.

    Format : target,source,reason. Une collision n'est ignorée que si
    toutes ses sources figurent dans l'allowlist pour cette cible.
    """
    allowed: dict[str, set[str]] = {}
    if not path.exists():
        return allowed
    with path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            target = normalize(row.get("target") or "")
            source = normalize(row.get("source") or "")
            if target and source:
                allowed.setdefault(target, set()).add(source)
    return allowed


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
                    "context": str(entry.get("context") or ""),
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
    parser.add_argument(
        "--allowlist",
        type=Path,
        default=DEFAULT_ALLOWLIST,
        help="collisions explicitement acceptées (CSV)",
    )
    args = parser.parse_args()

    packs, errors = load_packs(args.dir)
    collisions = find_collisions(packs)
    allowed = load_allowlist(args.allowlist)
    accepted: list[dict] = []
    remaining: list[dict] = []
    for collision in collisions:
        sources = {
            normalize(occurrence["source"])
            for occurrence in collision["sources"]
        }
        if sources and sources <= allowed.get(collision["target_key"], set()):
            accepted.append(collision)
            continue
        contexts = {
            occurrence.get("context", "")
            for occurrence in collision["sources"]
        }
        bilingual_contexts = {
            "site-officiel",
            "site-officiel-en",
            "site-officiel-extra",
            "site-officiel-extra-en",
            "glossaire",
        }
        has_en = any(context.endswith("-en") for context in contexts)
        has_fr = any(not context.endswith("-en") for context in contexts)
        if (
            contexts
            and contexts <= bilingual_contexts
            and has_en
            and has_fr
        ):
            # Même cible pour la version FR et la version EN du site : c'est
            # une mémoire bilingue volontaire, pas une collision métier.
            accepted.append(collision)
        else:
            remaining.append(collision)
    collisions = remaining

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

    if accepted:
        try:
            allowlist_label = args.allowlist.relative_to(ROOT)
        except ValueError:
            allowlist_label = args.allowlist
        print(
            f"{len(accepted)} collision(s) explicitement acceptée(s) "
            f"dans {allowlist_label} :",
            file=sys.stderr,
        )
        for collision in accepted:
            sources = ", ".join(
                f"« {occurrence['source']} »"
                for occurrence in collision["sources"]
            )
            print(
                f"  - « {collision['target']} » ← {sources}",
                file=sys.stderr,
            )

    print(
        f"Collisions OK — {len(packs)} pack(s), aucune collision non "
        "arbitrée"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
