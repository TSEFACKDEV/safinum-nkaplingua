# Langues, détection et couverture

NkapLingua ne prétend pas traduire automatiquement toutes les langues du
Cameroun. Le prototype retient **trois langues**, choisies pour leurs
ressources existantes (corpus de parole, grammaires, dictionnaires) :

- **Fulfulde d'Adamawa** (`fub`) — MT brouillon (`flagship-ai`, NLLB en secours) ;
- **Ewondo** (`ewo`) — MT brouillon (`flagship-ai`) + pack communautaire ;
- **Duala** (`dua`) — pack communautaire uniquement.

Yemba (`ybb`), medumba (`byv`), bassa (`bas`) et ghomala' (`bbj`) sont
**retirés du prototype** : ni corpus de parole comparable, ni moteur validé.
Klein les retire aussi du registre, des packs, des tests et de la documentation
(voir `tasks/klein.md`, K10).

## 1. Langues disponibles

| Code | Langue | Région | Moteur | Ressources connues | État |
|---|---|---|---|---|---|
| `fub` | Fulfulde (Adamawa) | Adamaoua, Nord, Extrême-Nord | `flagship-ai` fr → fub ; NLLB `fuv_Latn` en secours | Common Voice ASR ; 1 303 enregistrements TTS à une voix | MT brouillon, 0/102 phrases validées |
| `ewo` | Ewondo | Centre | `flagship-ai` fr → ewo, brouillon | Common Voice 27.0 : 14,36 h validées, 31 voix ; Ewondo-ASR ~3 h 11, 16 voix ; grammaires et dictionnaires | MT brouillon, 0/20 phrases validées |
| `dua` | Duala | Littoral | Pack communautaire | Common Voice 27.0 (heures à vérifier) ; dictionnaires et descriptions anciennes | Pack, 0/20 phrases validées |

Les classeurs T1/T2 et la fiche d'arbitrage sont prêts dans
[`../data/review/`](../data/review/).

> **Mise à jour du 8 novembre 2026** — le backend est branché :
> `flagship-ai/francais-fufulde` (CC-BY-4.0) pour le fulfulde et
> `flagship-ai/cameroon-int8` / `francais-ewondo` (CC-BY-NC-4.0, sous-fiche
> CC-BY-4.0 à trancher) pour l'ewondo. Ce sont des **brouillons**, pas des
> moteurs validés : le niveau A reste couvert par les packs. Les phrases
> critiques sans pack restent en français. Voir
> [`EXTERNAL_RESOURCES.md`](EXTERNAL_RESOURCES.md).

### Pourquoi ces trois langues

| Rang | Langue | Pourquoi elle ressort | Limite à prévoir |
|---|---|---|---|
| 1 | **Ewondo** | Deux corpus de parole avec transcriptions : Common Voice 27.0 annonce 14,36 h validées et 31 voix ; Ewondo-ASR annonce environ 3 h 11, 16 voix, avec transcription et tons marqués. Grammaires, dictionnaires et travaux linguistiques existent. | Une partie des enregistrements est lue à partir de textes ; pas de conversation spontanée ni toutes les variétés locales. Accès à Ewondo-ASR soumis à restrictions. |
| 2 | **Duala** | Présence dans Common Voice 27.0, un jeu audio destiné à l'ASR, et une longue tradition de dictionnaires et de descriptions. | Le nombre d'heures validées n'est pas comparable à l'ewondo ; vérifier quantité, variété et conditions d'accès. |
| 3 | **Fulfulde d'Adamawa** | Common Voice propose un corpus ASR ; un autre jeu contient 1 303 enregistrements lus par un locuteur. Forte tradition de ressources linguistiques. | Le jeu supplémentaire est un corpus **TTS à une seule voix** : insuffisant seul pour entraîner ou évaluer un système robuste. |

Les volumes ci-dessus sont des annonces externes : les vérifier avant de les
citer dans une release, une vidéo ou une présentation.

## 2. Ce que « pack communautaire » veut dire

Le pack est une **mémoire de traduction** : des phrases source et cible
exactement appariées, relues par un locuteur natif. Le moteur ne traduit pas
mot à mot et n'invente rien. Si la phrase n'est pas dans le pack, le texte
original reste affiché et l'interface indique « phrase non validée ».
Exception : pour les phrases **non critiques** en fulfulde et en ewondo, un
brouillon MT peut être proposé avec la mention « à relire par un natif ». Une
phrase critique sans pack reste toujours en français.

C'est volontaire : une traduction approximative de « frais », « solde » ou
« pénalité » peut faire prendre une mauvaise décision financière. Le règlement
SAFINUM considère d'ailleurs qu'une erreur sur un montant, une condition ou un
avertissement est un défaut majeur.

Niveaux de priorité :

