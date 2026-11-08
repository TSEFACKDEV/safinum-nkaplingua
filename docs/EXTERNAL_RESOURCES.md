# Ressources externes — inventaire du 8 novembre 2026

**Objet** : recenser les datasets, corpus, lexiques et modèles utilisables
pour NkapLingua, y compris ceux qui ne sont pas commercialisables mais qui
peuvent servir au hackathon SAFINUM 2026.

**Périmètre** : fulfulde (`fub`), ewondo (`ewo`), duala (`dua`), puis
candidats pour une quatrième langue camerounaise.

**Méthode** : interrogation des API Hugging Face, Kaggle, Mozilla Data
Collective, OPUS et Zenodo ; lecture des cartes de datasets et des arbres de
fichiers ; téléchargement et test local des modèles de traduction quand la
licence le permettait.

**Manifeste machine** : [`../data/reference/external-resources.csv`](../data/reference/external-resources.csv).

---

## 1. Résumé exécutif

1. **Le meilleur moteur français → fulfulde/ewondo/bulu trouvé** est la famille
   `flagship-ai` (projet Lingo / NativeAI) : MarianMT à pivot français, 119
   couples de traduction (français ↔ langue) pour une soixantaine de langues
   camerounaises, conversions int8 de ~80 Mo par paire.
   `francais-fufulde`, `francais-bulu` et `francais-ghomala` sont publiés en
   **CC-BY-4.0**. Le bundle `cameroon-int8` est en **CC-BY-NC-4.0**, mais la
   sous-fiche `francais-ewondo` affiche CC-BY-4.0 : **conflit de licence à
   faire trancher**.
2. **Aucun modèle prêt à l'emploi pour le duala** n'a été trouvé. Le corpus
   anglais → duala de 15 351 paires (CC-BY-4.0) reste la seule base sérieuse ;
   le pilote actuel n'est pas utilisable en production.
3. **NLLB-200 ne couvre pas** `ewo_Latn`, `dua_Latn` ni `fub_Latn`. Seul
   `fuv_Latn` (fulfulde nigérian) est présent. M2M100 ne couvre aucune des
   trois langues. Les modèles dédiés sont donc indispensables.
4. **Audio libre** : Common Voice 27.0 (CC0-1.0) fournit 263 Mo de fulfulde
   Adamawa, 295 Mo d'ewondo et 292 Mo de duala. `AfriSpeech/african-speech-ipa`
   (CC-BY-4.0) fournit 3,71 h d'ewondo, 20,12 h de duala, 48,58 h de basaa et
   16,93 h de bulu, avec transcriptions IPA.
5. **Évaluation** : `OlameMend/soreva` (CC-BY-4.0) donne 150 phrases audio par
   langue, dont ewondo, duala, fulfulde, basaa, ghomala, medumba, eton, bafia,
   ngiemboon et yemba. `facebook/bouquet` (CC-BY-4.0, accès automatique à
   accepter) contient un benchmark humain pour ewondo, duala, basaa, eton,
   bafia et tupuri.
6. **Quatrième langue la plus prête** : le **bulu** (`bum`) — 27 996 paires
   anglais–bulu (CC-BY-4.0), 16,93 h d'audio IPA, 211 Mo de Common Voice,
   2 688 paires lexicales MIT et un modèle français ↔ bulu CC-BY-4.0.
7. **Deuxième candidat** : le **basaa** (`bas`) — 27 771 paires, 48,58 h
   d'audio IPA, 255 Mo de Common Voice, plusieurs modèles ASR MIT/Apache,
   mais pas de modèle de traduction prêt.
8. **Troisième candidat** : le **ghomala** (`bbj`) — 15 190 paires
   français–ghomala (Apache-2.0), 268 Mo de Common Voice, un modèle
   français ↔ ghomala CC-BY-4.0 et un modèle anglais → ghomala Apache-2.0.
9. **Le ngiemboon** (`nnh`) a le plus gros corpus parallèle trouvé
   (40 968 paires français–ngiemboon) mais il est **gated** et sous
   **CC-BY-NC-SA-4.0** ; il faut demander l'accès.
