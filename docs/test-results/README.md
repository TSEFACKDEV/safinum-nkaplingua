# Résultats de tests — 8 novembre 2026

Générés en local par les harnais du dépôt. Aucune donnée réelle.

| Fichier | Commande | Résultat |
|---|---|---|
| `api-robust.json` | `NK_MOCK=1 server/.venv/bin/python tests/api.robust.py` | **17/17** cas |
| `pipeline-pack.json` | `node tests/pipeline.e2e.js --mode=pack` | **pass**, 0 réseau |
| `pipeline-reviewed.json` | `node tests/pipeline.e2e.js --mode=reviewed` | **pass** : draft/reviewed en démo, refus en strict, cache isolé |
| `pipeline-edge.json` | `node tests/pipeline.e2e.js --mode=edge` | **pass**, 4 cas |
| `pipeline-unseen.json` | `node tests/pipeline.e2e.js --mode=unseen` | **blocked** : modèle NLLB absent |
| `pipeline-demo.json` | `node tests/pipeline.e2e.js --mode=demo` | **blocked** : validation native absente |
| `native-review-audit.json` / `.csv` | `python3 scripts/audit-native-reviews.py` | **472 lignes auditées**, 85 « Tafsiri » rejetées |
| `reviewed-packs.json` | `python3 scripts/build-reviewed-packs.py` | **0 validée**, 107/122/121 entrées |

## Ce que ces résultats prouvent

- contrats API, CORS, refus et contenu JSON (pas de HTML interprété) ;
- pack validé : zéro requête réseau, latence locale sous 50 ms ;
- préservation des montants, noms et références dans le pipeline pack ;
- refus d'un pack miss, d'un texte long sans pack et d'une cible qui perd un
  jeton.

## Ce qu'ils ne prouvent pas

- la qualité NLLB sur les 20 phrases inédites : le modèle n'est pas téléchargé ;
- la couverture 102/102 de la page de démo : les packs contiennent des brouillons, pas encore de validation ; le test `tests/site-demo.e2e.js` vérifie l'intégration content/background/packs ;
- les 40 cas de préservation sur la démo complète.
