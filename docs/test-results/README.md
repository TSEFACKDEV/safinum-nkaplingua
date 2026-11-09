# Résultats de tests — 8 novembre 2026

Générés en local par les harnais du dépôt. Aucune donnée réelle.

## Résultats récents — stack packs + serveur (9 novembre)

| Fichier | Portée | Résultat |
|---|---|---|
| `real-site-packs-2026-11-09.json` | Site SAFINUM, 5 étapes, packs + serveur | **188/188 traduits**, 0 non traduit, 0 critique MT, restauration 5/5 |
| `real-first3-packs-2026-11-09.json` | Premier écran, ewondo/fulfulde | 39/40 et 40/40, titres traduits |
| `real-first3-dua-2026-11-09.json` | Premier écran, duala | 40/40, titre traduit |
| `real-unseen-2026-11-09.json` | 20 phrases inédites, packs + serveur | Production 1/20 ; démo 4/20 |

Voir [`docs/AUDIT_2026-11-09.md`](../AUDIT_2026-11-09.md).

## Repli NLLB seul — 8 novembre

| Fichier | Commande / portée | Résultat |
|---|---|---|
| `real-site-step1-2026-11-08.json` | Site SAFINUM, étape 1, extension réelle + NLLB | **6/44 segments traduits**, 38 restent en français, 2 critiques en MT démo ; 0 erreur page |
| `real-site-5steps-2026-11-08.json` | Site SAFINUM, **5 étapes**, extension réelle + NLLB | **31/192 segments traduits**, 161 en français, 9 critiques MT démo, restauration 5/5 |
| `real-site-en-2026-11-08.json` | Bascule FR → EN, étape 1 | **7/44 traduits**, 37 en anglais, titre non traduit |
| `real-unseen-2026-11-08.json` | 20 phrases inédites via le background réel | Production : **1/20** ; démo : **4/20** |
| `real-tokens-2026-11-08.json` | Appels réels avec jetons | `[[NUM_0]]` conservé ; `[[NAME_0]]` perdu sur un cas |

Voir l’analyse complète : [`docs/AUDIT_2026-11-08.md`](../AUDIT_2026-11-08.md).

## Résultats mock/CI

| Fichier | Commande | Résultat |
|---|---|---|
| `api-robust.json` | `NK_MOCK=1 server/.venv/bin/python tests/api.robust.py` | **17/17** cas |
| `pipeline-pack.json` | `node tests/pipeline.e2e.js --mode=pack` | **pass**, 0 réseau |
| `pipeline-reviewed.json` | `node tests/pipeline.e2e.js --mode=reviewed` | **pass** : draft/reviewed en démo, refus en strict, cache isolé |
| `pipeline-edge.json` | `node tests/pipeline.e2e.js --mode=edge` | **pass**, 4 cas |
| `pipeline-unseen.json` | `node tests/pipeline.e2e.js --mode=unseen` | **historique bloqué** : remplacé par le test réel |
| `pipeline-demo.json` | `node tests/pipeline.e2e.js --mode=demo` | **historique bloqué** : remplacé par le test réel |
| `native-review-audit.json` / `.csv` | `python3 scripts/audit-native-reviews.py` | **472 lignes auditées**, 85 « Tafsiri » rejetées |
| `reviewed-packs.json` | `python3 scripts/build-reviewed-packs.py` | **0 validée**, 182/195/196 entrées |

## Ce que ces résultats prouvent

- contrats API, CORS, refus et contenu JSON (pas de HTML interprété) ;
- pack validé : zéro requête réseau, latence locale sous 50 ms ;
- préservation des montants, noms et références dans le pipeline pack ;
- refus d’un pack miss, d’un texte long sans pack et d’une cible qui perd un
  jeton ;
- sur le site réel : aucun crash, boutons stables, montants et restauration
  fonctionnels, mais **couverture et qualité insuffisantes**.

## Ce qu’ils ne prouvent pas

- la qualité NLLB est faible sur les phrases financières : **1/20 en
  production, 4/20 en démo** ;
- la couverture packs est **188/188** sur 5 étapes, mais **0 phrase validée** ;
- le repli NLLB seul reste **31/192** et **6/44** à l’étape 1 ;
- les packs ewondo et duala sont vides : **aucune phrase validée** ;
- les étapes 2 à 5 du site n’ont pas été rejouées en NLLB réel ;
- le message d’erreur du popup ne distingue pas `low_roundtrip` de
  `token_lost` ;
- les 40 cas de préservation sur la démo complète ne sont pas couverts par un
  test réel.