10. **À éviter en l'état** : tout ce qui est biblique sans accord de la Bible
    Society (Bible ewondo, `OlameMend/Ewondo-TTS`, `OlameMend/Corinth_dataset`,
    `flagship-ai/cameroon_bibles`, `Favourez/tupuri_english`), les datasets sans
    licence (`ELRs`, `exyms`, `BayangSouloukna`, `OlameMend/Bafia-TTS`,
    `OlameMend/NT-Bulu`) et `AfriSpeech/african-corpus-jw` (licence `other`).

---

## 2. Légende des verdicts

| Verdict | Signification |
|---|---|
| **Utilisable** | Licence dans la liste du projet (MIT, CC0, CC-BY) ou libre compatible ; attribution obligatoire. |
| **Utilisable hors liste** | Apache-2.0, AFL-3.0, ODC-BY ou CC-BY-SA : libre, mais à valider avec le règlement du concours. |
| **Non commercial** | CC-BY-NC ou CC-BY-NC-SA : démonstration hackathon seulement, pas de version commerciale. |
| **Gated** | Accès à demander sur Hugging Face (acceptation des conditions ou validation manuelle). |
| **Autorisation requise** | Droits d'auteur ou droits éditoriaux à clarifier (Bible Society, éditeurs, JW). |
| **Bloqué** | Aucune licence, licence `other` non clarifiée, ou qualité insuffisante. |
| **Référence** | Lexique ou corpus monolingue, utilisable pour vérifier un terme, pas comme corpus parallèle. |

---

## 3. Langues actuelles

### 3.1 Fulfulde (`fub`)

| Ressource | Type | Volume | Licence | Accès | Verdict |
|---|---|---:|---|---|---|
| `flagship-ai/francais-fufulde` | MT fr → fub | 299 Mo | CC-BY-4.0 | ouvert | **Utilisable** |
| `flagship-ai/fufulde-francais` | MT fub → fr | 299 Mo | CC-BY-4.0 | ouvert | **Utilisable** |
| `flagship-ai/cameroon-int8` / `francais-fufulde` | MT fr → fub int8 | 80,8 Mo | CC-BY-NC-4.0 (bundle) | ouvert | **Non commercial** |
| Common Voice 27.0 — Adamawa Fulfulde | Audio + texte | 263,2 Mo | CC0-1.0 | inscription | **Utilisable** |
| `OlameMend/soreva` / `fub_cm` | Audio + texte, évaluation | 7,75 Mo, 150 phrases | CC-BY-4.0 | ouvert | **Utilisable** |
| `mimba/afrilang` / `fub_cm` | Audio + texte ASR | ~1,4 Go (5 shards) | CC-BY-NC-SA-4.0 | gated manuel | **Gated** |
| `SuzuyaXIII/fulfulde` | Lexique EN/FR/Fulfulde | 922 entrées | MIT | ouvert | **Référence** |
| `lbourdois/panlex` / `fub` | Lexique | 2 105 entrées | CC0-1.0 | ouvert | **Référence** |
| `michaelanietie/fulani-english-pair-dataset` (Kaggle) | Paires en → fuv | 3 032 paires | Apache-2.0 | ouvert | **Référence** (fuv, pas fub) |
| `ahmedbah/fulfulde` (Kaggle) | Corpus fub (accès par e-mail) | inconnu | CC-BY-NC-SA-4.0 | e-mail | **Gated** |
| `DS4H-ICTU/french-FULFULDE-ADAMAOUA` | Corpus fr ↔ fub | inconnu | inconnue | privé/gated | **Gated** |
| NOODL — Adamawa Fulfulde–French Parallel Corpus of Narratives 1.2 | Corpus fr ↔ fub | ~1 977 lignes | NOODL-1.0 | Mozilla Data Collective | **Autorisation requise** |
| `AfriSpeech/africa-corpus` / fulfulde | Texte biblique | 243 053 lignes | `other` | ouvert | **Autorisation requise** |
| `flagship-ai/cameroon_bibles` / Fulfulde | Texte biblique | 60 langues | CC-BY-4.0 (fiche) | ouvert | **Autorisation requise** |

**Lecture** : le fulfulde a désormais un **modèle fr → fub CC-BY-4.0** et un
modèle int8 rapide. C'est la meilleure nouvelle pour le niveau B/C. Le corpus
parallèle fub reste rare : le modèle est entraîné sur un corpus
« scripture + livres » et reste faible sur les phrases financières modernes.
Le niveau A doit rester sur les packs validés.

### 3.2 Ewondo (`ewo`)

