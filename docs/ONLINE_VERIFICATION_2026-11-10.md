# Vérification en ligne des packs — 10 novembre 2026

**Objet** : chercher si les traductions des packs existent déjà en ligne, et
voir si elles **correspondent**. Ce n’est **pas** une validation native : c’est
une vérification documentaire.

**Méthode** : recherche des cibles exactes, puis des lemmes français dans des
dictionnaires publics ; comparaison manuelle. Aucune donnée n’est copiée dans
les packs. Les sources sont utilisées comme références, pas comme corpus
d’entraînement.

---

## 1. Sources consultées

- **Webonary — Fulfulde Burkina Faso**, index français-fulfulde :
  <https://www.webonary.org/fulfuldeburkina/files/Fran%C3%A7ais-Fulfulde-index.pdf>
- **Glosbe** fr→fuv, fr→ewo, fr→dua :
  <https://glosbe.com/fr/fuv/solde>, <https://glosbe.com/fr/ewo/solde>,
  <https://glosbe.com/fr/dua/solde>
- **Lexique duala** (archive 2014) :
  <https://web.archive.org/web/20140619122858/http://duala.kazeo.com/lexique-duala/lexique-duala,r84555.html>
- **Wörterbuch der Duala-Sprache** (archive) :
  <https://archive.org/stream/wrterbuchderdu00dinkuoft/wrterbuchderdu00dinkuoft_djvu.txt>
- **Orthographe ewondo** (PDF) :
  <https://fundaciobofill.cat/uploads/docs/m/y/4/o/p/7/a/f/9/e0006_0.pdf>
- Audit des sources : [`REFERENCE_SOURCES.md`](REFERENCE_SOURCES.md).

> Limite majeure : le Webonary est du **fulfulde du Burkina**, pas de
> l’Adamawa. Une absence ne prouve pas qu’un mot est faux ; elle prouve
> seulement qu’il n’est pas attesté dans cette source. Glosbe est une
> mémoire communautaire, pas une autorité.

---

## 2. Fulfulde — résultats

| Source | Cible du pack | Ce que dit la source | Verdict |
|---|---|---|---|
| Solde disponible | `Jawdindi ndi yami` | Aucune entrée « solde » ni « jawdindi » | **Non attesté** |
| Frais de transfert | `Njoɓdi nawgol` | `njoɓdi` apparaît (`njoɓdi golle`) ; pas `nawgol` | **Partiel** : racine connue, composition non attestée |
| Total | `fof` | Webonary : `total` = **`kawral`** ; `fof` n’est pas « total » | **Divergent** |
| Reference | `Tiinde` | Webonary : `tiinde` = boîte / chaîne / chance | **Divergent** |
| Compte | `Asaaku` | Webonary : `compte` = **`limngal`** ; `asaaku` absent | **Divergent / non attesté** |
| Bénéficiaire | `Keɓoowo` | Aucune entrée | **Non attesté** |
| Retrait | `yaltugol kaalis` | Webonary : `retrait` = `jaɓtugol` | **Descriptif, non attesté** |
| Dépôt | `naatgol kaalis` | Webonary : `dépôt` = `limgal` / `battaare` / `tolmaade` | **Descriptif, non attesté** |
| Sécurité | `Kisal` | Aucune entrée « kisal » (seulement `nakkisal`) | **Non attesté** |
| Code de confirmation | `code teeŋtingol` | Aucune entrée | **Non attesté** |

**Points chauds** : `total → fof` et `Reference → Tiinde` sont les deux
divergences les plus nettes. Ils sont affichés sur le site et dans la vidéo
potentielle. À faire relire en priorité.

---

## 3. Ewondo — résultats

Aucune entrée financière trouvée dans Glosbe pour `solde` et `frais` ; la
source PDF ewondo consultée est une orthographe, pas un lexique finance.

