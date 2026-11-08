# Test du site SAFINUM — itérations et résultats

**Date** : 8 novembre 2026  
**URL testée** : <https://safinum.cm/hackathon-test>  
**Méthode** : Chrome headless + CDP, injection du content script, parcours
des 5 étapes, audit des nœuds texte/attributs, puis exécution du background
réel avec le backend `flagship-ai` et MyMemory.

---

## 1. Ce qui a été testé

Le site est une application Laravel/Inertia. Le HTML initial ne contient pas
le parcours : il faut laisser le JavaScript s'exécuter. Les 5 étapes ont été
parcourues :

1. **Solde** — compte, solde, transactions récentes.
2. **Frais** — type d'opération, montant, frais, total.
3. **Bénéficiaire** — nom, téléphone, motif, note, consentement.
4. **Récapitulatif** — montant, frais, total, bénéficiaire, téléphone,
   référence, opération, confirmation.
5. **Confirmation** — transfert effectué, référence, montant, statut.

Le test couvre aussi :

- le titre de l'onglet ;
- les boutons et les options de `select` ;
- les attributs `title`, `aria-label`, `placeholder`, `alt` ;
- les changements de DOM dynamiques (le site remplace tout le contenu à
  chaque étape) ;
- les initiales d'avatar (`AN`) et le sélecteur de langue (`EN`), qui ne
  doivent pas être traduits ;
- les montants, numéros de compte, téléphones et références
  (`SAF-2026-…`), qui doivent rester intacts.

---

## 2. Couverture

Audit avec un background factice qui marque chaque segment collecté :

| Mesure | Résultat |
|---|---:|
| Segments visibles collectés sur les 5 étapes | **104** |
| Textes uniques | **71** |
| Nœuds texte visibles non collectés | **0** |
| Titre de l'onglet traduit | **oui** |
| Options de `select` collectées | **oui** |
| Attributs sûrs collectés | **oui** |
| Étapes dynamiques re-traduites | **oui** |

**Conclusion couverture** : le content script ne laisse aucun texte visible
de côté sur ce site. Les seuls textes volontairement ignorés sont les sigles
courts (`EN`, `AN`, `CM`), les marques (`Safinum`), les montants (`FCFA`) et
les champs de formulaire.

---

## 3. Qualité réelle des traductions

### 3.1 Fulfulde (`fub`) — mode démo avec MyMemory

Le modèle local `flagship-ai` est faible sur les libellés courts. Le pré-pass
MyMemory `fr|ff`, activé uniquement en mode démo et si l'utilisateur a coché
« Autoriser MyMemory », donne de bien meilleurs libellés :

| Français | Fulfulde (MyMemory) |
|---|---|
| Montant | Limgal |
| Sécurité | Jam |
| Confirmation | Tabitingol |
| Récapitulatif | Samere |
| Effectuer un transfert | Waɗde mbayliigu |
| Consulter les frais | Yiytu njoɓdi |
| Nouveau transfert | Jaltugol kesol |
| Nom du bénéficiaire | Innde keɓoowo nafoore ndee |
| Solde disponible | Balance ina woodi |
| Votre compte | Konte maa |
| Transactions récentes | Julaagu cakkitiingu nguu |
| Retour | Bawo |
| Modifier | Ngam waylude |

Résultat du test complet :

| Mesure | Résultat |
|---|---:|
| Segments uniques | 71 |
| Traductions acceptées | **66** |
| Échecs | **5** |
| Nature des échecs | fragments de jetons seuls (`[[NUM_0]] FCFA`, `[[NAME_0]]`), pas des libellés visibles |

**Lecture** : en Fulfulde, le site est utilisable en démo. Les libellés sont
nettement meilleurs avec MyMemory. Les phrases longues restent du brouillon
local, à relire.

### 3.2 Ewondo (`ewo`) — local uniquement

MyMemory n'a pas de paire `fr|ewo`. Le modèle `flagship-ai` est entraîné sur
un corpus « scripture + livres » et ne connaît pas les libellés d'interface.

| Mesure | Résultat |
|---|---:|
| Segments uniques | 71 |
| Traductions acceptées | **61** |
| Échecs | **10** |
| Échecs visibles | `Montant`, `Compte Safinum`, `Opération`, `Statut`, `Confirmation` laissés en français |
| Échecs non visibles | 5 fragments de jetons seuls |

Exemples de sorties locales :

| Français | Ewondo (brouillon) | Commentaire |
|---|---|---|
| Bonjour, Amina | Ma mëte, Amina. | acceptable |
| Votre transfert a été envoyé avec succès. | Ndò mvulna woe ongabë nyè. | brouillon |
| Nom du bénéficiaire | Dzoe nyè na: | incomplet |
| Sécurité | Dzam da, asu yë na: | mauvais libellé |
| Récapitulatif | Ndò hm, akëlë kui a nyòl. | trop long, incorrect |

**Lecture** : l'ewondo reste un **brouillon**, pas une traduction fiable. Le
filtre `english_leak` empêche au moins de afficher « Amount », « Security »
ou « Summary » à la place du français. Les libellés non fiables restent en
français avec le badge « non traduit » ou « démo MT ».

### 3.3 Duala (`dua`)

Aucun modèle de traduction duala. Le site reste en pack communautaire, et le
pack est vide. **Le duala ne peut pas être démontré comme traduction
automatique sur ce site.**

---

## 4. Corrections et améliorations apportées

