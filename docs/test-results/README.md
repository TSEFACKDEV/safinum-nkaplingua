# Résultats de tests — 8 novembre 2026

Générés en local par les harnais du dépôt. Aucune donnée réelle.

| Fichier | Commande | Résultat |
|---|---|---|
| `api-robust.json` | `NK_MOCK=1 server/.venv/bin/python tests/api.robust.py` | **17/17** cas |
| `pipeline-pack.json` | `node tests/pipeline.e2e.js --mode=pack` | **pass**, 3,57 ms, 0 réseau |
| `pipeline-edge.json` | `node tests/pipeline.e2e.js --mode=edge` | **pass**, 4 cas |
| `pipeline-unseen.json` | `node tests/pipeline.e2e.js --mode=unseen` | **blocked** : modèle NLLB absent |
| `pipeline-demo.json` | `node tests/pipeline.e2e.js --mode=demo` | **blocked** : pack 102/102 absent |

## Ce que ces résultats prouvent

- contrats API, CORS, refus et contenu JSON (pas de HTML interprété) ;
- pack validé : zéro requête réseau, latence locale sous 50 ms ;
- préservation des montants, noms et références dans le pipeline pack ;
- refus d'un pack miss, d'un texte long sans pack et d'une cible qui perd un
  jeton.

## Ce qu'ils ne prouvent pas

- la qualité NLLB sur les 20 phrases inédites : le modèle n'est pas téléchargé ;
- la couverture 102/102 de la page de démo : le pack est vide ;
- les 40 cas de préservation sur la démo complète.
