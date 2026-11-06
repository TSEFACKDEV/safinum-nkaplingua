# Scripts et préparation des données

## 1. Télécharger le modèle

Le backend télécharge automatiquement `facebook/m2m100_418M` au premier appel
`/translate`. Pour pré-télécharger :

```bash
cd server
source .venv/bin/activate
python -c "from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer; M2M100Tokenizer.from_pretrained('facebook/m2m100_418M'); M2M100ForConditionalGeneration.from_pretrained('facebook/m2m100_418M')"
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
