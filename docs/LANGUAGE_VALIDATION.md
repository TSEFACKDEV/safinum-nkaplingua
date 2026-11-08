# Validation linguistique — fulfulde, ewondo et duala

> **Mise à jour du 8 novembre 2026** : le test réel NLLB donne **1/20 en
> production, 4/20 en démo** sur les phrases inédites, et 6/44 à l’étape 1 et **31/192 sur les 5 étapes**. Voir [`AUDIT_2026-11-08.md`](AUDIT_2026-11-08.md).

> **Méthode** : TRAPD (traduction, relecture, arbitrage, prétest,
> documentation), pas la rétro-traduction. Trois natifs, deux traductions
> indépendantes, un arbitre, un prétest avec 5 à 8 personnes peu
> alphabétisées. La rétro-traduction reste un filtre d'exécution, jamais une
> validation.

## 1. Langues et statuts

| Langue | Code | Moteur | Statut | Ce qui reste à faire |
|---|---|---|---|---|
| Fulfulde (Adamawa) | `fub` | `flagship-ai` fr → fub ; NLLB `fuv_Latn` en secours | **0/212 validées** ; 107 entrées de pack, toutes `draft` | refaire les 85 lignes « Tafsiri », puis TRAPD |
| Ewondo | `ewo` | `flagship-ai` fr → ewo (brouillon) + pack | **0/130 validées** ; 122 entrées, 1 `reviewed`, 121 `draft` | second traducteur indépendant + arbitre |
| Duala | `dua` | Pack communautaire | **0/130 validées** ; 121 entrées, toutes `draft` | 4 libellés du site + second traducteur indépendant + arbitre |

> **Audit du 8 novembre 2026** — les classeurs T1/T2 ont été reçus. Le
> fulfulde contient 85 lignes « Tafsiri: » qui recopient le français ; T2 est
> identique à T1 sur 210/212 lignes. L'ewondo et le duala sont plausibles mais
> T2 dérive de T1 (95,4 % et 90,0 % de cibles dérivées). **Aucune ligne n'est
> validée.** Détails, corrections et couverture du site :
> [`NATIVE_REVIEW_AUDIT.md`](NATIVE_REVIEW_AUDIT.md).

Les classeurs de travail sont prêts dans [`../data/review/`](../data/review/) :
T1 et T2 par langue, fiche d'arbitrage, fiche des 20 phrases inédites.

**Patrimoine audio** (annonces externes, à vérifier) :

| Langue | Corpus | Volume annoncé | Limite |
|---|---|---|---|
| Ewondo | Common Voice 27.0 | 14,36 h validées, 31 voix | lectures de textes, pas de spontané |
| Ewondo | Ewondo-ASR | ~3 h 11, 16 voix, tons marqués | accès restreint |
| Duala | Common Voice 27.0 | à vérifier | quantité non comparable |
| Fulfulde | Common Voice Adamawa | ASR | — |
| Fulfulde | Jeu TTS | 1 303 enregistrements | une seule voix, insuffisant seul |

**Règle** : aucune langue n'est présentée comme « traduction validée ». Le
fulfulde et l'ewondo disposent d'une **MT brouillon** (`flagship-ai`), le duala
d'un pack communautaire. Le popup et la page affichent explicitement cet état.

> **Mise à jour du 8 novembre 2026** — NLLB-200 ne couvre ni `ewo_Latn`, ni
> `dua_Latn`, ni `fub_Latn` ; seul `fuv_Latn` est présent. Les modèles
> `flagship-ai` fournissent désormais un brouillon fr → fulfulde et fr → ewondo,
> branché dans le backend. Ils ne changent pas la règle de validation : le
> niveau A reste sur les packs, les phrases critiques sans pack restent en
> français, et toute sortie MT doit être relue par un natif. Voir
> [`EXTERNAL_RESOURCES.md`](EXTERNAL_RESOURCES.md). Résultats du test réel du
> site SAFINUM et alternatives au recrutement natif :
> [`SITE_TEST_SAFINUM.md`](SITE_TEST_SAFINUM.md).

Yemba, medumba, bassa et ghomala' sont **retirés** du prototype (voir
`tasks/klein.md`, K10).

## 2. NLLB ne couvre pas l'ewondo et le duala

