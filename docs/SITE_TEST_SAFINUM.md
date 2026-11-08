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

### 3.1 Fulfulde (`fub`) — pack humain + secours MyMemory

Depuis l'import des relectures, le pack fulfulde contient 107 entrées
(`draft`), dont les 70 messages du site. Résultat du parcours complet :

| Mesure | Résultat |
|---|---:|
| Segments uniques | 71 |
| Traductions acceptées | **71** |
| Hits pack humain | **60** |
| MT démo critique | **1** (`Compte courant`) |
| Fragments inchangés (montants/noms) | **10** |
| Titre de l'onglet | **pack** |
| Échecs visibles | **0** |

Exemples issus du pack humain :

| Français | Fulfulde |
|---|---|
| Solde disponible | Jawdindi ndi yami |
| Frais de transfert | Njoɓdi nawgol |
| Bénéficiaire | Keɓoowo |
| Sécurité | Kisal |
| Confirmation | Teeŋtingol |
| Récapitulatif | Koolol |
| Total débité | Kaalis yoɓaaɗo fof |
| Votre compte | Asaaku ma |

MyMemory reste utilisé pour un libellé critique absent du pack
(`Compte courant`) et pour quelques libellés non critiques. Il est marqué
« démo MT » et n'entre jamais dans le pack.

### 3.2 Ewondo (`ewo`) — pack humain + flagship en secours

MyMemory n'a pas de paire `fr|ewo`. Le pack humain couvre l'essentiel ; le
modèle `flagship-ai` ne sert que de secours.

| Mesure | Résultat |
|---|---:|
| Segments uniques | 71 |
| Traductions acceptées | **71** |
| Hits pack humain | **59** |
| MT démo critique | **1** (`Compte courant`) |
| Fragments inchangés (montants/noms) | **11** |
| Titre de l'onglet | **pack** |
| Échecs visibles | **0** |

Exemples issus du pack humain :

| Français | Ewondo |
|---|---|
| Solde disponible | Abálá é ne ngə́lə́ |
| Frais de transfert | Mákyé má nkus |
| Bénéficiaire | Mòd á nnyɔ́ŋ |
| Sécurité | Ɔ́bám |
| Confirmation | Nsinyi |
| Récapitulatif | Afúlásí |
| Votre compte | Kɔ́ndó wō |

Le pack contient une entrée `reviewed` (`SO-010`) : T1 contenait
« automatic », T2 a fourni une formulation ewondo. Les autres entrées sont
des brouillons T1.

### 3.3 Duala (`dua`) — pack humain seulement

Aucun modèle de traduction duala. Le pack contient 121 entrées, dont les
70 messages du site.

| Mesure | Résultat |
|---|---:|
| Segments uniques | 71 |
| Traductions acceptées | **64** |
| Hits pack humain | **58** |
| MT | **0** |
| Fragments inchangés (montants/noms/dates) | **6** |
| Titre de l'onglet | **pack** |
| Échecs visibles | **4 libellés** |

Les quatre libellés encore en français sont :

- `Protocole de test` (P1) ;
- `Banque en ligne` (P1) ;
- `Compte courant` (P0) ;
- `Référence` (P0).

Ils sont listés dans
[`../data/site-officiel/messages-gaps.csv`](../data/site-officiel/messages-gaps.csv).
Deux formats de date (`nov.`, `oct.`) restent aussi en français ; ils ne sont
pas bloquants. Les textes non traduits portent le badge « non traduit » ;
les textes humains non validés portent « brouillon humain ».

Exemples issus du pack humain :

