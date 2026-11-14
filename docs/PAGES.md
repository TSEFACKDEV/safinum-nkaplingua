# Démo publique — GitHub Pages

## URL active de secours

**https://markitchi.github.io/nkaplingua-demo/demo/**

Elle sert une copie de `demo/` et répond 200 (vérifié le 14 novembre 2026).

## URL d'équipe

`https://tsefackdev.github.io/safinum-nkaplingua/demo/` répond **404** car
GitHub Pages n'est **pas activé** sur le dépôt d'équipe (API `pages` : 404).

Le workflow `.github/workflows/pages.yml` tente de publier `demo/` ; il est
volontairement inactif si Pages est désactivé, pour ne pas casser la CI.

## Réactivation (admin requis)

1. Ouvrir **Settings → Pages** du dépôt `TSEFACKDEV/safinum-nkaplingua`.
2. Source : **GitHub Actions**.
3. Relancer le workflow **Pages demo** (ou pousser sur `develop`).
4. Vérifier `https://tsefackdev.github.io/safinum-nkaplingua/demo/`.

Le workflow publie `demo/` sous `/demo/` et ajoute une redirection racine.