| Source | Cible du pack | Verdict |
|---|---|---|
| Solde disponible | `Abálá é ne ngə́lə́` | **Non attesté** |
| Frais de transfert | `Mákyé má nkus` | **Non attesté** |
| Compte courant | `Kɔ́ndó courant` | **Hybride français** : `courant` non traduit |
| Reference | `Eñíŋlé` | **Non attesté** |
| Sécurité | `Ɔ́bám` | **Non attesté** |
| Bénéficiaire | `Mòd á nnyɔ́ŋ` | **Non attesté** |

La couverture du site est bonne, mais **aucun de ces libellés finance n’est
confirmé par une source en ligne**. Le pack reste un brouillon humain.

---

## 4. Duala — résultats

Le lexique duala de 2014 confirme :

- `argent` = **`môni`** ; `banque` = **`bank`** ;
- `compter` = `sôngèlè` ;
- pas de `solde`, `frais`, `transfert`, `compte` comme entrées finance.

| Source | Cible du pack | Ce que dit la source | Verdict |
|---|---|---|---|
| Solde disponible | `Mɔ̀nì mwé ɓáyí` | `môni` = argent ; pas l’expression complète | **Partiel** |
| Frais de transfert | `Móǹgá mwá lómò mɔ̀nì` | Glosbe donne `ebo̱tibo̱ti` pour « frais » (source incertaine, mention Sango) | **Non concordant** |
| Compte courant | `Kompa a ɓoso` | `compte` absent ; `kompa` n’est pas dans le lexique | **Non attesté** |
| Reference | `Nombara a lómo mɔ̀nì` | `nombara` est un emprunt ; pas d’entrée « référence » | **Partiel / emprunt** |
| Sécurité | `Bata` | Aucune entrée | **Non attesté** |
| Bénéficiaire | `Moto nu mányɔ̀ŋɔ̀` | `moto` = personne ; composition non attestée | **Partiel** |

---

## 5. Bilan

| Catégorie | Nombre (échantillon 16) |
|---|---:|
| Correspondance exacte trouvée en ligne | **0** |
| Racine / lemme partiellement attesté | 4 |
| Divergence nette avec un dictionnaire | 2 (`total`, `Reference`) |
| Aucune attestation trouvée | 10 |

**Conclusion** : la recherche en ligne **ne valide pas** les packs. Elle
confirme quelques racines (`môni`, `bank`, `njoɓdi`) et signale deux
traductions suspectes. Elle ne remplace ni le T2 indépendant ni l’arbitre.

## 6. Corrections appliquées

- `total → kawral` (source `import/fub.csv` + pack).
- `Reference → Limre` (source + pack).
- `Facture électricité → Mákyé má mwinda` en ewondo : **candidat éditorial
  non sourcé**, ajouté pour couvrir le site ; à confirmer par un natif.
- Aucun statut `validated` ajouté.

## 6bis. Apport Pichon 1950

Le PDF `Pichon_1950_Dico_ewondo.pdf` est un scan de 16 pages (grammaire +
lexique ewondo-français + français-ewondo). 11 entrées utiles ont été
extraites dans `data/lexicon/ewondo-pichon-1950.csv` : `payer → yan`,
`monnaie → mvakəma`, `envoyer → lom`, `recevoir → bɛ́lɛ́`, `refuser → tɛ́b`,
`traduire → timi`, `affaire → dzam`, `caisse → ewôli`, `lumière → mfyé`,
`nombre → taŋ`, etc.

Ce sont des **attestations de 1950**, pas des validations natives modernes.
L'orthographe doit être normalisée et les termes finance modernes
(banque, solde, facture, sécurité, total, transfert) n'y sont pas.

## 7. Actions

1. Faire relire en priorité `total → fof` et `Reference → Tiinde`.
2. Vérifier `Compte → Asaaku` face au terme `limngal` du Webonary ; trancher
   la variété (Burkina vs Adamawa).
3. Documenter la source de chaque entrée `editorial` ; ne pas la présenter
   comme validée.
4. Ajouter une colonne `online_attestation` (oui / partiel / non) dans le kit
   natif, sans la confondre avec `status=validated`.
5. Ne pas utiliser Glosbe comme corpus d’entraînement (CC BY-NC-SA) ; référence
   manuelle uniquement.
