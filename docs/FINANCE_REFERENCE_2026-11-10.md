# Noyau lexical financier trilingue — 10 novembre 2026

**But** : sortir du seul glossaire du site et rassembler un noyau finance
vérifiable dans les trois dictionnaires fournis.

**Statut** : **référence lexicographique**, pas validation native. Aucune entrée
n'est `validated`.

## Ce qui a été extrait

| Langue | Entrées de référence | Source |
|---|---:|---|
| Fulfulde | **16** | Dictionnaire Fulfulde (PDF), catégorie Argent / entrées vérifiées |
| Ewondo | **11** | Pichon 1950, lexique français-ewondo |
| Duala | **5** | Helmlinger 1972, dictionnaire duala-français |
| **Total** | **32** | — |

Fichiers :

- `data/lexicon/fulfulde-dictionary-2021.csv`
- `data/lexicon/ewondo-pichon-1950.csv`
- `data/lexicon/duala-helmlinger-1972.csv`
- `data/corpus/finance-multilingual.csv` : **236 lignes**, 0 validée

## Termes couverts

- argent, monnaie, budget, pièce, billet ;
- prix, coût, prix total, dépense, recette, bénéfice ;
- crédit, facture, retrait, taxe, impôt, salaire ;
- payer, envoyer, recevoir, refuser, traduire (verbes de base) ;
- total, nombre, affaire, caisse, lumière.

## Ce qui manque encore

Les dictionnaires historiques ne donnent pas, ou pas clairement :

- **banque** en fulfulde (emprunt moderne) ;
- **solde** ;
- **sécurité** ;
- **transfert** ;
- **référence** ;
- **bénéficiaire** ;
- **échéance**, **plafond**, **pénalité**, **découvert** ;
- les phrases complètes du parcours finance.

Ces termes existent dans les packs comme brouillons, mais **pas comme
validations natives**.

## Décision

- Les 32 entrées sont maintenant **branchées dans les packs** comme entrées
  `draft`, contexte `lexique-reference`, avec la source et le badge « non
  validé » ;
- elles ne sont **jamais `validated`** ;
- les collisions de cibles sont dans l’allowlist, pas une validation ;
- les packs passent à 200 / 210 / 203 entrées ;
- **0 phrase validée**.

## Prochaine étape

Faire relire ces 32 entrées + les 20 phrases inédites par un natif par langue.
C'est le seul moyen de passer de “référence” à “validated”.
