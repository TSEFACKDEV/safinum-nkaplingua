# Modèle anglais → duala — note technique

**Date** : 7 novembre 2026  
**Statut** : **expérimental**, non intégré au niveau A.  
**Base** : `Helsinki-NLP/opus-mt-en-fr` (Apache-2.0), fine-tuné sur des paires
anglais → duala.

## 1. Données

| Élément | Valeur |
|---|---|
| Dataset | `michsethowusu/english-duala_sentence-pairs_mt560` |
| Licence | **CC-BY-4.0** ; original OPUS MT560 (Apache-2.0) |
| Taille | 15 351 paires `eng,dua` |
| Source locale | `Langue.zip` → `Langue/Duala/texte/Duala_anglais.csv` |
| Domaine | textes religieux (versets/paragraphes), **pas finance** |

Le corpus est **anglais → duala**, pas français → duala. Pour une entrée
française, il faut un pivot français → anglais
(`Helsinki-NLP/opus-mt-fr-en`, Apache-2.0) puis le modèle duala. Cette chaîne
à deux étages est réservée au niveau B/C : le niveau A reste couvert par les
packs validés.

## 2. Nettoyage

- normalisation Unicode NFC ;
- suppression des espaces autour des diacritiques combinants ;
- suppression des paires vides ou trop longues (> 400 caractères) ;
- déduplication ;
- découpage 90 % entraînement / 5 % validation / 5 % test.

## 3. Entraînement

```bash
server/.venv/bin/python scripts/train-duala-mt.py \
  --csv "/chemin/vers/Duala_anglais.csv" \
  --output dist/models/duala-en \
  --max-pairs 2000 --epochs 1
```

- encodeur anglais gelé (par défaut) ;
- décodeur duala entraîné ;
- batch 4, learning rate `2e-5`, longueur max 96 ;
- CPU uniquement (GPU non compatible avec la version de PyTorch installée).

### Inférence avec pivot français → anglais

```bash
server/.venv/bin/python scripts/translate-duala-pivot.py \
  --model dist/models/duala-en \
  --text "Votre solde est disponible."
```

Le script charge `Helsinki-NLP/opus-mt-fr-en` puis le modèle duala. Il affiche
les trois étapes : français, anglais pivot, duala.

## 4. Résultats du pilote

Pilote exécuté le 7 novembre 2026 sur CPU (4 cœurs, encodeur gelé) :

| Métrique | Valeur |
|---|---|
| Paires utilisées | 2 000 |
| Train / validation | 1 800 / 100 |
| Époques | 1 |
| Steps | 450 |
| Loss train (dernière) | 5,1019 |
| Loss validation | 4,2226 |
| Durée | 682 s (~11 min 22 s) |

Exemples de génération (validation) :

```text
EN : He did so by organizing a teaching campaign that used "the book of Jehovah's Law."
REF: A boli nde nika na bokise̱ o ekombo ye̱ se̱ jokwa la "kalat 'a Mbend 'a Yehova."
HYP: Nje bwam ba bwam ba bwam ba bwam ba bwam ... (répétition)

EN : Also, Christians who remain faithful through persecution or illness need to hear encouragement.
REF: 31:28,31) Kriste̱n yena i matingame̱ na jemea labu owas 'a mitakisan ...
HYP: Nde, nde nde nde ... (répétition)
```

Test finance avec le pivot :

```text
FR : Votre solde est disponible.
EN : Your balance is available.
DUA: Nde nde nje ba ba ba ba ba ba ... (répétition)
```

**Lecture honnête** : le pilote apprend le format et quelques mots duala,
mais il répète et produit encore du français (`Pierre`). Il n’est **pas**
utilisable comme traducteur de production. Il faudrait :

- le corpus complet (15 351 paires) et plusieurs époques ;
- un GPU ou davantage de temps CPU ;
- un nettoyage plus fin des références bibliques ;
- une évaluation native ;
- un décodage contraint / pénalité de répétition.

Le modèle est conservé localement dans `dist/models/duala-en-pilot` (ignoré par
git), pas dans l’extension.

## 5. Limites

- corpus religieux, pas de vocabulaire finance ;
- beaucoup de bruit (références bibliques, ponctuation, diacritiques) ;
- pas de paire français → duala ;
- qualité non validée par un natif ;
- ne doit **jamais** être utilisé pour le niveau A (solde, frais, PIN/OTP,
  erreurs, confirmation, sécurité).

## 6. Licence et attribution

- données : CC-BY-4.0, citer `michsethowusu/english-duala_sentence-pairs_mt560`
  et OPUS MT560 ;
- base : Apache-2.0, citer `Helsinki-NLP/opus-mt-en-fr` ;
- modèle produit : expérimental, à documenter dans `MODEL_CARD.md` avec les
  mêmes attributions ;
- ne pas redistribuer le corpus dans le dépôt.

## 7. Fichiers

- script : [`../scripts/train-duala-mt.py`](../scripts/train-duala-mt.py) ;
- manifeste : [`../data/training/sources.csv`](../data/training/sources.csv) ;
- audit : [`TRAINING_DATA_AUDIT.md`](TRAINING_DATA_AUDIT.md).
