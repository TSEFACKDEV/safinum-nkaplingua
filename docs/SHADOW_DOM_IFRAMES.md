# Shadow DOM et iframes — état testé (M12)

**Date** : 8 novembre 2026
**Navigateur** : Chrome for Testing 158.0.8127.18, Playwright, headless
**Page de test** : locale (`http://127.0.0.1:8080/page.html`), aucune donnée réelle

## Dispositif

La page contient :

- un texte dans le document principal ;
- un Shadow DOM **ouvert** (`attachShadow({mode:"open"})`) ;
- un Shadow DOM **fermé** (`attachShadow({mode:"closed"})`) ;
- une iframe **même origine** (`/iframe.html`) ;
- une iframe **cross-origin** (`http://localhost:8080/iframe.html`).

L'extension est une copie de test avec permissions d'hôte sur les deux origines ;
le code de l'extension est inchangé.

## Résultats

| Zone | Injection top-frame seule | Injection `allFrames` + message par frame |
|---|---|---|
| Document principal | traduit | traduit |
| Shadow DOM ouvert | **non traduit** (texte intact) | **non traduit** |
| Shadow DOM fermé | **non traduit** (texte intact) | **non traduit** |
| iframe même origine | **non traduit** | **traduit** |
| iframe cross-origin | **non traduit** | **traduit** avec permissions des deux origines |

Constats techniques :

- `chrome.dom.openOrClosedShadowRoot` est **disponible** dans le monde du
  content script (Chrome 158) ; il permet de lire le Shadow DOM fermé.
- `element.shadowRoot` reste `null` pour le Shadow fermé, comme attendu.
- Le `TreeWalker` actuel ne parcourt pas les Shadow Roots : aucun texte traduit
  dans l'ouvert ni dans le fermé.
- Le content script fonctionne dans les iframes lorsqu'il y est injecté
  (`allFrames: true`) et qu'on lui envoie un message par `frameId`.
- En production, l'injection et le message ciblent le **top frame** uniquement :
  les iframes ne sont donc pas traduites aujourd'hui.

## Limite importante : `activeTab`

Le test des iframes utilise des `host_permissions` explicites. En production,
`activeTab` accorde l'accès à l'origine de l'onglet après un clic, pas
nécessairement aux iframes cross-origin. **Nous ne promettons donc pas** la
traduction des iframes cross-origin avec `activeTab` seul.

## Décision

- Ne pas annoncer la prise en charge des Shadow DOM ou des iframes dans la
  documentation produit.
- Une évolution future pourra parcourir les Shadow Roots ouverts et fermés
  (`chrome.dom.openOrClosedShadowRoot`) et injecter en `allFrames`, mais elle
  demande un test `activeTab` réel dans Chrome et Firefox.
- Aucune régression : le comportement actuel reste limité au document
  principal, ce qui est cohérent avec le parcours officiel de la démo.

## Reproductibilité

Le harnais (page locale, serveur statique, script Playwright, copie de test du
manifeste) est local et non versionné. Il ne contient aucune donnée réelle.
