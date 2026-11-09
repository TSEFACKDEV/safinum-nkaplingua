# Audit des relectures natives — 8 novembre 2026

**Objet** : vérifier les six classeurs T1/T2 reçus pour le fulfulde, l'ewondo
et le duala avant de les importer dans les packs.

**Décision** : aucun ligne n'est marquée `validated`. Le fulfulde contient
85 lignes non valides de type « Tafsiri: … » ; l'ewondo et le duala sont
plausibles mais T2 dérive de T1, donc l'indépendance TRAPD n'est pas
démontrée.

---

## 1. Fichiers audités

| Langue | Fichier T1 | Fichier T2 | Lignes |
|---|---|---|---:|
| Fulfulde | `data/review/fulfulde.t1.csv` | `data/review/fulfulde.t2.csv` | 212 |
| Ewondo | `data/review/ewondo.t1.csv` | `data/review/ewondo.t2.csv` | 130 |
| Duala | `data/review/duala.t1.csv` | `data/review/duala.t2.csv` | 130 |

Empreintes SHA-256 des fichiers reçus :

```text
4f418cea36f4a4e689a44f16b41d7b99f6f953e5bd5f4240d26f8af4a9d33c87  fulfulde.t1.csv
854bdadd4f6a67365875ded04dc471f276ac44cc3f7571165a46cc258f187dac  fulfulde.t2.csv
c5dfd9c0aed320fe87ee372dcf5181e1625bb8c8daee4b382aa835174c1f540e  ewondo.t1.csv
eedb315b3db8737db0bed830d0032a65efa0ff28869b75a48ab89b2f2040efa2  ewondo.t2.csv
a2b363470d758e5fdbdfc4f5f459a376da61ededfa3ae13a90905be5c5788a58  duala.t1.csv
511cba58877ce54aa7f4119ae6ca2725961e70f8b4008f582847e8619771c583  duala.t2.csv
```

Rapport détaillé : `docs/test-results/native-review-audit.csv` et
`docs/test-results/native-review-audit.json`.

---

## 2. Résultat d'audit

| Langue | Lignes dures T1 | Lignes dures T2 | Indépendance | Verdict |
|---|---:|---:|---|---|
| Fulfulde | 99 | 99 | 210/212 identiques (99,1 %) | **copié** |
| Ewondo | 5 | 11 | 95,4 % dérivées | **dérivé** |
| Duala | 5 | 4 | 90,0 % dérivées | **dérivé** |

« Dérivé » signifie : T2 est identique à T1, ou T2 est l'une des variantes
proposées par T1, ou T2 est à plus de 85 % similaire. Ce n'est pas un second
traducteur indépendant.

### 2.1 Fulfulde — 85 lignes « Tafsiri: »

Le fichier T1 contient **85 lignes sur 212** (40,1 %) dont la cible commence
par `Tafsiri:`. « Tafsiri » est le mot swahili pour « traduction » ; ce n'est
pas du fulfulde. La cible recopie ensuite le français, souvent tronqué :

| Item | Source | Cible reçue |
|---|---|---|
| FUB-001 | Erreur et sécurité | `Tafsiri: Erreur et sécurité` |
| FUB-004 | Le numéro du bénéficiaire est invalide. | `Tafsiri: Le numéro du bénéficiaire est inval` |
| FUB-007 | Ne communiquez jamais votre code PIN… | `Tafsiri: Ne communiquez jamais votre code PI` |
| FUB-055 | Aucune valeur de formulaire ni code PIN lu. | `Tafsiri: Aucune valeur de formulaire ni code` |

Ces lignes ne sont pas des traductions. Elles sont rejetées, y compris les
33 lignes P0. Quinze d'entre elles ont pu être récupérées uniquement parce que
le même texte existe dans les 70 messages du site avec une traduction
fulfulde humaine (voir §4). Après recoupement, **70 des 85 lignes « Tafsiri »
restent rejetées** ; 14 autres lignes non-Tafsiri (copies du français,
mélanges, troncatures) sont aussi rejetées, soit **84 rejets sur 212**.

T2 ne corrige rien : ses cibles sont identiques à T1 sur **210/212** lignes,
et ses commentaires sont les commentaires T1 suffixés de
« (variante dialectale) » sur **212/212**. Ce n'est pas un second traducteur.

