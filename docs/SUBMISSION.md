# Soumission — SAFINUM Innovate Challenge 2026

**Version en préparation : 0.6.0** — trois langues (fulfulde, ewondo, duala),
détection FR/EN, protection des noms et des montants, filtres de qualité.
Glossaire et packs **en cours de validation** ; cloud MyMemory expérimental et
désactivé par défaut.

La version 0.4.0 reste disponible dans l’historique des releases.

## Liens à copier dans le formulaire

### 1. Lien de la vidéo de présentation

```text
https://github.com/TSEFACKDEV/safinum-nkaplingua/releases/latest/download/NkapLingua-Demo.mp4
```

- Durée : **2 min 19** (limite : 3 min)
- Format : MP4, 1920×1080
- Contenu : problème, solution, parcours, sécurité, langue, impact

### 2. Documentation

```text
https://github.com/TSEFACKDEV/safinum-nkaplingua/releases/latest/download/NkapLingua-Documentation.pdf
```

- PDF A4, **8 pages**, ~1,33 Mo (limite : 10 Mo)
- Architecture, intégration, sécurité, langues, détection, licences, limites

### 3. Lien du dépôt GitHub

```text
https://github.com/TSEFACKDEV/safinum-nkaplingua
```

- Dépôt public
- Branches : `main`, `develop`, `klein`, `freedy`, `marius`
- CI GitHub Actions verte

### 4. Extension

```text
https://github.com/TSEFACKDEV/safinum-nkaplingua/releases/latest/download/nkaplingua-extension.zip
```

- ZIP universel **Chrome / Edge / Firefox**
- ~373 Ko (limite : 10 Mo)
- Backend local recommandé pour la démonstration ; cloud MyMemory expérimental (opt-in)
- Mode 100 % local disponible avec le backend du dépôt
- 3 langues : fulfulde en MT, ewondo et duala en packs communautaires
- Détection FR/EN, protection des montants et des noms, attributs traduits

Variantes :

```text
https://github.com/TSEFACKDEV/safinum-nkaplingua/releases/latest/download/nkaplingua-chrome.zip
https://github.com/TSEFACKDEV/safinum-nkaplingua/releases/latest/download/nkaplingua-firefox.zip
```

## Démo publique

```text
https://tsefackdev.github.io/safinum-nkaplingua/demo/
```

## Installation de l’extension

### Chrome / Edge

1. Dézipper `nkaplingua-extension.zip`.
2. Ouvrir `chrome://extensions`.
3. Activer **Mode développeur**.
4. **Charger l’extension non empaquetée**.
5. Sélectionner le dossier contenant `manifest.json`.
6. Ouvrir la démo publique et cliquer sur l’icône NkapLingua.

### Firefox

1. Dézipper le même ZIP.
2. Ouvrir `about:debugging#/runtime/this-firefox`.
3. **Charger un module temporaire…**
4. Sélectionner `manifest.json`.

## Vérifications avant envoi

- [ ] Vidéo accessible sans authentification.
- [ ] PDF accessible sans authentification.
- [ ] Dépôt public accessible.
- [ ] ZIP téléchargeable et < 10 Mo.
- [ ] Extension testée sur Chrome et Firefox.
- [ ] Démo publique accessible.
- [ ] Aucune donnée réelle dans la vidéo ou les captures.
- [ ] Le panel TRAPD (3 natifs par langue) a relu les phrases critiques.
- [ ] Les packs fulfulde, ewondo et duala sont remplis ou affichés comme
  « 0/102 » et « 0/20 ».
- [ ] Un nom de bénéficiaire est préservé.
- [ ] Les attributs `title`, `aria-label`, `placeholder`, `alt` sont traduits.

## Notes pour le jury

- L’extension fonctionne sans installation Python ; pour une démonstration fiable, lancer le backend local.
- Elle utilise le backend local s’il est disponible. Le cloud MyMemory est
  expérimental et désactivé par défaut.
- Les montants, URLs, emails et noms de bénéficiaires sont contrôlés après
  traduction.
- Les opérations sont simulées ; aucune transaction réelle.
- Le fulfulde est une baseline NLLB, à valider par un locuteur natif.
- L’ewondo et le duala ne sont pas de la traduction automatique : uniquement
  des phrases validées.
