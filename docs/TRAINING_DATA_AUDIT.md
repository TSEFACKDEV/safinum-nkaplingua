# Audit des données d’entraînement — 7 novembre 2026

**Objet** : vérifier si les fichiers fournis dans `~/Downloads` peuvent servir
à entraîner un modèle de traduction pour NkapLingua, dans le respect des
licences du concours (MIT, CC0-1.0, CC-BY-4.0, OFL).

**Conclusion** : **aucun des huit fichiers n’est utilisable en l’état**. Un
seul pourrait le devenir avec une autorisation écrite (la Bible ewondo) ; les
autres sont sans licence, issus d’un scraping, ou protégés par le droit
d’auteur.

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

## 6. Ce qui reste réellement libre

| Source | Licence | Ce qu’elle permet |
|---|---|---|
| Common Voice 27.0 — ewondo, duala, fulfulde | CC0-1.0 | audio + transcriptions pour ASR/évaluation |
| NLLB-200 | CC BY-NC 4.0 | démonstration fulfulde non commerciale |
| Code NkapLingua | MIT | réutilisation |
| Contributions natives | CC0-1.0 ou CC-BY-4.0 | packs validés |
| Bible Louis Segond 1910 | domaine public | texte français, pas de contrepartie ewondo libre |

Aucune de ces sources ne fournit un corpus parallèle français → ewondo libre.
C’est pourquoi les packs ewondo/duala restent la seule voie conforme pour le
niveau A.

## 7. Décision

- **Ne pas entraîner** sur les fichiers fournis.
- **Ne pas committer** les fichiers dans le dépôt.
- Demander une autorisation écrite aux détenteurs (voir
  [`DATA_PERMISSIONS.md`](DATA_PERMISSIONS.md)).
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
