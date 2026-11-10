# Audit structurel des 583 entrées — 10 novembre 2026

**Objet** : regarder comment les entrées existantes sont construites, sans
prétendre les valider nativement.

Fichier complet : [`entry-audit-582.csv`](../data/review/entry-audit-582.csv).
Banque de phrases : [`sentence-bank-50.csv`](../data/review/sentence-bank-50.csv).
Kit : [`native-kit.csv`](../data/review/native-kit.csv).

## Volumes

| Langue | Entrées | Draft | Reviewed | Validated |
|---|---:|---:|---:|---:|
| Fulfulde | 185 | 185 | 0 | **0** |
| Ewondo | 199 | 197 | 2 | **0** |
| Duala | 199 | 199 | 0 | **0** |
| **Total** | **583** | **581** | **2** | **0** |

## Structure

- **Libellés courts** : 407 entrées (≤3 mots, sans ponctuation) ;
- **Phrases** : 161 entrées (ponctuation) ;
- **Questions** : quelques-unes, à relire séparément ;
- **Négations** : 13 entrées ;
- **Possessifs** : 19 entrées ;
- **Cibles identiques** : 16 entrées — uniquement des noms, codes, jetons et
  montants (`Amina Ngo Bell`, `code PIN`, `[[NUM_0]] FCFA`). **Ce ne sont pas
  des erreurs.**
- **Cibles plus longues que la source** : 9 entrées (ewondo 5, duala 4) ;
  explications possibles, à relire.

## Ce que l'audit ne dit pas

Il ne dit **pas** si une phrase est naturelle ou du mot à mot. Pour le savoir,
il faut un locuteur. Les drapeaux `libelle`, `phrase`, `negation`, `possessif`
sont des catégories de relecture, pas des fautes.

## Comparaison Duala / Helmlinger

`duala-helmlinger-comparison.csv` recherche la première forme cible dans la
couche texte de Helmlinger 1972. **59 / 199** ont une correspondance de chaîne.
Une absence ne prouve pas une erreur : la couche texte ne couvre pas tout le
dictionnaire, et l'orthographe peut différer. Aucune correction automatique
n'a donc été faite.

## Décision

- **0 correction nouvelle** : aucune erreur assez nette pour être corrigée sans
  natif ;
- les 16 identiques sont volontaires ;
- les 9 cibles longues et les 13 négations sont prioritaires pour la relecture ;
- rien n'est passé en `validated`.

## Limites de l'extraction Helmlinger / Pichon

- Helmlinger : **5 entrées vérifiées** (`moní`, `bank`, `lóma`, `kusa`,
  `bekusedi`) à partir de la couche texte ; le reste du lexique français-duala
  est scanné. Impossible de sortir 50–100 entrées fiables sans OCR + relecture.
- Pichon : **11 entrées vérifiées** ; le PDF est un scan de 16 pages. Le reste
  demande OCR et normalisation orthographique.
- Les 50 phrases par langue sont donc des **phrases existantes** des packs et
  du site, pas 50 nouvelles phrases inventées.
