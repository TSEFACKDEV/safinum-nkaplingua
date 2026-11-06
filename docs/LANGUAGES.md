# Langues, détection et couverture

NkapLingua ne prétend pas traduire automatiquement toutes les langues du
Cameroun. Le prototype distingue trois niveaux de couverture, affichés dans le
popup.

## 1. Langues disponibles

| Code | Langue | Région | Moteur | État |
|---|---|---|---|---|
| `fub` | Fulfulde (Adamawa) | Adamaoua, Nord, Extrême-Nord | NLLB local + MyMemory | MT baseline, validation native en cours |
| `ybb` | Yemba | Menoua, Ouest | Pack communautaire | 0/20 phrases validées au départ |
| `byv` | Medumba | Ndé, Ouest | Pack communautaire | 0/20 phrases validées au départ |
| `ewo` | Ewondo | Centre | Pack communautaire | 0/20 phrases validées au départ |
| `dua` | Douala | Littoral | Pack communautaire | 0/20 phrases validées au départ |
| `bas` | Bassa | Littoral | Pack communautaire | 0/20 phrases validées au départ |
| `bbj` | Ghomala' | Ouest | Pack communautaire | 0/20 phrases validées au départ |

### Ce que « pack communautaire » veut dire

Le pack est une **mémoire de traduction** : des phrases source et cible
exactement appariées, relues par un locuteur natif. Le moteur ne traduit pas
mot à mot et n’invente rien. Si la phrase n’est pas dans le pack, le texte
original reste affiché et l’interface indique « phrase non validée ».

C’est volontaire : une traduction approximative de « frais », « solde » ou
« pénalité » peut faire prendre une mauvaise décision financière. Le règlement
SAFINUM considère d’ailleurs qu’une erreur sur un montant, une condition ou un
avertissement est un défaut majeur.

## 2. Détection de la langue source

La détection est déterministe et explicable (`extension/languages.js` et
`server/app.py`) :

1. indice HTML `lang` de la page (`fr-FR`, `en-US`) ;
2. mots-outils français et anglais ;
3. accents français et digrammes anglais ;
4. score, confiance et cas mixte.

Le résultat est affiché dans le popup : « Source détectée : français (92 %) ».
Si la page est courte ou ambiguë, l’indice HTML est prioritaire avec une
confiance basse. La détection ne prétend pas reconnaître le fulfulde, le yemba
ou le medumba : ce sont des langues **cibles**, pas les langues sources
attendues de l’interface du challenge.

## 3. Protection des données avant traduction

Avant l’envoi au moteur, le content script remplace par des jetons :

- les montants et tous les chiffres (`[[NUM_n]]`) ;
- les URLs (`[[URL_n]]`) ;
- les emails (`[[EMAIL_n]]`) ;
- les noms de bénéficiaires et de personnes (`[[NAME_n]]`).

Les noms sont détectés après un mot déclencheur (`bénéficiaire`, `client`,
`à`, `de`, `pour`, `M.`, `Mme`, etc.) ou dans une séquence de mots
capitalisés. Les mots courants, les marques et les libellés financiers sont
exclus pour éviter les faux positifs.

Après traduction, chaque jeton doit être présent **exactement une fois**. Sinon
la traduction est refusée et l’original est conservé. Les termes `FCFA`, `XAF`,
`PIN`, `OTP`, `KYC` et `FINAKA` sont également contrôlés.

## 4. Attributs traduits

Le content script traduit désormais :

- les nœuds texte visibles ;
- `title`, `aria-label`, `placeholder`, `alt` ;
- la valeur des boutons `input[type=button|submit|reset]` ;
- le texte des `<option>`.

Il ne lit jamais la valeur d’un champ texte, d’un mot de passe, d’un OTP ou
d’un champ marqué `data-sensitive`.

## 5. Ajouter une langue

1. Ajouter une entrée dans `extension/languages.js` avec `engine: "pack"`.
2. Créer `extension/language-packs/<code>.json` (le script le fait).
3. Remplir `data/language-packs/<code>.csv` avec 20 phrases finance.
4. Faire relire par un locuteur natif et passer `status` à `validated`.
5. Importer :

```bash
python3 scripts/import-language-pack.py data/language-packs/<code>.csv
```

6. Reconstruire le ZIP :

```bash
./scripts/package-extension.sh
```

Le script refuse une entrée si un jeton ou un terme critique a disparu. C’est
la barrière de sécurité minimale avant toute publication.

## 6. Limites assumées

- Le fulfulde reste une **baseline NLLB**, pas une traduction validée.
- Les six autres langues sont des packs vides tant qu’un natif ne les remplit
  pas. Le code est prêt, la donnée ne l’est pas.
- Aucun modèle NLLB ne gère `ybb`, `byv`, `ewo`, `dua`, `bas` ou `bbj` :
  `ybb_Latn`, `byv_Latn`, etc. sont inconnus du tokenizer NLLB.
- MyMemory ne couvre pas ces langues : `fr|ybb`, `fr|byv` renvoient une erreur
  de langue cible invalide.
- La qualité et la couverture seront mesurées dans `docs/EVAL.md` et
  `docs/LANGUAGE_VALIDATION.md`.