| Ressource | Type | Volume | Licence | Accès | Verdict |
|---|---|---:|---|---|---|
| `flagship-ai/cameroon-int8` / `francais-ewondo` | MT fr → ewo int8 | 80,8 Mo | CC-BY-NC-4.0 (bundle) ; sous-fiche CC-BY-4.0 | ouvert | **Non commercial / conflit** |
| `mabobe-biyong/m2m100_418M-fr-ewo-rel-ft` | MT fr → ewo | 1,9 Go | AFL-3.0 | ouvert | **Utilisable hors liste, expérimental** |
| `yemen2016/ewondo-french-model` | MT ewo ↔ fr | 299 Mo | Apache-2.0 | ouvert | **Bloqué qualité** |
| Common Voice 27.0 — Ewondo | Audio + texte | 295,3 Mo | CC0-1.0 | inscription | **Utilisable** |
| `AfriSpeech/african-speech-ipa` / `ewondo_ewo` | Audio + IPA | 3,71 h, 63 Mo | CC-BY-4.0 | ouvert | **Utilisable** |
| `OlameMend/soreva` / `ewo_cm` | Audio + texte, évaluation | 6,19 Mo, 150 phrases | CC-BY-4.0 | ouvert | **Utilisable** |
| `facebook/bouquet` / `ewo_Latn` | Benchmark humain | 116 Ko dev + 181 Ko test | CC-BY-4.0 | gated auto | **Gated** |
| `lbourdois/panlex` / `ewo` | Lexique | 459 entrées | CC0-1.0 | ouvert | **Référence** |
| `HuggingFaceFW/finetranslations` / `ewo_Latn` | Paires synthétiques ewo → en | 209 documents | ODC-BY | ouvert | **Référence** |
| Ewondo-ASR (ENS Yaoundé / Mozilla) | Audio + texte | ~3 h 11, 16 voix | accès restreint | Mozilla Data Collective | **Gated** |
| NOODL — Ewondo–French Parallel Corpus | Corpus fr ↔ ewo | 3 631 unités | NOODL-1.0 | Mozilla Data Collective | **Autorisation requise** |
| `Favourez/french_ewondo_dictionary` + `ewondo_english` | CSV | 268 + 112 paires | aucune | ouvert | **Bloqué** (scraping Bible.com) |
| `apachefranklin/ewondodatasets` (Kaggle) | Phrases bibliques ewo–fr | 227 Ko | inconnue | ouvert | **Bloqué** |
| `flagship-ai/cameroon_bibles` / Ewondo | Texte biblique | 7 951 lignes | CC-BY-4.0 (fiche) | ouvert | **Autorisation requise** |
| `ELRs/Ewondo_Bible` | Texte biblique | 16 785 lignes | CC-BY-4.0 (fiche) | ouvert | **Autorisation requise** |
| `OlameMend/Ewondo-TTS` | Audio + texte biblique | 7 967 exemples | aucune | ouvert | **Bloqué** |
| `OlameMend/Corinth_dataset` | Audio + texte biblique | 423 exemples, 212 Mo | CC-BY-4.0 (fiche) | ouvert | **Autorisation requise** |
| `ELRs/Ewondo_mT5`, `Ewondo_xlm-roberta-*` | Modèles de langue | 1,1–1,2 Go | aucune | ouvert | **Bloqué** |

**Lecture** : l'ewondo a un modèle fr → ewo utilisable en brouillon
(`flagship-ai`), mais **sa licence est ambiguë** et son corpus d'entraînement
est biblique. Le modèle `mabobe-biyong` est libre mais plus lourd et moins bon.
`yemen2016` ne traduit pas correctement : il paraphrase en français. Le niveau A
reste sur les packs.

### 3.3 Duala (`dua`)

