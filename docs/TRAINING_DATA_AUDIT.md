# Audit des données d’entraînement — 7 novembre 2026

> **Audit d’exécution du 8 novembre 2026** : voir
> [`AUDIT_2026-11-08.md`](AUDIT_2026-11-08.md). Le présent document reste
> limité aux données et aux licences.

**Objet** : vérifier si les fichiers fournis dans `~/Downloads` peuvent servir
à entraîner un modèle de traduction pour NkapLingua, dans le respect des
licences du concours (MIT, CC0-1.0, CC-BY-4.0, OFL).

**Conclusion** : **aucun des huit fichiers de `~/Downloads` n’est utilisable
en l’état**. Le zip `Langue.zip` contient toutefois **une source utilisable** :
les paires **anglais → duala** (CC-BY-4.0). Les textes ewondo et fulfulde du
zip restent sous autorisation.

## 1. Tableau récapitulatif

| Fichier | Format | Volume | Source identifiée | Licence annoncée | Verdict |
|---|---|---:|---|---|---|
| `train-00000-of-00010.parquet` | Parquet audio + texte | 797 lignes, 354 Mo | `OlameMend/Ewondo-TTS` (HF) | **aucune** | **Bloqué** |
| `train-00001-of-00010.parquet` | Parquet audio + texte | 797 lignes, 317 Mo | `OlameMend/Ewondo-TTS` (HF) | **aucune** | **Bloqué** |
| `train-00002-of-00010.parquet` | Parquet audio + texte | 797 lignes, 307 Mo | `OlameMend/Ewondo-TTS` (HF) | **aucune** | **Bloqué** |
| `bible_2024.txt` | Texte | 16 785 lignes, 5,58 Mo | `ELRs/Ewondo_Bible` (HF) ; texte identique à Bible.com v1854 | CC-BY-4.0 (HF) mais **© Bible Society of Cameroon, 2012** | **Autorisation requise** |
| `french_ewondo_dictionary.csv` | CSV 2 colonnes | 268 paires | `Favourez/french_ewondo_dictionary` (HF) | **aucune** | **Bloqué** |
| `ewondo_english.csv` | CSV mal formé | 112 paires | `Favourez/ewondo_english` (HF) | **aucune** | **Bloqué** |
| `unique_ewondo_words.csv` | CSV 1 colonne | 1 223 mots | `Favourez/french_ewondo_dictionary` (HF) | **aucune** | **Bloqué** |
| `ewondo_segmented_basic.csv` | CSV 3 colonnes | 300 versets | `Favourez/french_ewondo_dictionary` (HF) | **aucune** | **Bloqué** |

## 2. Les fichiers Parquet — audio Bible ewondo

- Schéma : `audio: struct<bytes, path>` + `transcription: string`.
- Les chemins sont des références bibliques (`1CO_001_001.wav`,
  `MAT_012_032.wav`, `MRK_004_004.wav`).
- 797 lignes par fichier, 2 391 lignes pour les 3 fichiers fournis.
- Le jeu complet `OlameMend/Ewondo-TTS` annonce **7 967 exemples** sur
  10 shards, audio 16 kHz.
- La carte du dataset ne contient **aucune licence**. Le droit sur l’audio
  n’est donc pas établi.
- Les transcriptions sont des versets de la Bible ewondo : même si l’audio
  était libre, le texte sous-jacent reste protégé (voir §3).

**Usage possible** : aucun en l’état. Pour un modèle audio (ASR/TTS), il faut
une autorisation écrite du déposant et du détenteur du texte biblique.

## 3. `bible_2024.txt` — licence apparente contre droit réel

Deux constats :

1. Le fichier est **identique au bit près** à
   `https://huggingface.co/datasets/ELRs/Ewondo_Bible` (SHA-256
   `5c267752…f735`), dont la carte déclare `cc-by-4.0`.
2. Le même texte est publié sur Bible.com, version **NTE12 / ID 1854**, avec
   la mention explicite :

> **MKPAMAṄ AMVOE Nouveau Testament en langue Ewondo © Bible Society of
> Cameroon, 2012.**

Le tag CC-BY-4.0 posé par un tiers sur Hugging Face **ne peut pas transférer**
les droits de la Bible Society of Cameroon. Une licence CC BY suppose que
celui qui la pose détient les droits ou une autorisation du détenteur. Ce
n’est pas démontré ici.

**Usage possible** : aucun avant accord écrit de la Bible Society of Cameroon.
Un accord doit préciser : entraînement, évaluation, redistribution du modèle,
usage commercial, attribution.

## 4. Les CSV `Favourez` — scraping de Bible.com

Le dataset `Favourez/french_ewondo_dictionary` contient un notebook nommé
`Successful_Ewondo_Bible_Scarping_Python.ipynb`. Il automatise Chrome pour
extraire les versets de `https://www.bible.com/bible/1854` et
`https://www.bible.com/bible/42` (KJV).

