# Données

## `glossary.template.csv`

Glossaire finance à remplir avec les natifs des trois langues : fulfulde,
ewondo et duala.

- `source_fr` : terme français ;
- `source_en` : équivalent anglais (optionnel) ;
- `target_fub`, `target_ewo`, `target_dua` : traductions validées —
  **ne pas inventer** ;
- `domain` : mobile_money, credit, savings, kyc, security, support ;
- `note` : contrainte d’usage ;
- `status` : `a_traduire`, `à valider`, `validated`, `validé`, `rejeté` ;
- `reviewer_fub`, `reviewer_ewo`, `reviewer_dua` : relecteurs publics.

Règle : un terme n’est `validated` que si un locuteur natif l’a relu et si la
source est documentée.

Le backend charge automatiquement les lignes `validated` avec un
`target_fub` non vide. Il remplace le terme par un jeton avant NLLB, puis
restaure la traduction validée. Les colonnes `target_ewo` et `target_dua`
servent aux packs ewondo et duala, pas au backend NLLB. Si le modèle perd le jeton, la phrase est
refusée et l’original est conservé. C’est ce qui garantit la cohérence
terminologique sur du contenu inédit.

## `do_not_translate.txt`

Termes qui doivent rester identiques : marques, codes, devises, acronymes.
Utilisé par le contrôle de sûreté du backend.

## `language-packs/`

Feuilles de traduction communautaire pour le **fulfulde**, l’**ewondo** et le
**duala**. Chaque feuille contient les colonnes `source`, `target`, `status`,
`reviewer`, `context`, `reviewed_at`, `license` et `provenance`.

Une ligne `status=validated` exige :

- `reviewer` non vide ;
- `reviewed_at` au format ISO ;
- `license` = `CC0-1.0` ou `CC-BY-4.0` ;
- `provenance=human` — aucune machine translation dans un pack validé.

Voir [`../extension/language-packs/README.md`](../extension/language-packs/README.md).

## `reference/`

Navigateur de références pour les 40 termes du glossaire :
[`reference/glossary-links.csv`](reference/glossary-links.csv) contient les
liens Glosbe, Webonary, Resulam et SIL Cameroon. Aucune traduction n’est
copiée. Voir [`reference/README.md`](reference/README.md) et
[`../docs/REFERENCE_SOURCES.md`](../docs/REFERENCE_SOURCES.md).

## `review/`

Kit de traduction native TRAPD généré par
[`../scripts/make-native-kit.py`](../scripts/make-native-kit.py) :

- `fulfulde.t1.csv` / `.t2.csv` : 212 items (glossaire, messages, 102 phrases) ;
- `ewondo.t1.csv` / `.t2.csv` : 130 items ;
- `duala.t1.csv` / `.t2.csv` : 130 items ;
- `unseen_judgment.csv` : copie de la fiche des 20 phrases inédites.

Les colonnes `target` restent vides tant que les natifs n’ont pas travaillé.
Voir [`review/README.md`](review/README.md).

## `unseen_finance.txt`

20 phrases finance écrites pour tester le moteur sur du contenu inédit. Elles ne
doivent pas servir à l’entraînement ni au prompt de démo.

## Ce qu’il ne faut pas mettre ici

- un dictionnaire copié sans licence ;
- des données client réelles ;
- des numéros de compte ou de téléphone réels ;
- des traductions non validées présentées comme officielles.
