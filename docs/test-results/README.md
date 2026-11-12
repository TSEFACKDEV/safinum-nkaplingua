# Résultats de tests — NkapLingua

Générés en local par les harnais du dépôt. Aucune donnée réelle.

## 12 novembre 2026 — reçu de traduction

| Fichier | Portée | Résultat |
|---|---|---|
| `real-site-packs-2026-11-12-153512.json` | Chrome 158, 5 étapes + EN, reçu | **188/188**, EN 40/44, 0 non traduit, 0 erreur |
| `real-firefox-2026-11-12-154230.json` | Firefox 159, 5 étapes + EN, reçu | **188/188**, EN 40/44, 0 non traduit, 0 erreur |

Voir [`docs/REAL_TEST_2026-11-12.md`](../REAL_TEST_2026-11-12.md).

## 10 novembre 2026 — recette pack-only, charge API, taxonomie

| Fichier | Portée | Résultat |
|---|---|---|
| `real-site-packs-2026-11-10-011346.json` | Chrome 158, site SAFINUM, 5 étapes + EN, packs | **188/188** sur 5 étapes, 0 non traduit, 0 critique MT, restauration 5/5, 0 erreur |
| `real-firefox-2026-11-10-011500.json` | Firefox 159, site SAFINUM, 5 étapes + EN, packs | **188/188** sur 5 étapes, 0 non traduit, 0 critique MT, restauration 5/5, 0 erreur |
| `api-load-2026-11-10.json` | 24 requêtes concurrentes FR/EN + 503 ewondo | **24/24**, 0 mélange, p95 29,86 ms ; 503 isolé 6/6, `/health` 200 |
| `pipeline-pack.json` | `node tests/pipeline.e2e.js --mode=pack` | pass, 0 réseau |
| `pipeline-reviewed.json` | `node tests/pipeline.e2e.js --mode=reviewed` | pass : draft/reviewed en démo, refus en strict |
| `pipeline-edge.json` | `node tests/pipeline.e2e.js --mode=edge` | pass, 4 cas |

EN pack-only : **40/44** (4 dates restantes). Les entrées anglaises `Back to hackathon`, `Balance` et `Fees` ont été ajoutées en brouillons ; l’audit du 9 nov (backend) donnait 38/44.

Voir [`docs/REAL_TEST_2026-11-10.md`](../REAL_TEST_2026-11-10.md).

## 9 novembre 2026 — stack packs + serveur

| Fichier | Portée | Résultat |
|---|---|---|
| `real-site-packs-2026-11-09.json` | Site SAFINUM, 5 étapes, packs + serveur | **188/188 traduits**, 0 non traduit, 0 critique MT, restauration 5/5 |
| `real-site-packs-2026-11-10.json` | Pack-only, backend arrêté, 5 étapes + EN + repli | **188/188 FR, EN 40/44**, repli OK, 0 erreur |
| `real-site-ewo-facture-2026-11-10.json` | Ewondo ciblé après correction | **40/40**, `Mákyé má mwinda`, 0 erreur |
| `guide-2026-11-10.json` | Conditions du guide SAFINUM | **pass** : dynamique, montants, références, langue |
| `api-load-2026-11-10.json` | 24 requêtes concurrentes + 503 isolé | **24/24 200**, 503 isolé, `/health` 200 |
| `real-first3-packs-2026-11-09.json` | Premier écran, ewondo/fulfulde | 39/40 et 40/40, titres traduits |
| `real-first3-dua-2026-11-09.json` | Premier écran, duala | 40/40, titre traduit |
| `real-unseen-2026-11-09.json` | 20 phrases inédites, packs + serveur | Production 1/20 ; démo 4/20 |

Voir [`docs/AUDIT_2026-11-09.md`](../AUDIT_2026-11-09.md).

## 8 novembre 2026 — repli NLLB seul

| Fichier | Portée | Résultat |
|---|---|---|
| `real-site-step1-2026-11-08.json` | Site SAFINUM, étape 1, NLLB | **6/44**, 38 en français, 2 critiques MT ; 0 erreur |
| `real-site-5steps-2026-11-08.json` | Site SAFINUM, 5 étapes, NLLB | **31/192**, 161 en français, 9 critiques MT, restauration 5/5 |
| `real-site-en-2026-11-08.json` | Bascule FR → EN, étape 1 | **7/44**, 37 en anglais, titre non traduit |
| `real-unseen-2026-11-08.json` | 20 phrases inédites via background réel | Production **1/20** ; démo **4/20** |
| `real-tokens-2026-11-08.json` | Appels réels avec jetons | `[[NUM_0]]` conservé ; `[[NAME_0]]` perdu sur un cas |

Voir [`docs/AUDIT_2026-11-08.md`](../AUDIT_2026-11-08.md).

## Résultats mock/CI

| Fichier | Commande | Résultat |
|---|---|---|
| `api-robust.json` | `NK_MOCK=1 python tests/api.robust.py` | **17/17** cas |
| `pipeline-unseen.json` | `node tests/pipeline.e2e.js --mode=unseen` | bloqué : NLLB absent |
| `pipeline-demo.json` | `node tests/pipeline.e2e.js --mode=demo` | bloqué : validation native absente |
| `native-review-audit.json` / `.csv` | `python3 scripts/audit-native-reviews.py` | **472 lignes auditées**, 85 « Tafsiri » rejetées |
| `reviewed-packs.json` | `python3 scripts/build-reviewed-packs.py` | **0 validée**, 231/210/203 entrées |

## Ce que ces résultats prouvent

- contrats API, CORS, refus, JSON sans HTML ;
- charge concurrente sans mélange FR/EN, 503 isolé sans casser `/health` ;
- pack-only : 188/188 sur le site, zéro réseau, latence locale ;
- préservation des montants, comptes, noms, références et restauration 5/5 ;
- taxonomie popup distincte (`low_roundtrip`, `token_lost`, `too_short`,
  `dnt_missing`).

## Ce que ces résultats ne prouvent pas

- **0 phrase validée** : les packs sont des brouillons humains/éditoriaux ;
- EN 40/44 pack-only (4 dates restantes), 38/44 avec backend dans l’audit ;
- inédit réel : **1/20 production, 4/20 démo** ;
- NLLB seul : **31/192** sur 5 étapes, 6/44 à l’étape 1 ;
- qualité linguistique native : aucune validation TRAPD indépendante ;
- Firefox : recette avec XPI de test auto-déclenché, pas le paquet signé.
