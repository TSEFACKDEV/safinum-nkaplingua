# Contribuer à NkapLingua

Merci de vouloir aider ! Ce projet est un prototype de hackathon : la clarté,
la sécurité et la traçabilité des données comptent plus que la quantité de
fonctionnalités.

## 1. Branches

| Branche | Rôle |
|---|---|
| `main` | version stable / démo |
| `develop` | intégration |
| `klein` | espace de travail Klein |
| `freedy` | espace de travail Freedy |
| `marius` | espace de travail Marius |

Pour une fonctionnalité :

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ma-fonctionnalite
```

Puis ouvrir une **pull request vers `develop`**. Ne pas pousser directement sur
`main`.

## 2. Installation

```bash
git clone git@github.com:TSEFACKDEV/safinum-nkaplingua.git
cd safinum-nkaplingua

cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Pour le CI / les tests sans modèle :

```bash
pip install -r server/requirements-ci.txt
NK_MOCK=1 pytest -q server/test_api.py
```

## 3. Vérifications avant PR

```bash
node --check extension/background.js
node --check extension/content.js
node --check extension/popup.js

python3 -c "import json; json.load(open('extension/manifest.json')); json.load(open('extension/manifest.firefox.json'))"

./scripts/build-firefox.sh
npx --yes web-ext lint --source-dir dist/firefox

NK_MOCK=1 pytest -q server/test_api.py
```

## 4. Règles de sécurité

- Ne jamais committer de clé API, token, mot de passe ou donnée client.
- Ne pas ajouter de permission `*://*/*` sans discussion.
- Ne pas lire les valeurs de formulaire, mots de passe ou OTP.
- Ne pas utiliser `innerHTML` avec du texte traduit.
- Ne pas envoyer de texte de page à un service cloud sans accord explicite.
- Toute nouvelle source de données doit avoir une licence documentée dans
  `docs/DATA_LICENSES.md`.

## 5. Données linguistiques

- Utiliser l’orthographe **AGLC**.
- Ne pas inventer une traduction : la colonne `target_fub` du glossaire doit
  être validée par un locuteur natif.
- Ne pas utiliser un dictionnaire ou un corpus sans licence.
- Documenter la source, la licence et la date de validation.

## 6. Commits

Format recommandé :

```text
feat: ajouter le mode bilingue
fix: préserver les montants dans le content script
docs: mettre à jour les licences
test: couvrir le refus d'un jeton manquant
chore: mettre à jour la CI
```

## 7. Pull requests

- Décrire le problème et la solution.
- Indiquer les tests effectués.
- Joindre une capture ou un court texte de sortie si la traduction change.
- Ne pas mélanger plusieurs sujets sans rapport.
- La CI doit passer avant merge.

## 8. Signaler un problème

Ouvrir une issue avec :

- le navigateur et sa version ;
- la page ou l’extrait concerné (anonymisé) ;
- le comportement attendu ;
- le comportement observé ;
- les logs éventuels, sans donnée personnelle.
