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

## 6. Packs linguistiques

```bash
# Vérifier les packs et les feuilles de traduction
python3 scripts/check-language-packs.py

# Importer un CSV rempli par un locuteur natif
python3 scripts/import-language-pack.py data/language-packs/ewo.csv
python3 scripts/import-language-pack.py data/language-packs/dua.csv

# Reconstruire les ZIP
./scripts/package-extension.sh
```

Le script refuse une entrée si un jeton `[[NUM_n]]`, `[[NAME_n]]`,
`[[URL_n]]` ou `[[EMAIL_n]]` manque, ou si un terme critique (`FCFA`, `PIN`,
`OTP`, `FINAKA`) a été traduit.

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