| Problème constaté | Correction |
|---|---|
| Le titre de l'onglet n'était pas traduit | ajout d'un item `title`, traduction et restauration |
| `EN` et `AN` étaient traduits | ignorer les sigles de 1 à 4 majuscules |
| Les libellés courts partaient en phrases entières | plafond de décodage dynamique selon la longueur source |
| Le modèle sortait « Amount », « Security », « Summary » | filtre `english_leak` côté backend |
| Les phrases critiques restaient en français sur le site de test | mode démo SAFINUM : MT autorisée, badge « démo MT », jamais « validé » |
| Les libellés Fulfulde étaient mauvais | pré-pass MyMemory `fr|ff` pour les libellés courts, uniquement en démo et avec opt-in cloud |
| Le fournisseur affiché était imprécis | provider `hybrid` : MyMemory + flagship-ai |
| Les étapes dynamiques pouvaient être oubliées | test des 5 étapes ; MutationObserver déjà en place |
| Les options de `select` et attributs | vérifiés : collectés et traduits |

---

## 5. Limites qui restent

1. **Ewondo** : le modèle local n'est pas un traducteur d'interface. Il faut
   une relecture humaine ou un fine-tuning sur un corpus UI/finance.
2. **MyMemory** : cloud, opt-in, quota, conditions à vérifier ; uniquement
   `fr|ff`. Ce n'est pas une validation native.
3. **Duala** : aucun modèle ; pack vide.
4. **Niveau A** : aucune de ces sorties n'est « validée ». En mode strict,
   les phrases critiques restent en français ; en mode démo SAFINUM, elles
   sont traduites mais portent le badge « démo MT ».
5. **Phrases longues** : le brouillon local reste fragile, surtout en ewondo.

---

## 6. Alternatives au natif

Aucune méthode automatique ne remplace un natif pour le niveau A. Voici les
options réalistes, classées par fiabilité.

### 6.1 La plus fiable : traducteur professionnel payant

- **Upwork, Fiverr, ProZ, TranslatorsCafe** : publier une tâche « traduction
  français → ewondo/fulfulde, 70 messages finance, relecture, 3 jours ».
- **Agences camerounaises** : demander un devis pour 70 à 200 phrases.
- **Universités** : départements de langues africaines de Yaoundé I, Douala,
  Dschang, Ngaoundéré ; ENS Yaoundé ; étudiants en master.
- **Associations** : ANACLAC, ACAMLADU, comité Beti, associations sawa,
  associations peules, radios communautaires, centres culturels.

Ce n'est pas une alternative « sans natif » : c'est une alternative au
recrutement personnel. C'est la seule voie crédible pour le niveau A.

### 6.2 Traducteur professionnel + linguiste non natif

Un linguiste peut vérifier l'orthographe, la grammaire, les tons et la
terminologie à partir des dictionnaires et grammaires. Il ne remplace pas la
naturalité d'un natif, mais il peut valider la forme écrite. Utiliser :

- dictionnaires SIL / OLC / NTeALan comme référence ;
- AGLC pour l'orthographe ;
- un traducteur professionnel pour le sens ;
- une relecture communautaire pour la naturalité.

### 6.3 Consensus de plusieurs traducteurs / réviseurs

- 3 réviseurs indépendants, même non natifs, avec le même glossaire ;
- garder la traduction qui fait consensus ;
- marquer « expert-reviewed », jamais « native-validated » ;
- payer les réviseurs ou leur offrir une attribution claire.

### 6.4 Validation automatique (démo uniquement)

Le backend applique déjà :

- préservation des montants, noms, URLs, emails, références ;
- filtre de longueur, répétition, fuite de français ;
- filtre de fuite d'anglais ;
- rétro-traduction NLLB pour le fulfulde ;
- pré-pass MyMemory pour les libellés fulfulde.

On peut ajouter :

- **consensus multi-modèles** : flagship + NLLB + MyMemory ;
- **back-translation** avec `ewondo-francais` / `fufulde-francais` ;
- **score de confiance** affiché, avec refus si trop bas.

Ces contrôles améliorent la démo. Ils ne certifient pas le niveau A.

---

## 7. Recommandation pour la démonstration

1. **Démo Fulfulde** : activer « Autoriser MyMemory » dans le popup, choisir
   Fulfulde, parcourir les 5 étapes. C'est la démo la plus convaincante.
2. **Démo Ewondo** : montrer le brouillon local et expliquer que les libellés
   non fiables restent en français ; ne pas prétendre que c'est validé.
3. **Duala** : ne pas le présenter comme MT ; montrer le pack et expliquer
   qu'il attend les natifs.
4. **Niveau A** : toujours packs validés uniquement. Le mode démo SAFINUM est
   réservé au site fictif `safinum.cm/hackathon-test`.

---

## 8. Commandes de reproduction

```bash
# Backend flagship
cd server
NK_MOCK=0 NK_ROUNDTRIP=0 NK_FLAGSHIP_MT=auto \
  NK_FLAGSHIP_MODEL_DIR=../dist/models/flagship-int8 \
  .venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000

# Tests
python3 scripts/check-evolution.py
NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py
node scripts/test-extension.js
node tests/criticality.test.js
node tests/cloud-gating.test.js
node tests/content.test.js
node tests/pipeline.e2e.js --mode=all
```

Le test Chrome/CDP complet est décrit dans l'historique de la session ; il
n'est pas versionné car il dépend d'un Chrome headless local.