| Français | Duala |
|---|---|
| Solde disponible | Mɔ̀nì mwé ɓáyí |
| Frais de transfert | Móǹgá mwá lómo mɔ̀nì |
| Bénéficiaire | Moto nu mányɔ̀ŋɔ̀ |
| Sécurité | Bata |
| Confirmation | Adise |
| Récapitulatif | Tombise |
| Votre compte | Kompa ɔŋ |

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
| 85 lignes fulfulde « Tafsiri: » recopiaient le français | audit automatique, rejet de ces lignes |
| T2 fulfulde identique à T1 à 99,1 % | T2 n'est pas utilisé comme second traducteur |
| Les cibles humaines contenaient des montants/noms en clair | index pseudonymisé + cible tokenisée, restauration locale |
| Les entrées `draft` pouvaient passer en mode strict | seules les entrées `validated` sont appliquées en strict ; `draft`/`reviewed` réservées à la démo |
| Le site avait des variantes de ponctuation | index souple (`Bonjour, Amina` ↔ `Bonjour, Amina.`) |
| Titre et ligne de compte absents du kit | gabarits composés, sans invention de terme métier |

---

## 5. Limites qui restent

1. **Aucune entrée n'est validée** : les 107 entrées fulfulde, 122 ewondo et
   121 duala sont `draft` ou `reviewed`. Il manque un T2 indépendant et un
   arbitre.
2. **Fulfulde** : 85 lignes « Tafsiri » ont été rejetées ; elles doivent être
   refaites par un locuteur. T2 est une copie de T1.
3. **Ewondo** : les brouillons T1 sont plausibles mais non validés ; T2 dérive
   de T1.
4. **Duala** : 4 libellés du site restent en français ; aucun modèle MT.
5. **MyMemory** : cloud, opt-in, quota, conditions à vérifier ; uniquement
   `fr|ff`. Ce n'est pas une validation native.
6. **Niveau A** : en mode strict, les phrases critiques restent en français ;
   en mode démo, les brouillons humains sont appliqués avec badge, et les
   phrases sans pack passent en MT avec badge « démo MT ».

---

## 6. Alternatives au natif

Aucune méthode automatique ne remplace un natif pour le niveau A. Voici les
options réalistes, classées par fiabilité.

### 6.0 La demande native est passée de 130 lignes à 4 libellés

Le kit a été rempli par des proches. Le travail restant pour le duala est
maintenant très petit :

| Libellé | Priorité | Pourquoi |
|---|---|---|
| `Compte courant` | P0 | absent du kit ; critique |
| `Référence` | P0 | les deux traducteurs ont laissé le français |
| `Protocole de test` | P1 | absent du kit |
| `Banque en ligne` | P1 | absent du kit |

Fichier à envoyer : [`../data/site-officiel/messages-gaps.csv`](../data/site-officiel/messages-gaps.csv).
Pour le fulfulde et l'ewondo, il reste surtout à refaire les 85 lignes
« Tafsiri » et à obtenir un T2 indépendant.

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

1. **Démo Fulfulde** : activer « Autoriser MyMemory » pour le seul libellé
   critique absent du pack (`Compte courant`). Les 60 autres segments
   viennent du pack humain. C'est la démo la plus convaincante.
2. **Démo Ewondo** : le pack couvre 59 segments ; `Compte courant` passe en
   MT de démonstration. Ne pas prétendre que c'est validé.
3. **Duala** : montrer le pack (58 segments) et les 4 badges « non traduit ».
   C'est la démonstration la plus honnête : elle montre exactement où le
   travail natif reste à faire.
4. **Niveau A** : en strict, packs validés uniquement. En mode démo SAFINUM,
   les brouillons humains sont appliqués avec badge, les phrases sans pack
   passent en MT avec badge « démo MT ». Jamais de phrase « validée » sans
   T2 indépendant et arbitre.

---

## 8. Commandes de reproduction

```bash
# Backend flagship
cd server
NK_MOCK=0 NK_ROUNDTRIP=0 NK_FLAGSHIP_MT=auto \
  NK_FLAGSHIP_MODEL_DIR=../dist/models/flagship-int8 \
  .venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000

# Audit et reconstruction des packs
python3 scripts/audit-native-reviews.py
python3 scripts/build-reviewed-packs.py          # simulation
python3 scripts/build-reviewed-packs.py --write  # écriture

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