- Aucune licence n’est déclarée sur le dataset.
- Le scraping de Bible.com est contraire aux conditions d’utilisation de
  YouVersion.
- Les fichiers `french_ewondo_dictionary.csv`, `ewondo_english.csv`,
  `unique_ewondo_words.csv` et `ewondo_segmented_basic.csv` sont des dérivés
  de ce scraping ou de sources non documentées.
- `ewondo_english.csv` est en plus mal formé : l’en-tête
  `"ewondo,english"` est une seule colonne CSV, pas deux.

**Usage possible** : aucun. Ne pas importer, ne pas entraîner, ne pas
redistribuer.

## 5. Le corpus Ewondo-Français « officiel » est NOODL-1.0

La recherche a identifié un corpus parallèle Ewondo-Français de **3 631
unités** sur Mozilla Data Collective, produit par l’Institute of African
Digital Humanities. Sa licence est **NOODL-1.0**.

Le règlement du projet interdit explicitement d’utiliser un corpus NOODL pour
l’entraînement, l’adaptation ou la création d’œuvres dérivées **sans
autorisation écrite**. Il ne peut donc pas être utilisé en l’état.

## 5bis. Le zip `Langue.zip` — une source utilisable

Le zip contient trois corpus et un outil :

| Élément | Source | Licence | Verdict |
|---|---|---|---|
| `Duala/texte/Duala_anglais.csv` | `michsethowusu/english-duala_sentence-pairs_mt560` (HF) | **CC-BY-4.0** ; original OPUS MT560 (Apache-2.0) | **Utilisable** pour un modèle anglais → duala |
| `Ewondo/texte/Ewondo_textes.xlsx` + `source/Ewondo/*.txt` | `flagship-ai/cameroon_bibles` (HF) | fiche CC-BY-4.0, mais la fiche reconnaît que les droits appartiennent aux éditeurs | **Autorisation requise** |
| `Fulfulde/texte/Fulfulde_Adamawa_francais.csv` | `AfriSpeech/africa-corpus` (HF) | **other** ; versets via YouVersion | **Autorisation requise** |
| `Fulfulde/texte/africa-corpus-builder/` | GitHub AfriSpeech | **MIT** (code) | Utilisable comme outil, pas comme corpus |

Le corpus **Duala** contient 15 351 paires `eng,dua`, alignées sur des
versets/paragraphes religieux. Il ne contient **pas de français** : le modèle
produit sera anglais → duala, puis utilisable derrière un pivot
français → anglais. Le niveau A reste réservé aux packs validés.

Les corpus **Ewondo** et **Fulfulde** sont bibliques et leurs droits ne sont
pas clarifiés. Le fait que la fiche HF affiche CC-BY-4.0 ne suffit pas : la
fiche `flagship-ai/cameroon_bibles` dit elle-même que les droits appartiennent
aux éditeurs.

## 6. Ce qui reste réellement libre

| Source | Licence | Ce qu’elle permet |
|---|---|---|
| Common Voice 27.0 — ewondo, duala, fulfulde | CC0-1.0 | audio + transcriptions pour ASR/évaluation |
| NLLB-200 | CC BY-NC 4.0 | démonstration fulfulde non commerciale |
| Code NkapLingua | MIT | réutilisation |
| Contributions natives | CC0-1.0 ou CC-BY-4.0 | packs validés |
| `michsethowusu/english-duala_sentence-pairs_mt560` | CC-BY-4.0 | entraînement anglais → duala |
| Bible Louis Segond 1910 | domaine public | texte français, pas de contrepartie ewondo libre |

Aucune de ces sources ne fournit un corpus parallèle français → ewondo libre.
C’est pourquoi les packs ewondo/duala restent la seule voie conforme pour le
niveau A.

## 7. Décision

- **Ne pas entraîner** sur les fichiers Ewondo/Fulfulde non autorisés.
- **Ne pas committer** les fichiers dans le dépôt.
- **Entraîner uniquement** le modèle anglais → duala sur les paires
  CC-BY-4.0, avec attribution et mention « expérimental ».
- Demander une autorisation écrite aux détenteurs pour l’ewondo et le
  fulfulde (voir [`DATA_PERMISSIONS.md`](DATA_PERMISSIONS.md)).
- Si une autorisation est obtenue, formater le corpus en JSONL
  `{"source": "...", "target": "..."}` et documenter la licence dans
  `data/training/sources.csv` avant tout entraînement.
- Continuer à enrichir les packs avec les natifs, sous CC0/CC BY.

## 8. Preuves

- HF `ELRs/Ewondo_Bible` : <https://huggingface.co/datasets/ELRs/Ewondo_Bible>
- HF `OlameMend/Ewondo-TTS` : <https://huggingface.co/datasets/OlameMend/Ewondo-TTS>
- HF `Favourez/french_ewondo_dictionary` :
  <https://huggingface.co/datasets/Favourez/french_ewondo_dictionary>
