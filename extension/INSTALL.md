# Installer NkapLingua

## Chrome / Edge / Brave / Chromium

1. Dézipper le fichier.
2. Ouvrir `chrome://extensions`.
3. Activer **Mode développeur**.
4. Cliquer sur **Charger l’extension non empaquetée**.
5. Sélectionner le dossier qui contient `manifest.json`.
6. Épingler **NkapLingua** et ouvrir une page financière.

## Firefox

1. Dézipper le fichier.
2. Ouvrir `about:debugging#/runtime/this-firefox`.
3. Cliquer sur **Charger un module temporaire…**.
4. Sélectionner `manifest.json`.

## Fonctionnement

L’extension essaie d’abord un backend local sur `127.0.0.1:8000`.
S’il n’est pas disponible, elle utilise le service cloud **MyMemory** avec du
texte pseudonymisé (montants, URLs et emails remplacés par des jetons).

Aucune valeur de formulaire, aucun mot de passe, aucun code PIN et aucun cookie
ne sont lus ou transmis.

## Mode 100 % local

Pour un traitement entièrement local, lancer le backend fourni dans le dépôt :

```bash
cd server
NK_DEVICE=cpu .venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000
```

L’extension détecte automatiquement le backend et l’utilise en priorité.
