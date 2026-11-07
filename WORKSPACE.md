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
