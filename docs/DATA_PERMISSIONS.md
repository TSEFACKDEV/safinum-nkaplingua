# Demandes d’autorisation — données d’entraînement

Ces modèles servent à demander une autorisation **écrite** avant tout
entraînement. Conserver la réponse (PDF ou e-mail) hors du dépôt public et la
référencer dans `data/training/sources.csv` (`evidence_url` ou chemin privé).

## 1. Bible Society of Cameroon — texte ewondo

**Objet** : autorisation d’utiliser la Bible ewondo pour l’entraînement et
l’évaluation d’un modèle de traduction.

```text
À l’attention de la Bible Society of Cameroon
Objet : demande d’autorisation — texte biblique ewondo et projet NkapLingua

Madame, Monsieur,

Nous développons NkapLingua, un prototype d’accessibilité financière pour le
fulfulde, l’ewondo et le duala, dans le cadre du SAFINUM Innovate Challenge
2026. Nous souhaitons utiliser le texte biblique ewondo (MKPAMAṄ AMVOE,
© Bible Society of Cameroon, 2012) pour :

- entraîner un modèle de traduction français → ewondo ;
- évaluer ce modèle sur un jeu de versets tenus à l’écart ;
- publier éventuellement les poids du modèle et le corpus dérivé.

Pouvez-vous nous confirmer :

1. si une telle utilisation est autorisée ;
2. la licence applicable au texte et aux œuvres dérivées ;
3. les conditions d’attribution ;
4. si un accord écrit est nécessaire pour un usage non commercial puis
   commercial ;
5. si la redistribution du corpus ou des poids du modèle est permise.

Nous pouvons signer une convention, limiter l’usage au hackathon et retirer
les données à votre demande.

Cordialement,
L’équipe ARTEMIS 237
```

**Canal** : formulaire de contact de Bible.com / United Bible Societies, ou
adresse officielle de la Bible Society of Cameroon. Conserver la référence de
la version Bible.com **NTE12 / ID 1854**.

## 2. OlameMend — dataset audio Ewondo-TTS

**Objet** : clarifier la licence du dataset audio et des transcriptions.

```text
Objet : licence du dataset OlameMend/Ewondo-TTS

Bonjour,

Nous avons identifié votre dataset « Ewondo-TTS » sur Hugging Face
(7 967 exemples audio + transcription, 10 shards). La carte ne mentionne pas
de licence.

Pouvez-vous préciser :

1. la licence exacte de l’audio et des transcriptions ;
2. la source du texte lu (Bible ewondo ? autre corpus ?) ;
3. si l’entraînement d’un modèle ASR/TTS et la redistribution des poids sont
   autorisés ;
4. les conditions d’attribution.

Sans licence explicite, nous ne pouvons pas utiliser le dataset dans un
projet public.

Cordialement,
L’équipe ARTEMIS 237
```

**Canal** : discussion Hugging Face du dataset ou profil `OlameMend`.

## 3. Favourez — dictionnaire et phrasebook

**Objet** : clarifier la licence et la provenance des CSV.

```text
Objet : licence des datasets Favourez/ewondo_english et
Favourez/french_ewondo_dictionary

Bonjour,

Nous avons identifié vos datasets `ewondo_english` (112 paires) et
`french_ewondo_dictionary` (268 paires, notebook de scraping Bible.com).
Aucune licence n’est déclarée.

Pouvez-vous préciser :

1. la source exacte de chaque fichier ;
2. si vous détenez les droits ou une autorisation de Bible.com ;
3. la licence que vous pouvez accorder (CC0, CC BY, autre) ;
4. si l’entraînement et la redistribution des modèles dérivés sont autorisés.

Nous ne pouvons pas utiliser un fichier sans licence explicite.

Cordialement,
L’équipe ARTEMIS 237
```

**Canal** : discussion Hugging Face des datasets `Favourez`.

## 4. Institute of African Digital Humanities — corpus NOODL

**Objet** : autorisation d’entraînement sur le corpus Ewondo-Français
(3 631 unités, NOODL-1.0).

```text
Objet : autorisation d’entraînement — Ewondo-French Parallel Corpus
(NOODL-1.0)

Bonjour,

Nous avons identifié votre corpus Ewondo-Français de 3 631 unités sur
Mozilla Data Collective. La licence NOODL-1.0 exige une autorisation écrite
pour l’entraînement.

Pouvez-vous nous confirmer :

1. si l’entraînement d’un modèle de traduction est autorisé ;
2. si la redistribution des poids du modèle est autorisée ;
3. les conditions d’attribution et de citation ;
4. si un usage commercial est exclu ou soumis à un accord séparé.

Cordialement,
L’équipe ARTEMIS 237
```

**Canal** : Mozilla Data Collective / Institut de recherche indiqué sur la
page du dataset.

## 5. Checklist avant d’accepter une autorisation

- [ ] Le document identifie le **détenteur des droits** (pas seulement
      l’uploader).
- [ ] Il couvre explicitement l’**entraînement**.
- [ ] Il couvre l’**évaluation**.
- [ ] Il couvre la **redistribution des poids** ou du corpus dérivé.
- [ ] Il précise l’**usage commercial** (autorisé, interdit, accord séparé).
- [ ] Il précise l’**attribution** exigée.
- [ ] Il précise la **durée** et les conditions de retrait.
- [ ] La preuve est archivée hors du dépôt public.
- [ ] `data/training/sources.csv` passe de `blocked`/`permission_required`
      à `usable`, avec `license_claim`, `rights_holder` et `evidence_url`.
- [ ] `python3 scripts/check-training-data.py` passe.

## 6. Ce qu’il ne faut pas faire

- Considérer un tag Hugging Face comme une preuve de droits.
- Utiliser un corpus NOODL sans autorisation écrite.
- Entraîner sur un texte biblique © Bible Society sans accord.
- Committer les fichiers audio ou le texte biblique dans le dépôt.
- Présenter un modèle entraîné sur des données non libres comme « libre ».


## Widget flottant (v0.7.0)

Le widget est injecté par `content_scripts` sur les pages `http://` et
`https://` pour être disponible sans clic sur l'icône. Le content script ne
scanne pas la page au chargement : il ne lit le DOM qu'au moment où
l'utilisateur lance une traduction, une sélection ou un test de texte. Le
widget ne lit jamais les champs, mots de passe, PIN ou valeurs de formulaire.
Il est isolé en Shadow DOM et sa position est la seule donnée conservée
(`nkWidgetPosition`).

La permission d'hôte associée est donc large par construction ; elle doit être
expliquée dans la fiche de soumission et dans la vidéo.