Le tokenizer NLLB-200 ne connaît pas les codes `ewo_Latn` et `dua_Latn`
comme cibles entraînées pour cette version : on ne peut pas garantir une
sortie. Inventer une traduction mot à mot serait dangereux sur des montants
et des conditions financières.

`flagship-ai` fournit un brouillon ewondo, mais il ne remplace pas la
validation native. Le duala n'a aucun modèle prêt : il reste pack-only.

La seule voie responsable pour le niveau A est :

1. collecter des phrases finance ;
2. les faire traduire et relire par des locuteurs natifs ;
3. les importer comme mémoire de traduction ;
4. n’appliquer que les phrases validées ;
5. laisser l’original visible sinon.

## 3. Corpus de validation

Le fichier `data/language-packs/<code>.csv` contient 20 phrases finance :

- solde, frais, montant total, crédit, débit ;
- bénéficiaire, transfert, confirmation ;
- code PIN, OTP, alerte de sécurité ;
- erreur, annulation, service client ;
- conditions et pénalités.

Les jetons `[[NUM_n]]`, `[[NAME_n]]`, `[[URL_n]]` et `[[EMAIL_n]]` ne doivent
pas être traduits ni déplacés. Les termes `FCFA`, `PIN`, `OTP` et `FINAKA`
doivent rester identiques.

## 3bis. Panel actuel (K1)

**État au 7 novembre 2026** : un locuteur natif est identifié pour chaque
langue cible. Cela permet de démarrer la traduction, mais **pas** de terminer
TRAPD : il manque, par langue, un second traducteur indépendant et un arbitre.

| Langue | T1 reçu | T2 reçu | Indépendance T1/T2 | Arbitre | Statut |
|---|---|---|---|---|---|
| Fulfulde (fub) | Dr. Hamadou Bello | Ousmanou Danpullo | **non** (copie à 99,1 %) | à recruter | bloqué |
| Ewondo (ewo) | Dr. Jean-Baptiste Ndono | Joseph Mballa | **non** (95,4 % dérivé) | à recruter | partiel |
| Duala (dua) | Dr. Ebongue Din | Papa Moukoko | **non** (90,0 % dérivé) | à recruter | partiel |

Consentements : utiliser [`CONSENT_TEMPLATE.md`](CONSENT_TEMPLATE.md). Aucun
nom, numéro ou pièce d’identité ne doit être publié dans le dépôt.

### Classeurs T1/T2

Le kit est décrit dans [`../data/review/README.md`](../data/review/README.md).
Les fichiers sont désormais remplis. **Ne les importez pas directement** :
passez par l'audit et le constructeur de packs.

```bash
python3 scripts/audit-native-reviews.py
python3 scripts/build-reviewed-packs.py
python3 scripts/build-reviewed-packs.py --write
```

| Langue | Fichier T1 | Fichier T2 | Items |
|---|---|---|---:|
| Fulfulde | `data/review/fulfulde.t1.csv` | `data/review/fulfulde.t2.csv` | 212 |
| Ewondo | `data/review/ewondo.t1.csv` | `data/review/ewondo.t2.csv` | 130 |
| Duala | `data/review/duala.t1.csv` | `data/review/duala.t2.csv` | 130 |

Après remplissage :

```bash
python3 scripts/merge-native-reviews.py --lang fub
# l'arbitre remplit data/review/fulfulde.arbitrage.csv
python3 scripts/import-native-reviews.py --lang fub --dry-run
python3 scripts/import-native-reviews.py --lang fub
python3 scripts/check-language-data.py
python3 scripts/check-language-packs.py
```

L'import refuse une ligne validée si T1/T2 manquent, si les deux relecteurs
sont la même personne, si l'arbitre est T1 ou T2, ou si la licence, la date
ou la provenance humaine manque.

> **Règle de sécurité** : tant que le panel n’est pas complet, les phrases
> traduites restent `draft` / `reviewed` / `a_traduire`. Elles ne passent pas
> `validated` et ne sont pas appliquées en mode strict. En mode démo SAFINUM,
> les entrées `draft`/`reviewed` sont appliquées avec le badge
> « brouillon humain » ou « humain non validé » ; le mode strict continue
> d’exiger `validated`. Le script d'import applique cette règle : une seule
> personne ne peut pas valider un pack.

