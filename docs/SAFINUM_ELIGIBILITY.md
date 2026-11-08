# Éligibilité SAFINUM — auto-évaluation

**Date** : 8 novembre 2026  
**Référence** : PDF officiel « PRESELECTION EPREUVE SAFINUM INNOVATE
CHALLENGE En » (section 8, critères sur 100 points).

> Le PDF officiel ne fixe **ni seuil de qualification ni quota**. Le
> pourcentage ci-dessous est donc un **score de préparation**, pas une
> probabilité officielle de sélection.

---

## 1. Score selon les 6 critères officiels

| Critère officiel | Poids | Note | Points | Justification |
|---|---:|---:|---:|---|
| Prototype functionality | 25 | 23 | **23** | Parcours 5/5 étapes testé en fulfulde ; 3 langues sur le premier écran ; montants et référence préservés ; duala laisse 3 libellés visibles. |
| Integration capabilities and independence | 20 | 20 | **20** | Extension navigateur, aucun changement du code du site, `activeTab`, content script injecté à la demande. |
| Security and preservation of financial information | 20 | 19 | **19** | Jetons, contrôle des nombres, niveau A strict, aucune donnée de formulaire, tests de confidentialité. -1 : MT de démonstration sur le nouveau contenu critique. |
| Accessibility and user experience | 15 | 11 | **11** | Popup 3 langues, badges, restauration, sélection, toast. -4 : pas de test avec des personnes peu alphabétisées ; 3 libellés duala restent en français. |
| Adaptation to new content | 10 | 6 | **6** | Nouveau texte traité en fulfulde/ewondo, mais qualité MT faible ; duala sans MT reste en français avec badge. |
| Technical feasibility and documentation | 10 | 9 | **9** | Architecture, tests, CI, PDF 9 pages, limites documentées. -1 : vidéo non vérifiée, asset PDF de release non remplacé. |
| **Total brut** | **100** |  | **88** |  |

**Pénalité linguistique prudente : -10.**  
**Score prudent : 78/100.**

Pourquoi -10 : 0 ligne `validated`, 85 lignes fulfulde « Tafsiri » rejetées,
4 libellés duala non couverts, et le nouveau contenu critique MT est
sémantiquement faible. Ces éléments ne sont pas dans la grille chiffrée, mais
le PDF précise que la qualité linguistique fait l’objet d’une évaluation
spécifique et que les défauts majeurs peuvent peser sur la qualification.

---

## 2. Conditions minimales

| Exigence | État | Commentaire |
|---|---|---|
| 1. Adaptation de la langue de l’interface | ✅ | 3 langues, 5 étapes, titre, attributs, options. |
| 2. Parcours financier | ✅ | Solde, frais, bénéficiaire, récapitulatif, confirmation. |
| 3. Préservation des informations | ✅ | Montants, frais, référence, noms ; tests automatiques. |
| 4. Fonctionnement sans modifier le service | ✅ | Extension, injection, aucun changement serveur. |
| 5. Adaptation à un nouveau contenu | ⚠️ | Techniquement oui ; qualité MT faible ; duala pack-only. |

**Conclusion minimum** : **5/5 capacités démontrées**, avec une réserve
qualité sur la 5e.

---

## 3. Livrables

| Livrable | État |
|---|---|
| Description du problème et de la solution | ✅ |
| Prototype fonctionnel / démonstration reproductible | ✅ |
| Vidéo de démonstration ≤ 3 min | ⚠️ **à confirmer / enregistrer** |
| Document technique (architecture, dépendances, limites) | ✅ PDF 9 pages, 1,2 Mo |
| Langues supportées + méthode de validation | ✅ documenté (TRAPD), mais **validation non terminée** |
| Divulgation des composants tiers | ✅ `docs/DATA_LICENSES.md`, `docs/EXTERNAL_RESOURCES.md` |
| Règles de sécurité (données fictives, pas de transaction réelle) | ✅ |

---

## 4. Estimation d’éligibilité

| Scénario | Estimation |
|---|---:|
| Vidéo + PDF soumis, prototype démontré, pas de surpromesse | **75–85 %** |
| En plus, 4 libellés duala et un T2 indépendant | **85–90 %** |
| Si la validation native est un prérequis éliminatoire | **50–60 %** |
| Si la vidéo manque | **< 50 %** |

**Point estimate : 78 %.**

Ce chiffre est une **auto-évaluation de préparation**, pas une garantie. Le
jury peut valoriser fortement un prototype qui fonctionne sur le site imposé,
ou au contraire sanctionner l’absence de validation native.

---

## 5. Ce qui ferait gagner les 10–15 points manquants

1. **Enregistrer la vidéo de 3 minutes** avec le parcours fulfulde complet :
   solde → frais → bénéficiaire → récapitulatif → confirmation, puis
   restauration.
2. **Montrer les badges** : « brouillon humain », « démo MT », « non traduit ».
   C’est une preuve de sérieux, pas une faiblesse cachée.
3. **Faire traduire les 4 libellés duala** de
   `data/site-officiel/messages-gaps.csv`.
4. **Obtenir un T2 indépendant + un arbitre** pour passer les phrases critiques
   de `draft` à `validated`.
5. **Remplacer l’asset PDF de release** par la version du 8 novembre.
6. **Ne pas montrer le nouveau contenu critique MT comme une réussite** : le
   montrer avec le badge « démo MT » et expliquer la limite.

---

## 6. Verdict

- **Éligibilité technique** : très bonne (prototype fonctionnel, intégration
  indépendante, sécurité des montants).
- **Éligibilité linguistique** : fragile (0 validation native, 4 libellés
  duala, nouveau contenu MT approximatif).
- **Estimation globale** : **78 %**, avec une fourchette de **75–85 %** si la
  vidéo et le PDF sont soumis dans les temps.

La priorité n’est plus le code : c’est la **vidéo**, le **PDF de release** et
les **4 libellés duala**.
