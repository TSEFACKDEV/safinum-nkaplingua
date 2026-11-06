## Problème

Décrire le problème ou le besoin.

## Solution

Décrire le changement principal.

## Type de changement

- [ ] Fonctionnalité
- [ ] Correction
- [ ] Documentation
- [ ] Tests / CI
- [ ] Données / licences

## Vérifications

- [ ] `NK_MOCK=1 pytest -q server/test_api.py`
- [ ] `node --check extension/background.js`
- [ ] `node --check extension/content.js`
- [ ] `node --check extension/popup.js`
- [ ] `./scripts/build-firefox.sh && npx --yes web-ext lint --source-dir dist/firefox`
- [ ] Aucun secret ni donnée personnelle ajouté
- [ ] Licences des nouvelles données documentées

## Captures / sorties

Ajouter une capture ou un exemple de traduction si pertinent.

## Notes pour la revue

Points d’attention, limites connues, suites prévues.
