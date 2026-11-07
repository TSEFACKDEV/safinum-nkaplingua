# Dossier de travail — `dev`

> Clone de travail de `TSEFACKDEV/safinum-nkaplingua`, créé le 7 novembre 2026.
> **C'est ici qu'on travaille désormais**, pas dans le dossier d'analyse
> `safinum-nkaplingua`.

## Identité du clone

| Réglage | Valeur |
|---|---|
| Dépôt origin | `https://github.com/TSEFACKDEV/safinum-nkaplingua.git` |
| Branche de départ | `develop` |
| Commit de départ | `55292c8` (docs : trois langues) |
| Remotes | `origin` seulement (HTTPS) |
| Config locale | inscription et nom à définir avant le premier commit |

## Après un clone ou un pull

```bash
cd /home/dark-linux/Documents/Temp/hacaton/dev

git status -sb
python3 scripts/check-evolution.py
git log --oneline -5
```

Puis lire, dans l'ordre :

1. [`tasks/START_PROMPT.md`](tasks/START_PROMPT.md) — le prompt de reprise ;
2. [`tasks/README.md`](tasks/README.md) — répartition Freedy / Klein / Marius ;
3. [`tasks/EVOLUTION.md`](tasks/EVOLUTION.md) — la dernière entrée qui te concerne ;
4. ton lot : [`tasks/klein.md`](tasks/klein.md) ou [`tasks/marius.md`](tasks/marius.md).

## Branches

| Branche | Usage |
|---|---|
| `develop` | intégration, base de travail |
| `klein` | lot langue, données, validation, audio |
| `marius` | lot moteur, sécurité, intégration, CI |
| `freedy` | frontend visuel, expérience, tests profonds |

Workflow :

```bash
git checkout develop
git pull origin develop
git checkout -b ma-branche     # ou git checkout <klein|marius|freedy>
git pull origin <branche-du-lot>
```

On pousse sur sa branche, puis on ouvre une PR vers `develop`.

## Ce qui n'est pas dans ce clone

- **L'audit et le rapport de tests** (`docs/AUDIT_2026-11-07.md`,
  `docs/TEST_REPORT_2026-11-07.md`, `docs/test-results/`) restent **locaux**
  dans le dossier d'analyse, non publiés. Les lots `tasks/` en reprennent
  l'essentiel.
- Les scripts de test d'audit `tests/pipeline.e2e.js`, `tests/api.robust.py`,
  `tests/privacy.test.js`, `tests/demo.e2e.js` sont absents du clone : Marius
  les ajoute dans son lot (M9) s'ils ne sont pas encore dans le dépôt.
- Le venv Python, `node_modules` et le modèle NLLB (2,4 Go) doivent être
  recréés localement.

## Première installation

```bash
# Backend local (optionnel, pour la MT fulfulde)
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Tests backend sans modèle
NK_MOCK=1 pytest -q test_api.py

# Tests JS
cd ..
node scripts/test-extension.js

# jsdom (tests DOM)
npm install --no-save --no-package-lock jsdom
```

## Rituel obligatoire

Chaque avancement est consigné dans [`tasks/EVOLUTION.md`](tasks/EVOLUTION.md),
puis :

```bash
python3 scripts/check-evolution.py
```

Le journal est validé avant le commit. Un commit sans entrée n'est pas accepté.

## Règles du projet

- **Trois langues** : fulfulde d'Adamawa (`fub`), ewondo (`ewo`), duala
  (`dua`). Yemba, medumba, bassa et ghomala' sont retirés.
- **Niveau A** (solde, frais, total, PIN/OTP, erreurs, confirmation,
  sécurité) : **pack validé uniquement**, sinon français + badge « non
  traduit ».
- **Pas de MyMemory** dans le chemin de démo ; local-only par défaut.
- **Aucun bouton du site hôte désactivé** ; panneaux injectés en Shadow DOM.
- **Libre de droit** : code MIT, traductions CC0/CC BY avec consentement,
  audio humain CC0/CC BY. NLLB et MMS-TTS restent non commerciaux.
- **Aucune donnée réelle**, aucune transaction réelle.

## Commandes utiles

| Action | Commande |
|---|---|
| Journal | `python3 scripts/check-evolution.py` |
| Packs | `python3 scripts/check-language-packs.py` |
| Import pack | `python3 scripts/import-language-pack.py data/language-packs/<code>.csv` |
| Tests JS | `node scripts/test-extension.js` |
| Tests backend | `NK_MOCK=1 pytest -q server/test_api.py` |
| Packaging | `./scripts/package-extension.sh` |
| Firefox | `./scripts/build-firefox.sh && npx --yes web-ext lint --source-dir dist/firefox` |

## Sécurité Git

- Ne pas committer de secret ni de donnée personnelle.
- Ne pas utiliser `--force` sur une branche partagée.
- La CI (dont le job journal, une fois activé via `tasks/CI_JOB.yml`) doit
  passer avant une PR.
## Tester le popup redessiné

### 1. Aperçu interactif, sans charger l'extension

```bash
cd /home/dark-linux/Documents/Temp/hacaton/dev
npm install --no-save --no-package-lock playwright
node scripts/preview-popup.mjs --open
```

Une fenêtre Chromium s'ouvre au format popup (380 × 600). Les données de
langue et la traduction sont simulées : on teste la mise en page, les
sélections, l'accordéon et les états, pas le moteur réel. Fermer la fenêtre
termine le script.

Les captures sont écrites dans `docs/assets/` :