| Ressource | Type | Volume | Licence | Accès | Verdict |
|---|---|---:|---|---|---|
| `michsethowusu/english-duala_sentence-pairs_mt560` | Paires en → dua | 15 351 paires | CC-BY-4.0 | ouvert | **Utilisable** |
| Common Voice 27.0 — Duala | Audio + texte | 292,4 Mo | CC0-1.0 | inscription | **Utilisable** |
| `AfriSpeech/african-speech-ipa` / `douala_dua` | Audio + IPA | 20,12 h, 298 Mo | CC-BY-4.0 | ouvert | **Utilisable** |
| `OlameMend/soreva` / `dua_cm` | Audio + texte, évaluation | 11,1 Mo, 150 phrases | CC-BY-4.0 | ouvert | **Utilisable** |
| `facebook/bouquet` / `dua_Latn` | Benchmark humain | 110 Ko dev + 171 Ko test | CC-BY-4.0 | gated auto | **Gated** |
| `lbourdois/panlex` / `dua` | Lexique | 1 009 entrées | CC0-1.0 | ouvert | **Référence** |
| `AfriSpeech/afri2universal` / `dua` | Audio ASR | ~8,39 h | CC-BY-NC-4.0 | ouvert | **Non commercial** |
| `translatewiki` (OPUS) / `dua` | Monolingue | 9 Ko | CC-BY-SA | ouvert | **Référence** (très petit) |

**Lecture** : le duala n'a **aucun modèle de traduction prêt**. Le corpus
15 351 paires est utilisable, mais le pilote 2 000 paires est insuffisant. Il
faut soit entraîner sur le corpus complet (GPU), soit rester sur les packs et
la traduction humaine. Le duala a en revanche le plus gros volume audio IPA des
trois langues (20,12 h), ce qui permet un bon module ASR.

---

## 4. Modèles de traduction testés

### 4.1 `flagship-ai/cameroon-int8` — test local

Test du 8 novembre 2026, CTranslate2 int8, CPU, `beam_size=5`,
`no_repeat_ngram_size=3`, `repetition_penalty=1.15`.

| Français | Ewondo (`francais-ewondo`) | Fulfulde (`francais-fufulde`) | Bulu (`francais-bulu`) |
|---|---|---|---|
| Bonjour, comment allez-vous ? | Mina, eyë miakòbò ya? | Jaŋngo, noy on ɗon njahata? | Mbôlô, mia ye bo aya? |
| Veuillez saisir votre code PIN. | Ndò hm, tili nyè dzoe PIN. | Ngam maajum, ndokka on Pin. | Mia yiane tili nyeʼelane wônan. |
| Merci d'avoir utilisé NkapLingua. | Nkap Lingua ngò akëlë nyè. | Ɓaawoɗon, on mbaɗi nkaafLingua. | Mvame ya nyoñe Nkap Lingua. |
| Le paiement a été effectué avec succès. | Ndò mbòg angavëban. | Ɓe mbaɗani yoŋkiiji man fuu. | Mvoʼé é nga boban e be mam mete. |
| Quel est le montant total ? | Dze enë mbòg ya? | Ɗume yimɓe ɗuuɗɓe na? | Ataté éziñ ja ye boban aya? |

**Verdict** : brouillon utilisable pour du texte général, **pas pour le niveau
A**. Les montants et les termes financiers ne sont pas fiables ; la couche de
protection des jetons doit conserver les nombres, les montants et les termes
du glossaire. Une relecture native reste obligatoire avant publication.

**Licence** : le bundle global est CC-BY-NC-4.0 ; la sous-fiche
`francais-ewondo` affirme CC-BY-4.0. En cas de doute, considérer le modèle
ewondo comme **non commercial** et demander confirmation à `flagship-ai`.
Les modèles fp32 `francais-fufulde` et `francais-bulu` sont, eux, explicitement
CC-BY-4.0.

### 4.2 `mabobe-biyong/m2m100_418M-fr-ewo-rel-ft`

- Licence AFL-3.0, 1,9 Go, M2M100 418M fine-tuné.
- Test : sorties en ewondo reconnaissables, mais bruitées, avec des mots
  anglais/français parasites et des répétitions.
- **Verdict** : alternative libre, mais moins bonne et plus lourde que
  `flagship-ai`. À garder comme secours si la licence CC-BY-NC du bundle
  ewondo est rédhibitoire.

### 4.3 `yemen2016/ewondo-french-model`

- Licence Apache-2.0, 299 Mo, MarianMT fine-tuné depuis `opus-mt-en-fr`.
- Test : les phrases françaises ressortent en **français paraphrasé**, pas en
  ewondo ; les phrases ewondo donnent des traductions françaises fausses.
- **Verdict** : **inutilisable** comme traducteur. Ne pas intégrer.

### 4.4 NLLB-200 et M2M100

- `facebook/nllb-200-distilled-600M` : `fuv_Latn` présent ; `ewo_Latn`,
  `dua_Latn`, `fub_Latn` **absents**.
