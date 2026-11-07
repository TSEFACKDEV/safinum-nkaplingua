#!/usr/bin/env python3
"""Valide le journal d'évolution de l'équipe.

Le journal `tasks/EVOLUTION.md` est append-only. Chaque avancement y ajoute une
entrée : un titre lisible, puis un bloc de code JSON. Ce script est utilisé par
la CI : une entrée manquante, invalide ou non chronologique bloque le push.

Usage :
    python3 scripts/check-evolution.py
    python3 scripts/check-evolution.py --file tasks/EVOLUTION.md
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_FILE = ROOT / "tasks" / "EVOLUTION.md"

PEOPLE = {"Freedy": "freedy", "Klein": "klein", "Marius": "marius"}
PREFIX = {"Freedy": "F", "Klein": "K", "Marius": "M"}
STATUSES = {"in_progress", "blocked", "done"}
RESULTS = {"pass", "fail", "blocked", "not_run"}
REQUIRED = {
    "timestamp",
    "person",
    "branch",
    "task",
    "status",
    "summary",
    "files",
    "tests",
    "evidence",
    "next",
    "blockers",
}
JSON_BLOCK_RE = re.compile(r"```json\s*\n(.*?)```", re.DOTALL)


def fail(message: str) -> None:
    print(f"ERREUR : {message}", file=sys.stderr)


def validate_entry(entry: dict, index: int) -> list[str]:
    errors: list[str] = []
    label = f"entrée {index}"

    missing = REQUIRED - set(entry)
    if missing:
        errors.append(f"{label}: champs manquants {sorted(missing)}")
        return errors

    person = entry["person"]
    if person not in PEOPLE:
        errors.append(f"{label}: personne inconnue {person!r}")
    elif entry["branch"] != PEOPLE[person]:
        errors.append(
            f"{label}: branche {entry['branch']!r} != {PEOPLE[person]!r} pour {person}"
        )

    task = str(entry["task"])
    if person in PREFIX and not re.fullmatch(rf"{PREFIX[person]}\d+", task):
        errors.append(
            f"{label}: tâche {task!r} ne correspond pas au préfixe {PREFIX[person]}"
        )

    if entry["status"] not in STATUSES:
        errors.append(f"{label}: statut inconnu {entry['status']!r}")

    for field in ("summary", "evidence", "next"):
        if not isinstance(entry[field], str) or not entry[field].strip():
            errors.append(f"{label}: {field} vide")

    if not isinstance(entry["files"], list) or not all(
        isinstance(item, str) and item.strip() for item in entry["files"]
    ):
        errors.append(f"{label}: files doit être une liste de chemins")

    if not isinstance(entry["blockers"], list):
        errors.append(f"{label}: blockers doit être une liste")
    elif entry["status"] == "blocked" and not entry["blockers"]:
        errors.append(f"{label}: status=blocked sans blockers")

    tests = entry["tests"]
    if not isinstance(tests, list):
        errors.append(f"{label}: tests doit être une liste")
    else:
        for test_index, test in enumerate(tests, start=1):
            if not isinstance(test, dict):
                errors.append(f"{label}: test {test_index} n'est pas un objet")
                continue
            if not str(test.get("command", "")).strip():
                errors.append(f"{label}: test {test_index} sans command")
            if test.get("result") not in RESULTS:
                errors.append(
                    f"{label}: test {test_index} result={test.get('result')!r} invalide"
                )

    try:
        parsed = datetime.fromisoformat(entry["timestamp"])
        if parsed.tzinfo is None:
            errors.append(f"{label}: timestamp sans fuseau horaire")
    except (TypeError, ValueError):
        errors.append(f"{label}: timestamp ISO 8601 invalide")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, default=DEFAULT_FILE)
    args = parser.parse_args()

    path = args.file
    if not path.exists():
        fail(f"journal introuvable : {path}")
        return 1

    text = path.read_text(encoding="utf-8")
    blocks = JSON_BLOCK_RE.findall(text)
    if not blocks:
        fail("aucune entrée JSON trouvée dans le journal")
        return 1

    entries: list[dict] = []
    errors: list[str] = []
    for index, block in enumerate(blocks, start=1):
        try:
            entry = json.loads(block)
        except json.JSONDecodeError as error:
            errors.append(f"entrée {index}: JSON invalide ({error})")
            continue
        if not isinstance(entry, dict):
            errors.append(f"entrée {index}: le bloc JSON doit être un objet")
            continue
        entries.append(entry)
        errors.extend(validate_entry(entry, index))

    # Chronologie : les entrées doivent être ajoutées dans l'ordre.
    parsed_entries: list[tuple[datetime, dict]] = []
    for entry in entries:
        try:
            parsed_entries.append(
                (datetime.fromisoformat(entry["timestamp"]), entry)
            )
        except (KeyError, TypeError, ValueError):
            continue
    for previous, current in zip(parsed_entries, parsed_entries[1:]):
        if current[0] < previous[0]:
            errors.append(
                "entrées non chronologiques : "
                f"{previous[1].get('timestamp')} puis {current[1].get('timestamp')}"
            )

    seen: set[tuple[str, str]] = set()
    for entry in entries:
        key = (str(entry.get("timestamp")), str(entry.get("task")))
        if key in seen:
            errors.append(f"doublon timestamp/tâche : {key[0]} / {key[1]}")
        seen.add(key)

    if errors:
        print("Journal invalide :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    latest: dict[str, dict] = {}
    for entry in entries:
        latest[str(entry["task"])] = entry

    print(f"Journal valide — {len(entries)} entrée(s), {len(latest)} tâche(s)")
    print(f"{'Tâche':6} {'Statut':12} {'Personne':8} {'Timestamp':25} Résumé")
    for task in sorted(latest):
        entry = latest[task]
        summary = entry["summary"].replace("\n", " ")[:60]
        print(
            f"{task:6} {entry['status']:12} {entry['person']:8} "
            f"{entry['timestamp']:25} {summary}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
