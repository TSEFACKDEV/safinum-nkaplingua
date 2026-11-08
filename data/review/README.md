# Kit de traduction native — NkapLingua 0.6

Ce dossier contient les classeurs à remettre aux traducteurs et à l’arbitre
du panel **TRAPD** pour le fulfulde (`fub`), l’ewondo (`ewo`) et le duala
(`dua`).

> **État au 8 novembre 2026** : les classeurs T1/T2 ont été reçus et remplis.
> L'audit a trouvé **85 lignes fulfulde « Tafsiri: »** qui recopient le
> français, et T2 est identique à T1 sur 210/212 lignes. En ewondo et duala,
> T2 dérive de T1 (95,4 % et 90,0 %). **Aucune ligne n'est validée.**
> Ne pas importer les classeurs directement : lancer
> `scripts/audit-native-reviews.py` puis `scripts/build-reviewed-packs.py`.
> Détails : [`../../docs/NATIVE_REVIEW_AUDIT.md`](../../docs/NATIVE_REVIEW_AUDIT.md).

## 1. Fichiers

| Fichier | Rôle |
|---|---|
| `fulfulde.t1.csv` | traducteur 1 fulfulde |
| `fulfulde.t2.csv` | traducteur 2 fulfulde, à remplir **sans voir** T1 |
| `ewondo.t1.csv`, `ewondo.t2.csv` | idem pour l’ewondo |
| `duala.t1.csv`, `duala.t2.csv` | idem pour le duala |
| `unseen_judgment.csv` | jugement des 20 phrases inédites (évaluation) |
| `manifest.json` | nombres de lignes, priorités, empreintes des sources |

Les fichiers T1 et T2 étaient **identiques au départ**. Ils sont maintenant
remplis, mais l'audit montre que T2 a vu T1 dans les trois langues. Pour une
vraie validation TRAPD, il faut un nouveau T2 réalisé **sans voir** T1, puis
un arbitre distinct.

## 2. Volume et priorités

| Langue | Items | P0 | P1 |
|---|---:|---:|---:|
| Fulfulde | 212 | 90 | 122 |
| Ewondo | 130 | 73 | 57 |
| Duala | 130 | 73 | 57 |

Chaque classeur mélange trois types d’items :

- `glossaire` : 40 termes finance ;
- `message` : 70 messages du site officiel (35 niveau A, 35 niveau B) ;
- `phrase` : 20 phrases de pack (ewondo/duala) ou 102 phrases de la page
  (fulfulde, dont les 37 premières en P0).

**Commandes de sécurité** :

```bash
python3 scripts/audit-native-reviews.py
python3 scripts/build-reviewed-packs.py          # simulation
python3 scripts/build-reviewed-packs.py --write  # écrit les packs
```

**Commencer par les lignes `P0`.** Elles couvrent le solde, les frais, le
total, le PIN/OTP, les erreurs, la confirmation et la sécurité. Le niveau A
n’est jamais traduit automatiquement : sans validation, l’extension laisse le
texte original et affiche « non traduit ».

## 3. Comment remplir

1. Ouvrir le CSV dans un tableur (UTF-8).
2. Ne modifier **que** les colonnes :
   - `target` : la traduction ;
   - `commentaire` : une note si un mot est ambigu, emprunté ou régional ;
   - `reviewer` : votre nom public ou pseudonyme ;
   - `reviewed_at` : la date au format `AAAA-MM-JJ` ;
   - `license` : `CC0-1.0` ou `CC-BY-4.0`.
3. Ne pas modifier `item_id`, `source_fr`, `source_en`, `contexte`,
   `consigne`, `provenance`.
4. Laisser `provenance=human` : aucune machine translation n’est acceptée
   dans un pack validé.

### Exemple

```csv
item_id,type,priorite,source_fr,...,target,commentaire,reviewer,reviewed_at,license,provenance
G01,glossaire,P0,solde disponible,...,<votre traduction>,,<nom>,2026-11-10,CC-BY-4.0,human
```

## 3bis. Références externes

Pour le glossaire, un navigateur de liens est disponible dans
[`../reference/glossary-links.csv`](../reference/glossary-links.csv) :
Glosbe, Webonary, Resulam et archives SIL Cameroon, terme par terme.

Règles :

- ces liens servent à **comprendre** le sens, pas à copier ;
- Glosbe est sous CC BY-NC-SA, Resulam et Webonary ne donnent pas de licence
  libre : aucun contenu ne doit être recopié dans le pack ;
