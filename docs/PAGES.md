# Démo publique — GitHub Pages

## URL officielle

**https://tsefackdev.github.io/safinum-nkaplingua/demo/** — **200**, vérifiée
le 14 novembre 2026.

Le workflow `.github/workflows/pages.yml` publie `demo/` sous `/demo/` et
ajoute une redirection racine vers `/demo/`.

## Pourquoi le 404 précédent

GitHub Pages était désactivé sur le dépôt (API `pages` : 404). Après activation
par un admin (`Settings → Pages → GitHub Actions`), le premier déploiement a
échoué car l'environnement `github-pages` n'autorisait que `main` et `gh-pages`.
Le job `deploy` n'utilise plus cet environnement protégé : OIDC + `pages: write`
suffisent, et `develop` peut déployer.

## URL de secours

**https://markitchi.github.io/nkaplingua-demo/demo/** reste disponible en cas
d'indisponibilité de Pages.

## Vérification

```bash
curl -sS -o /dev/null -w '%{http_code}\n' \
  https://tsefackdev.github.io/safinum-nkaplingua/demo/
```
