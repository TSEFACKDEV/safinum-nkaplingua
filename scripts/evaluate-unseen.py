#!/usr/bin/env python3
"""Évalue le backend sur les phrases finance « jamais vues ».

Le script envoie chaque phrase à /translate et calcule des indicateurs
simples, sans prétendre remplacer une évaluation native :

- taux de traductions acceptées par le contrôle de sûreté ;
- taux de préservation des montants (les chiffres doivent rester présents) ;
- ratio de longueur ;
- score de rétro-traduction moyen (si le backend l'expose) ;
- raisons de refus.

Usage :
    python3 scripts/evaluate-unseen.py --url http://127.0.0.1:8000
"""

from __future__ import annotations

import argparse
import json
import re
import statistics
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / "data" / "unseen_finance.txt"
NUMBER_RE = re.compile(r"\d[\d\s.,]*")


def post(url: str, payload: dict) -> dict:
    request = urllib.request.Request(
        f"{url.rstrip('/')}/translate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.load(response)


def numbers(text: str) -> list[str]:
    return [
        re.sub(r"\s+", " ", match.group(0)).strip()
        for match in NUMBER_RE.finditer(text)
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()

    sentences = [
        line.strip()
        for line in args.input.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if not sentences:
        print("Aucune phrase à évaluer.")
        return 1

    rows = []
    for index, sentence in enumerate(sentences, start=1):
        try:
            data = post(
                args.url,
                {
                    "target": "fub",
                    "source": "fr",
                    "segments": [
                        {"id": f"u{index}", "text": sentence, "context": "finance"}
                    ],
                },
            )
            translation = data["translations"][0]
            rows.append(
                {
                    "id": f"u{index}",
                    "source": sentence,
                    "target": translation.get("text", ""),
                    "ok": translation.get("ok", False),
                    "reason": translation.get("reason"),
                    "roundtrip": translation.get("roundtrip"),
                }
            )
            print(
                f"{index:02d} {'OK ' if rows[-1]['ok'] else 'REF'} "
                f"rt={rows[-1]['roundtrip']} {sentence[:70]}"
            )
        except Exception as error:
            rows.append(
                {
                    "id": f"u{index}",
                    "source": sentence,
                    "target": "",
                    "ok": False,
                    "reason": f"http_error:{error}",
                    "roundtrip": None,
                }
            )
            print(f"{index:02d} ERR {error}")

    accepted = [row for row in rows if row["ok"]]
    roundtrips = [
        row["roundtrip"]
        for row in rows
        if isinstance(row["roundtrip"], (int, float))
    ]

    # Préservation des montants : tous les nombres de la source doivent
    # apparaître dans la cible acceptée.
    preserved = 0
    for row in accepted:
        source_numbers = numbers(row["source"])
        if all(number in row["target"] for number in source_numbers):
            preserved += 1

    report = {
        "sentences": len(rows),
        "accepted": len(accepted),
        "acceptance_rate": round(len(accepted) / len(rows), 3),
        "amount_preservation_rate": round(
            preserved / len(accepted), 3
        )
        if accepted
        else 0.0,
        "roundtrip_mean": round(statistics.mean(roundtrips), 3)
        if roundtrips
        else None,
        "reasons": {},
        "rows": rows,
    }
    for row in rows:
        if not row["ok"]:
            report["reasons"][row["reason"] or "unknown"] = (
                report["reasons"].get(row["reason"] or "unknown", 0) + 1
            )

    print(json.dumps({k: v for k, v in report.items() if k != "rows"}, indent=2))
    if args.output:
        args.output.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Rapport écrit : {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
