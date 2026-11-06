# Tester sur Mozilla Firefox

Firefox supporte les extensions Manifest V3 depuis Firefox 109, mais **pas**
`background.service_worker`. Il utilise un **event page** avec
`background.scripts`.

Le manifest Firefox de ce projet cible **Firefox 140+**, car Mozilla exige
désormais la déclaration `data_collection_permissions`. Nous déclarons
`websiteContent` : le texte de la page est traité par le backend local, jamais
envoyé à un serveur distant.

Le dossier `extension/` est donc prévu pour Chrome. Pour Firefox, on génère un
build séparé avec le bon manifest.

## 1. Construire la version Firefox

```bash
cd /home/klein/Documents/projects/safinum-nkaplingua
./scripts/build-firefox.sh
```

Pour lancer Firefox avec l’extension temporaire directement :

```bash
./scripts/start-firefox.sh
```

Ce script utilise le binaire Snap réel et un profil dédié dans
`~/.tmp/opencode/nk-firefox-profile2`. Il ouvre la page de démo servie par
le backend (`http://127.0.0.1:8000/demo`).

Cela crée :

```text
dist/firefox/
  manifest.json
  background.js
  content.js
  popup.html
  popup.css
  popup.js
  icon-*.png
```

Le `manifest.json` de ce dossier utilise :

```json
"background": {
  "scripts": ["background.js"]
}
```

au lieu de `service_worker`.

## 2. Charger l’extension temporaire

1. Ouvrir Firefox.
2. Aller sur `about:debugging#/runtime/this-firefox`.
3. Cliquer sur **Charger un module temporaire…**
4. Choisir `dist/firefox/manifest.json`.
5. L’extension apparaît dans la liste. Cliquer sur **Inspecter** pour voir la
   console.

> Une extension temporaire est supprimée quand Firefox redémarre. Il suffit de
> la recharger pour la démo.

## 3. Lancer le backend

Le backend est le même que pour Chrome :

```bash
cd server
source .venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8000
```

Vérifier :

```bash
curl http://127.0.0.1:8000/health
```

## 4. Tester

1. Ouvrir `demo/index.html` dans Firefox.
2. Cliquer sur l’icône NkapLingua dans la barre d’outils.
3. Cliquer sur **Traduire cette page**.
4. Vérifier les montants, le bouton **Restaurer l’original**, puis le texte
   inédit dans le popup.

Si l’icône n’apparaît pas :

- cliquer sur le menu extensions (icône puzzle) ;
- épingler NkapLingua ;
- ou utiliser `about:debugging` → **Inspecter** → onglet Console.

## 5. Différences Firefox / Chrome

| Point | Chrome | Firefox |
|---|---|---|
| Background | service worker | event page (`background.scripts`) |
| API | `chrome.*` | `browser.*` (promesses) |
| Manifest | `manifest.json` | `manifest.firefox.json` → `manifest.json` |
| Version minimale | Chrome 116+ | Firefox 140+ |
| Chargement | `chrome://extensions` | `about:debugging` |
| Extension permanente | zip / store | signature AMO ou `web-ext` |

Le code utilise :

```js
const api = globalThis.browser ?? globalThis.chrome;
```

Donc le même `background.js`, `content.js` et `popup.js` fonctionne dans les
deux navigateurs.

## 6. Déboguer

### Console du background

`about:debugging#/runtime/this-firefox` → **Inspecter** → onglet **Console**.

### Console de la page

`Outils` → `Développement web` → `Console web` (ou `Ctrl+Shift+K`).

### Réseau

`Outils` → `Développement web` → `Réseau`. Filtrer sur `127.0.0.1:8000`.

### Erreur fréquente

```text
background.service_worker is currently disabled
```

Signifie que Firefox a chargé le `manifest.json` de Chrome. Utiliser
`dist/firefox/manifest.json`, pas `extension/manifest.json`.

## 7. Option `web-ext`

Pour lancer Firefox automatiquement avec l’extension :

```bash
npm install -g web-ext
cd /home/klein/Documents/projects/safinum-nkaplingua
web-ext run --source-dir dist/firefox
```

Pour lint :

```bash
web-ext lint --source-dir dist/firefox
```

## 8. Limites

- Firefox Android n’est pas testé.
- Les pages `about:`, PDF et modules complémentaires ne peuvent pas être
  injectés.
- Une extension temporaire disparaît au redémarrage.
- Pour une version permanente, il faut signer l’extension sur
  addons.mozilla.org (AMO) ou utiliser un profil développeur.
