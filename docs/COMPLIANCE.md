# Conformité au SAFINUM Innovate Challenge 2026

Ce document confronte le prototype NkapLingua au règlement officiel du
**Hackathon Preselection Challenge**.

## 1. Fonctionnalités minimales attendues

| Exigence officielle | Statut | Preuve / remarque |
|---|---|---|
| 1. Adaptation de la langue de l’interface | ✅ / ⚠️ | Extension MV3 et 3 langues. **Stack packs + flagship (9 nov) : 39/39 au premier écran dans les 3 langues, 0 non traduit, parcours 5/5.** Repli NLLB seul : 31/192 sur 5 étapes. Packs 182/195/196 entrées, **0 validée**. |
| 2. Parcours financier : solde, frais, transfert | ✅ | Page FINAKA : solde, frais, formulaire de transfert, récapitulatif |
| 3. Préservation des montants, frais, bénéficiaires, conditions, alertes | ⚠️ | Jetons `[[NUM_n]]`/`[[NAME_n]]` et refus si jeton perdu. **Défauts réels : numéro de compte `CM 001 2345 6789 01` → `CM 001 23456789 01` ; `Amina` → `amina`**. À corriger avant de promettre la préservation. |
| 4. Fonctionnement sans modifier le code source | ✅ | Injection à l’exécution, aucun changement serveur, toggle original ; le cloud est opt-in et désactivé par défaut |
| 5. Adaptation à un nouveau contenu | ⚠️ | Popup « texte inédit », sélection et attributs. **NLLB réel : 1/20 en production, 4/20 en démo ; 31/192 sur 5 étapes ; titre EN non traduit**. |

## 2. Grille d’évaluation (100 points)

| Critère | Poids | Auto-évaluation | Commentaire |
|---|---:|---|---|
| Fonctionnalité du prototype | 25 | **14–17** | Pipeline solide, mais **31/192 segments** sur les 5 étapes (6/44 à l’étape 1) et 1/20 en production : la démo complète ne fonctionne pas. |
| Intégration et indépendance | 20 | 18–20 | Aucune modification du site ; `activeTab` + `scripting` |
| Sécurité et préservation des informations | 20 | **14–17** | Pseudonymisation et jetons solides, mais numéro de compte et casse du nom altérés sur le site réel. |
| Accessibilité et expérience utilisateur | 15 | 12–14 | Choix de 3 langues, détection affichée, toggle original, `lang`, popup natif ; pas encore de lecture audio |
| Adaptation à un nouveau contenu | 10 | **4–6** | Oui techniquement, mais la qualité NLLB réelle est insuffisante sur les phrases financières. |
| Faisabilité technique et documentation | 10 | **8–9** | Documentation riche, mais plusieurs chiffres antérieurs (12/20, 66/71) ne sont pas reproduits ; l’audit du 8 nov corrige. |
| **Total indicatif** | **100** | **70–83, réaliste ~74** | Auto-évaluation après audit réel ; pas une note du jury. |

> Ces notes sont une auto-évaluation, pas une note du jury.

## 2bis. Audit d’exécution du 8 novembre 2026

Le test réel `https://safinum.cm/hackathon-test` + extension + NLLB donne :

| Mesure | Résultat |
|---|---:|
| Segments traduits, étape 1 | **6 / 44** |
| Segments traduits, 5 étapes | **31 / 192** |
| Segments laissés en français, 5 étapes | **161** |
| Phrases inédites acceptées, production | **1 / 20** |
| Phrases inédites acceptées, démo | **4 / 20** |
| Erreurs page/console | **0** |
| Restauration | OK à 1,5 s ; contrôle instable à 0,8 s |

Détails et preuves : [`AUDIT_2026-11-08.md`](AUDIT_2026-11-08.md).

**Conséquence pour la soutenance** : ne pas promettre une page entièrement
traduite. Démontrer un paragraphe court, le popup, la restauration et les
garde-fous ; annoncer clairement les 31/192 (6/44 à l’étape 1) et les 1/20/4/20.

## 3. Livrables attendus

