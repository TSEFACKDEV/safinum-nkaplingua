# Lot de Marius — moteur, sécurité, intégration

**Branche** : `marius`
**Mission** : rendre le pipeline sûr, local, testable et compatible avec le site
officiel Vue 3. Corriger les défauts P0, intégrer le pack de Klein, préparer le
packaging et la CI.
**Dépend de** : Klein (K10 retrait des langues, packs, glossaire, audio) pour
l'intégration ; Freedy pour l'UI des badges et du lecteur audio.
**Note** : le registre `extension/languages.js` et `server/app.py` sont touchés
par K10 (Klein) ; Marius vérifie seulement que rien ne casse côté moteur.
**Livraison à** : Freedy (UI), équipe (packaging, CI, preuves).

## 1. Règles du lot

- **Niveau A = pack validé uniquement** : solde, frais, total, PIN/OTP, erreurs,
  confirmation, sécurité. Aucune MT, aucun fuzzy. Sinon, original + badge
  « non traduit ».
- **Pas de MyMemory** dans le chemin de démo. Local-only par défaut, opt-in
  explicite.
- **Ne jamais désactiver un bouton du site hôte.** Le blocage « lire avant de
  confirmer » reste dans notre page de démo.
- **Libre de droit** : code MIT ; pas de NLLB/MMS dans un produit commercial ;
  audio humain CC0/CC BY.
- **Aucune régression** : `tests/privacy.test.js`, `tests/demo.e2e.js`,
  `tests/pipeline.e2e.js`, `tests/api.robust.py`, CI.

## 2. Tâches P0

### M1 — Corriger la fuite de `context`

Le champ `context` envoyé au backend contient le contenu d'un `<textarea>`, le
texte d'une zone `[data-sensitive]` et des montants non tokenisés.

- [ ] Dans `extension/content.js`, supprimer `blockContext()` et envoyer
      `context: ""` (ou supprimer la propriété).
- [ ] Vérifier `extension/background.js` : il transmet `context` à
      `/translate` ; le backend ne l'utilise pas.
- [ ] `node tests/privacy.test.js` doit passer.
- [ ] Vérifier qu'aucun message ne contient `CONFIDENTIEL`, `CODE-1234`,
      `9876`, `1 000`, `25 000`.
- [ ] Mettre à jour `tests/README.md` : le test n'est plus rouge.

**Critère** : `tests/privacy.test.js` vert, aucune valeur de formulaire dans
les messages.

### M2 — Retirer MyMemory du chemin de démo

- [ ] `extension/background.js` : `cloudAllowed()` ne renvoie `true` que si
      `nkCloudFallback === true` (opt-in explicite), pas `!== false`.
- [ ] `extension/popup.html` : case décochée par défaut.
- [ ] `extension/popup.js` : refléter le défaut local-only.
- [ ] Le parcours pack-only ne doit faire **aucune** requête réseau
      (DevTools).
- [ ] Mettre à jour `README.md`/`docs/SUBMISSION.md` : MyMemory expérimental,
      jamais recommandé pour le jury (voir audit §8).
- [ ] Ne pas supprimer le code cloud : le garder derrière l'opt-in, documenté.

**Critère** : parcours principal sans réseau ; aucune requête MyMemory ;
`tests/pipeline.e2e.js --mode=demo` avec `nkCloudFallback=false`.

### M3 — Politique niveau A

- [ ] Ajouter une classification `criticality` par segment :
      `A` si la source contient un terme critique (solde, frais, total,
      bénéficiaire, PIN, OTP, confirmer, annuler, erreur, sécurité, réessayer,
      référence), sinon `B`/`C`.
- [ ] Pour `A` : chercher uniquement dans le pack validé. Si absent, garder
      l'original et renvoyer `reason: "untranslated_critical"`.
- [ ] Aucun appel MT, aucun fuzzy pour `A`.
- [ ] Le content script affiche un badge « non traduit » sur le segment
      concerné (voir Freedy pour le style).
- [ ] Tests : une phrase A absente du pack ne doit jamais partir au backend.
- [ ] Tests : une phrase B/C peut partir en MT, avec badge « automatique ».

**Critère** : 0 appel MT sur le niveau A ; fallback français explicite.

### M4 — Détecteur de collisions

- [ ] Écrire `scripts/check-pack-collisions.py` : lit
      `extension/language-packs/*.json`, normalise les cibles, signale deux
      sources différentes avec la même cible.
