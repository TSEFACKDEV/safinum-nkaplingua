# Document technique — NkapLingua

**Projet** : NkapLingua — couche d’accessibilité linguistique pour les services
financiers numériques camerounais.

**Équipe** : ARTEMIS 237 (Klein, Freedy, Marius).

**Challenge** : SAFINUM Innovate Challenge 2026 — Hackathon Preselection.

**Langues cibles** : fulfulde (Adamawa) et ewondo en **MT brouillon**
(`flagship-ai`, avec NLLB en secours pour le fulfulde), duala en **pack
communautaire**. Aucune sortie MT n’est présentée comme validée : le niveau A
reste couvert par les packs. Yemba, medumba, bassa et ghomala’ sont retirés du
prototype (voir `tasks/klein.md`, K10).

**Version** : prototype 0.7.0 — novembre 2026.

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
│  - TreeWalker texte + attributs sûrs                         │
│  - exclusions : password, OTP, PIN, valeurs de formulaire    │
│  - détection FR/EN avec score et confiance                   │
│  - pseudonymisation : nombres, URLs, emails, noms            │
│  - découpage en phrases                                      │
│  - rendu réversible + MutationObserver                       │
└──────────────────────────────┬───────────────────────────────┘
                               │ messages
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Background (Chrome service worker / Firefox event page)      │
│  - cache local                                               │
│  - packs communautaires validés d’abord                      │
│  - phrases niveau A sans pack : bloquées, jamais de MT       │
│  - backend local flagship-ai / NLLB si disponible            │
│  - cloud MyMemory seulement si une paire cloud existe        │
└──────────────────────────────┬───────────────────────────────┘
                               │ local ou HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Moteur de traduction                                         │
│  - flagship-ai Marian/CTranslate2 (brouillon)                │
│  - NLLB-200 local en secours pour le fulfulde                │
│  - découpage en phrases, jetons préservés                    │
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
| Registre langues | `extension/languages.js` | cibles, détection FR/EN, normalisation |
| Packs | `extension/language-packs/*.json` | mémoires de traduction validées |
| Popup | `extension/popup.html/js/css` | choix de langue, texte inédit |
| Backend | `server/app.py` | API FastAPI, routage packs/flagship/NLLB, `/languages` |
| Moteur flagship | `server/flagship_mt.py` | CTranslate2 int8, découpage des jetons, brouillon MT |
| Tests | `server/test_api.py` | tests sans modèle (`NK_MOCK=1`), blocage niveau A |
| CI | `.github/workflows/ci.yml` | tests, lint, scan de secrets |
| Démo | `demo/index.html` | page FINAKA fictive |

## 3. Flux de données

1. L’utilisateur ouvre une page financière.
2. Il clique sur l’icône NkapLingua.
3. Le content script est injecté via `activeTab` + `scripting`.
4. Il collecte les nœuds texte visibles et quelques attributs sûrs, hors
   champs sensibles.
5. Il détecte la langue source (français ou anglais) avec un score de confiance.
6. Il remplace les nombres, URLs, emails et noms de bénéficiaires par des jetons.
7. Il envoie les segments au background. Le background cherche d’abord une
   entrée **validée** dans le pack. Si la phrase contient un terme du niveau A
   (solde, frais, PIN/OTP, etc.) et n’est pas dans le pack, elle est bloquée et
   reste en français : elle ne part jamais vers la MT.
8. Pour les phrases non critiques, le backend découpe en phrases, traduit avec
   `flagship-ai` (ou NLLB en secours pour le fulfulde) et vérifie les jetons.
9. Le content script restaure les jetons et écrit le texte via `textContent`.
10. L’utilisateur peut restaurer l’original à tout moment ; l’interface indique
    « MT brouillon — à relire par un natif ».

## 4. Approche d’intégration

- **Aucune modification du site cible** : le code de la banque ou de la fintech
  n’est pas touché.
- **Aucune API côté banque** : l’extension lit uniquement le DOM rendu.
- **Aucune dépendance à un identifiant de page** : le pipeline est générique.
- **Mode pack sans backend** : les packs validés fonctionnent seuls. Le cloud
  MyMemory reste **expérimental et opt-in** ; il n’est contacté que si
  l’utilisateur l’autorise explicitement et si la paire a un code cloud.
  L’ewondo n’a pas de code cloud et ne part jamais vers MyMemory.
- **Seconde opinion ciblée** (cloud opt-in uniquement) : si le backend local
  rejette une phrase non critique, le background peut redemander uniquement
  cette phrase au cloud, puis garder la meilleure sortie conforme. Le local
  reste prioritaire.
- **Trois langues cibles** : fulfulde et ewondo en MT brouillon, duala en pack
  communautaire. Le niveau A reste pack-only.
- **Barrière niveau A** : `isCriticalText()` / `classifyCriticality()` bloque
  solde, frais, montant, PIN, OTP, transaction, confirmation, etc. avant tout
  appel MT ; le backend refuse aussi un segment marqué `critical`.