- `facebook/m2m100_418M` : aucun code `ewo`, `dua`, `fub`, `bas`, `bum` dans le
  tokenizer.
- **Conséquence** : NLLB reste une baseline pour le fulfulde **nigérian**
  (`fuv`), pas pour le fulfulde Adamawa (`fub`). Les modèles `flagship-ai` sont
  mieux alignés sur le fulfulde camerounais.

### 4.5 Intégration dans le backend

Depuis le 8 novembre 2026, `flagship-ai` est branché dans le backend local :

- `server/flagship_mt.py` charge les modèles int8 à la demande (CTranslate2) et
  retire les jetons `[[NUM_n]]` / `[[n]]` avant l'appel, puis les remet dans
  l'ordre. Cela évite qu'un montant ou un nom soit avalé par le modèle.
- `server/app.py` route :
  - `fub` → `francais-fufulde` si présent, sinon NLLB `fuv_Latn` ;
  - `ewo` → `francais-ewondo` si présent, sinon erreur 503 (pas de NLLB) ;
  - `dua` → pack communautaire uniquement.
- Variables d'environnement : `NK_FLAGSHIP_MT=auto|0`, `NK_FLAGSHIP_MODEL_DIR`,
  `NK_FLAGSHIP_DEVICE=cpu`, `NK_FLAGSHIP_COMPUTE_TYPE=int8`.
- Le backend refuse aussi un segment marqué `critical=true` : le niveau A ne
  passe jamais par la MT.
- L'extension bloque les phrases contenant solde/frais/montant/PIN/OTP/
  transaction/confirmation/etc. avant l'appel local ou cloud. Si le pack n'a
  pas d'entrée `validated`, la phrase reste en français.
- Test de bout en bout : `ewo` → « Mina, eyë miakòbò ya? », `fub` →
  « Jaŋngo, noy on ɗon njahata? », `critical` → `critical_pack_only`.
- **Mode démo SAFINUM** : sur `safinum.cm/hackathon-test` uniquement, les
  phrases critiques peuvent être traduites par MT avec le badge « démo MT » ;
  les libellés courts fulfulde passent par MyMemory `fr|ff` si le cloud est
  autorisé. Résultats : [`SITE_TEST_SAFINUM.md`](SITE_TEST_SAFINUM.md).
  Audit des relectures reçues et lignes rejetées :
  [`NATIVE_REVIEW_AUDIT.md`](NATIVE_REVIEW_AUDIT.md).

---

## 5. Quatrième langue : candidats

### 5.1 Tableau comparatif

| Langue | Code | Paires parallèles | Audio | Modèle MT prêt | Licence | Accès | Verdict |
|---|---|---:|---|---|---|---|---|
| **Bulu** | `bum` | 27 996 en ↔ bum (mt560) + 2 688 paires lexicales MIT | 16,93 h IPA + 210,6 Mo CV | fr ↔ bum CC-BY-4.0 (299 Mo) ; int8 NC | CC-BY-4.0 / MIT | ouvert | **Recommandé** |
| **Basaa** | `bas` | 27 771 en ↔ bas (mt560) | 48,58 h IPA + 254,6 Mo CV | aucun modèle prêt | CC-BY-4.0 / CC0 | ouvert | **Très bon, mais MT à entraîner** |
| **Ghomala** | `bbj` | 15 190 fr ↔ bbj (Apache-2.0) | ~20 h Bible parlée (à autoriser) + 268,1 Mo CV | fr ↔ bbj CC-BY-4.0 ; en → bbj Apache-2.0 | CC-BY-4.0 / Apache-2.0 | ouvert | **Bon compromis** |
| **Ngiemboon** | `nnh` | 40 968 fr ↔ nnh | 8,0 Mo SOREVA ; ASR gated | mbart50 MIT (gated) ; NLLB NC | CC-BY-NC-SA-4.0 | gated | **Plus gros corpus, mais accès/NC-SA** |
| **Tupuri** | `tui` | 31 297 versets bibliques (à autoriser) | 232,7 Mo CV | fr → tui int8 NC | MIT (fiche) mais Bible | ouvert | **À éviter en l'état** |
| **Cameroon Pidgin** | `wes` | 28 159 en ↔ wes (mt560) | audio rare | pas de modèle prêt | CC-BY-4.0 | ouvert | **Portée forte, mais créole** |
| **Eton** | `eto` | benchmark BOUQuET seulement | 202,1 Mo CV | pas de modèle prêt | CC-BY-4.0 / CC0 | ouvert | **Faible en texte** |
| **Bafia** | `ksf` | DS4H gated | 359,2 Mo CV | fr → ksf int8 NC | inconnue (DS4H) | gated | **Moyen** |
| **Medumba** | `byv` | dataset CC-BY gated | 277,0 Mo CV | fr → byv int8 NC | CC-BY-4.0 | gated | **Moyen** |
| **Yemba** | `ybb` | — | 7,77 Mo SOREVA + CV | m2m100 MIT | MIT | ouvert | **Hors périmètre actuel** |

