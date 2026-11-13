# Tests — NkapLingua

Toutes les fixtures sont fictives : aucun compte, aucun montant réel, aucune
donnée personnelle.

## Prérequis

```bash
npm install --no-save --no-package-lock jsdom
```

Node 20+ (CI) ou 24 (poste de dev). Python 3.12 pour le backend.

## Tests présents

| Fichier | Portée | Commande | État |
|---|---|---|---|
| `tests/content.test.js` | content script en jsdom : texte, noms, attributs, options, restauration, jetons | `node tests/content.test.js` | **pass** |
| `tests/privacy.test.js` | aucune valeur de formulaire, zone `[data-sensitive]` ou montant brut ne quitte la page ; aucun `context` transmis (M1) | `node tests/privacy.test.js` | **pass** |
| `tests/cloud-gating.test.js` | pack sans réseau ; MyMemory jamais appelé sans opt-in ; case décochée par défaut (M2) | `node tests/cloud-gating.test.js` | **pass** |
| `tests/check-pack-collisions.test.py` | détecteur de collisions : collision, normalisation, doublon de source, pack invalide (M4) | `python3 tests/check-pack-collisions.test.py` | **pass** |
| `tests/criticality.test.js` | niveau A pack-only : aucun appel MT/cloud, original conservé ; niveau B autorisé (M3) | `node tests/criticality.test.js` | **pass** |
| `tests/import-glossary.test.py` | contrôle lexical glossaire à l'import : terme validé absent → refus, présent → acceptation, langue/statut (M5) | `python3 tests/import-glossary.test.py` | **pass** |
| `tests/pipeline.e2e.js` | pipeline pack/edge : zéro réseau, latence, jetons, références, pack miss (M9) | `node tests/pipeline.e2e.js --mode=all` | **pass** (unseen/demo bloqués) |
| `tests/api.robust.py` | 17 contrats HTTP, CORS, refus, JSON sans HTML (M9) | `NK_MOCK=1 python3 tests/api.robust.py` | **pass** |
| `tests/api-load.test.py` | charge 24 requêtes concurrentes FR/EN, 503 ewondo isolé (M9) | `server/.venv/bin/python tests/api-load.test.py` | **pass** |
| `tests/error-taxonomy.test.js` | messages popup distincts : low_roundtrip, token_lost, too_short, dnt_missing | `node tests/error-taxonomy.test.js` | **pass** |
| `tests/receipt.test.js` | reçu de traduction : compteurs, moteur, note brouillon, masquage à la restauration | `node tests/receipt.test.js` | **pass** |
| `tests/real-site.e2e.js` | recette Chrome réelle 5 étapes + EN, packs, préservation (manuel) | `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/real-site.e2e.js` | **pass** |
| `tests/real-firefox.e2e.py` | recette Firefox réelle 5 étapes + EN, packs, préservation (manuel) | `server/.venv/bin/python tests/real-firefox.e2e.py` | **pass** |
| `tests/guide.e2e.js` | conditions du guide SAFINUM : page non modifiée, dynamique, montants, changement de langue | `NK_TEST_CACHE=/tmp/nk-guide node tests/guide.e2e.js` | **pass** |
| `tests/review-kit.test.py` | kit natif : 150 phrases, 583 audits, 183 lignes, 0 validé | `python3 tests/review-kit.test.py` | **pass** |
| `scripts/test-extension.js` | registre des langues, détection, packs, jetons, qualité | `node scripts/test-extension.js` | **pass** |
| `server/test_api.py` | contrats API, CORS, refus, mode mock | `NK_MOCK=1 python3 -m pytest -q server/test_api.py` | **pass** |
| `tests/corpus.test.py` | corpus candidat : 642 lignes, clés uniques, 0 validé | `python3 tests/corpus.test.py` | **pass** |
| `tests/state.test.js` | état de page, retraduction au changement de langue, refus des no-op | `node tests/state.test.js` | **pass** |
| `tests/ui-language.test.js` | popup FR/EN selon `<html lang>` du site | `node tests/ui-language.test.js` | **pass** |
| `tests/popup-actions.test.js` | busy, succès réel et refus des no-op dans le popup | `node tests/popup-actions.test.js` | **pass** |
| `tests/unseen-text.test.js` | texte inédit multi-phrases : phrases connues traduites, inconnues laissées en français, critique préservée | `node tests/unseen-text.test.js` | **pass** |
| `tests/unseen-finance-text.test.js` | texte courant avec mot financier traduit par le moteur local ; vraies alertes conservées | `node tests/unseen-finance-text.test.js` | **pass** |
| `tests/popup-unseen.test.js` | popup : repli partiel expliqué sans erreur rouge, phrase absente signalée calmement | `node tests/popup-unseen.test.js` | **pass** |