| Niveau | Contenu | Règle |
|---|---|---|
| **A** | solde, frais, total, PIN/OTP, erreurs, confirmation, sécurité | **pack validé uniquement** ; sinon, français + badge « non traduit » |
| **B** | navigation, libellés, aides | pack, ou MT avec badge « automatique » |
| **C** | texte non critique | MT autorisée, étiquetée |

## 3. Détection de la langue source

La détection est déterministe et explicable (`extension/languages.js` et
`server/app.py`) :

1. indice HTML `lang` de la page (`fr-FR`, `en-US`) ;
2. mots-outils français et anglais ;
3. accents français et digrammes anglais ;
4. score, confiance et cas mixte.

Le résultat est affiché dans le popup : « Source détectée : français (92 %) ».
Si la page est courte ou ambiguë, l'indice HTML est prioritaire avec une
confiance basse. La détection ne prétend pas reconnaître le fulfulde, l'ewondo
ou le duala : ce sont des langues **cibles**, pas les langues sources attendues
de l'interface du challenge.

## 4. Protection des données avant traduction

Avant l'envoi au moteur, le content script remplace par des jetons :

- les montants et tous les chiffres (`[[NUM_n]]`) ;
- les URLs (`[[URL_n]]`) ;
- les emails (`[[EMAIL_n]]`) ;
- les noms de bénéficiaires et de personnes (`[[NAME_n]]`).

Les noms sont détectés après un mot déclencheur (« bénéficiaire », « client »,
« à », « de », « pour », « M. », « Mme », etc.) ou dans une séquence de mots
capitalisés. Les mots courants, les marques et les libellés financiers sont
exclus pour éviter les faux positifs.

Après traduction, chaque jeton doit être présent **exactement une fois**. Sinon
la traduction est refusée et l'original est conservé. Les termes `FCFA`, `XAF`,
`PIN`, `OTP`, `KYC` et `FINAKA` sont également contrôlés.

Le champ `context` ne doit pas être envoyé au backend : il peut contenir des
valeurs de formulaire ou des zones `data-sensitive` (correctif M1).

## 5. Attributs traduits

Le content script traduit :

- les nœuds texte visibles ;
- `title`, `aria-label`, `placeholder`, `alt` ;
- la valeur des boutons `input[type=button|submit|reset]` ;
- le texte des `<option>`.

Il ne lit jamais la valeur d'un champ texte, d'un mot de passe, d'un OTP ou
d'un champ marqué `data-sensitive`.

## 6. Ajouter ou retirer une langue

### Ajouter

1. Ajouter une entrée dans `extension/languages.js` avec `engine: "pack"`.
2. Ajouter l'entrée correspondante dans `LANGUAGE_REGISTRY` et
   `PACK_TARGETS` de `server/app.py`.
3. Créer `data/language-packs/<code>.csv` avec 20 phrases finance.
4. Faire relire par un locuteur natif et passer `status` à `validated`.
5. Importer :

```bash
python3 scripts/import-language-pack.py data/language-packs/<code>.csv
```

6. Vérifier et reconstruire :

```bash
python3 scripts/check-language-packs.py
./scripts/package-extension.sh
```

### Retirer

1. Supprimer l'entrée de `extension/languages.js` et de `server/app.py`
   (`LANGUAGE_REGISTRY`, `PACK_TARGETS`).
2. Supprimer `extension/language-packs/<code>.json` et
   `data/language-packs/<code>.csv`.
3. Mettre à jour `scripts/check-language-packs.py` (liste des langues
   attendues) et `scripts/test-extension.js`.
4. Mettre à jour la doc : `README.md`, `docs/LANGUAGES.md`,
   `docs/TECHNICAL.md`, `docs/PRESELECTION.md`, `docs/SUBMISSION.md`.
5. Publier le retrait dans la release : ne jamais laisser une langue morte
   dans l'interface.

## 7. Limites assumées

- Le fulfulde et l'ewondo restent des **MT brouillons**, pas des traductions
  validées. NLLB ne sert plus que de secours pour le fulfulde.
- Le pack duala est vide tant qu'un natif ne le remplit pas. Le code est prêt,
  la donnée ne l'est pas.
- NLLB ne couvre ni `ewo` ni `dua`. L'ewondo utilise `flagship-ai` en brouillon,
  le duala reste pack-only.
- Sans pack validé, les phrases critiques (solde, frais, PIN/OTP, etc.) ne sont
  pas traduites automatiquement : elles restent en français.
- Les corpus de parole disponibles ne suffisent pas, seuls, à garantir une
  transcription robuste ; ils aident l'audio, pas la traduction écrite.
- La qualité et la couverture seront mesurées dans `docs/EVAL.md` et
  `docs/LANGUAGE_VALIDATION.md`.