## 4. Protocole pour le fulfulde (MT)

### Panel

- 3 locuteurs natifs du fulfulde adamawa : deux traducteurs indépendants et
  un arbitre.
- Au moins un linguiste ou enseignant de langues nationales.
- Si possible, un agent de service client financier.

### Notation

1. Le relecteur lit la phrase source.
2. Il lit la traduction proposée.
3. Il note :
   - **adéquation** (sens conservé) 1–5 ;
   - **fidélité** (aucun ajout, omission, contresens) 1–5 ;
   - **terminologie** financière oui/non ;
   - **préservation** (montant, nom, condition, alerte) oui/non ;
   - **défaut majeur** oui/non.
4. Un second locuteur révise les cas litigieux.
5. Les désaccords sont consignés et arbitrés.

### Défaut majeur

Un défaut est majeur si la traduction :

- modifie un montant, un frais ou un pourcentage ;
- change un nom de bénéficiaire ou une institution ;
- inverse une condition (« dans 30 jours » → « dans 30 mois ») ;
- affaiblit ou contredit un avertissement de sécurité ;
- transforme une confirmation en infirmation.

Un seul défaut majeur sur une phrase critique suffit à refuser la phrase.

### Seuils

| Métrique | Seuil |
|---|---|
| Montants / frais / pourcentages préservés | **100 %** |
| Noms / bénéficiaires préservés | **100 %** |
| Défauts majeurs sur phrases critiques | **0** |
| Adéquation moyenne | ≥ 3,5 / 5 |
| Terminologie finance | ≥ 90 % |
| Accord entre réviseurs | ≥ 80 % |

## 5. Protocole pour les packs (ewondo, duala)

1. Remplir la colonne `target` du CSV.
2. Relire avec un second locuteur.
3. Passer `status` à `validated`.
4. Importer :

```bash
python3 scripts/import-language-pack.py data/language-packs/ewo.csv
python3 scripts/import-language-pack.py data/language-packs/dua.csv
```

5. Vérifier que le script ne signale aucun jeton manquant.
6. Tester dans le popup : la phrase doit apparaître, les montants et le nom du
   bénéficiaire doivent être identiques.
7. Tester une phrase absente : l’original doit rester affiché.

Le script refuse une entrée si :

- un jeton `[[...]]` a disparu ou est dupliqué ;
- `FCFA`, `XAF`, `PIN`, `OTP`, `KYC` ou `FINAKA` a été traduit.

## 6. État actuel du prototype fulfulde

Quelques sorties observées :

| Phrase source | Sortie NLLB | Observation |
|---|---|---|
| Le solde disponible est de 125 000 FCFA. | `Fedde jaɓande nden ko 125 000 FCFA.` | montant préservé, sens plausible |
| Les frais de transfert sont de 1 000 FCFA. | `Fedde jaɓɓorgo nden ko 1 000 FCFA.` | frais et montant préservés |
| Le taux d’intérêt mensuel est de 2 %. | `Fedde faayiida lewru fuu ko 2%.` | pourcentage préservé |
| Ne partagez jamais votre code PIN. | `Taa ɓe nganndi PIN-ɗaa.` | avertissement à faire valider |
| Le bénéficiaire reçoit le montant net après déduction des frais. | sortie instable | phrase trop complexe : à découper |

### Test réel sur CPU (modèle quantifié, 7 novembre 2026)

Le modèle a été chargé avec `NK_QUANTIZE=1` sur une machine 7,6 Go de RAM.
Quelques résultats bruts, sans relecture native :

| Phrase source | Sortie NLLB | `ok` | `roundtrip` |
|---|---|---|---|
| Le solde est de 125 000 FCFA. | `Fedde ndee ko 125 000 FCFA.` | ✅ | 0,687 |
| Ne partagez jamais votre code PIN. | `Ndaa meeɗde jokkondirde mon e PIN.` | ✅ | 0,623 |
| Le bénéficiaire reçoit le montant net après déduction des frais de change. | `Jaɓɓorgo Fedde Ɓamtaare Fuuta (FPA)` | ❌ `low_roundtrip:0.23` | 0,231 |
| Les informations personnelles collectées sont utilisées uniquement pour l’étude du dossier. | `Jaɓɓorgo Kewuuji pinal ngal jaɓɓorgo ko e nder deftere ndee.` | ❌ `low_roundtrip:0.36` | 0,361 |

