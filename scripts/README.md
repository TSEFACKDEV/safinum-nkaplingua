# Scripts et préparation des données

## 1. Télécharger le modèle

Le backend télécharge automatiquement `facebook/nllb-200-distilled-600M` au
premier appel `/translate`. Pour pré-télécharger :

```bash
cd server
source .venv/bin/activate
python -c "from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; AutoTokenizer.from_pretrained('facebook/nllb-200-distilled-600M'); AutoModelForSeq2SeqLM.from_pretrained('facebook/nllb-200-distilled-600M')"
```

## 2. Corpus d’évaluation

Source : Adamawa Fulfulde–French Parallel Corpus of Narratives 1.2, Mozilla Data
Collective, licence NOODL-1.0.

- télécharger depuis la page Mozilla Data Collective ;
- ne pas committer le corpus dans le dépôt ;
- garder 100–200 phrases tenues à l’écart ;
- ajouter 50 phrases finance écrites pour le projet.

Format attendu :

```json
{"id": "t001", "source": "Les frais...", "reference": "...", "domain": "mobile_money"}
```

## 3. Vérifier le backend

```bash
curl http://127.0.0.1:8000/health
```

## 4. Lancer la démo

```bash
# terminal 1
cd server && source .venv/bin/activate && uvicorn app:app --host 127.0.0.1 --port 8000

# terminal 2 (optionnel)
python3 -m http.server 8080 --directory demo
# ouvrir http://127.0.0.1:8080
```

## 5. Mode maquette

```bash
NK_MOCK=1 uvicorn app:app --host 127.0.0.1 --port 8000
```

Utile pour tester l’extension et le rendu sans attendre le modèle.

## 6. Packs linguistiques et kit natif

```bash
# Vérifier les packs, le glossaire, les messages et le kit natif
python3 scripts/check-language-packs.py
python3 scripts/check-language-data.py
python3 scripts/check-native-kit.py

# Générer les classeurs T1/T2 à remettre aux natifs
python3 scripts/make-native-kit.py

# Générer le navigateur de références du glossaire (liens seulement)
python3 scripts/build-reference-links.py

# Vérifier le manifeste des données d'entraînement (aucun fichier versionné)
python3 scripts/check-training-data.py

# Entraîner le modèle anglais → duala (source CC-BY-4.0)
server/.venv/bin/python scripts/train-duala-mt.py \
  --csv /chemin/vers/Duala_anglais.csv \
  --output dist/models/duala-en --max-pairs 2000 --epochs 1

# Tester le pivot français → anglais → duala
server/.venv/bin/python scripts/translate-duala-pivot.py \
  --model dist/models/duala-en --text "Votre solde est disponible."

# Après remplissage : fusionner T1/T2, puis arbitrer
python3 scripts/merge-native-reviews.py --lang fub
# l'arbitre remplit data/review/fulfulde.arbitrage.csv

# Importer l'arbitrage (dry-run puis réel)
python3 scripts/import-native-reviews.py --lang fub --dry-run
python3 scripts/import-native-reviews.py --lang fub

# Si un seul natif est disponible : conserver son travail en brouillon
python3 scripts/import-draft-kit.py --lang fub --dry-run
python3 scripts/import-draft-kit.py --lang fub

# Reconstruire les ZIP
./scripts/package-extension.sh
```

Le kit natif est décrit dans
[`data/review/README.md`](../data/review/README.md). Il couvre 40 termes de
glossaire, 70 messages du site officiel et les phrases de pack (102 en
fulfulde, 20 en ewondo et duala).

Le script d'import refuse une entrée validée si :

- un jeton `[[NUM_n]]`, `[[NAME_n]]`, `[[URL_n]]` ou `[[EMAIL_n]]` manque ;
- un terme critique (`FCFA`, `PIN`, `OTP`, `KYC`, `FINAKA`) a été traduit ;
- le relecteur, la date ISO, la licence (`CC0-1.0` ou `CC-BY-4.0`) ou la
  provenance `human` manque ;
- T1 et T2 sont la même personne, ou l'arbitre est l'un des deux.

Aucune machine translation n'entre dans un pack validé : la provenance
`human` est obligatoire.

## 6bis. Fiche d'évaluation du fulfulde

```bash
# Remplit candidate_fub / candidate_raw pour les 20 phrases inédites
server/.venv/bin/python scripts/generate-unseen-fub.py
```

Le script protège les nombres et les termes critiques avant NLLB, puis marque
`rejected_auto` si un montant, un terme ou un jeton est perdu. Les 20 phrases
restent à juger par un natif dans `data/review/unseen_judgment.csv`.

Après jugement :

```bash
python3 scripts/import-unseen-judgment.py --dry-run
python3 scripts/import-unseen-judgment.py
python3 scripts/check-language-data.py
```

## 7. Évaluer le contenu inédit

```bash
python3 scripts/evaluate-unseen.py --url http://127.0.0.1:8000 \
  --output eval-unseen.json
```

Mesure le taux d’acceptation, la préservation des montants, le score de
rétro-traduction moyen et les raisons de refus sur les 20 phrases de
`data/unseen_finance.txt`.

## 8. Tests rapides de l’extension

```bash
node scripts/test-extension.js
```

Vérifie le registre des trois langues, la détection FR/EN, les packs et la
préservation des jetons, sans navigateur ni réseau.