- **Détection source** : FR/EN, avec indice HTML, mots-outils et confiance.
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
| `flagship-ai/cameroon-int8` | int8, ~80 Mo/paire | CC BY-NC 4.0 (bundle) ; sous-fiche `francais-ewondo` CC BY 4.0 | brouillon MT ewondo/fulfulde |
| `flagship-ai/francais-fufulde` | 299 Mo | CC BY 4.0 | référence fp32 / alternative |
| `facebook/nllb-200-distilled-600M` | 600M | CC BY-NC 4.0 | secours fulfulde |
| MyMemory Translation API | — | service externe | cloud expérimental, opt-in uniquement |
| Packs fulfulde, ewondo et duala | 0.1 | à définir avec les contributeurs (CC0 / CC BY) | mémoires de traduction validées |
| FastAPI | >=0.115 | MIT | API |
| Uvicorn | >=0.30 | BSD | serveur |
| PyTorch | >=2.3 | BSD | inférence NLLB |
| CTranslate2 | >=4.4 | MIT | inférence flagship int8 |
| Transformers | >=4.44 | Apache-2.0 | tokenizers Marian/NLLB |
| SentencePiece | >=0.2 | Apache-2.0 | tokenizer |
| corpus Adamawa Fulfulde–French 1.2 | — | NOODL-1.0 | évaluation |
| Common Voice Adamawa Fulfulde | — | CC0 1.0 | audio optionnel |

**Contribution propre** :

- pipeline DOM non intrusif ;
- pseudonymisation et contrôle de préservation ;
- découpage en phrases et des jetons pour stabiliser la MT ;
- barrière niveau A avant tout appel MT ;
- interface de traduction réversible ;
- tests et CI ;
- documentation de sécurité et de licences.

**Composants tiers** : flagship-ai, NLLB, CTranslate2, FastAPI, PyTorch,
Transformers, MyMemory (cloud expérimental, opt-in uniquement). Les packs
communautaires sont la contribution propre de l’équipe et des relecteurs
natifs.

## 6. Sécurité et intégrité

- Aucune lecture des valeurs de formulaire, mots de passe, OTP ou PIN.
- Aucun cookie, token ou header d’authentification transmis.
- Backend lié à `127.0.0.1`, sans journalisation du texte.
- Jetons `[[NUM_n]]`, `[[URL_n]]`, `[[EMAIL_n]]`, `[[NAME_n]]` : contrôle
  d’unicité.
- Termes critiques (`FCFA`, `PIN`, `OTP`, etc.) : contrôle de présence.
- **Niveau A** : une phrase contenant solde/frais/montant/PIN/OTP/transaction/
  confirmation/etc. est bloquée avant la MT si le pack n’a pas d’entrée
  `validated`. Le backend refuse aussi un segment `critical=true`.
- Refus des entrées de pack non `validated`.
- Filtre de qualité : sortie identique à la source, trop courte, trop longue,
  répétitive ou avec fuite de français.
- Rétro-traduction de contrôle (`NK_ROUNDTRIP=1`, NLLB uniquement) : similarité
  source ↔ retour français ≥ 0,45, sinon l’original est conservé.
- Refus de la traduction si un jeton ou un terme critique manque.
- Les jetons sont retirés avant l’appel `flagship-ai`, puis remis dans l’ordre :
  un montant ou un nom ne peut pas être « avalé » par le modèle.
- UI en Shadow DOM, texte injecté via `textContent` (pas de `innerHTML`).
- CSP de l’extension verrouillée ; aucun code distant.

## 7. Traitement linguistique

- Fulfulde (`fub`) : `flagship-ai/francais-fufulde` (brouillon, CC-BY-4.0) ;
  NLLB `fuv_Latn` en secours si le modèle manque ou si la source est l’anglais.
- Ewondo (`ewo`) : `flagship-ai/cameroon-int8` / `francais-ewondo` (brouillon,
  licence à trancher). Pas de cloud : MyMemory n’a pas de paire ewondo.