- Bible.com v1854 : <https://www.bible.com/bible/1854>
- Corpus Ewondo-Français NOODL :
  <https://mozilladatacollective.com/datasets/cmpedjr9y00wqnv07styloz0d>
- Licence NOODL : <https://licensingafricandatasets.com/nwulite-obodo-license>
- Louis Segond 1910, domaine public : <https://ebible.org/fraLSG/copyright.htm>
- Duala-English, CC-BY-4.0 :
  <https://huggingface.co/datasets/michsethowusu/english-duala_sentence-pairs_mt560>
- Origine OPUS MT560 (Apache-2.0) :
  <https://opus.nlpl.eu/MT560>
- Ewondo bibles, fiche qui reconnaît les droits des éditeurs :
  <https://huggingface.co/datasets/flagship-ai/cameroon_bibles>
- Africa Corpus (licence other) :
  <https://huggingface.co/datasets/AfriSpeech/africa-corpus>

## 9. Mise à jour du 8 novembre 2026 — ressources externes

L’audit des huit fichiers de `~/Downloads` reste valable : aucun n’est
utilisable en l’état. La recherche externe a toutefois identifié des
**modèles pré-entraînés** et des **corpus audio** qui changent les options
techniques, sans changer la règle du niveau A.

| Ressource | Licence | Usage retenu |
|---|---|---|
| `flagship-ai/francais-fufulde` | CC-BY-4.0 | brouillon fr → fub, jamais niveau A |
| `flagship-ai/francais-bulu` | CC-BY-4.0 | brouillon fr → bulu (langue candidate) |
| `flagship-ai/cameroon-int8` / `francais-ewondo` | CC-BY-NC-4.0 (bundle) ; sous-fiche CC-BY-4.0 | brouillon fr → ewo, licence à trancher |
| Common Voice 27.0 (`fub`, `ewo`, `dua`, `bas`, `bum`) | CC0-1.0 | audio/ASR, pas de redistribution |
| `AfriSpeech/african-speech-ipa` (`ewo`, `dua`, `bas`, `bum`) | CC-BY-4.0 | audio + IPA, ASR/évaluation |
| `OlameMend/soreva` (`ewo`, `dua`, `fub`, `bas`, etc.) | CC-BY-4.0 | évaluation ASR/TTS |
| `facebook/bouquet` (`ewo`, `dua`, `bas`, `eto`, `ksf`, `tui`) | CC-BY-4.0 | benchmark humain, accès à accepter |
| `michsethowusu/english-basaa` / `english-bulu` | CC-BY-4.0 | paires en → bas/bum, texte religieux |
| `Favourez/bulu_english` / `fr_en_bulu.json` | MIT | 2 688 paires lexicales ; exclure le fichier Bible de 31 297 versets |
| `stfotso/french-ghomala-bandjoun` | Apache-2.0 | 15 190 paires fr ↔ bbj |
| `mimba/text2text` / `nnh_fra` | CC-BY-NC-SA-4.0 | 40 968 paires, gated |
| `mimba/afrilang` / `fub_cm` | CC-BY-NC-SA-4.0 | audio fub, gated |
| `DS4H-ICTU/french-*` | inconnue | privé/gated, à demander |

**Corrections importantes** :

- `NLLB-200` ne connaît pas `ewo_Latn`, `dua_Latn` ni `fub_Latn` ; seul
  `fuv_Latn` est présent. La baseline NLLB actuelle est donc du fulfulde
  nigérian, pas du fulfulde Adamawa.
- `Favourez/bulu_english` contient deux choses : 2 688 paires lexicales
  utilisables sous MIT et un fichier de 31 297 versets bibliques à traiter
  comme du texte biblique (autorisation requise). Le tag MIT global ne suffit
  pas pour la partie Bible.
- `OlameMend/Corinth_dataset` est tagué CC-BY-4.0 mais contient la première
  épître aux Corinthiens en ewondo : même règle que la Bible ewondo.
- Le bundle `flagship-ai/cameroon-int8` est globalement CC-BY-NC-4.0, alors que
  sa sous-fiche `francais-ewondo` affiche CC-BY-4.0. En cas de doute, retenir
  la licence la plus restrictive (NC) et demander confirmation à l’auteur.

**Décision** : le niveau A reste **packs validés uniquement**. Les modèles
`flagship-ai` peuvent alimenter un mode brouillon pour l’ewondo et le
fulfulde, avec protection des nombres et relecture native. Le duala n’a
toujours pas de modèle prêt : formation complète sur les 15 351 paires ou
traduction humaine.

Inventaire complet : [`EXTERNAL_RESOURCES.md`](EXTERNAL_RESOURCES.md).
