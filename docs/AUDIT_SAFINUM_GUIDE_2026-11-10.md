# Audit spécial — conditions du guide SAFINUM

**Source officielle** : <https://safinum.cm/hackathon-test/guide>
**Date** : 10 novembre 2026
**Produit audité** : `develop` (`8ef16d7`), extension chargée sur la page de test
**Objet** : mesurer le prototype contre les **critères officiels sur 100 points**
et dire ce qu'il faut financer/modifier pour viser le meilleur résultat.

> **Ce n'est pas la note du jury.** C'est une estimation interne, à partir du
> protocole publié et de tests reproductibles. Le jury note indépendamment.

---

## 1. Les conditions officielles

Le guide impose un parcours en **cinq étapes** : solde/tableau de bord, frais,
bénéficiaire, récapitulatif, reçu/alertes. Il exige aussi :

- une page **non modifiée**, sans hook ni API fournie ;
- la gestion du **contenu injecté après chargement** ;
- la préservation des **montants, frais, totaux, téléphones, références et noms** ;
- des **alertes de sécurité** claires ;
- une **navigation clavier**, des contrastes et des libellés compréhensibles ;
- aucune collecte/stockage/transmission des données affichées.

### Barème officiel

| Critère | Points |
|---|---:|
| Fonctionnement du prototype | **25** |
| Fidélité des traductions | **20** |
| Sécurité et intégrité financière | **20** |
| Intégration aux services existants | **15** |
| Accessibilité et expérience utilisateur | **10** |
| Innovation et pertinence | **10** |
| **Total** | **100** |

La **vérification linguistique** est notée séparément. Défauts majeurs signalés :
contresens sur une action (envoyer/confirmer/annuler), montant/frais/total
modifié, alerte de sécurité affaiblie, nom/numéro/référence traduit, interface
inutilisable ou texte tronqué.

---

## 2. Ce que le test officiel a donné

Harnais : [`tests/guide.e2e.js`](../tests/guide.e2e.js), Chrome réel, extension
non modifiée (seule permission d'hôte ajoutée pour l'automatisation), page
`https://safinum.cm/hackathon-test`.

Preuve : [`guide-2026-11-10T21-26-29-155Z.json`](test-results/guide-2026-11-10T21-26-29-155Z.json).

| Condition du guide | Résultat |
|---|---|
| Page normale, aucun hook `data-i18n` | **OK** (`hooks=0`) |
| 5 étapes / stabilité | **OK**, 188/188 sur la recette complète |
| Montants préservés | **OK** |
| Références préservées | **OK** |
| Compte préservé | **OK** |
| Champs de formulaire non traduits | **OK** |
| Contenu injecté **connu** après chargement | **traduit** |
| Contenu injecté **inconnu** | **laissé en français**, pas inventé |
| Changement de langue après traduction | **retraduit** (ewondo, 41 passages) |
| Erreurs page/console | **0** |
| Collecte de données | **aucune** (tests privacy) |

Le point crucial : le jury peut injecter du texte. Ici, un texte connu est
traduit ; un texte inconnu reste en français. C'est **honnête**, mais ce n'est
pas une traduction complète de l'inconnu.

---

## 3. Estimation sur 100

| Critère | Points | Justification |
|---|---:|---|
| Fonctionnement du prototype | **22 / 25** | 5 étapes, 188/188, dynamique connu, erreurs gérées ; Firefox non rejoué ; inconnu non traduit |
| Fidélité des traductions | **8 / 20** | **0 phrase validée**, 0 correspondance exacte en ligne, 2 corrections, 4 dates EN, candidat ewondo |
| Sécurité et intégrité | **19 / 20** | Montants/compte/références/champs préservés, alertes conservées, 0 erreur ; sémantique non validée |
| Intégration | **14 / 15** | Page non modifiée, sans hook, contenu dynamique ; plafond 180 passages |
| Accessibilité / UX | **8 / 10** | Clavier, contraste, cibles 44 px, popup FR/EN ; toasts de page en français, lecteur d'écran non testé |
| Innovation / pertinence | **8 / 10** | 3 langues camerounaises, pack + MT, provenance ; validation native absente |
| **Total estimé** | **79 / 100** | **Bon prototype, pas encore “meilleur”** |

**Fourchette honnête : 75–82/100.** Le haut de la fourchette dépend de la
lecture des packs par le jury ; le bas, de la vérification linguistique.

### Défauts majeurs : risque actuel

- **Contresens sur une action** : non validé nativement ; `Reference` et `Total`
  ont été corrigés, mais `Facture électricité` reste un candidat éditorial.
- **Montant/frais/total modifié** : les tests disent **non** (valeurs intactes).
- **Alerte de sécurité affaiblie** : les alertes sont préservées, mais leur
  clarté n'est pas validée par un natif.
