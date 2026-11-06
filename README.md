# NkapLingua

[![CI](https://github.com/TSEFACKDEV/safinum-nkaplingua/actions/workflows/ci.yml/badge.svg)](https://github.com/TSEFACKDEV/safinum-nkaplingua/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](#chrome--edge)
[![Firefox](https://img.shields.io/badge/Firefox-140%2B-FF7139?logo=firefox&logoColor=white)](#firefox)

> **Traduction financière non intrusive en fulfulde, directement dans le navigateur.**

NkapLingua est une extension navigateur + un backend local qui traduit les
interfaces financières numériques en **fulfulde (Adamawa)** sans modifier le
site source, sans lire les champs sensibles et sans envoyer les données à un
service cloud.

Projet préparé pour le **SAFINUM Innovate Challenge 2026** (Yaoundé,
26–28 novembre 2026).

## Aperçu

<p align="center">
  <img src="docs/assets/demo-overview.png" alt="Aperçu de l’interface FINAKA avec NkapLingua" width="760" />
</p>

<p align="center">
  <img src="docs/assets/popup.png" alt="Popup de l’extension NkapLingua" width="300" />
</p>

Design system : [`docs/DESIGN.md`](docs/DESIGN.md).

---

## Sommaire

- [Le problème](#le-problème)
- [La solution](#la-solution)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Chrome / Edge](#chrome--edge)
- [Firefox](#firefox)
- [API](#api)
- [Sécurité et vie privée](#sécurité-et-vie-privée)
- [Données et licences](#données-et-licences)
- [Évaluation](#évaluation)
- [Structure du dépôt](#structure-du-dépôt)
- [Workflow Git](#workflow-git)
- [Roadmap](#roadmap)
- [Contribuer](#contribuer)
- [Licence](#licence)

---

## Le problème

Des millions de Camerounais utilisent le mobile money, mais les frais, les
conditions de crédit, les alertes de sécurité et les procédures KYC restent
souvent en français ou en anglais.

Les traducteurs généralistes ne connaissent pas la terminologie financière et
peuvent modifier un montant, un numéro de compte ou un avertissement. Une
mauvaise traduction dans ce contexte peut coûter de l’argent à l’utilisateur.

## La solution

NkapLingua ajoute une **couche de traduction réversible** à n’importe quelle page
financière :

1. l’utilisateur ouvre sa page mobile money ou sa banque ;
2. il clique sur l’extension ;
3. il choisit le fulfulde ;
4. la page devient lisible ;
5. il peut revenir à l’original à tout moment.

Le site source n’est jamais modifié. Aucune ligne de code n’est ajoutée au
serveur de la banque.

```text
Page financière
      │
      ▼
Content script
  ├─ nœuds texte visibles uniquement
  ├─ exclusion : mots de passe, OTP, PIN, champs de formulaire
  ├─ pseudonymisation : montants, numéros, URLs, emails
  ├─ découpage en phrases courtes
  └─ rendu réversible
      │
      ▼
Background (service worker Chrome / event page Firefox)
  ├─ cache local
  └─ appel HTTP vers 127.0.0.1:8000
      │
      ▼
Backend local — FastAPI + NLLB-200
  ├─ traduction français → fulfulde
  ├─ post-contrôle des jetons et termes critiques
  └─ refus si un montant ou une entité est modifié
```

## Fonctionnalités

- **Extension Manifest V3** pour Chrome/Edge et Firefox 140+.
- **Traduction réversible** : bouton « Restaurer l’original ».
- **Contenu inédit** : test dans le popup ou traduction de la sélection.
- **Mode bilingue** possible pour les termes sensibles.
- **Pseudonymisation** des montants, numéros, URLs et emails avant envoi.
- **Refus sécurisé** si un jeton ou un terme critique manque.
- **Aucune lecture** des mots de passe, codes OTP, PIN ou valeurs de formulaire.
- **Backend local** : le texte ne quitte pas la machine.
- **CI GitHub Actions** : tests backend mock, lint JS, lint Firefox, scan de
  secrets.

## Architecture

```mermaid
flowchart LR
    A[Page financière] --> B[Content script]
    B --> C[Background]
    C --> D[Backend local FastAPI]
    D --> E[NLLB-200]
    E --> D
    D --> C
    C --> B
    B --> F[Page traduite réversible]
```

### Stack

| Couche | Technologie |
|---|---|
| Extension | JavaScript, Manifest V3, Shadow DOM |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Traduction | NLLB-200 distilled 600M (`fuv_Latn`) |
| Tests | Pytest, FastAPI TestClient |
| CI | GitHub Actions |
| Données | Adamawa Fulfulde–French Parallel Corpus, NOODL-1.0 |

---

## Démarrage rapide

### Prérequis

- Python 3.10+
- Chrome/Edge 116+ ou Firefox 140+
- Node.js 20+ (uniquement pour `web-ext` et le lint Firefox)
- ~3 Go d’espace disque pour le modèle NLLB
- 8 Go de RAM recommandés

### 1. Backend local

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate

# Option CPU-only (plus léger sur Linux/Windows) :
pip install torch --index-url https://download.pytorch.org/whl/cpu

pip install -r requirements.txt
NK_DEVICE=cpu uvicorn app:app --host 127.0.0.1 --port 8000
```

Vérifier :

```bash
curl http://127.0.0.1:8000/health
```

Le premier lancement télécharge le modèle NLLB (~2,4 Go). Sur CPU, comptez
plusieurs dizaines de secondes pour la première traduction d’une page.

### 2. Mode maquette (sans modèle)

Pour tester l’extension et l’UI sans attendre le modèle :

```bash
cd server
source .venv/bin/activate
NK_MOCK=1 uvicorn app:app --host 127.0.0.1 --port 8000
```

### 3. Page de démo

Le backend sert directement la page de démonstration :

```text
http://127.0.0.1:8000/demo
```

La page FINAKA contient un solde, un transfert, des frais, un crédit, un champ
PIN/OTP et un paragraphe « texte inédit ».

---

## Chrome / Edge

1. Ouvrir `chrome://extensions`.
2. Activer le **mode développeur**.
3. Cliquer sur **Charger l’extension non empaquetée**.
4. Sélectionner le dossier `extension/`.
5. Épingler **NkapLingua**.
6. Ouvrir `http://127.0.0.1:8000/demo`.
7. Cliquer sur l’icône → **Traduire cette page**.

> Chrome 149+ bloque le chargement automatique des extensions non empaquetées
> via `--load-extension` dans les builds officielles. Le chargement manuel
> ci-dessus est la voie normale pour le développement.

## Firefox

```bash
./scripts/build-firefox.sh
```

Puis :

1. Ouvrir `about:debugging#/runtime/this-firefox`.
2. Cliquer sur **Charger un module temporaire…**.
3. Choisir `dist/firefox/manifest.json`.

Ou lancer directement une instance Firefox avec l’extension temporaire :

```bash
./scripts/start-firefox.sh
```

Détails et dépannage : [`docs/FIREFOX.md`](docs/FIREFOX.md).

---

## API

### `GET /health`

```json
{"status":"ok","model":"facebook/nllb-200-distilled-600M","mock":false,"loaded":true}
```

### `POST /translate`

```bash
curl -s http://127.0.0.1:8000/translate \
  -H 'Content-Type: application/json' \
  -d '{
    "target": "fub",
    "source": "fr",
    "segments": [
      {
        "id": "s1",
        "text": "Les frais de transfert sont de [[NUM_0]] FCFA.",
        "context": "mobile money"
      }
    ]
  }'
```

```json
{
  "translations": [
    {
      "id": "s1",
      "text": "Fedde jaɓɓorgo nden ko [[NUM_0]] FCFA.",
      "ok": true,
      "reason": null
    }
  ],
  "model": "facebook/nllb-200-distilled-600M",
  "target": "fub"
}
```

Les jetons `[[NUM_n]]`, `[[URL_n]]` et `[[EMAIL_n]]` sont contrôlés : si un
jeton manque ou est dupliqué, `ok` passe à `false` et l’extension conserve
l’original.

---

## Sécurité et vie privée

- `activeTab` + `scripting` : pas d’accès permanent à tous les sites.
- Aucune lecture des valeurs de formulaire, mots de passe, OTP ou cookies.
- Aucun code distant, aucune évaluation dynamique.
- UI en Shadow DOM ; le texte traduit est injecté via `textContent`.
- Montants, numéros, URLs et emails remplacés par des jetons avant traduction.
- Si un jeton ou un terme critique manque, la traduction est refusée.
- Backend lié à `127.0.0.1`, sans journalisation du texte.
- CORS restreint aux origines `chrome-extension://` et `moz-extension://`.

Détails : [`docs/SECURITY.md`](docs/SECURITY.md).

## Données et licences

| Ressource | Licence | Usage |
|---|---|---|
| **NLLB-200 distilled 600M** | CC BY-NC 4.0 | traduction, hackathon non commercial |
| **Adamawa Fulfulde–French Parallel Corpus 1.2** | NOODL-1.0 | évaluation / adaptation |
| **Common Voice Adamawa Fulfulde** | CC0 1.0 | audio optionnel |
| **Recherches du centre linguistique** | à confirmer | référence orthographique et terminologique |
| **Code NkapLingua** | MIT | réutilisation libre |

> NLLB est autorisé pour ce hackathon non commercial. Pour une exploitation
> commerciale, il faudra un accord ou un autre modèle (par exemple M2M100 MIT
> fine-tuné sur le corpus adamawa).

Détails : [`docs/DATA_LICENSES.md`](docs/DATA_LICENSES.md).

## Évaluation

Le projet distingue :

- **qualité linguistique** : validation par un locuteur natif fulfulde ;
- **sécurité** : 100 % des montants et entités préservés ;
- **contenu inédit** : phrases jamais utilisées pour l’entraînement ;
- **latence** : mesurée sur CPU et GPU.

Protocole et métriques : [`docs/EVAL.md`](docs/EVAL.md).

> Le modèle NLLB est un **baseline**. Les phrases courtes sont nettement plus
> fiables que les phrases longues. Une validation native est indispensable
> avant toute démonstration.

## Conformité SAFINUM

Le règlement officiel du Hackathon Preselection Challenge est analysé
exigence par exigence dans [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md).

| Document | Contenu |
|---|---|
| [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md) | grille 100 points, livrables, écarts |
| [`docs/DESIGN.md`](docs/DESIGN.md) | palette, typographie, espacement, accessibilité |
| [`docs/TECHNICAL.md`](docs/TECHNICAL.md) | architecture, intégration, dépendances, limites |
| [`docs/LANGUAGE_VALIDATION.md`](docs/LANGUAGE_VALIDATION.md) | fulfulde, méthode de validation native |
| [`docs/VIDEO_SCRIPT.md`](docs/VIDEO_SCRIPT.md) | script de la vidéo de 3 minutes |
| [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md) | checklist avant soumission |

---

## Structure du dépôt

```text
.
├── extension/              # Manifest V3, content script, popup, icônes
│   ├── manifest.json       # Chrome / Edge
│   └── manifest.firefox.json
├── server/                 # FastAPI + NLLB-200
│   ├── app.py
│   ├── test_api.py
│   ├── requirements.txt
│   └── requirements-ci.txt
├── demo/                   # Page FINAKA fictive
├── data/                   # Glossaire à valider, termes à ne pas traduire
├── docs/                   # Sécurité, licences, évaluation, pitch, Firefox
├── scripts/                # build Firefox, lancement Firefox
├── .github/workflows/      # CI GitHub Actions
└── README.md
```

## Workflow Git

Branches disponibles :

| Branche | Usage |
|---|---|
| `main` | version stable / démo |
| `develop` | intégration des fonctionnalités |
| `klein` | espace de travail Klein |
| `freedy` | espace de travail Freedy |
| `marius` | espace de travail Marius |

Règles simples :

1. Travailler sur sa branche (`klein`, `freedy`, `marius`) ou une branche
   `feature/...` créée depuis `develop`.
2. Faire une PR vers `develop`.
3. `main` ne reçoit que du code validé depuis `develop`.
4. Avant chaque PR :

```bash
NK_MOCK=1 pytest -q server/test_api.py
node --check extension/background.js
node --check extension/content.js
node --check extension/popup.js
```

Conventions de commit : `feat:`, `fix:`, `docs:`, `test:`, `chore:`.

## Roadmap

- [x] Extension Manifest V3 + backend local
- [x] Traduction réversible et test de texte inédit
- [x] Pseudonymisation des montants et entités
- [x] CI GitHub Actions
- [ ] Validation native de 100 phrases finance
- [ ] Glossaire finance validé (`data/glossary.template.csv`)
- [ ] Fine-tuning / adaptation au fulfulde adamawa
- [ ] Mode bilingue pour les contrats
- [ ] Tests end-to-end sur 5 sites financiers réels
- [ ] Packaging Chrome Web Store / AMO

## Contribuer

Les contributions sont bienvenues. Lire
[`CONTRIBUTING.md`](CONTRIBUTING.md) avant d’ouvrir une PR.

## Licence

Le code est sous **MIT** — voir [`LICENSE`](LICENSE).

Les modèles et données gardent leurs licences respectives : NLLB-200
(CC BY-NC 4.0), corpus Adamawa (NOODL-1.0), Common Voice (CC0 1.0).

## Remerciements

- **SAFINUM 2026** — Salon de la Finance Numérique, Yaoundé.
- **CNEF Cameroun** — cadre de réflexion sur la finance numérique.
- **Mozilla Data Collective** — corpus Adamawa Fulfulde.
- **Meta AI** — modèle NLLB-200.
- Les linguistes et locuteurs natifs qui valideront les traductions.

---

<p align="center">
  <strong>NkapLingua</strong> — rendre les frais, les conditions et les alertes
  compréhensibles, sans toucher au site et sans exposer les données.
</p>
