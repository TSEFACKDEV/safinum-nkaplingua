#!/usr/bin/env python3
"""Génère le navigateur de références pour les 40 termes du glossaire.

Aucun contenu de Glosbe, Resulam ou Webonary n'est copié : le CSV ne contient
que des liens de consultation manuelle. Voir docs/REFERENCE_SOURCES.md.
"""

from __future__ import annotations

import csv
from pathlib import Path
from urllib.parse import quote, quote_plus

ROOT = Path(__file__).resolve().parent.parent
GLOSSARY = ROOT / "data" / "glossary.template.csv"
OUTPUT = ROOT / "data" / "reference" / "glossary-links.csv"

FIELDS = [
    "item_id",
    "source_fr",
    "source_en",
    "domain",
    "priorite",
    "glosbe_query",
    "glosbe_ewo",
    "glosbe_dua",
    "glosbe_fub",
    "webonary_search",
    "resulam_search",
    "silcam_ewo",
    "silcam_dua",
    "silcam_fub",
    "note",
]

SILCAM = {
    "ewo": "https://www.silcam.org/resources/search/language/ewo",
    "dua": "https://www.silcam.org/resources/search/language/dua",
    "fub": "https://www.silcam.org/resources/search/language/fub",
}


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def glosbe_headword(term: str) -> str:
    """Glosbe ne gère pas les expressions multi-mots : on cherche le mot-clé."""
    stopwords = {
        "de",
        "du",
        "des",
        "à",
        "au",
        "aux",
        "d'",
        "l'",
        "la",
        "le",
        "les",
        "un",
        "une",
        "et",
    }
    cleaned = (
        term.lower()
        .replace("’", "'")
        .replace("-", " ")
        .replace("'", " ")
    )
    for word in cleaned.split():
        if word not in stopwords and len(word) > 1:
            return word
    return term.split()[0] if term.split() else term


def main() -> int:
    rows = read_csv(GLOSSARY)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=FIELDS, lineterminator="\n"
        )
        writer.writeheader()
        for index, row in enumerate(rows, start=1):
            term = (row.get("source_fr") or "").strip()
            headword = glosbe_headword(term)
            query = quote_plus(term)
            glosbe_query = quote_plus(headword)
            priority = (
                "P0"
                if (row.get("domain") or "") in {"security", "kyc", "mobile_money"}
                else "P1"
            )
            writer.writerow(
                {
                    "item_id": f"G{index:02d}",
                    "source_fr": term,
                    "source_en": (row.get("source_en") or "").strip(),
                    "domain": (row.get("domain") or "").strip(),
                    "priorite": priority,
                    "glosbe_query": headword,
                    "glosbe_ewo": f"https://glosbe.com/fr/ewo?q={glosbe_query}",
                    "glosbe_dua": f"https://glosbe.com/fr/dua?q={glosbe_query}",
                    "glosbe_fub": f"https://glosbe.com/fr/fub?q={glosbe_query}",
                    "webonary_search": f"https://www.webonary.org/?s={query}",
                    "resulam_search": f"https://resulam.com/?s={query}",
                    "silcam_ewo": SILCAM["ewo"],
                    "silcam_dua": SILCAM["dua"],
                    "silcam_fub": SILCAM["fub"],
                    "note": (
                        "Lien de consultation manuelle. Ne pas recopier : "
                        "écrire une traduction originale et citer l'URL "
                        "dans commentaire si elle a aidé."
                    ),
                }
            )
    print(f"{len(rows)} termes -> {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