- **Nom/numéro/référence traduit** : les tests disent **non**.
- **Interface inutilisable/tronquée** : popup 461 px, test 667 px, scroll
  maîtrisé ; plafond 180 passages signalé.

---

## 4. Où mettre l'argent pour être meilleur

### Priorité 1 — panel natif (le seul gros gain)

**Achat** : 2 traducteurs indépendants + 1 arbitre par langue, avec un
terminologue finance. Faire relire en priorité :

1. les actions : envoyer, confirmer, annuler, continuer, restaurer ;
2. les montants, frais, total, solde, plafond ;
3. les alertes de sécurité et les erreurs ;
4. les 20 phrases inédites ;
5. les 188 libellés du parcours.

**Gain attendu** : **+9 à +12 points** (fidélité 8 → 17–20 ; sécurité 19 → 20),
et suppression du risque « défaut majeur ».
**Sans ça, le plafond réaliste est ~82/100.**

### Priorité 2 — contenu dynamique / inédit

**Achat** : un jeu de 50 à 100 phrases finance injectées, relues par les mêmes
natifs, puis un test d'injection automatisé.
**Gain** : +1 à +2 points, surtout sur l'intégration et la confiance.
**Sans ça**, le jury qui injecte une phrase inconnue verra du français.

### Priorité 3 — QA navigateur et accessibilité

**Achat** : un test Firefox réel, un audit clavier/lecteur d'écran, un test de
contraste et de zoom. **Gain** : +1 à +2 points et moins de risque de régression.
**Coût relatif** : faible ; à faire avant le panel si le temps manque.

### Priorité 4 — niveau “best”

- localiser aussi les **toasts de page** (pas seulement le popup) ;
- supprimer/limiter le plafond 180 ou l'expliquer visuellement ;
- ajouter un **reçu de traduction** (ce qui a changé, ce qui est resté en français) ;
- refaire la vidéo/PDF/release avec les chiffres du jour.

### Ce qu'il ne faut PAS acheter

- **plus de langues** : hors périmètre, aucun point au barème ;
- **audio/TTS** : pas demandé par le guide ;
- **nouveau modèle générique** : NLLB seul est à 31/192 ; le pack + validation
  est plus rentable ;
- **refonte visuelle** : le popup est déjà propre ; le risque est linguistique ;
- **publicité** : aucun effet sur la note.

---

## 5. Scénarios d'investissement

### Scénario A — “sprint 72 h” (recommandé pour le hackathon)

- 3 langues × (2 relecteurs + 1 arbitre) ;
- 188 libellés + 40 termes + 20 inédits ;
- 1 terminologue finance ;
- livrable : statuts `validated`, preuves, rapport de défauts.
- **Cible : 88–92/100**, sous réserve du temps de relecture.

### Scénario B — “deux semaines, meilleur”

- panel A + 100 phrases inédites + test Firefox + audit accessibilité +
  localisation des toasts ;
- **Cible : 90–94/100**.
- C'est le bon niveau pour viser le podium, pas seulement “ça marche”.

### Scénario C — “programme 6 semaines”

- panel permanent, corpus licencié, suivi des régressions, monitoring ;
- utile pour un produit réel, **surdimensionné pour le hackathon**.

**Répartition du budget** : ~70 % validation native, ~15 % QA/tests, ~10 %
accessibilité, ~5 % release/démo. Le modèle et le design ne sont pas le goulot.

---

## 6. Modifications encore nécessaires

1. **P0** : passer les actions/alertes/montants critiques de `draft` à
   `validated`, avec deux relecteurs et un arbitre.
2. **P0** : tester 50–100 phrases inconnues ; conserver le français + badge
   quand le pack ne couvre pas, jamais inventer.
3. **P1** : Firefox réel et audit lecteur d'écran.
4. **P1** : localiser les toasts de page en FR/EN.
5. **P2** : plafond 180 visible, reçu de traduction, release/PDF à jour.
6. **P2** : CI GitHub à remettre (le token actuel n'a pas le scope `workflow`).

---

## 7. Verdict

**Le prototype est solide, mais il n'est pas encore “le meilleur”.**
Il gagne sur le fonctionnement, la sécurité des valeurs et l'intégration ; il
perd sur la **fidélité linguistique** et la **validation native**. Avec de
l'argent, le meilleur investissement n'est pas un nouveau modèle ni une refonte :
c'est un **panel natif court, ciblé sur les actions, les montants et les alertes**,
puis un test d'injection inédite.

**Sans panel : ~79/100. Avec panel + QA : ~90/100.**
Le reste est de la finition, pas de la magie.
