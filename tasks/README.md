# Répartition des tâches — NkapLingua

**Équipe de trois** : Freedy, Klein, Marius.
**Date** : 7 novembre 2026.
**Sources (documents locaux, non publiés)** : `docs/AUDIT_2026-11-07.md`,
`docs/TEST_REPORT_2026-11-07.md`, `data/language-packs/fub.csv`.

## 1. Qui fait quoi

| Personne | Périmètre | Branche | Fichiers principaux |
|---|---|---|---|
| **Freedy** | Frontend visuel, expérience utilisateur, tests profonds navigateur, démo sur le site officiel | `freedy` | `extension/popup.*`, `demo/index.html`, styles, captures, rapport de tests |
| **Klein** | Langue et données : **réduction à trois langues** (K10), natifs, glossaire, catalogues fulfulde/ewondo/duala, TRAPD, audio, licences, messages FR/EN du site officiel | `klein` | `data/language-packs/*.csv`, `data/site-officiel/messages.fr-en.csv`, `data/glossary.template.csv`, `extension/languages.js` (registre), `server/app.py` (registre), `docs/LANGUAGES.md` |
| **Marius** | Moteur, sécurité, intégration : fuite `context`, cloud, politique niveau A, collisions, jetons, audio backend, packaging, CI | `marius` | `extension/content.js`, `extension/background.js`, `extension/popup.js`, `server/app.py`, `scripts/`, `tests/` |

**Chemin critique** : Klein (3 natifs + 40 phrases P0) → Marius (import + politique
niveau A) → Freedy (UI + test officiel). Si Klein prend du retard, rien d'autre
ne peut compenser.

## 2. Règles communes

1. **Niveau A = pack validé uniquement.** Solde, frais, total, PIN/OTP, erreurs
   d'opération, confirmation, sécurité : jamais de MT, jamais de fuzzy. Sinon,
   français + badge « non traduit ».
2. **Pas de MyMemory** dans le chemin de démo. Local-only par défaut, opt-in
   explicite si le cloud revient un jour.
3. **Ne jamais désactiver un bouton du site hôte.** Le blocage « lire avant de
   confirmer » reste dans notre page de démo. Sur le site du comité, on injecte
   un panneau « Écouter le récapitulatif » en Shadow DOM.
4. **Libre de droit** : code MIT ; traductions sous CC0 1.0 ou CC BY 4.0 avec
   consentement ; audio humain CC0/CC BY ; pas de NLLB ni MMS dans un produit
   commercial ; pas de corpus NOODL pour l'entraînement sans autorisation.
5. **Ne pas sortir de son périmètre.** Une PR par sujet, vers `develop`, revue
   par un autre membre. `main` reste stable.
6. **Aucune donnée réelle**, aucun compte bancaire réel, aucune transaction.
7. **Tout ce qui est ajouté doit être testé** : `tests/privacy.test.js`,
   `tests/demo.e2e.js`, `tests/pipeline.e2e.js`, `tests/api.robust.py`, CI.

### 2.1 Journal d'évolution — obligatoire

Chaque personne consigne **chaque avancement** dans un seul fichier :
**[`tasks/EVOLUTION.md`](EVOLUTION.md)**. Il est append-only, lisible par
l'humain et parsé par le test.

- Une entrée à chaque passage en `in_progress`, `blocked` ou `done`.
- Avant chaque commit/PR : `python3 scripts/check-evolution.py`.
- Le script doit passer avant chaque push. Le job CI est fourni dans
  [`tasks/CI_JOB.yml`](CI_JOB.yml) ; son ajout à `.github/workflows/ci.yml`
  nécessite un token GitHub avec le scope `workflow`.
- Le bloc JSON fait foi ; les tests doivent être des commandes réelles.

### 2.2 Périmètre de Freedy (F0–F6)