- Duala (`dua`) : pack communautaire uniquement, aucun modèle de traduction
  prêt. Corpus de parole connus : Common Voice 27.0 (14,36 h pour l'ewondo),
  Ewondo-ASR (~3 h 11), Common Voice duala (à vérifier).
- Détection source FR/EN : `extension/languages.js` et `/detect`.
- Orthographe de référence : AGLC.
- Validation prévue : 20 à 100 phrases finance, locuteur natif, grille
  adéquation/fidélité/terminologie.
- Les phrases longues et certaines tournures financières restent fragiles :
  voir `docs/LANGUAGE_VALIDATION.md`, `docs/LANGUAGES.md`, `docs/EVAL.md` et
  `docs/DATA_INTEGRATION.md`.
- `flagship-ai` : 5 faisceaux, `no_repeat_ngram_size=3`,
  `repetition_penalty=1.15`, plafond de 256 jetons. NLLB : 2 faisceaux,
  plafond de 128 jetons. Découpage à 220 caractères dans les deux cas.
- `scripts/evaluate-unseen.py` mesure le taux d’acceptation, la préservation
  des montants et le score de rétro-traduction sur 20 phrases inédites.
- Glossaire finance : les termes `validated` de
  `data/glossary.template.csv` sont protégés par des jetons avant la MT, puis
  restaurés avec la traduction validée. Cela améliore la cohérence sur le
  contenu inédit sans réentraîner le modèle.
- Les phrases critiques ne passent jamais par la MT, même si le glossaire est
  vide : elles restent en français jusqu’à validation d’un pack.

## 8. Tests et reproductibilité

### Tests locaux sans modèle

```bash
cd server
pip install -r requirements-ci.txt
NK_MOCK=1 pytest -q test_api.py
```

### Tests extension

```bash
node --check extension/languages.js
node --check extension/background.js
node --check extension/content.js
node --check extension/popup.js
node scripts/test-extension.js
npm install --no-save --no-package-lock jsdom
node tests/content.test.js
./scripts/build-firefox.sh
npx --yes web-ext lint --source-dir dist/firefox
./scripts/package-extension.sh
```

### Test manuel du moteur flagship

```bash
# Modèles int8 : ewondo, fufulde, bulu (≈232 Mo)
server/.venv/bin/hf download flagship-ai/cameroon-int8 \
  --include "francais-ewondo/*" \
  --include "francais-fufulde/*" \
  --local-dir dist/models/flagship-int8

cd server
NK_MOCK=0 NK_ROUNDTRIP=0 NK_FLAGSHIP_MT=auto \
  NK_FLAGSHIP_MODEL_DIR=../dist/models/flagship-int8 \
  ../server/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000
```

Vérifier ensuite :

```bash
curl -s http://127.0.0.1:8000/health | python3 -m json.tool
curl -s -X POST http://127.0.0.1:8000/translate \
  -H 'Content-Type: application/json' \
  -d '{"target":"ewo","source":"fr","segments":[{"id":"s1","text":"Bonjour, comment allez-vous ?"}]}'
```

### Démonstration

```bash
cd server
source .venv/bin/activate
NK_DEVICE=cpu NK_FLAGSHIP_MT=auto \
  NK_FLAGSHIP_MODEL_DIR=../dist/models/flagship-int8 \
  uvicorn app:app --host 127.0.0.1 --port 8000
```

Puis ouvrir `http://127.0.0.1:8000/demo`.

## 9. Limites connues

- `flagship-ai` est un brouillon entraîné sur un corpus « scripture + livres » :
  il est faible sur les termes financiers modernes et les montants. Il ne doit
  jamais servir au niveau A.
- Le bundle `cameroon-int8` est CC BY-NC 4.0 ; la sous-fiche `francais-ewondo`
  indique CC BY 4.0. En cas de doute, considérer l’ewondo comme non commercial
  jusqu’à clarification écrite de `flagship-ai`.
- NLLB n’est pas spécialisé sur le fulfulde adamawa ; la variété produite peut
  différer. Il ne sert plus que de secours pour le fulfulde.
- Les phrases longues peuvent être mal traduites ou répétitives.
- Les noms sont tokenisés de façon conservatrice ; un nom sans mot déclencheur
  peut rester en clair.
- Les packs fulfulde, ewondo et duala sont vides tant que le panel TRAPD
  (deux traducteurs + un arbitre par langue) ne les a pas remplis. Sans pack
  validé, toutes les phrases critiques restent en français.
- Pas de support des iframes cross-origin, shadow DOM fermés, images/canvas.
- Pas de traduction audio (TTS fulfulde) dans le MVP.
- Le backend local est optionnel ; le cloud MyMemory reste expérimental et
  désactivé par défaut (opt-in explicite, quota et conditions à vérifier).
- En mode cloud, le texte pseudonymisé quitte la machine ; ne pas l’utiliser
  avec des données réelles sensibles.
- Le champ `context` doit être supprimé ou nettoyé (correctif M1) : il peut
  contenir des valeurs de formulaire ou des zones `data-sensitive`.
- NLLB et le bundle `flagship-ai/cameroon-int8` sont CC BY-NC 4.0 : usage
  non commercial pour le hackathon. Les modèles fp32 `francais-fufulde`,
  `francais-bulu` et `francais-ghomala` sont CC BY 4.0.
- Le prototype n’est pas une traduction certifiée pour un contrat.

## 10. Feuille de route technique

1. Valider 102 phrases fulfulde, 20 ewondo et 20 duala avec le panel TRAPD.
2. Importer les traductions validées et vérifier les packs JSON.
3. Tester sur l’interface fournie par le jury.
4. Ajouter un mode bilingue côte à côte pour les conditions contractuelles.
5. Ajouter une synthèse vocale dans les langues disposant d’une voix validée.
6. Brancher les données de l’OLC/ERDELAP selon `docs/DATA_INTEGRATION.md`.
7. Mettre à jour la vidéo avec la démonstration multilingue.
