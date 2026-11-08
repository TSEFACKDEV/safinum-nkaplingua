# Conformité au SAFINUM Innovate Challenge 2026

Ce document confronte le prototype NkapLingua au règlement officiel du
**Hackathon Preselection Challenge**.

## 1. Fonctionnalités minimales attendues

| Exigence officielle | Statut | Preuve / remarque |
|---|---|---|
| 1. Adaptation de la langue de l’interface | ✅ / ⚠️ | Extension Manifest V3 ; fulfulde et ewondo en MT brouillon, duala en pack. **Packs encore vides (0/102, 0/20, 0/20)** : le parcours validé reste à remplir par les natifs |
| 2. Parcours financier : solde, frais, transfert | ✅ | Page FINAKA : solde, frais, formulaire de transfert, récapitulatif |
| 3. Préservation des montants, frais, bénéficiaires, conditions, alertes | ✅ / ⚠️ | Jetons `[[NUM_n]]` et `[[NAME_n]]`, contrôle des termes critiques, refus si un jeton manque ; phrases niveau A bloquées si le pack n’est pas validé ; qualité linguistique à valider |
| 4. Fonctionnement sans modifier le code source | ✅ | Injection à l’exécution, aucun changement serveur, toggle original ; le cloud est opt-in et désactivé par défaut |
| 5. Adaptation à un nouveau contenu | ✅ / ⚠️ | Popup « texte inédit », traduction de sélection et d’attributs ; qualité `flagship-ai`/NLLB variable sur les phrases longues, packs limités aux phrases validées |

## 2. Grille d’évaluation (100 points)

| Critère | Poids | Auto-évaluation | Commentaire |
|---|---:|---|---|
| Fonctionnalité du prototype | 25 | 20–23 | Le pipeline fonctionne ; la qualité native doit être validée |
| Intégration et indépendance | 20 | 18–20 | Aucune modification du site ; `activeTab` + `scripting` |
| Sécurité et préservation des informations | 20 | 17–19 | Pseudonymisation des noms, contrôle des jetons, local prioritaire ; cloud opt-in désactivé par défaut |
| Accessibilité et expérience utilisateur | 15 | 12–14 | Choix de 3 langues, détection affichée, toggle original, `lang`, popup natif ; pas encore de lecture audio |
| Adaptation à un nouveau contenu | 10 | 7–9 | Oui, mais dépend de la qualité `flagship-ai`/NLLB sur phrases longues ; packs limités aux phrases validées |
| Faisabilité technique et documentation | 10 | 9–10 | README, doc technique, doc langues, doc d’intégration, licences, CI |
| **Total indicatif** | **100** | **objectif 80+** | Sous réserve de la validation native et du remplissage des packs ; auto-évaluation, pas une note du jury |

> Ces notes sont une auto-évaluation, pas une note du jury.

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
- [ ] L’extension fonctionne sans backend en mode pack (packs 0/102 et 0/20 à
  remplir) ; le cloud expérimental est opt-in, jamais automatique.
- [ ] Le backend local est lancé si l’on veut le mode 100 % local.
- [ ] Une langue en mode pack affiche l’original si la phrase n’est pas validée.

Limites connues :

- pas de support des iframes cross-origin ;
- pas de support des shadow DOM fermés ;
- pas de traduction des images/canvas ;
- qualité `flagship-ai`/NLLB variable sur les phrases longues ;
- les packs fulfulde, ewondo et duala sont vides tant que le panel TRAPD ne les remplit pas ;
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
  brouillon non validé, le duala un pack de phrases validées.
- « Aucune erreur possible » : le contrôle de sûreté réduit le risque, il ne
  l’élimine pas.
- « Production ready » : c’est un prototype de hackathon.
