# Éligibilité SAFINUM — auto-évaluation au 9 novembre 2026

**Référence officielle** : PDF « PRESELECTION EPREUVE SAFINUM INNOVATE
CHALLENGE En », section 8 (6 critères, 100 points).

> Le PDF ne fixe ni seuil ni quota. Les pourcentages ci-dessous sont des
> **scores de préparation**, pas des probabilités officielles.

---

## 1. Deux scénarios, deux mesures

| Scénario | Étape 1 | 5 étapes | Titre EN | Score |
|---|---:|---:|---|---:|
| **NLLB seul** (audit Freedy, 8 nov.) | 6/44 | 31/192 | non traduit | **~74/100** |
| **Packs + flagship-ai** (test du 9 nov.) | 39/39 | 5/5, 0 non traduit | traduit | **~82/100 prudent** |

Le chiffre **88/78** du 8 novembre n’est plus utilisé : il ne nommait pas le
backend. Le test du 9 novembre est documenté avec commande, paquet et
résultat JSON dans [`REAL_TEST_2026-11-09.md`](REAL_TEST_2026-11-09.md).

---

## 2. Score de la stack packs + flagship

| Critère officiel | Poids | Points | Justification |
|---|---:|---:|---|
| Prototype functionality | 25 | 24 | 5/5 étapes, 3 langues, 0 texte français visible au premier écran. |
| Integration / independence | 20 | 20 | Extension, aucun changement du site, `activeTab`. |
| Security / preservation | 20 | 19 | Montants, compte avec espaces, noms, référence, jetons. -1 : 0 validation native. |
| Accessibility / UX | 15 | 12 | Popup 3 langues, badges, restauration. -3 : pas de test avec des personnes peu alphabétisées. |
| Adaptation to new content | 10 | 8 | Gabarit éditorial pour le solde ; texte totalement inconnu encore fragile ; EN partiel. |
| Technical feasibility / documentation | 10 | 9 | Docs, tests, CI, PDF. -1 : vidéo et asset PDF de release à finaliser. |
| **Total technique** | **100** | **92** |  |
| **Pénalité linguistique** |  | **-10** | 0 `validated`, packs humains/éditoriaux, EN partiel. |
| **Score prudent** | **100** | **82** |  |

## 3. Conditions minimales

| Exigence | État |
|---|---|
| 1. Adaptation de la langue | ✅ 3 langues, 5 étapes, titre, attributs. |
| 2. Parcours financier | ✅ Solde, frais, bénéficiaire, récapitulatif, confirmation. |
| 3. Préservation | ✅ Montants, compte, noms, référence, jetons. |
| 4. Sans modifier le service | ✅ Extension navigateur. |
| 5. Nouveau contenu | ✅ pour le cas testé ; ⚠️ pour un texte réellement inconnu. |

## 4. Livrables

| Livrable | État |
|---|---|
| Description / problème | ✅ |
| Prototype / démo reproductible | ✅ |
| Vidéo ≤ 3 min | ⚠️ **à enregistrer** |
| Document technique | ✅ PDF 9 pages |
| Langues + méthode de validation | ✅ documenté ; validation non terminée |
| Divulgation des composants | ✅ |
| Règles de sécurité | ✅ |

## 5. Estimation de passage

| Scénario | Estimation |
|---|---:|
| Stack packs + flagship, vidéo + PDF soumis | **80–88 %** |
| Stack NLLB seul | **60–70 %** |
| Validation native exigée comme prérequis | **50–60 %** |
| Vidéo absente | **< 50 %** |

**Point estimate : 82 %.**

## 6. Ce qui ferait gagner les derniers points

1. Enregistrer la vidéo de 3 minutes avec le parcours fulfulde complet.
2. Remplacer l’asset PDF de release.
3. Faire relire les entrées `editorial` (duala, fub, ewo) par un locuteur.
4. Obtenir un T2 indépendant et un arbitre pour passer des `draft` aux
   `validated`.
5. Améliorer la couverture EN (14/44 actuellement).

## 7. Verdict

La stack **packs + flagship** est la démonstration à montrer : 39/39 au
premier écran dans les trois langues, 5/5 étapes, 0 texte français visible,
montants et compte préservés. Elle est techniquement solide mais **aucune
entrée n’est validée par un natif indépendant**. C’est le risque principal.
