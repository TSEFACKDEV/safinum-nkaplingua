#!/usr/bin/env python3
"""Contrôle du kit natif : volumes, pas de faux validé."""
import csv
from collections import Counter
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sent = list(csv.DictReader((root / "data/review/sentence-bank-50.csv").open(encoding="utf-8")))
audit = list(csv.DictReader((root / "data/review/entry-audit-582.csv").open(encoding="utf-8")))
kit = list(csv.DictReader((root / "data/review/native-kit.csv").open(encoding="utf-8")))
assert len(sent) == 150, len(sent)
assert Counter(r["lang"] for r in sent) == {"fub": 50, "ewo": 50, "dua": 50}
assert len(audit) == 583, len(audit)
assert len(kit) == 183, len(kit)
assert all(r["decision"] == "" for r in kit), "décision préremplie"
assert not any("validated" in (r["status"] + r["decision"]).lower() for r in kit)
print("review-kit OK — 150 phrases, 583 audits, 183 lignes, 0 validé")