| ID | Tâche | Livrable | Critère |
|---|---|---|---|
| **F0** | Mise en place du dossier et du journal | `tasks/` + `EVOLUTION.md` | journal valide |
| **F1** | Charte UI, écrans, badges « validé / automatique / non traduit » | maquettes + styles | 3 états visibles, contraste OK |
| **F2** | Page de démo 5 étapes + panneau audio Shadow DOM | `demo/index.html` | parcours complet, aucun bouton hôte désactivé |
| **F3** | Test réel du site officiel Chrome/Firefox | captures + rapport | 5 étapes, FR/EN, 0 erreur Vue |
| **F4** | Tests profonds : Vue, modales, toasts, latence, couverture | `docs/TEST_REPORT` | preuves reproductibles |
| **F5** | Preuves visuelles et vidéo | captures + vidéo | ≤ 3 min, aucune donnée réelle |
| **F6** | Répétition générale et checklist | checklist signée | démo rejouable, secours prêt |

## 3. Première 72 heures

| Jour | Freedy | Klein | Marius |
|---|---|---|---|
| J1 | Figer la charte UI et les écrans ; lister les badges et le panneau audio | **K10 : retirer yemba, medumba, bassa, ghomala'** (code + doc) ; recruter les natifs | Corriger la fuite `context` ; test `privacy` vert |
| J2 | Maquette des 5 étapes + états « traduit / non traduit / en cours » | Glossaire 40 termes ; premières 37 phrases P0 | Local-only par défaut ; retirer MyMemory du chemin |
| J3 | Test sur le site officiel, capture des erreurs Vue | Deux traductions indépendantes des 37 phrases | Détecteur de collisions + contrôle lexical |

## 4. Cadence

- Point de 15 minutes chaque matin : ce qui est validé, ce qui bloque, qui a
  besoin de qui.
- Une branche par personne (`klein`, `freedy`, `marius`), PR vers `develop`.
- Gel du code 48 h avant la démonstration. Seules les corrections de bugs
  passent.
- La démo tourne sur **une** machine, avec une vidéo de secours.

## 5. Définition de « fini » (équipe)

- 40/40 phrases P0 validées par TRAPD, **0 défaut majeur**, pour les trois
  langues (fulfulde, ewondo, duala).
- Trois langues seulement dans le code, les packs, les tests et la doc.
- 100 % du niveau A couvert par le pack ; le reste est explicitement
  « non traduit ».
- `tests/privacy.test.js` **vert** (plus de fuite de `context`).
- Zéro requête réseau sur le parcours pack-only (preuve DevTools).
- Test réel sur `https://safinum.cm/hackathon-test` : 5 étapes, FR/EN,
  erreurs injectées, aucune erreur Vue, **seuil de couverture mesuré**.
  L’audit du 8 nov mesure 6/44 segments sur l’étape 1 : ce n’est pas suffisant.
- 15 phrases audio **sans montant**, avec consentement et licence.
- Rapport de validation rempli, licences des packs documentées.
- CI verte, packaging Chrome/Firefox, vidéo à jour.

## 5bis. Écarts bloquants après l’audit du 8 novembre

L’audit réel (`docs/AUDIT_2026-11-08.md`) change les priorités :

1. **Couverture site** : 6/44 sur l’étape 1, **31/192 sur les 5 étapes** ;
   161 restent en français.
2. **Qualité NLLB** : 1/20 en production, 4/20 en démo ; le chiffre 12/20 n’est
   pas reproduit.
3. **Préservation** : numéro de compte sans espace, nom minusculé, jeton
   `[[NAME_0]]` perdu.
4. **Packs** : 0 phrase validée ; ewondo et duala ne peuvent pas sortir du
   français.
5. **Message popup** : `low_roundtrip` présenté à tort comme un problème de
   montants/noms.
6. **Titre EN** : non traduit ; le test K2 qui annonce un titre fulfulde n’est
   pas reproduit.

Conséquence : la démonstration doit être **réduite à un paragraphe court** et
les packs doivent être priorisés. Ne pas cocher la définition de « fini » tant
que ces cinq points ne sont pas mesurés.

## 6. Détail des lots

- [Lot de Klein](klein.md) — **retrait des langues hors périmètre (K10)**, langue, données, validation, audio, messages FR/EN du site officiel (K11).
- [Lot de Marius](marius.md) — moteur, sécurité, intégration, packaging.

Le périmètre de Freedy est détaillé en §2.2 : frontend visuel, expérience,
tests profonds et démonstration officielle. Il ne prend pas les tâches de Klein
ou Marius, sauf blocage explicitement signalé.
