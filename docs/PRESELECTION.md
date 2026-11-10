# NkapLingua — dossier de présélection

## 1. Identification

- **Nom du projet** : NkapLingua
- **Hackathon** : SAFINUM Innovate Challenge 2026
- **Langues cibles** : fulfulde adamawa (`fub`) et ewondo (`ewo`) en pack + MT
  brouillon ; duala (`dua`) en pack de brouillons non validés. **0 phrase
  validée** à ce jour. Trois langues retenues pour leurs corpus de parole et
  leurs ressources documentaires ; yemba, medumba, bassa et ghomala' retirés du
  prototype.
- **Plateforme** : extension navigateur Chrome/Edge/Firefox (Manifest V3)
- **Moteur** : `flagship-ai` (Marian/CTranslate2, brouillon fr → fulfulde et
  fr → ewondo), NLLB-200 en secours pour le fulfulde ; pack pour le duala
- **Données** : corpus open data Adamawa Fulfulde–French (NOODL-1.0), références
  de l’OLC/ERDELAP et des comités de langues, glossaire finance à valider

## 2. Problème

Les services financiers numériques camerounais sont majoritairement en français
ou en anglais. Les utilisateurs qui ne maîtrisent pas ces langues ne comprennent
pas toujours :

- les frais de transfert ;
- les conditions de crédit ;
- les alertes de sécurité ;
- les pénalités de retard ;
- les procédures de vérification d’identité.

Les traducteurs généralistes ne connaissent pas la terminologie financière et
peuvent modifier un montant, un numéro de compte ou un avertissement.

## 3. Solution

Une extension qui ajoute une **couche de traduction réversible** à n’importe
quelle page financière, sans intégration côté site.

L’utilisateur :

1. ouvre sa page mobile money ou sa banque ;
2. clique sur NkapLingua ;
3. choisit la langue cible ;
4. lit la page traduite ;
5. peut revenir à l’original à tout moment.

Le site source n’est jamais modifié. Aucune ligne de code n’est ajoutée au
serveur de la banque.

## 4. Réponse aux exigences

| Exigence | Réponse NkapLingua |
|---|---|
| Extension navigateur | Manifest V3, Chrome/Edge |
| Au moins une langue | Fulfulde `fub` + ewondo `ewo` en MT brouillon ; duala `dua` en pack |
| Page financière ou autre | Pipeline DOM générique + page de démo FINAKA |
| Sans modifier le contexte | Segmentation par bloc, glossaire, préservation des entités |
| Sans modifier le site source | Injection à l’exécution, rendu réversible |
| Contenu inédit | `flagship-ai`/NLLB + test en direct dans le popup |
| Sécurité plateforme | `activeTab`, pas de code distant, CSP verrouillée |
| Sécurité utilisateur | Pas de mots de passe/OTP/cookies, backend local |
| Orientation finance | Frais, crédit, épargne, alertes, KYC ; phrases critiques jamais en MT |
| Données du centre | OLC/ERDELAP et comités cités ; pipeline `docs/DATA_INTEGRATION.md` |
| Licences | `flagship-ai` CC BY-NC/CC BY, NLLB CC BY-NC 4.0, corpus NOODL, Common Voice CC0 |

## 5. Architecture

```text
Page financière
   │
   ▼
content.js
   ├─ TreeWalker : texte visible uniquement
   ├─ exclusions : inputs, password, OTP, code, pre
   ├─ pseudonymisation : nombres, URLs, emails
   ├─ traduction par lots
   └─ rendu réversible
   │
   ▼
background.js
   ├─ cache
   └─ appel 127.0.0.1:8000
   │
   ▼
server/app.py
   ├─ flagship-ai (brouillon) + NLLB secours
   ├─ post-contrôle des jetons
   └─ refus si un montant/entité change
```

## 6. Sécurité

- `activeTab` : pas d’accès permanent à tous les sites.
- Aucune lecture des valeurs de formulaire.
- Aucun cookie, token ou header d’authentification transmis.
- Backend local, sans journalisation du texte.
- Montants, numéros, URLs et emails remplacés par des jetons avant traduction.
- Si un jeton manque, la traduction est refusée et l’original conservé.
- UI en Shadow DOM, texte injecté via `textContent`, jamais `innerHTML`.
- Aucun code distant, aucune évaluation dynamique.

## 7. Données et licences

- **Modèles** : `flagship-ai/cameroon-int8` (CC BY-NC 4.0, sous-fiche ewondo
  CC BY 4.0) et `facebook/nllb-200-distilled-600M` (CC BY-NC 4.0), usage
  non commercial pour le hackathon. Les modèles fp32 fulfulde/bulu sont
  CC BY 4.0.
- **Corpus d’évaluation** : Adamawa Fulfulde–French Parallel Corpus of
  Narratives 1.2, licence NOODL-1.0, Mozilla Data Collective.
- **Audio optionnel** : Common Voice Adamawa Fulfulde, CC0.
- **Centre linguistique** : publications utilisées comme référence
  orthographique et terminologique ; aucune donnée redistribuée sans licence.
- **Glossaire finance** : à remplir et valider par le panel TRAPD (trois natifs par langue).

## 8. Démonstration prévue

1. Page FINAKA fictive : solde, transfert, frais, crédit, alerte PIN.
2. Traduction de la page en fulfulde.
3. Vérification que les montants et numéros sont intacts.
4. Retour à l’original.
5. Texte inédit collé par le jury → traduction en direct.
6. DevTools : une seule requête vers `127.0.0.1:8000`.
7. Présentation du dossier de licences.

## 9. Plan 48 heures

### Jour 1 — matin (0–6 h)

- figer la langue et le périmètre ;
- télécharger le modèle et le corpus ;
- lancer le backend ;
- charger l’extension ;
- tester la page de démo.

### Jour 1 — après-midi (6–12 h)

- remplir 40 termes du glossaire avec le panel TRAPD ;
- tester 20 phrases finance ;
- corriger les problèmes de segmentation ;
- vérifier les montants, numéros et URLs.

### Jour 1 — soir (12–18 h)

- améliorer le rendu (latence, batches, cache) ;
- ajouter le mode bilingue pour les termes sensibles ;
- préparer 3 phrases de secours validées.

### Jour 2 — matin (18–24 h)

- évaluation sur 50 phrases inédites ;
- corriger les cas d’échec ;
- vérifier la sécurité (DevTools, permissions) ;
- enregistrer une vidéo de secours.

### Jour 2 — après-midi (24–30 h)

- répétition du pitch ;
- répétition de la démo ;
- vérifier le dossier de licences ;
- préparer les réponses aux questions du jury.

## 10. Risques et plans B

| Risque | Plan B |
|---|---|
| Modèle lent sur CPU | `NK_MOCK=1` pour l’UX + 3 phrases validées |
| Qualité insuffisante | mode bilingue + validation native + fallback original |
| Corpus non téléchargeable | utiliser 50 phrases finance écrites pour l’évaluation |
| Page qui casse | utiliser la page de démo, pas un vrai site |
| Question sur la licence | montrer `docs/DATA_LICENSES.md` |
| Jury demande une autre langue | expliquer le language pack, ne pas improviser |

## 11. Ce que nous demandons aux organisateurs

- Confirmation que la langue est libre.
- Accès éventuel à un lexique finance validé par le centre linguistique.
- Précision sur l’usage commercial des données du centre.
- Critères de notation détaillés.

## 12. Phrase de fin

> **NkapLingua ne traduit pas seulement des mots : elle rend les frais, les
> conditions et les alertes compréhensibles, sans toucher au site et sans
> exposer les données de l’utilisateur.**
