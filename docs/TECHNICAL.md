# Document technique — NkapLingua

**Projet** : NkapLingua — couche d’accessibilité linguistique pour les services
financiers numériques camerounais.

**Challenge** : SAFINUM Innovate Challenge 2026 — Hackathon Preselection.

**Langue cible** : fulfulde (Adamawa), code ISO 639-3 `fub`, code modèle
`fuv_Latn`.

**Version** : prototype 0.2 — novembre 2026.

---

## 1. Problème traité

Les interfaces de mobile money, de banque et de microfinance sont souvent en
français ou en anglais. Une partie de la population ne maîtrise pas
suffisamment ces langues pour comprendre :

- un solde ;
- des frais ;
- les conditions d’un crédit ;
- un avertissement de sécurité ;
- un message d’erreur ;
- un récapitulatif avant confirmation.

NkapLingua ajoute une couche de traduction **non intrusive** à une interface
financière existante, sans modifier son code source.

## 2. Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ Page financière existante (fournie par le jury ou simulée)   │
│  - solde, frais, transfert, confirmation, erreurs            │
└──────────────────────────────┬───────────────────────────────┘
                               │ DOM visible
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Content script (extension)                                   │
│  - TreeWalker sur les nœuds texte                            │
│  - exclusions : input, password, OTP, PIN, code, pre         │
│  - détection FR/EN                                           │
│  - pseudonymisation : nombres, URLs, emails                  │
│  - découpage en phrases                                      │
│  - rendu réversible + MutationObserver                       │
└──────────────────────────────┬───────────────────────────────┘
                               │ messages
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Background (Chrome service worker / Firefox event page)      │
│  - cache local                                               │
│  - backend local prioritaire si disponible                   │
│  - sinon service cloud MyMemory (texte pseudonymisé)         │
└──────────────────────────────┬───────────────────────────────┘
                               │ local ou HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Moteur de traduction                                         │
│  - NLLB-200 local (FastAPI) ou MyMemory cloud                │
│  - découpage en phrases                                      │
│  - post-contrôle : jetons + termes critiques                 │
│  - refus si un montant/entité est modifié                    │
└──────────────────────────────────────────────────────────────┘
```

### Composants

| Composant | Fichier | Rôle |
|---|---|---|
| Extension Chrome/Edge | `extension/manifest.json` | Manifest V3 |
| Extension Firefox | `extension/manifest.firefox.json` | event page, Firefox 140+ |
| Content script | `extension/content.js` | lecture DOM, pseudonymisation, rendu |
| Background | `extension/background.js` | orchestration, cache, local/cloud |
| Popup | `extension/popup.html/js/css` | contrôle utilisateur, texte inédit |
| Backend | `server/app.py` | API FastAPI + NLLB |
| Tests | `server/test_api.py` | tests sans modèle (`NK_MOCK=1`) |
| CI | `.github/workflows/ci.yml` | tests, lint, scan de secrets |
| Démo | `demo/index.html` | page FINAKA fictive |

## 3. Flux de données

1. L’utilisateur ouvre une page financière.
2. Il clique sur l’icône NkapLingua.
3. Le content script est injecté via `activeTab` + `scripting`.
4. Il collecte les nœuds texte visibles, hors champs sensibles.
5. Il détecte la langue source (français ou anglais).
6. Il remplace les nombres, URLs et emails par des jetons.
7. Il envoie les segments au background, qui appelle le backend local.
8. Le backend découpe en phrases, traduit avec NLLB et vérifie les jetons.
9. Le content script restaure les jetons et écrit le texte via `textContent`.
10. L’utilisateur peut restaurer l’original à tout moment.

## 4. Approche d’intégration

- **Aucune modification du site cible** : le code de la banque ou de la fintech
  n’est pas touché.
- **Aucune API côté banque** : l’extension lit uniquement le DOM rendu.
- **Aucune dépendance à un identifiant de page** : le pipeline est générique.
- **Fonctionne sans backend** : un service cloud de secours (MyMemory) prend le
  relais si le backend local n’est pas lancé ; le texte reste pseudonymisé.
- **Permissions minimales** : `activeTab`, `scripting`, `storage`,
  `contextMenus`; pas de `*://*/*`.
- **Portabilité** : même code JS pour Chrome et Firefox, avec
  `globalThis.browser ?? globalThis.chrome`.

### Adaptation à l’interface du jury

Le prototype ne dépend pas de la page FINAKA. Il fonctionne sur toute page web
ordinaire après clic de l’utilisateur. Les éléments spécifiques à la démo
(solde, frais, transfert) sont là pour illustrer le parcours, pas pour être
reconnus par le code.