Modèles ASR basaa disponibles : `Ngue/w2v-bert-2.0-basaa` (MIT),
`infinitejoy/wav2vec2-large-xls-r-300m-basaa` (Apache-2.0) et
`sammy786/wav2vec2-xlsr-Basaa` (Apache-2.0). Pour le ghomala, on peut ajouter
`stfotso/t5_tuned_french_ghomala` (Apache-2.0, 892 Mo) au modèle
`flagship-ai`.

### 5.2 Recommandation

**Bulu (`bum`) est la meilleure quatrième langue pour le hackathon** :

- 27 996 paires anglais–bulu, soit **plus que le duala** (15 351) ;
- 16,93 h d'audio avec IPA (CC-BY-4.0) et 210,6 Mo de Common Voice (CC0) ;
- 2 688 paires lexicales MIT, utilisables pour le glossaire sans toucher aux
  31 297 versets bibliques du même dépôt ;
- un modèle **français ↔ bulu CC-BY-4.0** déjà entraîné, donc une démo
  immédiate sans GPU ;
- un modèle int8 rapide (80 Mo) pour le serveur local.

**Condition** : il faut un **natif bulu** pour la relecture T1/T2 et
l'arbitrage. Sans ce natif, ne pas ajouter la langue : les packs niveau A
exigent une validation humaine.

**Alternatives** :

- **Basaa** si l'objectif est l'audio/ASR : 48,58 h d'IPA, 254,6 Mo de Common
  Voice, modèles ASR MIT/Apache. En revanche, il faudra entraîner un modèle de
  traduction (27 771 paires, pas de modèle prêt).
- **Ghomala** si l'objectif est un lexique propre et un modèle prêt : 15 190
  paires Apache-2.0, modèle fr ↔ bbj CC-BY-4.0, modèle en → bbj Apache-2.0.
  Moins de paires de phrases que le bulu, et l'audio biblique reste à autoriser.
- **Ngiemboon** si l'accès au corpus de 40 968 paires est obtenu : c'est le plus
  gros volume de texte, mais la licence CC-BY-NC-SA-4.0 et le `gated` limitent
  la redistribution.

### 5.3 Coût d'intégration d'une quatrième langue

| Élément | Coût |
|---|---|
| Pack de phrases | 102 phrases (`fub`) ou 70 messages du site ; traduction native T1/T2 |
| Relecture | 1 natif + 1 arbitre ; mêmes règles TRAPD |
| Interface | ajouter la langue dans le sélecteur et les tests |
| MT | brancher le modèle `flagship-ai/francais-bulu` (299 Mo) ou l'int8 (80 Mo) |
| Validation | tests de non-régression, vérification des packs, capture d'écran |
| Licence | déclarer CC-BY-4.0, MIT et CC0 dans `docs/DATA_LICENSES.md` |

**Décision suggérée** : garder les trois langues actuelles pour la soumission
2026 et **garder le bulu en réserve** comme extension post-hackathon, sauf si
un natif bulu est déjà disponible. Le basaa et le ghomala restent des réserves.

---

## 6. Ressources bloquées ou à éviter

