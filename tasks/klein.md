# Lot de Klein — langue, données, validation

**Branche** : `klein`
**Mission** : produire les packs validés des **trois langues retenues**
(fulfulde, ewondo, duala), le glossaire, les enregistrements audio et le rapport
de validation. **Retirer les langues hors périmètre** (yemba, medumba, bassa,
ghomala') de tout le dépôt. C'est le **chemin critique** du projet.
**Dépend de** : rien, sauf les natifs (3 par langue prioritaire).
**Livraison à** : Marius (import du pack, politique niveau A) et Freedy (UI,
badges, audio).

> Klein n'a pas besoin de parler fulfulde : il/elle organise, outille et
> documente les relecteurs. Si Klein est locuteur, il/elle peut être l'un des
> traducteurs, mais il faut quand même deux autres avis.

## 1. Règles du lot

- **TRAPD**, pas de rétro-traduction comme validation.
- **Trois natifs par langue prioritaire** : deux traducteurs indépendants
  (sous-variétés différentes) + un arbitre. Le prétest est fait avec 5 à 8
  personnes peu alphabétisées.
- **Niveau A = pack validé uniquement** : solde, frais, total, PIN/OTP, erreurs,
  confirmation, sécurité.
- **Aucune phrase inventée** : les sources viennent de `fub.csv` ou du site
  officiel, jamais d'un modèle.
- **Licences** : chaque relecteur signe un consentement écrit pour CC0 1.0 ou
  CC BY 4.0. Sans consentement, la phrase n'entre pas dans le pack.
- **Aucun corpus NOODL** pour l'entraînement, l'adaptation ou la création
  d'œuvres dérivées sans autorisation écrite.
- **Trois langues seulement** : fulfulde d'Adamawa (`fub`), ewondo (`ewo`),
  duala (`dua`). Toute autre langue est hors périmètre et doit disparaître du
  code, des packs, des tests et de la doc.
- **Libre de droit** : traductions sous CC0 1.0 ou CC BY 4.0, audio humain
  sous CC0/CC BY, pas de NLLB ni de MMS-TTS dans un produit commercial.

## 2. Tâches P0

### K1 — Recruter les trois natifs

- [ ] Identifier 2 traducteurs et 1 arbitre, de sous-variétés différentes
      (Ngaoundéré, Garoua, Maroua si possible).
- [ ] Vérifier la disponibilité sur les 10 prochains jours.
- [ ] Faire signer le consentement de publication (CC0 1.0 ou CC BY 4.0).
- [ ] Consigner : nom, sous-variété, rôle, date, canal de contact.

**Livrable** : `docs/LANGUAGE_VALIDATION.md` § Panel, avec les trois profils.
**Critère** : 3 personnes confirmées, consentements signés.

### K2 — Glossaire finance de 40 termes

- [ ] Partir de `data/glossary.template.csv` (20 lignes).
- [ ] Ajouter 20 termes : frais, total, échéance, pénalité, plafond, retrait,
      dépôt, solde, découvert, agence, guichet, code, référence, reçu, litige,
      échec, annulation, confirmation, sécurité, bénéficiaire.
- [ ] Pour chaque terme : `target_fub`, `status=validated`, `reviewer`, `note`.
- [ ] Trancher explicitement : mot fulfulde ou emprunt au français.
- [ ] Vérifier que `FCFA`, `PIN`, `OTP`, `KYC` restent identiques.

**Livrable** : `data/glossary.template.csv` rempli.
**Critère** : 40 termes validés, 0 terme vide, décisions documentées.

### K3 — Les 37 phrases critiques de `fub.csv`

Le fichier contient 102 lignes, déjà ordonnées. Les **37 premières** couvrent :

- 8 lignes « Erreur et sécurité » ;
- 11 lignes « Récapitulatif » ;
- 18 lignes « Préparer un transfert ».

Procédure TRAPD :

- [ ] Traducteur 1 remplit `target` pour les 37 lignes.
- [ ] Traducteur 2 remplit une copie **sans voir** la traduction 1.
- [ ] Relecture commune : comparer les deux, discuter les écarts.
- [ ] Arbitre tranche les désaccords.
- [ ] Prétest auprès de 5 à 8 personnes : « Combien envoyez-vous ? À qui ?
      Y a-t-il des frais ? Que devez-vous faire si on vous demande votre PIN ? »
- [ ] Passer `status=validated`, renseigner `reviewer` et `reviewedAt`.
- [ ] Vérifier les jetons `[[NUM_n]]`, `[[NAME_n]]`, `FCFA`, `PIN`, `OTP`.

**Livrable** : `data/language-packs/fub.csv` (37 lignes validées).
**Critère** : 37/37, **0 défaut majeur** sur les phrases critiques.

### K4 — Les 102 phrases de la page

- [ ] Compléter les 65 lignes restantes avec la même procédure.
- [ ] Ne pas utiliser les 20 phrases de `data/unseen_finance.txt` : elles
      servent de test.
- [ ] Mettre à jour le contexte et les notes si une phrase est ambiguë.

**Livrable** : `data/language-packs/fub.csv` complet.
**Critère** : 102/102 validées, ou explicitement « non traduite » avec raison.

### K5 — Rapport de validation

- [ ] Remplir `docs/LANGUAGE_VALIDATION.md` : panel, méthode TRAPD, dates,
      nombre de phrases, défauts majeurs, désaccords, décisions.
- [ ] Faire juger les 20 phrases inédites sur trois niveaux :
      **acceptable / trompeur / faux**.
- [ ] Consigner les cas « trompeur » et « faux », même s'ils sont rares.
- [ ] Signer la fiche de validation.

**Livrable** : rapport rempli, lisible par le jury.
**Critère** : 20 phrases jugées, 0 défaut majeur non documenté.

## 3. Tâches P1

### K6 — Audio sans montant

- [ ] Choisir 15 phrases du parcours **sans montant** : solde, frais, total,
      bénéficiaire, confirmation, PIN, OTP, erreur, annulation, sécurité.
- [ ] Enregistrer avec un natif, pièce calme, mono, OGG/Opus.
- [ ] Faire relire par un second natif.
- [ ] Consentement écrit + licence CC0 1.0 ou CC BY 4.0.
- [ ] **Aucun montant synthétisé** : on dit « le montant affiché à l'écran
      est… » et on surligne le chiffre.
- [ ] Si un montant fixe est enregistré, vérifier la convention (multiples de
      cinq, « booro ») avec les natifs de chaque sous-variété.

**Livrable** : `data/audio/fub/*.ogg` + `data/audio/fub/index.json`
(phrase, fichier, durée, relecteur, licence).
**Critère** : 15 fichiers, 2 relecteurs, licences documentées.

### K7 — Formulations françaises **et anglaises**

- [ ] Pour chaque message important, faire écrire 3 à 5 formulations en
      français et en anglais.
- [ ] Couvrir les messages du site officiel : solde, frais, bénéficiaire,
      récapitulatif, confirmation, `AMOUNT_002`, `SECURITY_001`,
      `SECURITY_002`, `NETWORK_001`, `CONFIRM_001`.
- [ ] Livrer un CSV `source_fr,source_en,target_fub,contexte`.
- [ ] Le site officiel a un bouton FR/EN : le catalogue doit suivre.

**Livrable** : `data/language-packs/fub_en.csv` (ou colonnes `source_en`).
**Critère** : 10 messages × 3 formulations minimum, FR + EN.

### K8 — Orthographe camerounaise

- [ ] Lister les formes `ɲ` / `ny` et les variantes observées.
- [ ] Valider la règle avec les natifs : `ɲ` → `ny` à l'écriture.
- [ ] Livrer une table d'exceptions (noms propres, emprunts).
- [ ] Ne pas modifier le code : Marius intégrera le normaliseur.

**Livrable** : `docs/ORTHOGRAPHY.md` (règle + exceptions).
**Critère** : règle validée, 10 exemples, 0 contradiction.

### K9 — Licences des données

- [ ] Vérifier les termes exacts du corpus Adamawa–français (NOODL-1.0) :
      entraînement, adaptation, redistribution, œuvres dérivées.
- [ ] Ne pas utiliser le corpus pour le fine-tuning sans autorisation écrite.
- [ ] Documenter la licence du pack (`CC0-1.0` ou `CC-BY-4.0`) et les
      consentements.
- [ ] Mettre à jour `docs/DATA_LICENSES.md` avec les verdicts.

**Livrable** : section licences à jour, consentements archivés.
**Critère** : chaque ligne du pack a une licence et un relecteur.

## 3quater. Tâche P0 — retirer les langues hors périmètre (K10)

Tu l'as demandé : **Klein retire toute langue sauf fulfulde, ewondo et duala**,
et met à jour la doc. C'est à faire **avant** toute autre tâche.

### Ce qui reste

| Code | Langue | Moteur | Rôle |
|---|---|---|---|
| `fub` | Fulfulde (Adamawa) | NLLB (démonstration non commerciale) + pack | langue prioritaire |
| `ewo` | Ewondo | pack validé | 1er corpus de parole |
| `dua` | Duala | pack validé | 2e corpus de parole |

### Ce qui disparaît

`ybb` (yemba), `byv` (medumba), `bas` (bassa), `bbj` (ghomala').

### Fichiers à modifier (code)

- [ ] `extension/languages.js` : supprimer les 4 entrées `ybb`, `byv`, `bas`,
      `bbj` de `TARGETS` ; garder `fub`, `ewo`, `dua`.
- [ ] `extension/language-packs/` : supprimer `ybb.json`, `byv.json`,
      `bas.json`, `bbj.json`.
- [ ] `data/language-packs/` : supprimer `ybb.csv`, `byv.csv`, `bas.csv`,
      `bbj.csv` ; garder `ewo.csv`, `dua.csv`.
- [ ] `server/app.py` : `PACK_TARGETS` → `{"ewo", "dua"}` ;
      `LANGUAGE_REGISTRY` → 3 entrées (`fub`, `ewo`, `dua`) avec un champ
      `audio` (volumes Common Voice).
- [ ] `scripts/check-language-packs.py` : `EXPECTED = {"fub", "ewo", "dua"}` ;
      ajouter `REMOVED = {"ybb", "byv", "bas", "bbj"}` et une erreur si un
      pack de langue retirée existe encore.
- [ ] `scripts/test-extension.js` : attendre 3 langues ; remplacer le pack de
      test `ybb` par `ewo`.
- [ ] `extension/INSTALL.md` et `extension/language-packs/README.md` :
      corriger les exemples (`ybb` → `ewo`, liste des langues).
- [ ] `scripts/README.md` et l'usage dans `scripts/import-language-pack.py` :
      exemples `ybb`/`byv` → `ewo`/`dua`.
- [ ] `server/test_api.py` : attendre 3 langues, refuser les 4 anciennes.

### Fichiers à modifier (documentation)

- [ ] `README.md` : intro, badge, section Langues, données et licences,
      roadmap, MyMemory (« expérimental, désactivé par défaut »), « sept
      langues » → « trois langues ».
- [ ] `docs/LANGUAGES.md` : réécrire avec la table des trois langues, la
      justification (ewondo 14,36 h/31 voix + ASR ~3 h 11 ; duala ; fulfulde
      1 303 enregistrements TTS à une voix), et les limites.
- [ ] `docs/LANGUAGE_VALIDATION.md` : trois langues, TRAPD, protocole des six
      étapes, patrimoine audio.
- [ ] `docs/TECHNICAL.md` : langues cibles, traitement linguistique, limites.
- [ ] `docs/PRESELECTION.md` : langues cibles et réponses aux exigences.
- [ ] `docs/SUBMISSION.md` : version 0.6.0, trois langues, statut réel.
- [ ] `docs/COMPLIANCE.md` : exigence 1, limites, actions prioritaires.
- [ ] `docs/DATA_LICENSES.md` : tableau des packs (deux langues), tableau des
      corpus de parole, règles « libre de droit ».
- [ ] `docs/DATA_INTEGRATION.md` : plan ewondo/duala, pas yemba/medumba.
- [ ] `extension/INSTALL.md`, `extension/language-packs/README.md`,
      `scripts/README.md` : exemples et listes de langues.

### Fichiers à ne pas modifier

- `demo/index.html` (Freedy)
- `extension/content.js`, `extension/background.js` (Marius)

### Vérification

```bash
grep -rnE "ybb|byv|\bbas\b|bbj|yemba|medumba|bassa|ghomala" \
  README.md docs/*.md extension/*.md extension/languages.js \
  scripts/*.md scripts/*.py server/*.py | grep -v "retiré"
node scripts/test-extension.js
NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py
python3 scripts/check-language-packs.py
```

**Critère** : plus aucune référence active ; 3 langues dans le registre et
l'API ; tests verts ; doc cohérente.

## 3quinquies. Tâche P0 — messages FR/EN du site officiel (K11)

Nouveau fichier fourni : **`data/site-officiel/messages.fr-en.csv`**
(70 messages FR/EN extraits des textes affichés du site officiel, 35 classés
niveau A et 35 niveau B).

- [ ] Faire traduire chaque message par TRAPD en fulfulde, ewondo et duala.
- [ ] Ajouter les colonnes `target_fub`, `target_ewo`, `target_dua`.
- [ ] Le prétest doit couvrir les messages d'erreur (`AMOUNT_002`,
      `SECURITY_001`, `SECURITY_002`, `NETWORK_001`, `CONFIRM_001`).
- [ ] Livrer aussi les 20 phrases inédites de `data/unseen_finance.txt` pour
      l'évaluation.

**Critère** : 70/70 messages FR et EN couverts, 0 défaut majeur.

## 4. Première 72 heures

| Jour | Action |
|---|---|
| J1 | **K10** retirer yemba/medumba/bassa/ghomala' (code + doc) ; recruter les natifs, faire signer les consentements |
| J2 | Glossaire 40 termes (3 langues), première passe des 37 phrases P0 |
| J3 | Deuxième traduction indépendante, relecture commune, début d'arbitrage |

## 5. Fichiers

**À toucher** :

- `data/language-packs/fub.csv`
- `data/glossary.template.csv`
- `docs/LANGUAGE_VALIDATION.md`
- `docs/DATA_LICENSES.md`
- `data/audio/fub/` (nouveau)
- `docs/ORTHOGRAPHY.md` (nouveau)

**À ne pas toucher** :

- `extension/*` (Marius/Freedy)
- `server/*` (Marius)
- `demo/index.html` (Freedy)
- `data/unseen_finance.txt` (jeu de test, ne pas traduire dans le pack)

## 6. Handoff

| Vers | Quoi | Quand |
|---|---|---|
| Marius | **K10 terminé** : 3 langues dans le code, tests verts | J1 |
| Marius | `fub.csv` 37 P0 validées, glossaire 40, règles de jetons | J3–J7 |
| Marius | `messages.fr-en.csv` traduit (3 langues) | J10 |
| Marius | `fub.csv` 102, audio, table orthographe | J12 |
| Freedy | liste des phrases avec audio, formulations FR/EN, badges | J12 |
| Équipe | rapport de validation signé | J16 |

## 7. Critères d'acceptation

- [ ] 3 natifs confirmés, consentements signés.
- [ ] 40 termes de glossaire validés.
- [ ] 37/37 phrases P0 validées, 0 défaut majeur.
- [ ] 102/102 phrases validées ou explicitement non traduites.
- [ ] 20 phrases inédites jugées acceptable/trompeur/faux.
- [ ] 15 audio sans montant, 2 relecteurs, licences CC0/CC BY.
- [ ] Rapport de validation rempli et signé.
- [ ] Aucune utilisation de NOODL sans autorisation.
- [ ] K10 : yemba, medumba, bassa et ghomala' absents du code, des packs et
      de la doc.
- [ ] K11 : les 70 messages FR/EN du site officiel traduits et validés.

## 8. Journal d'évolution

À chaque avancement (K1…K9), ajouter une entrée dans
[`tasks/EVOLUTION.md`](EVOLUTION.md) **avant** le commit/PR :

- `task: "K1"` … `"K11"` ;
- `status: "in_progress"`, `"blocked"` ou `"done"` ;
- les tests réellement exécutés (`not_run` accepté pour un début de tâche) ;
- les fichiers touchés et la preuve (ligne de CSV, capture, sortie de test).

Puis :

```bash
python3 scripts/check-evolution.py
```

La CI échoue si le journal est invalide.
