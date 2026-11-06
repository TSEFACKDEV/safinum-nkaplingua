# Packs linguistiques

Chaque fichier JSON est une **mémoire de traduction communautaire**. Il ne
contient pas de modèle de traduction : uniquement des paires de phrases
relues par des locuteurs.

## Règle de sécurité

Une entrée n'est appliquée que si :

- `status` vaut `validated` ;
- les jetons `[[NUM_n]]`, `[[NAME_n]]`, `[[URL_n]]` et `[[EMAIL_n]]` sont
  présents exactement une fois ;
- les termes critiques (`FCFA`, `PIN`, `OTP`, `FINAKA`, etc.) sont préservés.

Une phrase absente ou non validée laisse le texte original en place. C'est
volontaire : mieux vaut ne pas traduire que modifier un montant ou une
condition.

## Format

```json
{
  "code": "ybb",
  "label": "Yemba",
  "version": "0.1.0",
  "status": "community-pack",
  "entries": [
    {
      "source": "Le solde est de [[NUM_0]] FCFA.",
      "target": "…",
      "status": "validated",
      "reviewer": "nom du relecteur",
      "reviewedAt": "2026-11-10",
      "context": "solde"
    }
  ]
}
```

## Contribuer

1. Ouvrir `data/language-packs/<code>.csv`.
2. Remplir la colonne `target` pour les 20 phrases finance.
3. Passer `status` à `validated` après relecture par un locuteur natif.
4. Lancer :

```bash
python3 scripts/import-language-pack.py data/language-packs/ybb.csv
```

Le script met à jour `extension/language-packs/ybb.json`. Il vérifie que les
jetons et les termes critiques sont présents.

## Langues sans pack rempli

Le yemba, le medumba, l'ewondo, le douala, le bassa et le ghomala' sont
présents dans le sélecteur, mais leur pack est vide au départ. L'extension
affiche alors « aucune phrase validée » et conserve le texte source. C'est un
état honnête, pas une traduction automatique déguisée.
