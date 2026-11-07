#!/usr/bin/env python3
"""Génère les sorties NLLB des 20 phrases inédites pour le jugement natif.

Ce script ne valide rien : il remplit uniquement les colonnes `candidate_*`
dans `docs/UNSEEN_JUDGMENT.csv`. Le verdict `acceptable / trompeur / faux`
reste à remplir par un locuteur natif.

Le script simule le pipeline de l'extension :

1. protection des termes critiques et du glossaire validé ;
2. protection des nombres (`[[NUM_n]]`) ;
3. traduction NLLB ;
4. restauration et contrôle des nombres et des termes.

Usage (depuis la racine du dépôt) :
    server/.venv/bin/python scripts/generate-unseen-fub.py
    server/.venv/bin/python scripts/generate-unseen-fub.py --limit 2

Le script refuse de tourner en mode mock : une sortie factice ne doit pas
être présentée comme une évaluation.
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERVER = ROOT / "server"
UNSEEN = ROOT / "data" / "unseen_finance.txt"
JUDGMENT = ROOT / "docs" / "UNSEEN_JUDGMENT.csv"
NUMBER_RE = re.compile(r"\d[\d\s.,]*")
DNT_TERMS = ("FCFA", "XAF", "PIN", "OTP", "KYC", "FINAKA")


def protect_numbers(text: str) -> tuple[str, list[tuple[str, str]]]:
    numbers: list[tuple[str, str]] = []

    def replace(match: re.Match[str]) -> str:
        token = f"[[NUM_{len(numbers)}]]"
        numbers.append((token, match.group(0)))
        return token

    return NUMBER_RE.sub(replace, text), numbers


def has_term(text: str, term: str) -> bool:
    return bool(
        re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text, flags=re.I)
    )


def restore_numbers(
    text: str, numbers: list[tuple[str, str]]
) -> tuple[str, list[str]]:
    issues: list[str] = []
    value = text
    for token, original in numbers:
        if value.count(token) != 1:
            issues.append(f"nombre perdu:{original}")
            continue
        value = value.replace(token, original)
    return value, issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--batch-size", type=int, default=2)
    args = parser.parse_args()

    os.environ.setdefault("NK_MOCK", "0")
    os.environ.setdefault("NK_ROUNDTRIP", "0")
    sys.path.insert(0, str(SERVER))

    import app  # noqa: E402

    if app.MOCK_MODE:
        print(
            "Refus : NK_MOCK=1 produirait une sortie factice. "
            "Relancez avec NK_MOCK=0.",
            file=sys.stderr,
        )
        return 1

    phrases = [
        line.strip()
        for line in UNSEEN.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if args.limit:
        phrases = phrases[: args.limit]

    prepared = []
    for phrase in phrases:
        with_terms, terms = app.protect_terms(phrase)
        protected, numbers = protect_numbers(with_terms)
        prepared.append(
            {
                "source": phrase,
                "protected": protected,
                "terms": terms,
                "numbers": numbers,
            }
        )

    outputs: list[str] = []
    for start in range(0, len(prepared), args.batch_size):
        batch = prepared[start : start + args.batch_size]
        print(
            f"Traduction {start + 1}-{start + len(batch)}/{len(prepared)}…",
            file=sys.stderr,
        )
        outputs.extend(
            app.safe_generate_batch(
                [item["protected"] for item in batch],
                "fra_Latn",
                "fuv_Latn",
            )
        )

    with JUDGMENT.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        fields = list(reader.fieldnames or [])
        rows = list(reader)

    for item, output, row in zip(prepared, outputs, rows):
        normalized = app.normalize_placeholders(output)
        restored, issues = restore_numbers(normalized, item["numbers"])
        restored = app.restore_terms(restored, item["terms"])
        if restored is None:
            issues.append("terme critique perdu")
            restored = normalized
        for term in DNT_TERMS:
            if has_term(item["source"], term) and not has_term(restored, term):
                issues.append(f"terme perdu:{term}")
        for token, original in item["numbers"]:
            if original not in restored:
                issues.append(f"nombre absent:{original}")
        row["candidate_raw"] = output.strip()
        row["candidate_source"] = "NLLB-200-distilled-600M / fuv_Latn"
        if issues:
            row["candidate_fub"] = ""
            row["candidate_status"] = "rejected_auto"
        else:
            row["candidate_fub"] = restored.strip()
            row["candidate_status"] = "mt_eval"
        row["candidate_issue"] = "; ".join(dict.fromkeys(issues))
        row["candidate_date"] = date.today().isoformat()

    with JUDGMENT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=fields, lineterminator="\n"
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})

    for row in rows[: len(outputs)]:
        issue = row["candidate_issue"] or "ok"
        print(f"{row['id']} | {issue} | {row['candidate_fub']}")
    print(f"{len(outputs)} sortie(s) écrite(s) dans {JUDGMENT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
