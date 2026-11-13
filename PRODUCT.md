# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personnes qui utilisent le mobile money, une banque ou une microfinance au
Cameroun et qui lisent mieux le fulfulde, l'ewondo ou le duala que le français
ou l'anglais. Une partie d'entre elles est peu alphabétisée : l'interface doit
rester lisible, courte et explicite. Public secondaire : le jury SAFINUM, qui
teste l'extension sur une interface financière simulée.

## Product Purpose

NkapLingua ajoute une couche de traduction réversible à une page financière
existante, sans modifier le site source. L'utilisateur choisit sa langue,
traduit la page, vérifie que les montants et les noms sont intacts, puis peut
revenir à l'original. Le succès, c'est comprendre une opération sans changer de
site et sans exposer de données sensibles.

## Positioning

Une extension navigateur non intrusive, avec une mémoire de phrases validées
par des natifs pour les parcours critiques et un repli MT étiqueté pour le
contenu inédit. La sécurité des montants, des bénéficiaires et des
avertissements est traitée comme une contrainte produit, pas comme un détail.

## Operating Context

- L'utilisateur ouvre le popup, ou utilise le widget flottant déjà présent sur la page financière.
- Trois langues cibles : fulfulde d'Adamawa (`fub`), ewondo (`ewo`), duala
  (`dua`). Le fulfulde est en MT ; l'ewondo et le duala sont des packs de
  phrases validées.
- Deux surfaces : le popup de la barre d'outils et le widget flottant injecté
  dans la page. Pas de page d'options ni de side panel.
- Le backend local NLLB peut être présent ; le cloud MyMemory reste
  expérimental et ne doit pas être le chemin de démonstration.
- Le popup doit tenir dans une fenêtre de 380 × 600 px environ, sans scroll
  pour le parcours principal.

## Capabilities and Constraints

- Traduire la page active, restaurer l'original, traduire une sélection.
- Tester un texte inédit dans le popup ou le widget.
- Choisir la langue cible ; l'état de la langue (MT ou pack) est affiché.
- Afficher l'état de la traduction, les erreurs, le moteur utilisé et la
  détection FR/EN.
- Pseudonymiser montants, URLs, emails et noms avant l'envoi.
- Ne jamais lire les mots de passe, OTP, PIN ou valeurs de formulaire.
- Ne pas modifier le code du site cible.
- Manifest V3 Chrome/Edge/Firefox ; HTML/CSS/JS natifs, sans framework.
- Aucune fonctionnalité inventée : les contrôles existants doivent rester.

## Brand Commitments

- Nom : NkapLingua.
- Icône : monogramme « N » et arche de parole, forêt et or (`icon.svg`).
- Polices auto-hébergées : Fraunces (page éditoriale FINAKA) et Noto Sans
  (popup), sous SIL OFL.
- Le popup est une **console** : Noto Sans uniquement, fond blanc/gris,
  monochrome, bouton noir. Pas de serif, pas de crème, pas d'or dans
  l'interface ; l'icône forêt/or porte la marque.
- Le **widget flottant** reprend l'icône de l'app (forêt `#123B2E`, or
  `#C9A45C`, crème `#F8F4EC`) : launcher 48 px, CTA forêt, focus or.
  Il est déplaçable même fermé et garde sa position.
- La camerounité vient du contexte financier, des langues et de la retenue,
  pas de motifs décoratifs.

## Evidence on Hand

- `extension/popup.html`, `extension/popup.css`, `extension/popup.js`.
- `extension/widget.js` (Shadow DOM, launcher 48 px, panneau).
- `extension/content.js` pour les bulles de sélection et les toasts.
- `demo/index.html` (page FINAKA fictive) et `docs/assets/popup.png`.
- Textes réels du produit dans le README et les docs.
- Aucun témoignage, chiffre d'usage ou partenariat à afficher.

## Product Principles

1. **La tâche d'abord** : ouvrir le popup, comprendre l'action, traduire.
2. **La confiance se voit** : langues, état, montants, original accessible.
3. **Local par défaut** : le cloud est une exception explicitement choisie.
4. **Honnête sur les limites** : pack, MT, phrases non validées sont étiquetés.
5. **Assez compact pour un popup** : une seule action principale, le reste
   se déploie à la demande.

## Accessibility & Inclusion

- Contraste AA minimum, focus visible, contrôles de 44 px.
- Libellés explicites, pas seulement des placeholders.
- Lecture au clavier, `aria-live` pour les statuts et résultats.
- Public peu alphabétisé : phrases courtes, verbes d'action, pas de jargon.
- Les langues cibles et leurs caractères (`ɓ`, `ɗ`, `ƴ`, `ŋ`) doivent rester
  lisibles dans les polices auto-hébergées.
