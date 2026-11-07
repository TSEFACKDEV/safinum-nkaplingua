# Données d’entraînement — état et règles

**État au 7 novembre 2026** : **aucun entraînement n’est autorisé** avec les
fichiers fournis. Le diagnostic complet est dans
[`../../docs/TRAINING_DATA_AUDIT.md`](../../docs/TRAINING_DATA_AUDIT.md).

## Pourquoi

| Fichier | Problème |
|---|---|
| 3 fichiers Parquet audio | aucune licence ; transcriptions bibliques |
| `bible_2024.txt` | texte © Bible Society of Cameroon, 2012 ; le tag CC-BY-4.0 de HF ne transfère pas les droits |
| 4 CSV `Favourez` | aucune licence ; scraping de Bible.com |

Le corpus parallèle Ewondo-Français de Mozilla Data Collective est en
**NOODL-1.0**, licence qui interdit l’entraînement sans autorisation écrite.

## Règles

1. **Ne jamais committer** les fichiers d’entraînement dans ce dossier.
   Seuls `README.md` et `sources.csv` sont versionnés.
2. **Ne pas entraîner** sans autorisation écrite du détenteur.
3. Une source n’est `usable` que si :
   - `license_claim` vaut `CC0-1.0`, `CC-BY-4.0`, `public-domain` ou `MIT` ;
   - `rights_holder` et `evidence_url` sont renseignés ;
   - l’autorisation couvre l’entraînement, l’évaluation et la redistribution
     du modèle.
4. Le corpus doit être formaté en JSONL :

```json
{"source": "Texte français", "target": "Texte ewondo"}
```

5. Avant tout entraînement :

```bash
python3 scripts/check-training-data.py
```

## Demande d’autorisation

Les modèles de courrier sont dans
[`../../docs/DATA_PERMISSIONS.md`](../../docs/DATA_PERMISSIONS.md).

## Alternatives libres

- **Common Voice 27.0** (CC0-1.0) pour l’audio/ASR, pas pour la traduction.
- **Contributions natives** CC0/CC BY pour les packs.
- **NLLB-200** (CC BY-NC 4.0) pour la démonstration fulfulde non commerciale.
- **Louis Segond 1910** (domaine public) pour le français, sans contrepartie
  ewondo libre.

## Si une autorisation est obtenue

1. Mettre à jour `sources.csv` : `license_claim`, `rights_holder`,
   `evidence_url`, `verdict=usable`.
2. Stocker le corpus **hors du dépôt** (par exemple
   `~/datasets/nkaplingua/`).
3. Lancer :

```bash
python3 scripts/check-training-data.py
python3 scripts/train-mt.py --train ~/datasets/nkaplingua/fr-ewo.jsonl \
  --output ~/models/nkaplingua-fr-ewo --license CC-BY-4.0
```

Le script d’entraînement n’est pas fourni tant qu’aucune donnée autorisée
n’est disponible : cela évite de laisser croire qu’un modèle peut être
produit avec des données non libres.
