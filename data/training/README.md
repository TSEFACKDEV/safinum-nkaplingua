# Données d’entraînement — état et règles

**État au 7 novembre 2026** :

- **Ewondo / Fulfulde** : entraînement **interdit** sans autorisation écrite
  (textes bibliques, droits des éditeurs).
- **Duala** : entraînement **anglais → duala autorisé** sur les paires
  CC-BY-4.0 de `michsethowusu/english-duala_sentence-pairs_mt560`.

Diagnostic complet : [`../../docs/TRAINING_DATA_AUDIT.md`](../../docs/TRAINING_DATA_AUDIT.md).

## Pourquoi

| Fichier | Problème |
|---|---|
| 3 fichiers Parquet audio | aucune licence ; transcriptions bibliques |
| `bible_2024.txt` | texte © Bible Society of Cameroon, 2012 ; le tag CC-BY-4.0 de HF ne transfère pas les droits |
| 4 CSV `Favourez` | aucune licence ; scraping de Bible.com |
| `Ewondo_textes.xlsx` | texte biblique ; fiche HF qui reconnaît les droits des éditeurs |
| `Fulfulde_Adamawa_francais.csv` | licence « other » ; versets via YouVersion |
| `Duala_anglais.csv` | **CC-BY-4.0** ; anglais → duala, 15 351 paires |

Le corpus parallèle Ewondo-Français de Mozilla Data Collective est en
**NOODL-1.0**, licence qui interdit l’entraînement sans autorisation écrite.

## Règles

1. **Ne jamais committer** les fichiers d’entraînement dans ce dossier.
   Seuls `README.md` et `sources.csv` sont versionnés.
2. **Ne pas entraîner** sur l’ewondo ou le fulfulde sans autorisation écrite.
3. Une source n’est `usable` que si :
   - `license_claim` vaut `CC0-1.0`, `CC-BY-4.0`, `public-domain` ou `MIT` ;
   - `rights_holder` et `evidence_url` sont renseignés ;
   - l’autorisation couvre l’entraînement, l’évaluation et la redistribution
     du modèle.
4. Avant tout entraînement :

```bash
python3 scripts/check-training-data.py
```

## Entraîner le modèle anglais → duala

Le corpus `Duala_anglais.csv` est extrait de `Langue.zip`. Il ne doit pas être
commité ; on le laisse hors du dépôt.

```bash
server/.venv/bin/python scripts/train-duala-mt.py \
  --csv "/chemin/vers/Duala_anglais.csv" \
  --output dist/models/duala-en \
  --max-pairs 2000 --epochs 1
```

Le script :

- vérifie `data/training/sources.csv` et refuse une source non `usable` ;
- nettoie les espaces autour des diacritiques ;
- découpe 90/5/5 ;
- gèle l’encodeur anglais (option par défaut) ;
- sauvegarde le modèle, `metrics.json` et `MODEL_CARD.md`.

Le modèle est **anglais → duala**, pas français → duala. Pour le français, il
faut un pivot français → anglais (par exemple `Helsinki-NLP/opus-mt-fr-en`,
Apache-2.0) puis le modèle duala. Le niveau A reste réservé aux packs validés.

Pilote du 7 novembre 2026 : 2 000 paires, 1 époque, loss validation 4,22,
mais générations répétitives. Le modèle est un **proof of concept**, pas un
traducteur de production. Voir [`../../docs/DUALA_MT.md`](../../docs/DUALA_MT.md).

## Demande d’autorisation

Les modèles de courrier pour l’ewondo et le fulfulde sont dans
[`../../docs/DATA_PERMISSIONS.md`](../../docs/DATA_PERMISSIONS.md).

## Alternatives libres

- **Common Voice 27.0** (CC0-1.0) pour l’audio/ASR, pas pour la traduction.
- **Contributions natives** CC0/CC BY pour les packs.
- **NLLB-200** (CC BY-NC 4.0) pour la démonstration fulfulde non commerciale.
- **Louis Segond 1910** (domaine public) pour le français, sans contrepartie
  ewondo libre.
