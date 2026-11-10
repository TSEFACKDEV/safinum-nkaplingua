#!/usr/bin/env python3
"""Contrôle du corpus candidat : pas de validation inventée, clés uniques."""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PATH = ROOT / "data/corpus/finance-multilingual.csv"
rows = list(csv.DictReader(PATH.open(encoding="utf-8")))
assert len(rows) >= 200, f"corpus trop petit : {len(rows)}"
keys = [(r["key_fr"] or r["key_en"]).strip().lower() for r in rows]
assert len(keys) == len(set(keys)), "clé dupliquée"
for r in rows:
    for lang in ("fub", "ewo", "dua"):
        assert r[f"{lang}_status"] in {"candidate", "missing"}, (lang, r)
        assert r[f"{lang}_status"] != "validated", "aucune validation ne doit être inventée"
assert all(r["fub_status"] != "validated" for r in rows)
facture = next(r for r in rows if r["key_fr"] == "Facture électricité")
assert facture["ewo"] == "Mákyé má mwinda"
assert "non validé" in facture["note"].lower() or "non validée" in facture["note"].lower()
filled = {lang: sum(bool(r[lang]) for r in rows) for lang in ("fub", "ewo", "dua")}
print(f"corpus OK — {len(rows)} lignes ; fub {filled['fub']}, ewo {filled['ewo']}, dua {filled['dua']} ; 0 validé")
