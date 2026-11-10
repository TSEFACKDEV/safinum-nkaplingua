# Test de l’extension installée — 9 novembre 2026

**Site** : <https://safinum.cm/hackathon-test>  
**Paquet** : `dist/package/chrome`
**Backend** : NLLB + `flagship-ai`, cloud désactivé (voir
[`REAL_TEST_2026-11-09.md`](REAL_TEST_2026-11-09.md)).

> Ce document remplace le test du 8 novembre qui annonçait 43/0 sans nommer le
> backend. Les chiffres ci-dessous sont reproductibles avec la commande
> documentée.

---

## 0. Assemblage Marius / Freedy

```text
origin/marius        ancêtre de HEAD : 0 commit unique
origin/freedy        ancêtre de HEAD : 0 commit unique
origin/design/popup  ancêtre de HEAD : 0 commit unique
```

Leur travail est déjà intégré dans le paquet testé.

## 1. Installation

- Chromium/Chrome for Testing 156, extension non empaquetée.
- Service worker `NkapLingua — SAFINUM 2026` actif.
- Popup : **3 langues** (fulfulde, ewondo, duala), boutons « Traduire la
  page », « Restaurer », « Traduire la sélection ».
- Le paquet de production utilise `activeTab` : un clic sur l’icône est
  nécessaire. Pour automatiser le parcours, une copie de test avec
  `https://safinum.cm/*` dans `host_permissions` a été utilisée.
- Le paquet de production a aussi été chargé séparément pour vérifier le
  popup et le refus du niveau A en mode strict.

## 2. Premier écran

| Langue | Traduits | Pack | MT critique | Non traduits | Français visible |
|---|---:|---:|---:|---:|---:|
| Fulfulde | **39/39** | 19 | 0 | 0 | 0 |
| Ewondo | **39/39** | 19 | 0 | 0 | 0 |
| Duala | **39/39** | 19 | 0 | 0 | 0 |

Le compte `CM 001 2345 6789 01` est préservé avec ses espaces, le titre est
traduit, les montants restent intacts.

## 3. Parcours fulfulde

**5/5 étapes** : solde, frais, bénéficiaire, récapitulatif, confirmation.

- montants : `250 000`, `25 000`, `0`, `225 000`, `12 500`, `180 000`,
  `50 000`, `7 500 FCFA` ;
- référence `SAF-2026-…` et bénéficiaire `Jean-Paul Mbarga` conservés ;
- boutons actifs, 0 erreur page ;
- restauration du titre et de la page : OK.

## 4. Nouveau contenu

`Le solde est de 25 000 FCFA.` → `Jawdindi ko 25 000 FCFA.`

- montant préservé ;
- mention unique « brouillons non validés » en bas de page ;
- entrée de pack, pas de MT sur ce cas.

## 5. Bascule EN

- titre traduit en fulfulde ;
- corps partiellement couvert par la mémoire bilingue FR/EN des packs
  (**14/44** au harnais, 0 erreur page) ;
- la couverture EN n’est pas annoncée comme complète.

## 6. Popup de production

- 3 langues listées.
- Un texte critique (`Le solde est de 25 000 FCFA.`) est **refusé en strict**
  avec le message « aucun pack validé ».
- Un texte non critique est traité.
- Les messages d’erreur distinguent désormais `low_roundtrip`, `token_lost`,
  `too_short`/`too_long`/`repetitive` et `dnt_missing`.

## 7. Limites

- 0 entrée `validated`.
- Les packs contiennent des brouillons humains et éditoriaux ; les entrées
  éditoriales sont marquées comme telles. La page affiche une seule mention
  discrète, pas une pastille par phrase.
- Le test automatisé utilise une permission d’hôte de test.
- La couverture EN est partielle.