| Fichier | État |
|---|---|
| `popup-redesign.png` | popup fermé, fulfulde |
| `popup-redesign-ewo.png` | pack ewondo |
| `popup-redesign-test.png` | test de texte ouvert avec résultat |
| `popup-redesign-privacy.png` | confidentialité ouverte |
| `popup-redesign-error.png` | état d'erreur |
| `popup-redesign-list.png` | liste des langues ouverte |
| `popup-redesign-real.png` | popup chargé par la vraie extension |
| `popup-redesign-wide.png` | popup centré dans une page large |

### 2. Vrai test dans Chrome / Edge

1. Ouvrir `chrome://extensions`.
2. Activer **Mode développeur**.
3. **Charger l'extension non empaquetée** → choisir
   `/home/dark-linux/Documents/Temp/hacaton/dev/extension`.
4. Servir la démo depuis le dossier `dev` :

```bash
cd /home/dark-linux/Documents/Temp/hacaton/dev
python3 -m http.server 8099
```

5. Ouvrir <http://127.0.0.1:8099/demo/>.
6. Cliquer sur l'icône NkapLingua → le popup s'ouvre.
7. Vérifier : la langue cible et le bouton **Traduire cette page** sont
   visibles sans scroll ; changer de langue ; traduire ; restaurer ;
   déplier **Tester un texte inédit** ; ouvrir **Confidentialité**.
8. Pour tester la traduction réelle, lancer le backend local (voir plus haut)
   ou accepter que MyMemory soit utilisé si la case est cochée.

### 3. Firefox

1. Ouvrir `about:debugging#/runtime/this-firefox`.
2. **Charger un module temporaire…** → choisir
   `extension/manifest.firefox.json`.
3. Ouvrir la démo sur `http://127.0.0.1:8099/demo/`, puis cliquer l'icône.

### 4. Ce qu'il faut regarder

- Le parcours principal tient dans 380 × 600 : pas de scroll pour traduire,
  restaurer ou changer de langue.
- Le titre, la paire `FR/EN → FF` et le bouton primaire se lisent en moins de
  deux secondes.
- La ligne `MT:`/`PACK:` indique le moteur ; le statut passe au rouge en cas
  d'erreur, sans point décoratif.
- La liste des langues s'ouvre au clic, se ferme avec Échap, et affiche
  `MT`/`PACK` pour chaque option.
- Les coins sont arrondis : rail/liste 10 px, bouton 8 px, contrôles 6 px.
- Le focus clavier est visible ; l'ordre de tabulation suit le formulaire.
- Le panneau Confidentialité ne déborde pas horizontalement.
- Le test de texte s'ouvre et se ferme sans casser la hauteur du popup.

## Ce qui n'est pas dans ce clone

- **L'audit et le rapport de tests** (`docs/AUDIT_2026-11-07.md`,
  `docs/TEST_REPORT_2026-11-07.md`, `docs/test-results/`) restent **locaux**
  dans le dossier d'analyse, non publiés. Les lots `tasks/` en reprennent
  l'essentiel.
- Les scripts de test d'audit `tests/pipeline.e2e.js`, `tests/api.robust.py`,
  `tests/privacy.test.js`, `tests/demo.e2e.js` sont absents du clone : Marius
  les ajoute dans son lot (M9) s'ils ne sont pas encore dans le dépôt.
- Le venv Python, `node_modules` et le modèle NLLB (2,4 Go) doivent être
  recréés localement.

## Première installation

```bash
# Backend local (optionnel, pour la MT fulfulde)
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Tests backend sans modèle
NK_MOCK=1 pytest -q test_api.py

# Tests JS
cd ..
node scripts/test-extension.js

# jsdom (tests DOM)
npm install --no-save --no-package-lock jsdom
```

## Rituel obligatoire

Chaque avancement est consigné dans [`tasks/EVOLUTION.md`](tasks/EVOLUTION.md),
puis :

```bash
python3 scripts/check-evolution.py
```

Le journal est validé avant le commit. Un commit sans entrée n'est pas accepté.

## Règles du projet

- **Trois langues** : fulfulde d'Adamawa (`fub`), ewondo (`ewo`), duala
  (`dua`). Yemba, medumba, bassa et ghomala' sont retirés.
- **Niveau A** (solde, frais, total, PIN/OTP, erreurs, confirmation,
  sécurité) : **pack validé uniquement**, sinon français + badge « non
  traduit ».
- **Pas de MyMemory** dans le chemin de démo ; local-only par défaut.
- **Aucun bouton du site hôte désactivé** ; panneaux injectés en Shadow DOM.
- **Libre de droit** : code MIT, traductions CC0/CC BY avec consentement,
  audio humain CC0/CC BY. NLLB et MMS-TTS restent non commerciaux.
- **Aucune donnée réelle**, aucune transaction réelle.

## Commandes utiles

| Action | Commande |
|---|---|
| Journal | `python3 scripts/check-evolution.py` |
| Packs | `python3 scripts/check-language-packs.py` |
| Import pack | `python3 scripts/import-language-pack.py data/language-packs/<code>.csv` |
| Tests JS | `node scripts/test-extension.js` |
| Tests backend | `NK_MOCK=1 pytest -q server/test_api.py` |
| Packaging | `./scripts/package-extension.sh` |
| Firefox | `./scripts/build-firefox.sh && npx --yes web-ext lint --source-dir dist/firefox` |

## Sécurité Git

- Ne pas committer de secret ni de donnée personnelle.
- Ne pas utiliser `--force` sur une branche partagée.
- La CI (dont le job journal, une fois activé via `tasks/CI_JOB.yml`) doit
  passer avant une PR.