- écrivez votre propre traduction et notez l’URL consultée dans
  `commentaire` si elle a aidé ;
- l’arbitre vérifie que la traduction est humaine et originale.

Audit complet : [`../../docs/REFERENCE_SOURCES.md`](../../docs/REFERENCE_SOURCES.md).

## 4. Termes à ne jamais traduire

Recopier exactement :

- `FCFA`, `XAF`, `FINAKA` ;
- `PIN`, `OTP`, `KYC` ;
- les jetons `[[NUM_0]]`, `[[NAME_0]]`, `[[URL_0]]`, `[[EMAIL_0]]` ;
- les noms propres et les marques.

Un montant, un nom de bénéficiaire ou un avertissement de sécurité ne doit
jamais être modifié. En cas de doute, laisser l’item sans traduction et
l’expliquer dans `commentaire`.

## 5. Licence et consentement

Chaque traducteur et chaque arbitre choisit :

- **CC0-1.0** : domaine public ;
- **CC-BY-4.0** : attribution obligatoire.

La licence est inscrite dans la colonne `license`. Le consentement écrit est
à signer avec [`../../docs/CONSENT_TEMPLATE.md`](../../docs/CONSENT_TEMPLATE.md).
Sans consentement, l’item ne peut pas entrer dans le pack.

## 6. Retour et arbitrage

1. T1 et T2 remplissent leurs fichiers séparément.
2. L’organisateur lance :

```bash
python3 scripts/merge-native-reviews.py --lang fub
python3 scripts/merge-native-reviews.py --lang ewo
python3 scripts/merge-native-reviews.py --lang dua
```

Cela produit `<langue>.arbitrage.csv` avec les deux propositions, l’accord et
les désaccords.

3. L’arbitre remplit `decision`, `statut` (`valide` ou `rejete`), `arbitre`,
   `date` et `license`.
4. L’organisateur importe :

```bash
python3 scripts/import-native-reviews.py --lang fub --dry-run
python3 scripts/import-native-reviews.py --lang fub
```

Le script refuse une validation si :

- T1 ou T2 manque ;
- T1 et T2 sont la même personne ;
- l’arbitre est T1 ou T2 ;
- la date ou la licence manque ;
- un jeton ou un terme critique a été modifié.

5. Vérifier :

```bash
python3 scripts/check-language-data.py
python3 scripts/check-language-packs.py
python3 scripts/check-evolution.py
```

### Jugement des 20 phrases inédites

Le fichier `unseen_judgment.csv` se remplit séparément : le natif lit
`source_fr`, `candidate_fub` et remplit `verdict_fub` avec `acceptable`,
`trompeur` ou `faux`, puis `commentaire_fub`, `reviewer_fub` et `date_fub`.
Ensuite :

```bash
python3 scripts/import-unseen-judgment.py --dry-run
python3 scripts/import-unseen-judgment.py
python3 scripts/check-language-data.py
```

### Mode « un seul natif disponible »

Si un seul natif peut travailler dans l'immédiat, ses propositions peuvent
être conservées comme **brouillons** :

```bash
python3 scripts/import-draft-kit.py --lang fub --dry-run
python3 scripts/import-draft-kit.py --lang fub
```

Le script remplit les cibles avec `statut=en_cours` (ou `draft` pour les
phrases) et **ne passe jamais une ligne en `validated`**. L'extension continue
d'afficher l'original. C'est un moyen de ne pas perdre le travail en attendant
T2 et l'arbitre.

## 7. Ce qui reste à faire

- [ ] Recruter T2 et l’arbitre pour le fulfulde.
- [ ] Recruter T2 et l’arbitre pour l’ewondo.
- [ ] Recruter T2 et l’arbitre pour le duala.
- [ ] Faire signer les consentements.
- [ ] Remplir les P0 en premier.
- [ ] Faire le prétest avec 5 à 8 personnes peu alphabétisées.
- [ ] Remplir `docs/VALIDATION_REPORT.md`.

Tant que ces cases ne sont pas cochées, les packs restent vides et
l’extension conserve le texte original. C’est le comportement attendu par le
règlement SAFINUM : mieux vaut ne pas traduire que modifier un montant ou une
alerte de sécurité.

## 8. Contact et délai

- Responsable données : Klein.
- Canal : à compléter hors dépôt public.
- Date cible : à compléter.
- Ne jamais publier de numéro de téléphone, d’adresse ou de pièce d’identité
  dans ce dépôt.
