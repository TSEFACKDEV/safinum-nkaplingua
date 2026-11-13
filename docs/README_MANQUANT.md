# NkapLingua — état du produit et ce qu'il manque

> **Date** : 10 novembre 2026
> **Base** : `develop` à `8343b26`
> **Périmètre** : produit, données, validation, livrables
> **Règle de lecture** : la couverture pack n'est pas une validation native.

## Résumé

Le produit est **démo-ready sur le site officiel SAFINUM** : 188/188 segments
sur les 5 étapes, en Chrome et Firefox, 0 non traduit, 0 critique MT, 0 erreur
page. Il n'est **pas encore un produit de production** : aucune phrase n'est
validée par un panel natif indépendant, le contenu inédit reste faible et les
artefacts de release ne sont pas à jour.

Trois manques dominent :

1. **validation native** ;
2. **qualité sur le contenu inédit** ;
3. **release à régénérer**.

## 1. Ce qui est livré et vérifié

| Élément | État |
|---|---|
| Site SAFINUM, 5 étapes, packs | **188/188**, 0 non traduit, 0 critique MT, restauration 5/5 |
| Navigateurs | Chrome 158 et Firefox 159, recettes réelles |
| Premier écran, 3 langues | fub 40/40, ewo 39/40, dua 40/40 (audit 9 nov) |
| EN pack-only | **40/44** ; 4 dates restantes |
| Résultat compact | passages traduits, passages laissés en français, détail technique masqué |
| Niveau A | strictement `validated` ; sinon original + badge « non traduit » |
| Brouillons B/C hors démo | acceptés avec toast « pack non validé » |
| Confidentialité | `context` supprimé, MyMemory opt-in, tests verts |
| Charge API | 24/24, 0 mélange FR/EN, p95 29,86 ms |
| 503 isolé | 6/6, `/health` toujours 200 |
| CI | 5 jobs verts sur `develop` |
| Journal | 72 entrées, 28 tâches, valide |

Preuves : [REAL_TEST_2026-11-10.md](REAL_TEST_2026-11-10.md),
[real-site packs](test-results/real-site-packs-2026-11-10-011346.json),
[real-firefox](test-results/real-firefox-2026-11-10-011500.json),
[api-load](test-results/api-load-2026-11-10.json).

## 2. Manques bloquants pour la crédibilité

| Manque | État réel | Impact |
|---|---|---|
| **Validation native** | **0 phrase validée** sur 231 fub / 210 ewo / 203 dua | Le niveau A n'est jamais « validé » en production ; la démo repose sur des brouillons. |
| **Panel TRAPD** | T2 indépendant, arbitre et consentements manquants (K1/K3/K4/K5) | Impossible de passer les packs en `validated`. |
| **Contenu inédit** | **1/20 en production, 4/20 en démo** ; NLLB seul 31/192 | Le produit ne traduit pas de façon fiable une page inconnue. |
| **Modèle / backend** | NLLB non téléchargé localement ; `flagship-ai` absent | Qualité, latence et concurrence réelles non mesurables ici. |
| **Release à jour** | **v0.6.2** : 3 ZIP reconstruits le 13 nov (404–405 Ko), PDF 8 pages et vidéo 1 min 47 s régénérés, lint 0/0/0 | Les assets publiés correspondent au code et à l’interface simplifiée. |

## 3. Manques fonctionnels

- **Audio** : 0 fichier OGG, `index.json` absent, consentements absents → pas de bouton « Écouter » (M8).
- **Orthographe** : table `ɲ/ny` vide → normaliseur non implémenté (M11).
- **M6 — formats de jetons** : comparaison des 4 formats non faite, faute de NLLB.
- **EN** : 4 dates restent en anglais (`Nov 5, 2026`, etc.).
- **Ewondo** : 1 segment manquant au premier écran selon l'audit (39/40).
- **Iframes / Shadow DOM fermés** : non supportés, documentés comme limites.
- **Paquet Firefox de production** : la recette utilise un XPI de test avec permission d'hôte et auto-déclenchement ; le paquet public `activeTab` n'a pas été rejoué sur le site après les changements de packs.
- **Charge avec vrai modèle** : 24/24 en mock ; le 503 est testé sans modèle. La concurrence NLLB réelle n'est pas mesurée.
- **Préservation 40 cas** : les harnais couvrent les 5 étapes, pas une matrice explicite de 40 cas limites.

## 4. Manques de livrables et de méthode

- **PDF et vidéo** régénérés le 13 novembre 2026 pour la v0.6.2 (interface simplifiée, équipe ARTEMIS 237).
- **Harnais Chrome/Firefox** versionnés mais **manuels** : ils ne tournent pas en CI (pas de navigateur dans le runner).
- **Tests réels** non exécutés en CI ; seuls les tests mock/pack y tournent.
- **Reste du lot Klein** : K1–K6, K8, K9, K11 encore ouverts.
- **F3/F4 de Freedy** encore `in_progress`.
- **M6/M8/M11** restent `blocked` dans le journal, avec preuves.

## 5. Priorités

1. **Régénérer la release** : `./scripts/package-extension.sh`,
   `./scripts/build-firefox.sh`, `web-ext lint`, rechargement Chrome/Firefox,
   puis mise à jour de la vidéo et du PDF.
2. **Faire valider les packs** par le panel natif : T2, arbitre, consentements,
   40 phrases P0 par langue, import `validated`.
3. **Traiter l'inédit** : télécharger/évaluer NLLB, ou brancher un modèle
   flagship, puis mesurer à nouveau 1/20 et 4/20.

## 6. Commandes de vérification

```bash
node scripts/test-extension.js
node tests/pipeline.e2e.js --mode=all
node tests/content.test.js
node tests/criticality.test.js
node tests/site-demo.e2e.js
node tests/error-taxonomy.test.js
NK_MOCK=1 server/.venv/bin/python tests/api.robust.py
server/.venv/bin/python tests/api-load.test.py
NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/real-site.e2e.js
server/.venv/bin/python tests/real-firefox.e2e.py
python3 scripts/check-evolution.py
```

## 7. Ce qui n'est pas manquant

Le socle est solide : couverture packs du site, politique niveau A, privacy,
pseudonymisation, restauration, charge API/503, taxonomie d'erreur, CI verte,
journal valide, recettes Chrome et Firefox.

**Le produit est démontrable ; il n'est pas encore validé linguistiquement.**
