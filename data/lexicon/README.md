# Lexique finance générique

Fichier : `finance-extra.csv`.

But : préparer la couverture d'autres interfaces financières (agences, reçus,
factures, plafonds, échéances) sans contaminer les packs de démonstration.

Statuts :

- `pack-draft` : traduction issue d'un pack, non validée ;
- `mixed` : une partie attestée en ligne (souvent le fulfulde), le reste
  brouillon ;
- `loanword` : emprunt conservé (`code`, `bank`) ;
- `missing` : aucune traduction fiable ; **ne pas inventer**, à confier à un
  natif.

Ce lexique n'est pas chargé par l'extension et ne remplace pas les packs.
Il sert de backlog de traduction et de base pour un futur import.

## Pichon 1950

`ewondo-pichon-1950.csv` est extrait manuellement de la *Petite grammaire
ewondo* du Père Pichon (1950), pages 110–119 du lexique français-ewondo.

- 11 entrées Pichon seulement, pas le dictionnaire complet ;
- orthographe de 1950, à normaliser en AGLC avant tout usage ;
- statut `source-attested`, **jamais `validated`** ;
- source à citer ; ne pas recopier le dictionnaire en masse.
- les termes modernes (banque, solde, facture, sécurité, total, transfert)
  n'y figurent pas : Pichon ne suffit pas pour le finance.


## Fulfulde et Duala

- `fulfulde-dictionary-2021.csv` : 16 entrées attestées dans le dictionnaire
  fulfulde fourni (`adadu` total, `baɗal` crédit, `heɓtugol` retrait,
  `faktiir` facture, `becca` monnaie, `kayitol kaalis` billet).
- `duala-helmlinger-1972.csv` : 5 entrées attestées dans Helmlinger 1972
  (`moní` argent, `bank` banque, `lóma` envoyer, `kusa` recevoir,
  `bekusedi` reçu).

Toutes sont `source-attested`, **pas `validated`**. Les dictionnaires sont des
références, pas des preuves de qualité moderne.
