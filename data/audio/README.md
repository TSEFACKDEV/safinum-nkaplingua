# Audio — protocole et licences

## Objectif

Enregistrer **15 phrases fulfulde sans montant** pour le lecteur audio du
parcours de démonstration. Les phrases sont dans
[`fub/phrases.csv`](fub/phrases.csv).

## Règles

- **Aucun montant fixe prononcé.** Pour un montant, l’interface dit « le
  montant affiché à l’écran » et surligne le chiffre.
- **Aucune donnée réelle** : pas de nom de client, numéro de compte ou
  transaction réelle.
- **Deux relecteurs natifs** : un enregistre, un vérifie la prononciation.
- **Consentement écrit** : voir `docs/CONSENT_TEMPLATE.md`.
- **Licence** : CC0-1.0 ou CC-BY-4.0, avec attribution si CC BY.
- **Format** : mono, 48 kHz, OGG/Opus, pièce calme.
- **Pas de voix synthétique** pour les montants ou les alertes de sécurité.

## Livrable

```text
data/audio/fub/
  phrases.csv
  index.json
  AUDIO-01.ogg
  ...
```

`index.json` reprend `index.template.json` avec les durées, relecteurs et
licences réels.

## État

- 15 phrases prêtes : oui.
- Enregistrements : **0/15**.
- Relecture : 0/15.
- Consentements : à signer.

Tant que ce n’est pas fait, le bouton « Écouter » doit rester masqué.
