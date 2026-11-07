# Packs linguistiques

Chaque fichier JSON est une **mémoire de traduction communautaire**. Il ne
contient pas de modèle de traduction : uniquement des paires de phrases
relues par des locuteurs.

## Règle de sécurité

Une entrée n'est appliquée que si :

- `status` vaut `validated` ;
- `reviewer`, `reviewedAt`, `license` et `provenance=human` sont renseignés ;
- `license` vaut `CC0-1.0` ou `CC-BY-4.0` ;
- les jetons `[[NUM_n]]`, `[[NAME_n]]`, `[[URL_n]]` et `[[EMAIL_n]]` sont
  présents exactement une fois ;
- les termes critiques (`FCFA`, `PIN`, `OTP`, `FINAKA`, etc.) sont préservés.

Une phrase absente ou non validée laisse le texte original en place. C'est
volontaire : mieux vaut ne pas traduire que modifier un montant ou une
condition. Aucune machine translation n'entre dans un pack validé : la
provenance `human` est vérifiée à l'import et par
`scripts/check-language-packs.py`.

## Format

```json
{
  "code": "ewo",
  "label": "Ewondo",
  "version": "0.1.0",
  "status": "community-pack",
  "entries": [
    {
      "source": "Le solde est de [[NUM_0]] FCFA.",
      "target": "…",
      "status": "validated",
      "reviewer": "nom du relecteur",
      "reviewedAt": "2026-11-10",
      "context": "solde",
      "license": "CC-BY-4.0",
      "provenance": "human"
    }
  ]
}
```

## Contribuer

Le chemin recommandé est le kit natif TRAPD :

1. générer les classeurs avec `python3 scripts/make-native-kit.py` ;
2. faire remplir T1 et T2 séparément ;
3. fusionner avec `scripts/merge-native-reviews.py --lang <code>` ;
4. faire arbitrer, puis importer avec
   `scripts/import-native-reviews.py --lang <code>`.

Pour une correction ponctuelle, on peut aussi éditer directement
`data/language-packs/<code>.csv` :

1. remplir la colonne `target` pour les 20 phrases finance ;
2. passer `status` à `validated` après relecture par un locuteur natif ;
3. renseigner `reviewer`, `reviewed_at`, `license` et `provenance=human` ;
4. lancer :

```bash
python3 scripts/import-language-pack.py data/language-packs/ewo.csv
```

Le script met à jour `extension/language-packs/ewo.json`. Il vérifie que les
jetons, les termes critiques, la licence et la provenance humaine sont
présents. Voir [`../../data/review/README.md`](../../data/review/README.md).

## Langues sans pack rempli

L'ewondo et le duala sont présents dans le sélecteur, mais leurs packs sont
vides au départ. L'extension affiche alors « aucune phrase validée » et
conserve le texte source. C'est un état honnête, pas une traduction automatique
déguisée.

Yemba, medumba, bassa et ghomala' ne font plus partie du prototype.
