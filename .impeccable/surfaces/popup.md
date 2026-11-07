# Surface — Popup extension

**Mode** : Operate
**Format** : 380 px de large, ~426 px de haut ; 600 px maximum.
**Objectif** : ouvrir, lire la langue cible, lancer la traduction de la page,
vérifier l'état, restaurer. Le test de texte est secondaire.

## Concept

Une **console de traduction**, pas une page de vente : barre supérieure
compacte, titre d'action, rail `Source → Cible`, bouton noir, statut, section
de test repliée. Fond blanc, gris neutre, monochrome. Pas de serif,
pas de crème, pas d'or, pas de carte décorative : l'icône porte la marque.

## Contraintes

- Garder les contrôles existants : langue, traduire la page, restaurer,
  traduire la sélection, tester un texte, cloud, statut, confidentialité.
- Pas de nouvelle fonctionnalité, pas de nouveau réglage, pas de nouvelle
  promesse.
- Le parcours principal tient sans scroll ; le test peut s'ouvrir.
- Une seule action primaire pleine largeur.
- Le cloud reste une option secondaire.
- Arrondis cohérents : 10 px pour le rail et la liste, 8 px pour le bouton,
  6 px pour les contrôles, icône 7 px.
- Aucune animation décorative ; seuls les états peuvent bouger.

## Premier écran

1. Barre : icône, NkapLingua, paire `FR/EN → FF` en mono.
2. Titre « Traduire cette page » + sous-titre.
3. Rail : cellule Source `FR/EN`, cellule Cible avec `<select>`.
4. Ligne `MT:`/`PACK:` + état de la langue.
5. Bouton primaire noir « Traduire la page ».
6. Deux actions secondaires : Restaurer, Traduire la sélection.
7. Statut en texte simple, rouge en erreur ; pas de point.
8. « Tester un texte » replié.
9. Pied : Local · pseudonymisé / Confidentialité.

## Critères de succès

- Langue cible et action primaire visibles en moins de deux secondes.
- Aucun scroll pour traduire/restaurer.
- Les états MT, pack, erreur et cloud sont compréhensibles.
- Le clavier atteint tous les contrôles ; le focus est visible.
- Le popup reste lisible à 380 px et se centre dans une page large.
