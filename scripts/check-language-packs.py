#!/usr/bin/env python3
"""Vérifie la cohérence des packs linguistiques et des feuilles de traduction."""

from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKS = ROOT / "extension" / "language-packs"
CSV_DIR = ROOT / "data" / "language-packs"
EXPECTED = {"fub", "ybb", "byv", "ewo", "dua", "bas", "bbj"}
TOKEN_RE = re.compile(r"\[\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\]", re.I)
DNT_TERMS = ["FCFA", "XAF", "PIN", "OTP", "KYC", "FINAKA"]


def tokens(text: str) -> list[str]:
    return [
        f"[[{match.group(1).upper()}_{match.group(2)}]]"
        for match in TOKEN_RE.finditer(text)
    ]


def has_term(text: str, term: str) -> bool:
    return bool(
        re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text, flags=re.I)
    )


def check_pack(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        pack = json.loads(path.read_text(encoding="utf-8"))
    except Exception as error:
        return [f"{path.name}: JSON invalide ({error})"]

    code = pack.get("code")
    if code != path.stem:
        errors.append(f"{path.name}: code {code!r} != {path.stem!r}")
    if code not in EXPECTED:
        errors.append(f"{path.name}: code inconnu {code!r}")

    for index, entry in enumerate(pack.get("entries", []), start=1):
        source = entry.get("source", "")
        target = entry.get("target", "")
        status = entry.get("status", "draft")
        if status not in {"draft", "reviewed", "validated", "deprecated"}:
            errors.append(f"{path.name}#{index}: statut inconnu {status!r}")
        if status != "validated":
            continue
        if not target:
            errors.append(f"{path.name}#{index}: cible vide mais validée")
            continue
        for token in tokens(source):
            if target.count(token) != 1:
                errors.append(
                    f"{path.name}#{index}: jeton {token} absent ou dupliqué"
                )
        for term in DNT_TERMS:
            if has_term(source, term) and not has_term(target, term):
                errors.append(
                    f"{path.name}#{index}: terme critique {term} manquant"
                )
    return errors


def main() -> int:
    errors: list[str] = []
    present = {path.stem for path in PACKS.glob("*.json")}
    missing = EXPECTED - present
    if missing:
        errors.append(f"packs manquants : {', '.join(sorted(missing))}")

    for path in sorted(PACKS.glob("*.json")):
        errors.extend(check_pack(path))

    for code in sorted(EXPECTED - {"fub"}):
        csv_path = CSV_DIR / f"{code}.csv"
        if not csv_path.exists():
            errors.append(f"feuille manquante : {csv_path.name}")
            continue
        with csv_path.open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        if len(rows) < 20:
            errors.append(
                f"{csv_path.name}: {len(rows)} lignes, 20 attendues"
            )

    if errors:
        print("Packs invalides :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    sheet_count = len(EXPECTED) - 1
    print(f"Packs OK — {len(present)} fichiers, {sheet_count} feuilles")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