Vérifications complémentaires :

```bash
python3 scripts/check-evolution.py
python3 scripts/check-language-packs.py
python3 scripts/check-training-data.py
```

## Tests annoncés mais absents du dépôt

`tests/demo.e2e.js` reste un artefact local de l'audit, pas encore versionné.
`tests/pipeline.e2e.js` et `tests/api.robust.py` sont désormais dans le dépôt.
Les résultats générés sont dans
[docs/test-results/](../docs/test-results/README.md).

## CI

`.github/workflows/ci.yml` exécute :

- `server/test_api.py`, `tests/api.robust.py` et `tests/api-load.test.py` en mode `NK_MOCK=1` ;
- `scripts/test-extension.js`, `tests/content.test.js`,
  `tests/privacy.test.js`, `tests/cloud-gating.test.js`,
  `tests/criticality.test.js`, `tests/error-taxonomy.test.js`,
  `tests/receipt.test.js` et `tests/pipeline.e2e.js --mode=all` ;
- `scripts/check-evolution.py`, `scripts/check-pack-collisions.py`,
  `tests/check-pack-collisions.test.py`, `tests/import-glossary.test.py`,
  les contrôles de packs et de données ;
- `build-firefox.sh`, `web-ext lint` et `package-extension.sh`.

Le test de confidentialité est la garde de non-régression de M1 : il échoue si
un `context` non vide ou une valeur de formulaire réapparaît dans un message
vers le moteur.

## Packaging vérifié — 8 novembre 2026

```bash
./scripts/package-extension.sh   # contrôle collisions + 3 ZIP
./scripts/build-firefox.sh
npx --yes web-ext lint --source-dir dist/firefox
```

- 3 ZIP construits : **370 Ko** chacun (< 10 Mo) ;
- `web-ext lint` : **0 erreur, 0 warning, 0 notice** ;
- **Chrome for Testing 158** : paquet chargé, service worker actif, popup avec
  les 3 langues, 0 erreur ;
- **Firefox 159** (binaire hors Snap) : paquet installé comme add-on temporaire
  par `web-ext run` ;
- CI GitHub vérifiée après push : **5 jobs verts** sur `develop` et `marius`
  (runs du 8 novembre 2026).

## Recette navigateur réelle — harnais versionnés

Deux harnais sont désormais dans le dépôt, hors CI (navigateur requis) :

- `tests/real-site.e2e.js` — Chrome for Testing + Playwright, packs, 5 étapes
  + EN ;
- `tests/real-firefox.e2e.py` — Firefox 159 + Selenium, XPI de test, 5 étapes
  + EN.

Résultats du 10 novembre 2026 : **188/188** sur 5 étapes en Chrome et Firefox,
0 non traduit, 0 critique MT, restauration 5/5, 0 erreur page. EN pack-only :
**40/44** (4 dates restantes) ; `Back to hackathon`, `Balance` et `Fees` ont
été ajoutés en brouillons, l'audit avec backend donnait 38/44.

Détails et preuves : [docs/REAL_TEST_2026-11-10.md](../docs/REAL_TEST_2026-11-10.md).
