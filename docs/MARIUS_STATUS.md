# Lot Marius — suivi M1 à M13

**Date** : 10 novembre 2026
**Branche de travail** : `marius` (synchronisée avec `develop`, puis poussée)
**Journal** : [tasks/EVOLUTION.md](../tasks/EVOLUTION.md) (le bloc JSON fait foi)

| Tâche | Statut | Preuve principale | Reste à faire |
|---|---|---|---|
| **M1** — fuite `context` | ✅ done | `tests/privacy.test.js` rouge → vert ; aucun `context` dans les messages | — |
| **M2** — MyMemory opt-in | ✅ done | `tests/cloud-gating.test.js` ; case décochée, `=== true` | — |
| **M3** — politique niveau A | ✅ done | A strictement `validated` ; B/C brouillons acceptés hors démo avec toast « pack non validé » ; badge A vérifié | EN couvert par 3 entrées éditoriales, 40/44 |
| **M4** — collisions de packs | ✅ done | `check-pack-collisions.py`, 6 cas, build + CI | — |
| **M5** — contrôle lexical | ✅ done | `tests/import-glossary.test.py`, 5 cas ; backend protège/restaure | — |
| **M6** — formats de jetons | ⛔ blocked | 20 phrases prêtes ; torch/NLLB absents | Télécharger NLLB, comparer 4 formats |
| **M7** — site officiel Vue | ✅ done | Chrome 158 et Firefox 159 : 5 étapes + EN, **188/188**, 0 non traduit, 0 critique MT, restauration 5/5, 0 erreur | EN pack-only 40/44 (4 dates ; 38/44 audit backend) |
| **M8** — audio backend | ⛔ blocked | 15 phrases sans montant ; 0 OGG, index absent | Recevoir audio + consentements de Klein |
| **M9** — harnais e2e | ✅ done | `api.robust.py` 17/17 ; charge 24/24, p95 29,86 ms ; 503 isolé ; taxonomie ; harnais Chrome/Firefox versionnés | Modes unseen/demo (NLLB, validation native) |
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
node tests/error-taxonomy.test.js
python3 tests/import-glossary.test.py
python3 tests/check-pack-collisions.test.py
NK_MOCK=1 server/.venv/bin/python tests/api.robust.py
server/.venv/bin/python tests/api-load.test.py
NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/real-site.e2e.js
server/.venv/bin/python tests/real-firefox.e2e.py
python3 scripts/check-evolution.py
```

## Blocages externes

- packs fub/ewo/dua remplis en brouillons (185/198/199), **0 phrase validée** ;
- glossaire 0 validé, table orthographique non validée ;
- 15 fichiers audio absents ;
- modèle NLLB non téléchargé ;
- EN 40/44 pack-only (4 dates), 38/44 avec backend dans l’audit ;
- inédit : 1/20 production, 4/20 démo.
