# Données

## `glossary.template.csv`

Glossaire finance à remplir avec un locuteur natif du fulfulde adamawa.

- `source_fr` : terme français ;
- `source_en` : équivalent anglais (optionnel) ;
- `target_fub` : traduction validée — **ne pas inventer** ;
- `domain` : mobile_money, credit, savings, kyc, security, support ;
- `note` : contrainte d’usage ;
- `status` : `à valider`, `validé`, `rejeté`.

Règle : un terme n’est `validé` que si un locuteur natif l’a relu et si la
source est documentée.

## `do_not_translate.txt`

Termes qui doivent rester identiques : marques, codes, devises, acronymes.
Utilisé par le contrôle de sûreté du backend.

## `unseen_finance.txt`

20 phrases finance écrites pour tester le moteur sur du contenu inédit. Elles ne
doivent pas servir à l’entraînement ni au prompt de démo.

## Ce qu’il ne faut pas mettre ici

- un dictionnaire copié sans licence ;
- des données client réelles ;
- des numéros de compte ou de téléphone réels ;
- des traductions non validées présentées comme officielles.
