# Lot Marius — suivi M1 à M13

**Date** : 8 novembre 2026
**Branche de travail** : `marius` (synchronisée avec `develop`, puis poussée)
**Journal** : [tasks/EVOLUTION.md](../tasks/EVOLUTION.md) (le bloc JSON fait foi)

| Tâche | Statut | Preuve principale | Reste à faire |
|---|---|---|---|
| **M1** — fuite `context` | ✅ done | `tests/privacy.test.js` rouge → vert ; aucun `context` dans les messages | — |
| **M2** — MyMemory opt-in | ✅ done | `tests/cloud-gating.test.js` ; case décochée, `=== true` | — |
| **M3** — politique niveau A | ✅ done | `tests/criticality.test.js` ; badge `data-nk-untranslated` vérifié sur le site | — |
| **M4** — collisions de packs | ✅ done | `check-pack-collisions.py`, 6 cas, build + CI | — |
| **M5** — contrôle lexical | ✅ done | `tests/import-glossary.test.py`, 5 cas ; backend protège/restaure | — |
| **M6** — formats de jetons | ⛔ blocked | 20 phrases prêtes ; torch/NLLB absents | Télécharger NLLB, comparer 4 formats |
| **M7** — site officiel Vue | 🟡 in_progress | Chrome 158 : 5 étapes + EN, 0 erreur ; Firefox 159 : add-on chargé | Automatiser Firefox avec permissions d'hôte |
| **M8** — audio backend | ⛔ blocked | 15 phrases sans montant ; 0 OGG, index absent | Recevoir audio + consentements de Klein |
| **M9** — harnais e2e | 🟡 in_progress | `api.robust.py` 17/17 ; pipeline pack 3,6 ms, 0 réseau | Modes unseen/demo (NLLB, pack 102/102) |
| **M10** — packaging/CI | ✅ done | 3 ZIP 370 Ko ; Chrome + Firefox chargés ; lint 0/0/0 ; CI verte | — |
| **M11** — normaliseur ɲ/ny | ⛔ blocked | Table native vide dans `docs/ORTHOGRAPHY.md` | Recevoir la table validée |
| **M12** — Shadow DOM/iframes | ✅ done | [docs/SHADOW_DOM_IFRAMES.md](SHADOW_DOM_IFRAMES.md) | Support futur non promis |
| **M13** — concurrence backend | ✅ done | `_MODEL_LOCK` ; test FR/EN échoue sans verrou | — |

## Tests reproductibles

```bash
node scripts/test-extension.js
node tests/content.test.js
node tests/privacy.test.js
node tests/cloud-gating.test.js
node tests/criticality.test.js
node tests/pipeline.e2e.js --mode=all
python3 tests/import-glossary.test.py
python3 tests/check-pack-collisions.test.py
NK_MOCK=1 server/.venv/bin/python tests/api.robust.py
NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py
python3 scripts/check-evolution.py
```

## Blocages externes

- packs fulfulde/ewondo/duala vides (Klein) ;
- glossaire 0 validé, table orthographique non validée ;
- 15 fichiers audio absents ;
- modèle NLLB non téléchargé ;
- Firefox MV3 : permissions d'hôte non accordées à l'add-on temporaire.