| Livrable | Statut | Fichier |
|---|---|---|
| Description de la solution et du problème | ✅ | `README.md`, `docs/PRESELECTION.md` |
| Prototype fonctionnel / démonstration reproductible | ✅ | `extension/`, `server/`, `demo/` |
| Vidéo de démonstration ≤ 3 minutes | ✅ | `NkapLingua-Demo.mp4` (2 min 19) + `docs/VIDEO_SCRIPT.md` |
| Document technique : architecture, intégration, dépendances, limites | ✅ | `docs/TECHNICAL.md` |
| Langue(s) supportée(s) + méthode de validation | ✅ / ⏳ | `docs/LANGUAGE_VALIDATION.md`, `docs/LANGUAGES.md` ; validation native à compléter |
| Intégration des données linguistiques | ✅ | `docs/DATA_INTEGRATION.md`, `scripts/import-language-pack.py` |

## 4. Environnement de test imposé

Le jury fournira une interface financière simulée commune. Le prototype doit
donc fonctionner sur une page qu’il n’a pas conçue.

Points à vérifier le jour J :

- [ ] L’extension s’injecte sur l’interface fournie (page web classique).
- [ ] Les textes principaux sont détectés (pas seulement la page FINAKA).
- [ ] Les montants et numéros restent identiques.
- [ ] Le bouton « Restaurer l’original » fonctionne.
- [ ] Un message nouveau ajouté par le jury est traduit.
- [ ] Les attributs `title`, `aria-label`, `placeholder`, `alt` sont traduits.
- [ ] Un nom de bénéficiaire est préservé et tokenisé.
- [ ] L’extension fonctionne sans backend en mode pack (packs 182/195/196, 0 validée, à
  valider) ; le cloud expérimental est opt-in, jamais automatique.
- [ ] Le backend local est lancé si l’on veut le mode 100 % local.
- [ ] Une langue en mode pack affiche l’original si la phrase n’est pas validée.

Limites connues :

- pas de support des iframes cross-origin ;
- pas de support des shadow DOM fermés ;
- pas de traduction des images/canvas ;
- qualité `flagship-ai`/NLLB variable sur les phrases longues ;
- les packs fulfulde, ewondo et duala n’ont **aucune phrase validée** tant que le panel TRAPD ne les remplit pas ;
- sans pack validé, les phrases critiques restent en français ;
- l’interface doit être une page web (pas une application mobile native).

## 5. Règles de sécurité

| Règle | Respect |
|---|---|
| Ne pas utiliser de vrais comptes bancaires | ✅ page FINAKA fictive |
| Ne pas collecter/transmettre de données personnelles | ✅ local prioritaire ; cloud avec texte pseudonymisé |
| Ne pas contourner les mécanismes de sécurité | ✅ aucune modification du site |
| Préserver montants, frais, bénéficiaires, confirmations | ✅ jetons NUM/NAME + contrôle ; noms hors déclencheur à surveiller |
| Divulguer les outils et composants tiers | ✅ `docs/DATA_LICENSES.md`, `docs/TECHNICAL.md` |
| Respecter la propriété intellectuelle | ✅ licences documentées ; NLLB et bundle flagship CC BY-NC pour le hackathon |

## 6. Actions prioritaires avant soumission

0. **Réduire la promesse de démo** : 31/192 sur les 5 étapes, 1/20 en production ; ne pas annoncer une page complète.

1. **Faire valider les phrases finance par le panel TRAPD (3 natifs par langue).**
2. **Remplir les packs fulfulde, ewondo et duala** avec le panel TRAPD.
3. **Tester le ZIP universel sur Chrome et Firefox, sans backend local.**
4. **Tester la tokenisation des noms et la traduction des attributs.**
5. **Enregistrer la vidéo de 3 minutes** selon `docs/VIDEO_SCRIPT.md`.
6. **Tester sur une page que l’équipe n’a pas écrite** (autre site de démo).
7. **Vérifier que le backend démarre sur une machine propre** (ou fournir une
   vidéo de secours).
8. **Mettre à jour `docs/LANGUAGE_VALIDATION.md`** avec les résultats réels.

## 7. Ce qu’il ne faut pas promettre

- « 100 % de précision » : faux et non mesuré.
- « Toutes les langues du Cameroun » : le prototype couvre le fulfulde et
  l’ewondo en MT brouillon, le duala en pack, pas les 280 langues du pays.
- « Traduction automatique validée ewondo/duala » : faux ; l’ewondo est un
  brouillon non validé, le duala un pack humain non validé.
- « Aucune erreur possible » : le contrôle de sûreté réduit le risque, il ne
  l’élimine pas.
- « Production ready » : c’est un prototype de hackathon.
- « La page du site est traduite » : 31/192 segments sur les 5 étapes, 6/44 à l’étape 1.
- « 12/20 phrases inédites acceptées » : chiffre historique non reproduit ; 1/20 en production, 4/20 en démo.
