# Installer NkapLingua

## Chrome / Edge / Brave / Chromium

1. Dézipper le fichier.
2. Ouvrir `chrome://extensions`.
3. Activer **Mode développeur**.
4. Cliquer sur **Charger l’extension non empaquetée**.
5. Sélectionner le dossier qui contient `manifest.json`.
6. Épingler **NkapLingua** et ouvrir une page financière.
7. Choisir la langue cible dans le popup, puis **Traduire cette page**.

## Firefox

1. Dézipper le fichier.
2. Ouvrir `about:debugging#/runtime/this-firefox`.
3. Cliquer sur **Charger un module temporaire…**.
4. Sélectionner `manifest.json`.

## Langues

- **Fulfulde (Adamawa)** : traduction automatique locale.
- **Ewondo et duala** : packs de phrases validées. Une phrase absente du pack
  reste en français ; c’est volontaire.

Le popup affiche le statut de chaque langue. Les packs ewondo et duala, vides
au départ (`0/20`), doivent être remplis par des locuteurs natifs :
`data/language-packs/<code>.csv`, puis
`python3 scripts/import-language-pack.py ...`.

## Fonctionnement

L’extension essaie d’abord un backend local sur `127.0.0.1:8000`.
S’il n’est pas disponible, elle utilise le service cloud **MyMemory** avec du
texte pseudonymisé (montants, URLs, emails et noms de bénéficiaires remplacés
par des jetons).

Aucune valeur de formulaire, aucun mot de passe, aucun code PIN et aucun cookie
ne sont lus ou transmis. Les langues en mode pack ne contactent aucun service
cloud.

## Mode 100 % local

Pour un traitement entièrement local, lancer le backend fourni dans le dépôt :

```bash
cd server
NK_DEVICE=cpu .venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000
```

L’extension détecte automatiquement le backend et l’utilise en priorité.

## Dépannage

- **« Impossible d’injecter le script »** : la page est probablement
  `chrome://`, une page de réglages, un PDF ou le Chrome Web Store. Ouvrir une
  page web classique.
- **« Service de traduction indisponible »** : lancer le backend local ou
  vérifier la connexion Internet pour le mode cloud.
- **« Phrase absente du pack »** : la phrase n’a pas encore été validée pour
  cette langue. Utiliser le fulfulde ou compléter le pack.
