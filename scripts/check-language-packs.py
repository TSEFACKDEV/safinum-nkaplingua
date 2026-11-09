#!/usr/bin/env python3
"""Vérifie la cohérence des packs linguistiques et des feuilles de traduction."""

from __future__ import annotations

import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKS = ROOT / "extension" / "language-packs"
CSV_DIR = ROOT / "data" / "language-packs"
EXPECTED = {"fub", "ewo", "dua"}
REMOVED = {"ybb", "byv", "bas", "bbj"}
TOKEN_RE = re.compile(r"\[\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\]", re.I)
DNT_TERMS = ["FCFA", "XAF", "PIN", "OTP", "KYC", "FINAKA"]
STATUSES = {"draft", "reviewed", "validated", "deprecated"}
ALLOWED_LICENSES = {"CC0-1.0", "CC-BY-4.0"}
REVIEW_LEVELS = {
    "single-translator",
    "second-translator-fallback",
    "reused-message",
    "composed-template",
    "lexicon-assisted",
    "independent",
    "validated",
}


def tokens(text: str) -> list[str]:
    return [
        f"[[{match.group(1).upper()}_{match.group(2)}]]"
        for match in TOKEN_RE.finditer(text)
    ]


def has_term(text: str, term: str) -> bool:
    return bool(
        re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text, flags=re.I)
    )


def numbers(text: str) -> list[str]:
    cleaned = TOKEN_RE.sub(" ", text or "")
    cleaned = re.sub(r"(?<=\d)[\s\u00A0]+(?=\d)", "", cleaned)
    return re.findall(r"\d+(?:[.,]\d+)?", cleaned)


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
    if not pack.get("label"):
        errors.append(f"{path.name}: label manquant")
    if not pack.get("nativeLabel"):
        errors.append(f"{path.name}: nativeLabel manquant")

    seen_sources: set[str] = set()
    for index, entry in enumerate(pack.get("entries", []), start=1):
        source = entry.get("source", "")
        target = entry.get("target", "")
        status = entry.get("status", "draft")
        reviewer = (entry.get("reviewer") or "").strip()
        license_id = (entry.get("license") or "").strip()
        provenance = (entry.get("provenance") or "").strip().lower()
        reviewed_at = (entry.get("reviewedAt") or "").strip()

        if not source:
            errors.append(f"{path.name}#{index}: source vide")
            continue
        if source in seen_sources:
            errors.append(f"{path.name}#{index}: source dupliquée {source!r}")
        seen_sources.add(source)

        if status not in STATUSES:
            errors.append(f"{path.name}#{index}: statut inconnu {status!r}")
            continue

        if not target:
            errors.append(f"{path.name}#{index}: cible vide ({status})")
            continue

        if not reviewer:
            errors.append(f"{path.name}#{index}: relecteur manquant")
        if license_id not in ALLOWED_LICENSES:
            errors.append(
                f"{path.name}#{index}: licence {license_id!r} absente ou "
                "non autorisée"
            )
        allowed_provenance = (
            {"human"} if status == "validated" else {"human", "editorial"}
        )
        if provenance not in allowed_provenance:
            errors.append(
                f"{path.name}#{index}: provenance {provenance!r} refusée "
                f"(attendu {sorted(allowed_provenance)})"
            )
        if not reviewed_at:
            errors.append(f"{path.name}#{index}: reviewedAt manquant")
        else:
            try:
                date.fromisoformat(reviewed_at)
            except ValueError:
                errors.append(
                    f"{path.name}#{index}: reviewedAt non ISO {reviewed_at!r}"
                )
        review_level = (entry.get("reviewLevel") or "").strip()
        if status in {"reviewed", "draft"} and review_level not in REVIEW_LEVELS:
            errors.append(
                f"{path.name}#{index}: reviewLevel {review_level!r} invalide"
            )

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
        target_flat = re.sub(
            r"(?<=\d)[\s\u00A0]+(?=\d)", "", target
        )
        for number in numbers(source):
            if number not in target_flat:
                errors.append(
                    f"{path.name}#{index}: nombre {number} modifié"
                )
    return errors


def check_sheet(path: Path) -> list[str]:
    """Contrôle minimal d'une feuille de travail avant import."""
    errors: list[str] = []
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        return [f"{path.name}: feuille vide"]
    required = {"source", "target", "status", "reviewer", "context"}
    missing = required - set(rows[0].keys())
    if missing:
        errors.append(
            f"{path.name}: colonnes manquantes {', '.join(sorted(missing))}"
        )
    for index, row in enumerate(rows, start=2):
        status = (row.get("status") or "draft").strip().lower()
        if status not in STATUSES:
            errors.append(
                f"{path.name}#{index}: statut inconnu {status!r}"
            )
        target = (row.get("target") or "").strip()
        if status in {"validated", "reviewed", "draft"} and target:
            if not (row.get("reviewer") or "").strip():
                errors.append(f"{path.name}#{index}: relecteur manquant")
            if (row.get("license") or "").strip() not in ALLOWED_LICENSES:
                errors.append(f"{path.name}#{index}: licence manquante")
            if (row.get("provenance") or "").strip().lower() != "human":
                errors.append(
                    f"{path.name}#{index}: provenance human attendue"
                )
            if status in {"reviewed", "draft"} and (
                row.get("review_level") or ""
            ).strip() not in REVIEW_LEVELS:
                errors.append(
                    f"{path.name}#{index}: review_level manquant ou invalide"
                )
    return errors


def main() -> int:
    errors: list[str] = []
    present = {path.stem for path in PACKS.glob("*.json")}
    missing = EXPECTED - present
    if missing:
        errors.append(f"packs manquants : {', '.join(sorted(missing))}")

    for code in sorted(REMOVED):
        removed_json = PACKS / f"{code}.json"
        removed_csv = CSV_DIR / f"{code}.csv"
        if removed_json.exists():
            errors.append(f"pack retiré encore présent : {removed_json.name}")
        if removed_csv.exists():
            errors.append(f"feuille retirée encore présente : {removed_csv.name}")

    for path in sorted(PACKS.glob("*.json")):
        errors.extend(check_pack(path))

    for code in sorted(EXPECTED):
        csv_path = CSV_DIR / f"{code}.csv"
        if not csv_path.exists():
            errors.append(f"feuille manquante : {csv_path.name}")
            continue
        errors.extend(check_sheet(csv_path))
        with csv_path.open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        minimum = 100 if code == "fub" else 20
        if len(rows) < minimum:
            errors.append(
                f"{csv_path.name}: {len(rows)} lignes, {minimum} attendues"
            )

    if errors:
        print("Packs invalides :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    sheet_count = len(EXPECTED)
    print(f"Packs OK — {len(present)} fichiers, {sheet_count} feuilles")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