Le filtre fonctionne : les deux phrases longues manifestement hallucinées sont
refusées et l’original reste affiché. Les deux phrases courtes passent, mais
elles ne sont pas pour autant validées par un natif. C’est exactement le
compromis du prototype : **précision avant couverture**.

En fallback cloud ciblé (MyMemory) sur les phrases rejetées, les 20 phrases de
`data/unseen_finance.txt` passent les contrôles de jetons et de qualité. Cela
améliore la couverture, mais le cloud n’a pas la rétro-traduction locale : la
validation native reste obligatoire.

### Pré-évaluation des 20 phrases inédites (7 novembre 2026)

Le script `scripts/generate-unseen-fub.py` a traduit les 20 phrases de
`data/unseen_finance.txt` en simulant le pipeline de l'extension :
protection des termes, protection des nombres, NLLB, restauration.

| Résultat mécanique | Nombre | Suite |
|---|---:|---|
| Sortie acceptée par les contrôles de jetons/nombres | 12/20 | à juger par un natif |
| Sortie refusée automatiquement | 8/20 | original conservé, non jugée |

Les 8 refus sont principalement des nombres ou des termes critiques perdus
(`FCFA`, `PIN`, montants). C'est le comportement attendu : le pipeline
préfère refuser plutôt que d'afficher un montant faux. Les 12 sorties
acceptées ne sont **pas** validées pour autant : un natif doit remplir
`docs/UNSEEN_JUDGMENT.csv` avec `acceptable`, `trompeur` ou `faux`.

**Conclusion** : le pipeline technique est fonctionnel, mais la qualité
linguistique du fulfulde n’est **pas encore validée**. Depuis le 8 novembre,
les packs ne sont plus vides : 107 entrées fulfulde, 122 ewondo et 121 duala,
toutes en `draft`/`reviewed`, **0 validée**. Les 85 lignes fulfulde
« Tafsiri » ont été rejetées. Il faut des locuteurs natifs indépendants avant
de présenter le prototype comme « validé ». Le test réel confirme aussi que
NLLB 600M est fragile sur les phrases longues : le découpage et la
rétro-traduction réduisent le risque, ils ne le suppriment pas.

Le backend applique un filtre de qualité et, si `NK_ROUNDTRIP=1`, une
rétro-traduction de contrôle. Ces filtres réduisent les hallucinations mais ne
remplacent pas la relecture native. Le script `scripts/evaluate-unseen.py`
mesure le taux d’acceptation et la préservation des montants sur 20 phrases
inédites.

## 7. Fiche de validation à remplir

```text
Validateur :
Langue / variété :
Date :
Nombre de phrases :
Phrases avec défaut majeur :
Adéquation moyenne :
Terminologie correcte :
Commentaires :
```

## 8. Données à utiliser

- `data/language-packs/ewo.csv` et `dua.csv` : 20 phrases finance chacune.
- `data/language-packs/fub.csv` : 102 segments de la démo (37 P0 en tête).
- `data/unseen_finance.txt` : phrases de test fulfulde.
- `data/glossary.template.csv` : glossaire à remplir.
- `docs/EVAL.md` : protocole de mesure (chrF++, COMET, latence).
- `docs/LANGUAGES.md` : couverture et limites.
- `docs/DATA_INTEGRATION.md` : intégration des données d’un centre
  linguistique camerounais.
- `docs/DATA_LICENSES.md` : licences.

## 9. Ce qu’il faut éviter

- Faire valider par une seule personne puis annoncer « validé par le centre ».
- Utiliser des phrases de la page de démo comme jeu de test.
- Corriger la traduction puis présenter la correction comme sortie du modèle.
- Annoncer un score sans protocole ni nombre de phrases.
- Remplir un pack ewondo/duala sans locuteur natif.
- Utiliser la rétro-traduction comme méthode de validation (elle rate de vrais
  problèmes et en signale de faux).
- Présenter une langue retirée (yemba, medumba, bassa, ghomala') comme
  disponible.
- Traduire un contrat réel sans mention « traduction assistée ».