| Ressource | Problème | Verdict |
|---|---|---|
| `ELRs/Ewondo_Bible`, `flagship-ai/cameroon_bibles` | Tag CC-BY-4.0 mais droits de la Bible Society / éditeurs | **Autorisation requise** |
| `OlameMend/Ewondo-TTS`, `OlameMend/Corinth_dataset`, `OlameMend/NT-Bulu`, `OlameMend/Bafia-TTS` | Audio biblique, licence absente ou insuffisante | **Bloqué / autorisation** |
| `Favourez/tupuri_english` | 31 297 versets bibliques ; tag MIT mais contenu Bible | **Autorisation requise** |
| `Favourez/bulu_english` (fichier Bible de 31 297 lignes) | Contenu biblique ; seule la partie `fr_en_bulu.json` (2 688 paires) est utilisable sous MIT | **Partiel** |
| `AfriSpeech/african-corpus-jw` | Licence `other`, texte JW.org | **Bloqué** |
| `ELRs/Ewondo_mT5`, `ELRs/Ewondo_xlm-roberta-*` | Aucune licence | **Bloqué** |
| `exyms/ewondo-tts-speecht5`, `exyms/bulu-tts-speecht5` | Aucune licence | **Bloqué** |
| `BayangSouloukna/adamawa-fulfulde-en-to-fub-v1` | Aucune licence | **Bloqué** |
| `yemen2016/ewondo-french-model` | Qualité insuffisante (paraphrase française) | **Bloqué qualité** |
| `maseyan/French_Medumba` | Gated manuel, pas de fichier public | **Gated** |
| `DS4H-ICTU/french-*` | 401, privé/gated | **Gated** |

---

## 7. Demandes d'accès à envoyer

1. **`flagship-ai`** : clarifier la licence du sous-modèle `francais-ewondo`
   (CC-BY-4.0 dans la fiche, CC-BY-NC-4.0 dans le bundle) et la provenance du
   corpus d'entraînement (scripture + livres).
2. **`facebook/bouquet`** : accepter les conditions et télécharger les splits
   `ewo_Latn`, `dua_Latn`, `bas_Latn`, `eto_Latn`, `ksf_Latn`, `tui_Latn`.
3. **`DS4H-ICTU`** : demander l'accès à `french-FULFULDE-ADAMAOUA`,
   `french-EWONDO`, `french-DUALA`, `french-GHOMALA`, `french-BULU`,
   `french-BAFIA`.
4. **`mimba`** : demander l'accès à `text2text` (40 968 paires nnh–fra) et à
   `afrilang` (`fub_cm`, `nnh_cm`).
5. **`maseyan/French_Medumba`** : demander l'accès au corpus CC-BY-4.0.
6. **Bible Society of Cameroon** : demande déjà rédigée dans
   [`DATA_PERMISSIONS.md`](DATA_PERMISSIONS.md) ; elle couvre aussi
   `OlameMend/Corinth_dataset` et les modèles `flagship-ai` si l'on veut
   commercialiser.
7. **OlameMend** : demander la licence de `Ewondo-TTS`, `Bafia-TTS` et
   `NT-Bulu` ; `soreva` et `Corinth_dataset` sont déjà tagués CC-BY-4.0 mais
   le contenu biblique de `Corinth_dataset` reste à clarifier.

---

## 8. Fichiers ajoutés et commandes utiles

### 8.1 Lexiques libres versionnés

| Fichier | Source | Licence | Volume |
|---|---|---|---:|
| [`../data/reference/panlex/panlex-targets.csv`](../data/reference/panlex/panlex-targets.csv) | `lbourdois/panlex` | CC0-1.0 | 3 573 entrées (fub 2 105, dua 1 009, ewo 459) |
| [`../data/reference/fulfulde-suzuya.csv`](../data/reference/fulfulde-suzuya.csv) | `SuzuyaXIII/fulfulde` | MIT | 922 entrées EN/FR/Fulfulde |

Les deux fichiers sont des **lexiques**, pas des corpus parallèles : ils
servent à vérifier une orthographe ou un terme, pas à remplacer la traduction
native.

### 8.2 Télécharger les modèles `flagship-ai`

```bash
# Bundle int8 : ewondo, fufulde et bulu (≈232 Mo)
server/.venv/bin/hf download flagship-ai/cameroon-int8 \
  --include "francais-ewondo/*" \
  --include "francais-fufulde/*" \
  --include "francais-bulu/*" \
  --local-dir dist/models/flagship-int8

# Modèles fp32 CC-BY-4.0 : fufulde et bulu (≈598 Mo)
server/.venv/bin/hf download flagship-ai/francais-fufulde \
  --local-dir dist/models/flagship-fp32/francais-fufulde
server/.venv/bin/hf download flagship-ai/francais-bulu \
  --local-dir dist/models/flagship-fp32/francais-bulu
```

