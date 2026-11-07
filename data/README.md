# Données

## `glossary.template.csv`

Glossaire finance à remplir avec un locuteur natif du fulfulde adamawa.

- `source_fr` : terme français ;
- `source_en` : équivalent anglais (optionnel) ;
- `target_fub` : traduction validée — **ne pas inventer** ;
- `domain` : mobile_money, credit, savings, kyc, security, support ;
- `note` : contrainte d’usage ;
- `status` : `à valider`, `validated`, `validé`, `rejeté`.

Règle : un terme n’est `validated` que si un locuteur natif l’a relu et si la
source est documentée.

Le backend charge automatiquement les lignes `validated` avec un
`target_fub` non vide. Il remplace le terme par un jeton avant NLLB, puis
restaure la traduction validée. Si le modèle perd le jeton, la phrase est
refusée et l’original est conservé. C’est ce qui garantit la cohérence
terminologique sur du contenu inédit.

## `do_not_translate.txt`

Termes qui doivent rester identiques : marques, codes, devises, acronymes.
Utilisé par le contrôle de sûreté du backend.

## `language-packs/`

Feuilles de traduction communautaire pour le yemba, le medumba, l’ewondo, le
douala, le bassa et le ghomala’. Voir
[`../extension/language-packs/README.md`](../extension/language-packs/README.md).

## `unseen_finance.txt`

20 phrases finance écrites pour tester le moteur sur du contenu inédit. Elles ne
doivent pas servir à l’entraînement ni au prompt de démo.

## Ce qu’il ne faut pas mettre ici

- un dictionnaire copié sans licence ;
- des données client réelles ;
- des numéros de compte ou de téléphone réels ;
- des traductions non validées présentées comme officielles.
