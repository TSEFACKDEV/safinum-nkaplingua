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
| `scripts/test-extension.js` | registre des langues, détection, packs, jetons, qualité | `node scripts/test-extension.js` | **pass** |
| `server/test_api.py` | contrats API, CORS, refus, mode mock | `NK_MOCK=1 python3 -m pytest -q server/test_api.py` | **pass** |

Vérifications complémentaires :

```bash
python3 scripts/check-evolution.py
python3 scripts/check-language-packs.py
python3 scripts/check-training-data.py
```

## Tests annoncés mais absents du dépôt

`tests/demo.e2e.js`, `tests/pipeline.e2e.js` et `tests/api.robust.py` sont des
artefacts locaux de l'audit, pas encore versionnés. Leur ajout est prévu par la
tâche M9 ; ils ne doivent pas être présentés comme exécutés tant qu'ils ne sont
pas dans le dépôt.

## CI

`.github/workflows/ci.yml` exécute :

- `server/test_api.py` en mode `NK_MOCK=1` ;
- `scripts/test-extension.js`, `tests/content.test.js`,
  `tests/privacy.test.js`, `tests/cloud-gating.test.js` et
  `tests/criticality.test.js` ;
- `scripts/check-evolution.py`, `scripts/check-pack-collisions.py`,
  `tests/check-pack-collisions.test.py`, les contrôles de packs et de données ;
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

- 3 ZIP construits : **377 Ko** chacun (< 10 Mo) ;
- `web-ext lint` : **0 erreur, 0 warning, 0 notice** ;
- CI GitHub vérifiée après push : **5 jobs verts** sur `develop` et `marius`
  (runs du 8 novembre 2026).

## Test navigateur manuel — M7

Le parcours réel sur `https://safinum.cm/hackathon-test` (5 étapes + FR/EN)
est décrit dans [docs/SITE_TEST_2026-11-08.md](../docs/SITE_TEST_2026-11-08.md).
Il nécessite un Chrome for Testing, Playwright et un backend local de test ; il
n'est **pas exécuté par la CI**. Résultat Chrome : 0 erreur page, montants,
noms et références préservés. Firefox reste à tester.