Les modèles sont dans `dist/`, ignoré par git. Ne pas les mettre dans
l'extension : la limite du ZIP est de 10 Mo.

### 8.3 Télécharger les corpus audio

```bash
# Common Voice : passer par Mozilla Data Collective (inscription, CC0)
# https://mozilladatacollective.com/organization/cmfh0j9o10006ns07jq45h7xk

# AfriSpeech IPA : parquet par langue, CC-BY-4.0
server/.venv/bin/hf download AfriSpeech/african-speech-ipa \
  --include "data/ewondo_ewo/*" \
  --include "data/douala_dua/*" \
  --local-dir dist/data/afrispeech-ipa

# SOREVA : évaluation, CC-BY-4.0
server/.venv/bin/hf download OlameMend/soreva \
  --include "data/ewo_cm/*" \
  --include "data/dua_cm/*" \
  --include "data/fub_cm/*" \
  --local-dir dist/data/soreva
```

Ne pas committer ces corpus dans le dépôt public : ils sont volumineux et
certains interdisent la redistribution (Common Voice).

---

## 9. Conclusion opérationnelle

- **Niveau A** : aucun changement. Packs validés uniquement, jamais de MT.
- **Niveau B/C** : `flagship-ai` fournit désormais le brouillon français →
  ewondo et français → fulfulde dans le backend. Le français → bulu est prêt
  côté modèle mais n'est pas branché (langue candidate). Le duala reste sans
  modèle.
- **Licence** : `francais-fufulde`, `francais-bulu` et `francais-ghomala` sont
  CC-BY-4.0 ; `francais-ewondo` est ambigu (CC-BY-4.0 vs CC-BY-NC-4.0) ; le
  bundle global est CC-BY-NC-4.0.
- **Quatrième langue** : bulu si un natif est disponible ; sinon basaa
  (audio/ASR) ou ghomala (lexique/MT) en réserve.
- **Prochaine action** : trancher la licence ewondo avec `flagship-ai`, puis
  décider si le mode brouillon MT est activé pour `ewo` et `fub` ou si l'on
  reste uniquement sur les packs pour la démo.

---

## 10. Sources principales

- `flagship-ai/cameroon-int8` : <https://huggingface.co/flagship-ai/cameroon-int8>
- `flagship-ai/francais-fufulde` : <https://huggingface.co/flagship-ai/francais-fufulde>
- `flagship-ai/francais-bulu` : <https://huggingface.co/flagship-ai/francais-bulu>
- `flagship-ai/francais-ghomala` : <https://huggingface.co/flagship-ai/francais-ghomala>
- `AfriSpeech/african-speech-ipa` : <https://huggingface.co/datasets/AfriSpeech/african-speech-ipa>
- `OlameMend/soreva` : <https://huggingface.co/datasets/OlameMend/soreva>
- Common Voice 27.0 : <https://mozilladatacollective.com/organization/cmfh0j9o10006ns07jq45h7xk>
- `facebook/bouquet` : <https://huggingface.co/datasets/facebook/bouquet>
- `michsethowusu/english-duala_sentence-pairs_mt560` : <https://huggingface.co/datasets/michsethowusu/english-duala_sentence-pairs_mt560>
- `michsethowusu/english-bulu_sentence-pairs_mt560` : <https://huggingface.co/datasets/michsethowusu/english-bulu_sentence-pairs_mt560>
- `michsethowusu/english-basaa_sentence-pairs_mt560` : <https://huggingface.co/datasets/michsethowusu/english-basaa_sentence-pairs_mt560>
- `Favourez/bulu_english` : <https://huggingface.co/datasets/Favourez/bulu_english>
- `stfotso/french-ghomala-bandjoun` : <https://huggingface.co/datasets/stfotso/french-ghomala-bandjoun>
- `mimba/text2text` : <https://huggingface.co/datasets/mimba/text2text>
- `mimba/afrilang` : <https://huggingface.co/datasets/mimba/afrilang>
- `maseyan/French_Medumba` : <https://huggingface.co/datasets/maseyan/French_Medumba>
- `lbourdois/panlex` : <https://huggingface.co/datasets/lbourdois/panlex>
- `SuzuyaXIII/fulfulde` : <https://huggingface.co/datasets/SuzuyaXIII/fulfulde>
- NLLB-200 : <https://huggingface.co/facebook/nllb-200-distilled-600M>