### 2.2 Ewondo — 129 lignes utilisables, 1 rejet

T1 est globalement plausible, avec des diacritiques et une terminologie
cohérente. Cinq lignes T1 sont mécaniquement inutilisables :

- `G11` : « adzóŋó automatic » (fuite d'anglais) ; l'autre variante
  « kɔ́ndó á adzóŋó » est conservée.
- `G18` : « service client » (copie du français) ; « nsáŋá á nnam » conservé.
- `SO-010` : « Mákyé má balan automatic » (fuite d'anglais) ; T2 est utilisé.
- `SO-036` : « Tsíŋí / Modifier » ; « Tsíŋí » conservé.
- `SO-063` : « Facture électricité » laissé en français ; rejeté.

T2 est plus faible sur certains libellés : `SO-069` contient « Erreur réseau »,
`SO-070` contient « valider », `SO-032` et `SO-039` sont restés en français.
T2 n'est utilisé que pour `SO-010`.

### 2.3 Duala — 126 lignes utilisables, 4 rejets

Les rejets sont des copies pures du français, présentes dans les deux
fichiers :

- `G25` « découvert » ;
- `G27` « guichet » ;
- `G29` « référence » ;
- `SO-032` « Référence ».

Le reste est cohérent, mais T2 est dérivé de T1 (96 identiques, 6 variantes
de T1, 15 quasi-identiques, 13 divergentes). Aucune ligne T2 n'a été utilisée
pour le duala.

---

## 3. Corrections appliquées

Ces corrections sont des décisions explicites, documentées, et restent des
**brouillons** : elles ne valent pas validation native.

| Correction | Occurrences | Justification |
|---|---:|---|
| `fgol` → `fof` | 5 | `fgol` n'est pas un mot fulfulde. `fof` = « tout/all » (Suzuya ; MyMemory `total → fu`). |
| `mo nelaɗo` → `keɓoowo` | 12 | `nelugol` = envoyer ; `nelaɗo` = expéditeur. `keɓugol` = recevoir ; `keɓoowo` = receveur/bénéficiaire (MyMemory `receveur → keɓoowo`). |
| `Nawgoljaawngol` → `Nawgol jaawngol` | 1 | espace manquant. |
| `Njoɓdi naange eletrik` → `Njoɓdi elektrik` | 1 | « naange » = soleil ; « électrique » est un emprunt. |
| `G25` ewondo rejeté | 1 | collision : `adzúmbí moní` traduisait à la fois « remboursement » et « découvert ». |

La correction `bénéficiaire/destinataire → keɓoowo` est un choix de sens :
dans un transfert mobile money, le bénéficiaire est le receveur. Elle est
signalée comme point à confirmer par un natif.

---

## 4. Ce qui a été importé

| Langue | Entrées pack | Validées | Revues | Brouillons | Dont gabarits composés |
|---|---:|---:|---:|---:|---:|
| Fulfulde | 107 | **0** | 0 | 107 | 3 |
| Ewondo | 122 | **0** | 1 | 121 | 3 |
| Duala | 121 | **0** | 0 | 121 | 3 |

- **Brouillon** (`draft`) : T1 seul, ou message réutilisé pour une source
  identique ; une seule personne identifiée.
- **Revu** (`reviewed`) : T1 rejeté mécaniquement, T2 utilisé ; deux personnes
  nommées, mais T2 n'est pas indépendant.
- **Validé** (`validated`) : **aucune entrée**. Il manque un T2 indépendant
  et un arbitre distinct.

> Depuis cet audit, les packs ont été enrichis d’une mémoire bilingue FR/EN et
> de gabarits `editorial` : 182 entrées fulfulde, 195 ewondo, 196 duala au
> 9 novembre, toujours **0 validée**. Voir
> [`REAL_TEST_2026-11-09.md`](REAL_TEST_2026-11-09.md).

Le pack fulfulde récupère **15 lignes** par recoupement avec les messages du
site (même source française, traduction fulfulde déjà présente) :
`FUB-006`, `009`, `013`, `014`, `015`, `017`, `018`, `023`, `025`, `026`,
`032`, `042`, `058`, `059`, `069`. Douze de ces sources sont déjà dans les
70 messages ; seules trois restent des entrées distinctes dans le pack.

Les trois **gabarits composés** sont :

1. le titre de l'onglet, composé depuis « Environnement de test » (SO-050) ;
2. la ligne « Numéro de compte : CM [[NUM_0]] … », composée depuis
   « Numéro de compte » (SO-008), avec les jetons conservés ;
3. « Retour au hackathon », composé depuis « Retour » (SO-018), avec
   « hackathon » conservé comme nom propre.

Aucun de ces gabarits n'invente un terme métier : ils réutilisent une
traduction humaine existante et conservent les noms propres, les sigles et
les jetons.

---

## 5. Couverture réelle du site SAFINUM

Test Chrome headless/CDP sur `https://safinum.cm/hackathon-test`, parcours
des 5 étapes, avec les packs ci-dessus et le background réel.

| Langue | Segments OK | Hits pack humain | MT démo critique | Titre |
|---|---:|---:|---:|---|
| Fulfulde | **71/71** | 60 | 1 | pack |
| Ewondo | **71/71** | 59 | 1 | pack |
| Duala | **64/71** | 58 | 0 | pack |

- 104 segments visibles collectés, 71 textes uniques, **0 texte visible non
  collecté**.
- Les échecs fulfulde/ewondo sont des fragments de jetons seuls
  (`[[NUM_0]] FCFA`, `[[NAME_0]]`) : ils ne sont pas visibles comme libellés.
- Les 7 échecs duala sont :
  - `Protocole de test` (P1) ;
  - `Banque en ligne` (P1) ;
  - `Compte courant` (P0) ;
  - `Référence` (P0) ;
  - deux formats de date (`nov.`, `oct.`) et un fragment de numéro de compte.
- Ces quatre libellés à traduire sont listés dans
  [`data/site-officiel/messages-gaps.csv`](../data/site-officiel/messages-gaps.csv).
  C'est la seule demande à envoyer à un locuteur duala : **4 lignes**, pas
  130.

---

## 6. Ce qui reste à faire pour valider

1. **Fulfulde** : refaire les 85 lignes « Tafsiri » avec un vrai locuteur.
   Les 70 messages du site, eux, sont couverts par des brouillons.
2. **Ewondo et duala** : obtenir un second traducteur **indépendant** (qui ne
   voit pas T1), puis un arbitre distinct. Sans cela, les packs restent
   `draft`/`reviewed`.
3. **Duala** : traduire les 4 libellés de `messages-gaps.csv`.
4. **Niveau A** : aucune entrée n'est validée. En mode strict, les phrases
   critiques restent en français. En mode démo SAFINUM, les brouillons
   humains sont appliqués avec le badge « brouillon humain » ; pour le
   fulfulde et l'ewondo, les phrases sans pack passent en MT avec le badge
   « démo MT ». Le duala, sans modèle MT, reste en français avec le badge
   « non traduit ».
5. **Consentement** : vérifier que les relecteurs acceptent la publication de
   leur nom public et la licence CC-BY-4.0. Les noms sont déjà dans les
   fichiers ; ils doivent être couverts par le formulaire de consentement.
6. **Phrases inédites** : `data/review/unseen_judgment.csv` n'a pas été
   renvoyé rempli. Le jugement des 20 phrases inédites reste à faire.

---

## 7. Commandes

```bash
# Auditer les classeurs
python3 scripts/audit-native-reviews.py

# Simuler la sélection, puis écrire les packs
python3 scripts/build-reviewed-packs.py
python3 scripts/build-reviewed-packs.py --write

# Vérifier
python3 scripts/check-language-data.py
python3 scripts/check-language-packs.py
python3 scripts/check-pack-collisions.py
python3 scripts/check-native-kit.py
node tests/criticality.test.js
node tests/pipeline.e2e.js --mode=all
```

---

## 8. Limites

- L'audit détecte des signaux objectifs ; il ne prouve pas la qualité
  linguistique d'une ligne.
- Les fichiers ewondo/duala peuvent être d'excellents brouillons humains ;
  ils ne sont pas une validation TRAPD.
- Les noms de relecteurs et les licences sont ceux fournis dans les fichiers ;
  aucune identité n'a été vérifiée.
- Le test SAFINUM utilise des données fictives. Aucune donnée réelle n'a été
  envoyée à MyMemory.