## 5. Dépendances et licences

| Dépendance | Version | Licence | Usage |
|---|---|---|---|
| `facebook/nllb-200-distilled-600M` | 600M | CC BY-NC 4.0 | traduction locale |
| MyMemory Translation API | — | service externe gratuit | traduction cloud de secours |
| FastAPI | >=0.115 | MIT | API |
| Uvicorn | >=0.30 | BSD | serveur |
| PyTorch | >=2.3 | BSD | inférence |
| Transformers | >=4.44 | Apache-2.0 | chargement NLLB |
| SentencePiece | >=0.2 | Apache-2.0 | tokenizer |
| corpus Adamawa Fulfulde–French 1.2 | — | NOODL-1.0 | évaluation |
| Common Voice Adamawa Fulfulde | — | CC0 1.0 | audio optionnel |

**Contribution propre** :

- pipeline DOM non intrusif ;
- pseudonymisation et contrôle de préservation ;
- découpage en phrases pour stabiliser NLLB ;
- interface de traduction réversible ;
- tests et CI ;
- documentation de sécurité et de licences.

**Composants tiers** : NLLB, FastAPI, PyTorch, Transformers. Aucun service cloud
de traduction n’est utilisé.

## 6. Sécurité et intégrité

- Aucune lecture des valeurs de formulaire, mots de passe, OTP ou PIN.
- Aucun cookie, token ou header d’authentification transmis.
- Backend lié à `127.0.0.1`, sans journalisation du texte.
- Jetons `[[NUM_n]]`, `[[URL_n]]`, `[[EMAIL_n]]` : contrôle d’unicité.
- Termes critiques (`FCFA`, `PIN`, `OTP`, etc.) : contrôle de présence.
- Refus de la traduction si un jeton ou un terme critique manque.
- UI en Shadow DOM, texte injecté via `textContent` (pas de `innerHTML`).
- CSP de l’extension verrouillée ; aucun code distant.

## 7. Traitement linguistique

- Langue cible : fulfulde adamawa (`fub`).
- Modèle : NLLB `fuv_Latn` (fulfulde nigérian, proche de l’adamawa).
- Découpage en phrases courtes pour limiter les répétitions.
- Orthographe de référence : AGLC.
- Validation prévue : 20 à 100 phrases finance, locuteur natif, grille
  adéquation/fidélité/terminologie.
- Les phrases longues et certaines tournures financières restent fragiles :
  voir `docs/LANGUAGE_VALIDATION.md` et `docs/EVAL.md`.

## 8. Tests et reproductibilité

### Tests locaux sans modèle

```bash
cd server
pip install -r requirements-ci.txt
NK_MOCK=1 pytest -q test_api.py
```

### Tests extension

```bash
node --check extension/background.js
node --check extension/content.js
node --check extension/popup.js
./scripts/build-firefox.sh
npx --yes web-ext lint --source-dir dist/firefox
```

### Démonstration

```bash
cd server
source .venv/bin/activate
NK_DEVICE=cpu uvicorn app:app --host 127.0.0.1 --port 8000
```

Puis ouvrir `http://127.0.0.1:8000/demo`.

## 9. Limites connues

- NLLB n’est pas spécialisé sur le fulfulde adamawa ; la variété produite peut
  différer.
- Les phrases longues peuvent être mal traduites ou répétitives.
- Les noms propres ne sont pas encore protégés par un mécanisme dédié.
- Pas de support des iframes cross-origin, shadow DOM fermés, images/canvas.
- Pas de traduction audio (TTS fulfulde) dans le MVP.
- Le backend local est optionnel ; le mode cloud dépend d’un service externe
  (MyMemory) et de sa disponibilité/quota.
- En mode cloud, le texte pseudonymisé quitte la machine ; ne pas l’utiliser
  avec des données réelles sensibles.
- NLLB est CC BY-NC 4.0 : usage non commercial pour le hackathon.
- Le prototype n’est pas une traduction certifiée pour un contrat.

## 10. Feuille de route technique

1. Valider 20 phrases avec un locuteur natif.
2. Remplir le glossaire finance et ajouter un mécanisme de termes protégés.
3. Ajouter la protection des noms propres / bénéficiaires.
4. Ajouter un mode bilingue côte à côte pour les conditions contractuelles.
5. Ajouter une synthèse vocale fulfulde si une voix validée est disponible.
6. Tester sur l’interface fournie par le jury.
7. Enregistrer la vidéo de démonstration de 3 minutes.
