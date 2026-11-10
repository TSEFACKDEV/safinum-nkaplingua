# Corpus finance multilingue — candidat

`finance-multilingual.csv` rassemble les messages du site et les entrées des
trois packs, dédupliqués par clé FR/EN.

- **213 lignes** environ, selon les mises à jour des packs ;
- colonnes `key_fr`, `key_en`, `fub`, `ewo`, `dua` ;
- statuts `candidate` ou `missing` uniquement ;
- **aucune ligne `validated`** : c'est un corpus candidat, pas une vérité
  linguistique ;
- les cellules vides sont volontaires : mieux vaut un trou qu'une invention.

Le fichier est destiné à la recherche, au calcul de couverture et à la
préparation des kits natifs. Il n'est pas chargé par l'extension.
