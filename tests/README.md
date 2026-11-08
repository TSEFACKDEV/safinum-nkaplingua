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
- `scripts/test-extension.js`, `tests/content.test.js` et
  `tests/privacy.test.js` ;
- `scripts/check-evolution.py`, les contrôles de packs et de données ;
- `build-firefox.sh`, `web-ext lint` et `package-extension.sh`.

Le test de confidentialité est la garde de non-régression de M1 : il échoue si
un `context` non vide ou une valeur de formulaire réapparaît dans un message
vers le moteur.
