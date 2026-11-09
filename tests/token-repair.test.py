#!/usr/bin/env python3
"""Non-régression : NLLB perd parfois les crochets des jetons.

On vérifie que le backend répare uniquement les jetons présents dans la
source, sans inventer de contenu.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "server"))

from app import repair_plain_tokens  # noqa: E402


def assert_equal(actual: str, expected: str, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: {actual!r} != {expected!r}")


def main() -> int:
    source = "Le bénéficiaire [[NAME_0]] reçoit [[NUM_0]] FCFA."
    assert_equal(
        repair_plain_tokens(source, "Jaɓɓorgo NAME_0 heɓi [[NUM_0]] FCFA."),
        "Jaɓɓorgo [[NAME_0]] heɓi [[NUM_0]] FCFA.",
        "NAME_0 sans crochets",
    )
    assert_equal(
        repair_plain_tokens(source, "Jaɓɓorgo [[NAME_0]] heɓi [[0]] FCFA."),
        "Jaɓɓorgo [[NAME_0]] heɓi [[NUM_0]] FCFA.",
        "jeton numérique nu",
    )
    # Un jeton absent de la source ne doit jamais être inventé.
    assert_equal(
        repair_plain_tokens("Bonjour", "Bonjour [[NAME_9]]"),
        "Bonjour [[NAME_9]]",
        "jeton inconnu conservé",
    )
    print("token-repair OK — NAME_0, [[0]], aucun jeton inventé")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