- [ ] Sortie : liste des collisions, code retour 1 si collision.
- [ ] Ajouter au build (`scripts/package-extension.sh`) et à la CI.
- [ ] Lancer sur le pack de Klein avant chaque build.
- [ ] Documenter : une collision n'est pas toujours une erreur, mais elle
      interdit la validation automatique ; l'arbitre tranche.

**Critère** : script exécutable, test avec deux entrées identiques, CI rouge
si collision.

### M5 — Contrôle lexical

- [ ] Si la source contient un terme critique du glossaire, la cible doit
      contenir **exactement** le terme cible validé.
- [ ] Intégrer dans `scripts/import-language-pack.py` (refus à l'import) et
      dans `validateTranslation` côté background/backend.
- [ ] Vérifier que `FCFA`, `PIN`, `OTP`, `KYC` restent identiques.
- [ ] Tests : terme manquant → refus ; terme présent → acceptation.
- [ ] Ne pas confondre avec le contrôle de jetons existant : les deux sont
      nécessaires.

**Critère** : import refuse un terme critique traduit ; runtime refuse une
sortie qui le perd.

## 3. Tâches P1

### M6 — Formats de jetons

Le format `[[NUM_0]] [[0]]` semble dégrader NLLB (3 `token_lost` sur 20).

- [ ] Comparer 3 ou 4 formats sur les 20 phrases de `data/unseen_finance.txt` :
      `[[NUM_0]]`, `[[0]]`, `[[N0]]`, `X0`.
- [ ] Mesurer : taux d'acceptation, `token_lost`, roundtrip, latence.
- [ ] Choisir le format qui perd le moins de phrases, sans casser la
      restauration.
- [ ] Mettre à jour `content.js`, `background.js`, `server/app.py` si besoin.
- [ ] Ajouter un test de non-régression sur les jetons.

**Critère** : rapport de comparaison, format retenu, tests verts.

### M7 — Compatibilité site officiel (Vue 3 + Inertia)

Le site `https://safinum.cm/hackathon-test` est une SPA Vue 3 avec un panneau
Jury (capture de base, rescan de couverture, injections, erreurs).

- [ ] Vérifier que le content script modifie les nœuds **en place**
      (`nodeValue`), sans remplacer de nœud.
- [ ] Vérifier que le `MutationObserver` ignore ses propres mutations et
      reprend après les mises à jour de Vue.
- [ ] Tester les 5 étapes : Solde, Frais, Bénéficiaire, Récapitulatif,
      Confirmation.
- [ ] Tester FR/EN.
- [ ] Tester les erreurs `AMOUNT_002`, `SECURITY_001`, `SECURITY_002`,
      `NETWORK_001`, `CONFIRM_001`.
- [ ] Ne pas toucher aux boutons du panneau Jury ; vérifier la console Vue
      (aucune erreur `removeChild`, hydration).
- [ ] Documenter les limites (iframes, Shadow DOM fermés) et les tests réels.
- [ ] Si le site casse à cause de l'extension, corriger le content script,
      jamais le site.

**Critère** : test réel Chrome/Firefox sur le site officiel, 5 étapes, 0 erreur
Vue, valeurs intactes.

### M8 — Audio backend / lecteur

- [ ] Recevoir de Klein : 15 fichiers OGG + `index.json` (phrase, fichier,
      durée, relecteur, licence).
- [ ] Servir les fichiers en local (pas de CDN, pas de cloud).
- [ ] Ajouter un endpoint ou un chargement statique dans l'extension.
- [ ] Bouton « Écouter » uniquement sur les segments validés qui ont un audio.
- [ ] **Aucun montant synthétisé** ; les phrases audio ne contiennent pas de
      montant. Montants fixes de la démo seulement si validés.
- [ ] MMS-TTS : interdit dans le produit libre ; si utilisé en démo
      non commerciale, étiqueter « voix synthétique ».
- [ ] Tests : audio absent → bouton masqué ; audio présent → lecture.

**Critère** : 15 fichiers lus, aucun montant prononcé, licences documentées.

### M9 — Harnais e2e et preuves

> Les scripts `tests/pipeline.e2e.js`, `tests/api.robust.py`,
> `tests/privacy.test.js` et `tests/demo.e2e.js` sont des artefacts locaux de
> l'audit. Les ajouter au dépôt dans cette tâche s'ils n'y sont pas encore.

- [ ] Maintenir `tests/pipeline.e2e.js` : pack, edge, unseen, demo.
- [ ] Maintenir `tests/api.robust.py` : contrats, CORS, refus.
- [ ] Mesurer la latence : pack < 50 ms, MT courte < 6 s, page pack < 2 s.
- [ ] Produire `docs/test-results/` à jour.
- [ ] Vérifier zéro requête réseau sur le parcours pack-only.
- [ ] Vérifier la préservation montant/nom/référence sur 40 cas.

**Critère** : rapport à jour, zéro réseau, 100 % des valeurs préservées.

### M10 — Packaging et CI

- [ ] `./scripts/package-extension.sh` : 3 ZIP, < 10 Mo.
- [ ] `./scripts/build-firefox.sh` + `web-ext lint` : 0 warning.
- [ ] CI verte : tests backend, JS, jsdom, packs, build, lint.
- [ ] Ajouter le détecteur de collisions à la CI.
- [ ] Mettre à jour `tests/README.md` et `docs/SUBMISSION.md` (statut réel).

**Critère** : CI verte, ZIP testés Chrome/Firefox.

## 4. Tâches P2

### M11 — Normaliseur orthographique

- [ ] Recevoir la table `ɲ` → `ny` de Klein.
- [ ] Ajouter une normalisation déterministe avant l'affichage/validation.
- [ ] Ne pas modifier les noms propres ni les emprunts.
- [ ] Tests : 10 exemples, 0 régression.

### M12 — Shadow DOM fermés et iframes

- [ ] Tester `chrome.dom.openOrClosedShadowRoot` (Chrome 88+) et
      `element.openOrClosedShadowRoot` (Firefox).
- [ ] Tester les iframes cross-origin avec `activeTab` ; documenter ce qui
      marche réellement.
- [ ] Ne pas promettre ce qui n'est pas testé.

### M13 — Concurrence backend

- [ ] `server/app.py` partage `tokenizer.src_lang` et le modèle sans verrou.
- [ ] Ajouter un verrou ou un worker unique pour les requêtes concurrentes.
- [ ] Test : deux requêtes FR/EN simultanées, pas de mélange de langues.

## 5. Première 72 heures

| Jour | Action |
|---|---|
| J1 | M1 `context` ; `tests/privacy.test.js` vert |
| J2 | M2 local-only + retrait MyMemory ; M3 classification niveau A |
| J3 | M4 collisions + M5 contrôle lexical ; premiers tests site officiel |

## 6. Fichiers

**À toucher** :

- `extension/content.js`, `extension/background.js`, `extension/popup.js`,
  `extension/popup.html`
- `server/app.py`
- `scripts/` (collisions, import, packaging)
- `tests/` (privacy, pipeline, api, demo)
- `docs/TECHNICAL.md`, `docs/SECURITY.md`, `docs/SUBMISSION.md`,
  `tests/README.md`

**À ne pas toucher** :

- `data/language-packs/*.csv` et `data/site-officiel/messages.fr-en.csv` (Klein)
- `data/glossary.template.csv` (Klein)
- `demo/index.html` et styles (Freedy)
- `docs/LANGUAGE_VALIDATION.md` (Klein)

## 7. Critères d'acceptation

- [ ] `tests/privacy.test.js` vert.
- [ ] Parcours pack-only sans réseau.
- [ ] 0 appel MT sur le niveau A.
- [ ] Détecteur de collisions dans la CI.
- [ ] Contrôle lexical à l'import et au runtime.
- [ ] Test réel sur `safinum.cm/hackathon-test` : 5 étapes, FR/EN, erreurs,
      0 erreur Vue.
- [ ] 15 audio lus, aucun montant prononcé.
- [ ] `pipeline.e2e.js` + `api.robust.py` à jour.
- [ ] CI verte, 3 ZIP, `web-ext lint` 0 warning.

## 8. Journal d'évolution

À chaque avancement (M1…M13), ajouter une entrée dans
[`tasks/EVOLUTION.md`](EVOLUTION.md) **avant** le commit/PR :

- `task: "M1"` … `"M13"` ;
- `status: "in_progress"`, `"blocked"` ou `"done"` ;
- les tests réellement exécutés (`not_run` accepté pour un début de tâche) ;
- les fichiers touchés et la preuve (sortie de test, capture, JSON).

Puis :

```bash
python3 scripts/check-evolution.py
```

La CI échoue si le journal est invalide.
