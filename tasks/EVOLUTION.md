# Journal d'évolution — NkapLingua

> **Fichier unique, append-only.** Chaque personne ajoute une entrée **à chaque
> avancement** — début, blocage, fin — avant son commit ou sa PR. Le script
> `python3 scripts/check-evolution.py` lit ce fichier, et la CI échoue si une
> entrée est invalide ou si le journal est vide. C'est ce fichier qui sert de
> source de vérité pour savoir ce qui est réellement fait.

## 1. Règles

1. **Ne jamais réécrire une entrée passée.** On ajoute à la fin.
2. **Une entrée par avancement** : passage en `in_progress`, `blocked` ou
   `done`. Ne pas attendre la fin pour tout consigner.
3. **Les tests sont réels** : commande exécutée et résultat (`pass`, `fail`,
   `blocked`, `not_run`). Pas de « ça marche » sans commande.
4. **Pas de secret, pas de donnée personnelle, pas de texte bancaire réel.**
5. **Le bloc JSON fait foi.** Le titre au-dessus est là pour la lecture humaine.
6. **Avant chaque push** :

```bash
python3 scripts/check-evolution.py
```

7. Si une tâche est bloquée, `status: "blocked"` et `blockers` non vide.
8. Le journal est utilisé par les tests : le script doit passer avant chaque
   push. Le job CI est préparé dans `tasks/CI_JOB.yml` ; il bloque le push dès
   qu'il est activé par un mainteneur.

## 2. Format d'une entrée

Un titre lisible, puis un bloc de code JSON (délimité par trois backticks et le
mot `json`) avec les champs ci-dessous. Exemple de structure, en indentation :

    ## 2026-11-07T16:42:00+01:00 — Freedy — F0 — done

```json
{
  "timestamp": "2026-11-07T16:42:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F0",
  "status": "done",
  "summary": "Mise en place du dossier de tâches et du journal d'évolution",
  "files": [
    "tasks/README.md",
    "tasks/klein.md",
    "tasks/marius.md",
    "tasks/EVOLUTION.md",
    "scripts/check-evolution.py"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide au moment de la création"
    }
  ],
  "evidence": "tasks/EVOLUTION.md",
  "next": "F1 — charte UI, écrans et badges",
  "blockers": []
}
```

## 2026-11-07T17:05:00+01:00 — Freedy — F0 — done

```json
{
  "timestamp": "2026-11-07T17:05:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F0",
  "status": "done",
  "summary": "Ajout du prompt de reprise après pull/clone pour les trois lots",
  "files": [
    "tasks/START_PROMPT.md",
    "tasks/EVOLUTION.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide avec la nouvelle entrée"
    }
  ],
  "evidence": "tasks/START_PROMPT.md",
  "next": "F1 — charte UI, écrans et badges",
  "blockers": []
}
```

## 2026-11-07T18:20:00+01:00 — Freedy — F0 — done

```json
{
  "timestamp": "2026-11-07T18:20:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F0",
  "status": "done",
  "summary": "Réduction du périmètre à trois langues (fulfulde, ewondo, duala) dans la documentation et ajout des tâches K10 (retrait des autres langues) et K11 (messages FR/EN du site officiel)",
  "files": [
    "README.md",
    "docs/LANGUAGES.md",
    "docs/LANGUAGE_VALIDATION.md",
    "docs/TECHNICAL.md",
    "docs/PRESELECTION.md",
    "docs/SUBMISSION.md",
    "docs/COMPLIANCE.md",
    "docs/DATA_LICENSES.md",
    "docs/DATA_INTEGRATION.md",
    "extension/INSTALL.md",
    "extension/language-packs/README.md",
    "scripts/README.md",
    "scripts/import-language-pack.py",
    "data/site-officiel/README.md",
    "data/site-officiel/messages.fr-en.csv",
    "tasks/README.md",
    "tasks/klein.md",
    "tasks/marius.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide"
    }
  ],
  "evidence": "docs/LANGUAGES.md ; data/site-officiel/messages.fr-en.csv (70 messages, 35 niveau A)",
  "next": "Klein exécute K10 dans le code (registre, packs, tests) puis K11",
  "blockers": []
}
```

## 2026-11-07T18:45:00+01:00 — Klein — K10 — done

```json
{
  "timestamp": "2026-11-07T18:45:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K10",
  "status": "done",
  "summary": "Retrait de yemba, medumba, bassa et ghomala' du registre, des packs, du serveur, des scripts, des tests et de la documentation. Le prototype ne garde que fulfulde, ewondo et duala.",
  "files": [
    "extension/languages.js",
    "extension/language-packs/ybb.json",
    "extension/language-packs/byv.json",
    "extension/language-packs/bas.json",
    "extension/language-packs/bbj.json",
    "data/language-packs/ybb.csv",
    "data/language-packs/byv.csv",
    "data/language-packs/bas.csv",
    "data/language-packs/bbj.csv",
    "server/app.py",
    "server/test_api.py",
    "scripts/check-language-packs.py",
    "scripts/test-extension.js",
    "extension/manifest.json",
    "extension/manifest.firefox.json",
    "extension/manifest.universal.json",
    "extension/INSTALL.md",
    "extension/language-packs/README.md",
    "extension/popup.html",
    "scripts/README.md",
    "scripts/import-language-pack.py",
    "docs/LANGUAGE_VALIDATION.md",
    "docs/SUBMISSION_DOCUMENT.html"
  ],
  "tests": [
    {
      "command": "node scripts/test-extension.js",
      "result": "pass",
      "note": "registre à 3 langues, pack de test ewondo"
    },
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "3 packs, 2 feuilles, packs retirés absents"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "25 tests backend"
    },
    {
      "command": "./scripts/package-extension.sh",
      "result": "pass",
      "note": "ZIP 0.6.0 construit"
    }
  ],
  "evidence": "extension/languages.js contient fub, ewo, dua ; server/app.py PACK_TARGETS={ewo,dua} ; docs/SUBMISSION_DOCUMENT.html à 3 langues",
  "next": "K1 — recruter les 3 natifs fulfulde et obtenir les consentements",
  "blockers": []
}
```

## 2026-11-07T18:50:00+01:00 — Klein — K1 — blocked

```json
{
  "timestamp": "2026-11-07T18:50:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K1",
  "status": "blocked",
  "summary": "Un natif identifié pour chacune des trois langues ; il manque encore deux personnes par langue (second traducteur et arbitre) et les consentements signés.",
  "files": [
    "docs/CONSENT_TEMPLATE.md",
    "docs/LANGUAGE_VALIDATION.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "not_run",
      "note": "recrutement humain en attente"
    }
  ],
  "evidence": "docs/LANGUAGE_VALIDATION.md § 3bis : panel partiel 1 natif/langue",
  "next": "Faire signer les consentements et recruter le 2e traducteur + l'arbitre pour fub, ewo et dua",
  "blockers": [
    "2 personnes supplémentaires par langue",
    "consentements écrits non signés"
  ]
}
```

## 2026-11-07T18:52:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-07T18:52:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Glossaire passé de 20 à 40 termes, avec colonnes target_fub, target_ewo et target_dua, reviewers par langue et statut a_traduire.",
  "files": [
    "data/glossary.template.csv",
    "data/README.md"
  ],
  "tests": [
    {
      "command": "python3 -c \"import csv; assert len(list(csv.reader(open('data/glossary.template.csv'))))==41\"",
      "result": "pass",
      "note": "40 termes + en-tête"
    }
  ],
  "evidence": "data/glossary.template.csv : 40 lignes, cibles vides, statut a_traduire",
  "next": "Faire remplir et valider les 40 termes par les trois natifs",
  "blockers": []
}
```

## 2026-11-07T18:54:00+01:00 — Klein — K3 — blocked

```json
{
  "timestamp": "2026-11-07T18:54:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K3",
  "status": "blocked",
  "summary": "Les 102 phrases fulfulde sont prêtes dans fub.csv, dont les 37 P0 ; aucune cible native n'est encore saisie.",
  "files": [
    "data/language-packs/fub.csv"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "not_run",
      "note": "aucune entrée validée à importer"
    }
  ],
  "evidence": "data/language-packs/fub.csv : 102 phrases, status draft, target vide",
  "next": "Traducteur 1 remplit les 37 P0, traducteur 2 à l'aveugle, arbitrage, prétest",
  "blockers": [
    "un seul natif par langue",
    "aucune traduction native dans fub.csv"
  ]
}
```

## 2026-11-07T18:55:00+01:00 — Klein — K4 — blocked

```json
{
  "timestamp": "2026-11-07T18:55:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K4",
  "status": "blocked",
  "summary": "Les 102 phrases de la page sont présentes, mais les 65 phrases restantes ne peuvent pas être validées sans le panel complet.",
  "files": [
    "data/language-packs/fub.csv"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "not_run",
      "note": "dépend de K3"
    }
  ],
  "evidence": "fub.csv : 102 lignes, 0 validée",
  "next": "Compléter les 65 phrases après les 37 P0, avec la même procédure TRAPD",
  "blockers": [
    "panel incomplet",
    "dépend de K3"
  ]
}
```

## 2026-11-07T18:55:00+01:00 — Freedy — F0 — done

```json
{
  "timestamp": "2026-11-07T18:55:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F0",
  "status": "done",
  "summary": "Mise en place du dossier de travail dev (clone de develop à 55292c8) avec WORKSPACE.md",
  "files": [
    "WORKSPACE.md",
    "tasks/EVOLUTION.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide dans le clone"
    },
    {
      "command": "node scripts/test-extension.js",
      "result": "pass",
      "note": "registre, détection, packs, jetons"
    },
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "7 packs encore présents : K10 pas encore exécuté"
    }
  ],
  "evidence": "WORKSPACE.md ; commit initial 55292c8",
  "next": "F1 — charte UI ; Klein exécute K10 dans le domaine code",
  "blockers": []
}
```

## 2026-11-07T18:56:00+01:00 — Klein — K5 — blocked

```json
{
  "timestamp": "2026-11-07T18:56:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K5",
  "status": "blocked",
  "summary": "Rapport de validation et fiche de jugement des 20 phrases inédites créés ; ils ne peuvent pas être remplis sans traductions validées et sans natifs.",
  "files": [
    "docs/VALIDATION_REPORT.md",
    "docs/UNSEEN_JUDGMENT.csv"
  ],
  "tests": [
    {
      "command": "python3 -c \"import csv; assert len(list(csv.DictReader(open('docs/UNSEEN_JUDGMENT.csv'))))==20\"",
      "result": "pass",
      "note": "20 phrases prêtes à juger"
    }
  ],
  "evidence": "docs/VALIDATION_REPORT.md ; docs/UNSEEN_JUDGMENT.csv",
  "next": "Remplir le rapport après K3/K4 et faire juger les 20 phrases",
  "blockers": [
    "aucune traduction validée",
    "panel incomplet"
  ]
}
```

## 2026-11-07T18:57:00+01:00 — Klein — K6 — blocked

```json
{
  "timestamp": "2026-11-07T18:57:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K6",
  "status": "blocked",
  "summary": "Protocole audio et 15 phrases sans montant préparés ; aucun enregistrement ni consentement audio n'est encore disponible.",
  "files": [
    "data/audio/README.md",
    "data/audio/fub/phrases.csv",
    "data/audio/fub/index.template.json"
  ],
  "tests": [
    {
      "command": "python3 -c \"import csv; rows=list(csv.DictReader(open('data/audio/fub/phrases.csv'))); assert len(rows)==15 and all(r['has_amount']=='no' for r in rows)\"",
      "result": "pass",
      "note": "15 phrases sans montant"
    }
  ],
  "evidence": "data/audio/fub/phrases.csv : 15 lignes, has_amount=no",
  "next": "Enregistrer avec un natif, faire relire, signer les consentements, remplir index.json",
  "blockers": [
    "enregistrements absents",
    "consentements audio non signés"
  ]
}
```

## 2026-11-07T18:58:00+01:00 — Klein — K7 — done

```json
{
  "timestamp": "2026-11-07T18:58:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K7",
  "status": "done",
  "summary": "10 messages critiques disposent chacun de 3 variantes françaises et 3 variantes anglaises, avec niveau et note.",
  "files": [
    "data/site-officiel/messages.variants.csv"
  ],
  "tests": [
    {
      "command": "python3 -c \"import csv; rows=list(csv.DictReader(open('data/site-officiel/messages.variants.csv'))); assert len(rows)==10 and all(r['source_fr_v1'] and r['source_en_v3'] for r in rows)\"",
      "result": "pass",
      "note": "10 x 3 FR + 3 EN"
    }
  ],
  "evidence": "data/site-officiel/messages.variants.csv",
  "next": "Faire traduire ces variantes avec K11",
  "blockers": []
}
```

## 2026-11-07T18:59:00+01:00 — Klein — K8 — blocked

```json
{
  "timestamp": "2026-11-07T18:59:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K8",
  "status": "blocked",
  "summary": "Document d'orthographe créé ; la règle ɲ/ny est explicitement une hypothèse à valider, pas une règle appliquée.",
  "files": [
    "docs/ORTHOGRAPHY.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "not_run",
      "note": "validation native requise"
    }
  ],
  "evidence": "docs/ORTHOGRAPHY.md : table de validation vide, aucune normalisation automatique",
  "next": "Faire trancher ɲ/ny, les tons et les exceptions par les natifs",
  "blockers": [
    "validation native non faite"
  ]
}
```

## 2026-11-07T19:00:00+01:00 — Klein — K9 — done

```json
{
  "timestamp": "2026-11-07T19:00:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K9",
  "status": "done",
  "summary": "Verdicts de licence ajoutés pour OLC/ERDELAP, ANACLAC, SIL, NTeALan, Common Voice, Ewondo-ASR, NOODL et les dictionnaires non libres ; CENALA identifié comme béninois.",
  "files": [
    "docs/DATA_LICENSES.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "not_run",
      "note": "revue documentaire manuelle"
    }
  ],
  "evidence": "docs/DATA_LICENSES.md § Verdicts de licence — recherche du 7 novembre 2026",
  "next": "Faire signer les consentements de contribution et archiver les preuves",
  "blockers": []
}
```

## 2026-11-07T19:01:00+01:00 — Klein — K11 — in_progress

```json
{
  "timestamp": "2026-11-07T19:01:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K11",
  "status": "in_progress",
  "summary": "Les 70 messages officiels ont désormais des colonnes target_fub, target_ewo, target_dua, reviewers, reviewed_at et license ; les cibles restent vides.",
  "files": [
    "data/site-officiel/messages.fr-en.csv",
    "data/site-officiel/README.md"
  ],
  "tests": [
    {
      "command": "python3 -c \"import csv; rows=list(csv.DictReader(open('data/site-officiel/messages.fr-en.csv'))); assert len(rows)==70 and 'target_fub' in rows[0] and 'target_dua' in rows[0]\"",
      "result": "pass",
      "note": "70 messages, 14 colonnes"
    }
  ],
  "evidence": "data/site-officiel/messages.fr-en.csv : 70 lignes, cibles vides, statut a_traduire",
  "next": "Faire traduire les 70 messages par les natifs, priorité aux 35 niveau A",
  "blockers": [
    "traductions natives absentes"
  ]
}
```

## 2026-11-07T19:10:00+01:00 — Klein — K1 — in_progress

```json
{
  "timestamp": "2026-11-07T19:10:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K1",
  "status": "in_progress",
  "summary": "Kit natif T1/T2 et fiche d'arbitrage générés pour les trois langues ; consentement et panel restent à compléter (un natif identifié par langue, T2 et arbitre à recruter).",
  "files": [
    "data/review/README.md",
    "data/review/fulfulde.t1.csv",
    "data/review/fulfulde.t2.csv",
    "data/review/ewondo.t1.csv",
    "data/review/ewondo.t2.csv",
    "data/review/duala.t1.csv",
    "data/review/duala.t2.csv",
    "data/review/manifest.json",
    "scripts/make-native-kit.py",
    "scripts/check-native-kit.py",
    "scripts/merge-native-reviews.py",
    "scripts/import-native-reviews.py",
    "docs/CONSENT_TEMPLATE.md",
    "docs/LANGUAGE_VALIDATION.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/make-native-kit.py",
      "result": "pass",
      "note": "212/130/130 items"
    },
    {
      "command": "python3 scripts/check-native-kit.py",
      "result": "pass",
      "note": "T1/T2 synchronisés"
    },
    {
      "command": "python3 scripts/merge-native-reviews.py --lang fub --t1 <copie> --t2 <copie> --out <copie>",
      "result": "pass",
      "note": "simulation sur copie, 3 items"
    }
  ],
  "evidence": "data/review/manifest.json ; data/review/README.md ; docs/LANGUAGE_VALIDATION.md §3bis",
  "next": "Faire signer les consentements, recruter T2 et l'arbitre pour fub, ewo et dua, puis remplir les P0",
  "blockers": [
    "T2 et arbitre non recrutés pour les trois langues",
    "consentements non signés"
  ]
}
```

## 2026-11-07T19:11:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-07T19:11:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Glossaire de 40 termes intégré au kit natif ; 0 terme validé. Les cibles restent vides pour éviter toute invention.",
  "files": [
    "data/glossary.template.csv",
    "data/review/fulfulde.t1.csv",
    "data/review/ewondo.t1.csv",
    "data/review/duala.t1.csv",
    "docs/VALIDATION_REPORT.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "40 termes, 0 validé"
    }
  ],
  "evidence": "data/glossary.template.csv : 40 lignes ; kit natif : 40 items glossaire par langue",
  "next": "Faire traduire et arbitrer les 40 termes, puis importer via scripts/import-native-reviews.py",
  "blockers": [
    "panel TRAPD incomplet"
  ]
}
```

## 2026-11-07T19:12:00+01:00 — Klein — K3 — in_progress

```json
{
  "timestamp": "2026-11-07T19:12:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K3",
  "status": "in_progress",
  "summary": "Les 37 phrases P0 fulfulde sont dans le kit T1/T2 avec priorité P0 ; 0 validée. Le script d'import refuse une validation par une seule personne.",
  "files": [
    "data/language-packs/fub.csv",
    "data/review/fulfulde.t1.csv",
    "data/review/fulfulde.t2.csv",
    "scripts/import-native-reviews.py"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "fub 0/102 validée"
    },
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "feuille fub 102 lignes"
    }
  ],
  "evidence": "data/review/fulfulde.t1.csv : 37 items FUB-001..FUB-037 en P0",
  "next": "Faire remplir T1/T2 sur les 37 P0, arbitrer, puis importer",
  "blockers": [
    "T2 et arbitre non recrutés",
    "0 traduction native"
  ]
}
```

## 2026-11-07T19:13:00+01:00 — Klein — K4 — in_progress

```json
{
  "timestamp": "2026-11-07T19:13:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K4",
  "status": "in_progress",
  "summary": "Les 102 phrases fulfulde sont dans le kit ; les 65 P1 restent à traduire après les 37 P0.",
  "files": [
    "data/language-packs/fub.csv",
    "data/review/fulfulde.t1.csv",
    "data/review/fulfulde.t2.csv"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "102 phrases, 0 validée"
    }
  ],
  "evidence": "data/review/fulfulde.t1.csv : 102 items type phrase",
  "next": "Traduire les 65 P1 avec la même procédure TRAPD",
  "blockers": [
    "dépend de K3",
    "panel incomplet"
  ]
}
```

## 2026-11-07T19:14:00+01:00 — Klein — K5 — in_progress

```json
{
  "timestamp": "2026-11-07T19:14:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K5",
  "status": "in_progress",
  "summary": "Pré-évaluation mécanique des 20 phrases inédites : 12 sorties acceptées, 8 refusées automatiquement (montant, terme ou jeton perdu). Le jugement natif reste à remplir.",
  "files": [
    "docs/UNSEEN_JUDGMENT.csv",
    "docs/VALIDATION_REPORT.md",
    "scripts/generate-unseen-fub.py",
    "docs/EVAL.md"
  ],
  "tests": [
    {
      "command": "server/.venv/bin/python scripts/generate-unseen-fub.py --batch-size 2",
      "result": "pass",
      "note": "12 mt_eval, 8 rejected_auto"
    },
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "20 lignes unseen"
    }
  ],
  "evidence": "docs/UNSEEN_JUDGMENT.csv : candidate_status mt_eval 12 / rejected_auto 8",
  "next": "Faire juger les 12 sorties acceptées acceptable/trompeur/faux par un natif",
  "blockers": [
    "jugement natif non fait"
  ]
}
```

## 2026-11-07T19:15:00+01:00 — Klein — K6 — in_progress

```json
{
  "timestamp": "2026-11-07T19:15:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K6",
  "status": "in_progress",
  "summary": "Protocole audio et 15 phrases sans montant prêts ; 0 enregistrement et 0 relecture.",
  "files": [
    "data/audio/README.md",
    "data/audio/fub/phrases.csv",
    "data/audio/fub/index.template.json"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "15 phrases, has_amount=no"
    }
  ],
  "evidence": "data/audio/fub/phrases.csv : 15 lignes",
  "next": "Enregistrer avec un natif, faire relire, signer les consentements",
  "blockers": [
    "enregistrements absents",
    "consentements audio non signés"
  ]
}
```

## 2026-11-07T19:16:00+01:00 — Klein — K8 — blocked

```json
{
  "timestamp": "2026-11-07T19:16:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K8",
  "status": "blocked",
  "summary": "Document d'orthographe prêt ; la règle ɲ/ny, les tons et les exceptions restent à trancher par les natifs. Aucun normaliseur automatique n'est activé.",
  "files": [
    "docs/ORTHOGRAPHY.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "aucune normalisation appliquée"
    }
  ],
  "evidence": "docs/ORTHOGRAPHY.md : table de validation vide",
  "next": "Faire trancher ɲ/ny, les tons et les exceptions par les trois panels",
  "blockers": [
    "validation native non faite"
  ]
}
```

## 2026-11-07T19:17:00+01:00 — Klein — K9 — in_progress

```json
{
  "timestamp": "2026-11-07T19:17:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K9",
  "status": "in_progress",
  "summary": "Verdicts de licence et consentement cadre ajoutés ; le kit natif impose CC0-1.0 ou CC-BY-4.0 et la provenance human. Les signatures restent à obtenir.",
  "files": [
    "docs/DATA_LICENSES.md",
    "docs/CONSENT_TEMPLATE.md",
    "data/review/README.md",
    "scripts/import-language-pack.py",
    "scripts/check-language-packs.py"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "licence et provenance contrôlées"
    }
  ],
  "evidence": "docs/DATA_LICENSES.md § Packs communautaires ; scripts/import-language-pack.py",
  "next": "Faire signer les consentements et archiver les preuves hors dépôt",
  "blockers": [
    "consentements non signés"
  ]
}
```

## 2026-11-07T19:18:00+01:00 — Klein — K11 — in_progress

```json
{
  "timestamp": "2026-11-07T19:18:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K11",
  "status": "in_progress",
  "summary": "Les 70 messages du site et les 40 termes sont dans les classeurs natifs T1/T2 ; 0 message traduit. Le schéma par langue sépare cible, statut, relecteur, date, licence et provenance.",
  "files": [
    "data/site-officiel/messages.fr-en.csv",
    "data/review/fulfulde.t1.csv",
    "data/review/ewondo.t1.csv",
    "data/review/duala.t1.csv",
    "data/site-officiel/README.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "70 messages, 35 A / 35 B, 0 validé"
    },
    {
      "command": "python3 scripts/check-native-kit.py",
      "result": "pass",
      "note": "70 messages par classeur"
    }
  ],
  "evidence": "data/review/fulfulde.t1.csv : 70 items type message ; data/site-officiel/messages.fr-en.csv : 24 colonnes",
  "next": "Faire traduire les 35 messages niveau A en priorité, puis les 35 niveau B",
  "blockers": [
    "traductions natives absentes",
    "panel TRAPD incomplet"
  ]
}
```

## 2026-11-07T19:20:00+01:00 — Klein — K1 — in_progress

```json
{
  "timestamp": "2026-11-07T19:20:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K1",
  "status": "in_progress",
  "summary": "Ajout d'un mode brouillon pour conserver le travail d'un seul natif sans validation : les cibles sont enregistrées en en_cours/draft et l'extension continue d'afficher l'original.",
  "files": [
    "scripts/import-draft-kit.py",
    "data/review/README.md",
    "scripts/README.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/import-draft-kit.py --lang fub --dry-run",
      "result": "pass",
      "note": "simulation sur copie, 1 glossaire + 1 message + 1 phrase"
    },
    {
      "command": "python3 scripts/import-draft-kit.py --lang fub",
      "result": "pass",
      "note": "statuts en_cours/draft, 0 validée"
    }
  ],
  "evidence": "scripts/import-draft-kit.py ; data/review/README.md § Mode un seul natif",
  "next": "Utiliser ce mode pour capturer T1, puis recruter T2 et l'arbitre pour valider",
  "blockers": [
    "T2 et arbitre non recrutés",
    "consentements non signés"
  ]
}
```

## 2026-11-07T19:21:00+01:00 — Klein — K5 — in_progress

```json
{
  "timestamp": "2026-11-07T19:21:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K5",
  "status": "in_progress",
  "summary": "Ajout du script d'import des verdicts natifs sur les 20 phrases inédites ; les verdicts restent vides et le script exige relecteur et date ISO.",
  "files": [
    "scripts/import-unseen-judgment.py",
    "data/review/README.md",
    "scripts/README.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/import-unseen-judgment.py --review <copie> --canonical <copie> --dry-run",
      "result": "pass",
      "note": "1 verdict simulé"
    },
    {
      "command": "python3 scripts/import-unseen-judgment.py --review <copie> --canonical <copie>",
      "result": "pass",
      "note": "verdict importé sur copie"
    }
  ],
  "evidence": "scripts/import-unseen-judgment.py ; data/review/unseen_judgment.csv",
  "next": "Faire remplir les verdicts par un natif, puis importer et remplir le rapport",
  "blockers": [
    "jugement natif non fait"
  ]
}
```

## 2026-11-07T19:22:00+01:00 — Klein — K11 — in_progress

```json
{
  "timestamp": "2026-11-07T19:22:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K11",
  "status": "in_progress",
  "summary": "Ajout d'un fragment CI pour les données linguistiques et le kit natif ; il reste à l'intégrer dans .github/workflows/ci.yml avec un token workflow.",
  "files": [
    "tasks/CI_JOB.yml"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "70 messages, 40 termes"
    },
    {
      "command": "python3 scripts/check-native-kit.py",
      "result": "pass",
      "note": "212/130/130"
    }
  ],
  "evidence": "tasks/CI_JOB.yml § language-data",
  "next": "Intégrer le job dans la CI avec un token scope workflow",
  "blockers": [
    "token GitHub scope workflow absent"
  ]
}
```

## 2026-11-07T19:23:00+01:00 — Klein — K11 — in_progress

```json
{
  "timestamp": "2026-11-07T19:23:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K11",
  "status": "in_progress",
  "summary": "Intégration effective des jobs CI journal d'évolution et données linguistiques dans .github/workflows/ci.yml ; le token GitHub dispose du scope workflow.",
  "files": [
    ".github/workflows/ci.yml",
    "tasks/CI_JOB.yml"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "26 entrées"
    },
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "70 messages, 40 termes"
    },
    {
      "command": "python3 scripts/check-native-kit.py",
      "result": "pass",
      "note": "212/130/130"
    }
  ],
  "evidence": ".github/workflows/ci.yml § process et language-data",
  "next": "Attendre la CI verte sur la PR, puis merger",
  "blockers": []
}
```

## 2026-11-07T19:30:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-07T19:30:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Ajout d'un navigateur de références pour les 40 termes du glossaire : liens Glosbe, Webonary, Resulam et SIL Cameroon, sans aucune traduction copiée.",
  "files": [
    "data/reference/README.md",
    "data/reference/glossary-links.csv",
    "scripts/build-reference-links.py",
    "data/review/README.md",
    "data/README.md",
    "scripts/README.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/build-reference-links.py",
      "result": "pass",
      "note": "40 termes"
    },
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "références 40 synchronisées"
    }
  ],
  "evidence": "data/reference/glossary-links.csv : 40 lignes, aucune cible copiée",
  "next": "Faire utiliser ces liens par les natifs et documenter la source dans commentaire",
  "blockers": [
    "panel TRAPD incomplet"
  ]
}
```

## 2026-11-07T19:31:00+01:00 — Klein — K9 — in_progress

```json
{
  "timestamp": "2026-11-07T19:31:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K9",
  "status": "in_progress",
  "summary": "Audit Glosbe, Resulam et Webonary : Glosbe interdit la copie automatisée et son contenu est CC BY-NC-SA ; Resulam est payant sans licence ouverte ; Webonary reste sous copyright par dictionnaire. Verdict : référence manuelle uniquement.",
  "files": [
    "docs/REFERENCE_SOURCES.md",
    "docs/DATA_LICENSES.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-language-data.py",
      "result": "pass",
      "note": "aucune donnée externe dans les packs"
    }
  ],
  "evidence": "docs/REFERENCE_SOURCES.md : CGU Glosbe, robots.txt Webonary, produits Resulam",
  "next": "Demander une autorisation écrite si un partenaire veut fournir un lexique",
  "blockers": [
    "aucune autorisation écrite de Glosbe, Resulam ou SIL"
  ]
}
```

## 2026-11-07T19:40:00+01:00 — Klein — K2 — blocked

```json
{
  "timestamp": "2026-11-07T19:40:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "blocked",
  "summary": "Audit des huit fichiers d'entraînement : aucun n'est utilisable en l'état. La Bible ewondo est © Bible Society of Cameroon malgré le tag CC-BY de HF ; les Parquet audio n'ont pas de licence ; les CSV Favourez sont sans licence et issus d'un scraping de Bible.com.",
  "files": [
    "docs/TRAINING_DATA_AUDIT.md",
    "data/training/README.md",
    "data/training/sources.csv",
    "scripts/check-training-data.py",
    "docs/DATA_LICENSES.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-training-data.py",
      "result": "pass",
      "note": "8 sources : 7 bloquées, 1 sous autorisation, 0 utilisable"
    },
    {
      "command": "sha256sum des 8 fichiers",
      "result": "pass",
      "note": "empreintes consignées dans sources.csv"
    }
  ],
  "evidence": "docs/TRAINING_DATA_AUDIT.md ; Bible.com v1854 : © Bible Society of Cameroon, 2012",
  "next": "Demander une autorisation écrite à la Bible Society, OlameMend et Favourez",
  "blockers": [
    "aucune donnée parallèle français-ewondo libre",
    "Bible ewondo sous copyright",
    "audio sans licence",
    "CSV sans licence"
  ]
}
```

## 2026-11-07T19:41:00+01:00 — Klein — K9 — in_progress

```json
{
  "timestamp": "2026-11-07T19:41:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K9",
  "status": "in_progress",
  "summary": "Ajout des modèles de demande d'autorisation pour la Bible Society of Cameroon, OlameMend, Favourez et le corpus NOODL ; checklist de preuve et mise à jour du manifeste.",
  "files": [
    "docs/DATA_PERMISSIONS.md",
    "data/training/README.md",
    "docs/DATA_LICENSES.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-training-data.py",
      "result": "pass",
      "note": "manifeste cohérent"
    }
  ],
  "evidence": "docs/DATA_PERMISSIONS.md : quatre modèles + checklist",
  "next": "Envoyer les demandes et archiver les réponses hors dépôt",
  "blockers": [
    "réponses des détenteurs non obtenues"
  ]
}
```

## 2026-11-07T19:55:00+01:00 — Freedy — F1 — done

```json
{
  "timestamp": "2026-11-07T19:55:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F1",
  "status": "done",
  "summary": "Popup redessiné en console compacte 380x428 : listbox des trois langues, arrondis cohérents, captures README et états test/confidentialité/erreur mis à jour.",
  "files": [
    "extension/popup.html",
    "extension/popup.css",
    "extension/popup.js",
    "scripts/preview-popup.mjs",
    "README.md",
    "PRODUCT.md",
    "docs/DESIGN.md",
    "WORKSPACE.md",
    ".impeccable/surfaces/popup.md",
    "docs/assets/popup-redesign.png",
    "docs/assets/popup-redesign-list.png",
    "docs/assets/popup-redesign-test.png",
    "docs/assets/popup-redesign-privacy.png",
    "docs/assets/popup-redesign-error.png",
    "docs/assets/popup-redesign-wide.png",
    "docs/assets/popup-redesign-real.png",
    "docs/assets/popup-redesign-real-list.png"
  ],
  "tests": [
    {
      "command": "node scripts/preview-popup.mjs",
      "result": "pass",
      "note": "états fermé, liste, test, confidentialité, erreur, large"
    },
    {
      "command": "impeccable detect extension/popup.html extension/popup.css extension/popup.js",
      "result": "pass",
      "note": "0 anti-pattern"
    },
    {
      "command": "chargement réel de l'extension Chrome",
      "result": "pass",
      "note": "3 langues, 380x428 fermé, 528 ouvert, 0 erreur page"
    },
    {
      "command": "node scripts/test-extension.js",
      "result": "pass",
      "note": "registre, détection, packs, jetons, qualité"
    }
  ],
  "evidence": "docs/assets/popup-redesign.png ; docs/assets/popup-redesign-list.png ; README.md § Aperçu",
  "next": "Merger design/popup dans develop et pousser",
  "blockers": []
}
```

## 2026-11-07T20:00:00+01:00 — Freedy — F1 — done

```json
{
  "timestamp": "2026-11-07T20:00:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F1",
  "status": "done",
  "summary": "Correction du libellé visible : Duala (code dua), remplace Douala dans le registre, le pack et le serveur.",
  "files": [
    "extension/languages.js",
    "extension/language-packs/dua.json",
    "server/app.py",
    "docs/assets/popup-redesign-list.png",
    "docs/assets/popup-redesign-real-list.png"
  ],
  "tests": [
    {
      "command": "node scripts/test-extension.js",
      "result": "pass",
      "note": "registre, détection, packs, jetons, qualité"
    },
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "3 fichiers, 3 feuilles"
    },
    {
      "command": "chargement réel de l'extension Chrome",
      "result": "pass",
      "note": "options Fulfulde, Ewondo, Duala ; 0 erreur"
    }
  ],
  "evidence": "docs/assets/popup-redesign-list.png : ligne Duala",
  "next": "Pousser la correction sur develop",
  "blockers": []
}
```

## 2026-11-07T20:00:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-07T20:00:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Audit du zip Langue.zip : le corpus anglais-duala (15 351 paires, CC-BY-4.0) est utilisable ; les textes ewondo et fulfulde restent sous autorisation (Bible/YouVersion). Le code africa-corpus-builder est MIT.",
  "files": [
    "docs/TRAINING_DATA_AUDIT.md",
    "data/training/sources.csv",
    "data/training/README.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-training-data.py",
      "result": "pass",
      "note": "11 sources : 7 bloquées, 3 sous autorisation, 1 utilisable"
    }
  ],
  "evidence": "docs/TRAINING_DATA_AUDIT.md §5bis ; data/training/sources.csv",
  "next": "Entraîner le modèle anglais → duala et documenter les limites",
  "blockers": [
    "pas de paire français-duala",
    "ewondo et fulfulde non autorisés"
  ]
}
```

## 2026-11-07T20:01:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-07T20:01:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Ajout du script d'entraînement anglais → duala (Marian, encodeur gelé) et du document de suivi ; pilote lancé sur 2 000 paires en CPU.",
  "files": [
    "scripts/train-duala-mt.py",
    "docs/DUALA_MT.md",
    "scripts/README.md"
  ],
  "tests": [
    {
      "command": "server/.venv/bin/python scripts/train-duala-mt.py --csv ... --max-pairs 2000 --dry-run",
      "result": "pass",
      "note": "2 000 paires propres"
    },
    {
      "command": "server/.venv/bin/python scripts/train-duala-mt.py --csv ... --max-pairs 2000 --epochs 1",
      "result": "not_run",
      "note": "pilote en cours"
    }
  ],
  "evidence": "scripts/train-duala-mt.py ; docs/DUALA_MT.md",
  "next": "Lire metrics.json et les exemples générés, puis compléter la note",
  "blockers": [
    "entraînement CPU lent",
    "qualité non validée"
  ]
}
```

## 2026-11-07T20:30:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-07T20:30:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Pilote anglais → duala entraîné sur 2 000 paires CC-BY-4.0 : loss validation 4,22 en 11 min CPU, mais générations répétitives et fuite de français. Modèle conservé localement, non intégré.",
  "files": [
    "scripts/train-duala-mt.py",
    "scripts/translate-duala-pivot.py",
    "docs/DUALA_MT.md",
    "data/training/README.md"
  ],
  "tests": [
    {
      "command": "server/.venv/bin/python scripts/train-duala-mt.py --csv ... --max-pairs 2000 --epochs 1",
      "result": "pass",
      "note": "450 steps, train 5,10, valid 4,22, 682 s"
    },
    {
      "command": "python3 scripts/check-training-data.py",
      "result": "pass",
      "note": "1 source usable (Duala), 3 sous autorisation"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide"
    }
  ],
  "evidence": "docs/DUALA_MT.md §4 ; dist/models/duala-en-pilot/metrics.json",
  "next": "Passer au corpus complet/GPU ou intégrer le pivot côté Marius après évaluation native",
  "blockers": [
    "qualité insuffisante",
    "pas de paire français-duala",
    "ewondo/fulfulde non autorisés"
  ]
}
```

## 2026-11-07T20:35:00+01:00 — Klein — K2 — blocked

```json
{
  "timestamp": "2026-11-07T20:35:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "blocked",
  "summary": "Test du pivot français → anglais → duala : la phrase « Votre solde est disponible » sort en répétition (« Nde nde nje ba ba ba... »). Le modèle pilote n'est pas utilisable pour la démo.",
  "files": [
    "scripts/translate-duala-pivot.py",
    "docs/DUALA_MT.md"
  ],
  "tests": [
    {
      "command": "server/.venv/bin/python scripts/translate-duala-pivot.py --model dist/models/duala-en-pilot --text 'Votre solde est disponible.'",
      "result": "fail",
      "note": "sortie répétitive, non exploitable"
    }
  ],
  "evidence": "docs/DUALA_MT.md §4 ; log local dist/logs/duala-en-pilot.log",
  "next": "Corpus complet + GPU + décodage contraint, ou abandon du MT duala pour le niveau A",
  "blockers": [
    "qualité insuffisante",
    "pas de paire français-duala",
    "pas de GPU compatible"
  ]
}
```

## 2026-11-08T06:14:00+01:00 — Marius — M1 — done

```json
{
  "timestamp": "2026-11-08T06:14:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M1",
  "status": "done",
  "summary": "Reprise depuis main 87941b4 : suppression de blockContext() et du champ context dans le message content → background → /translate. Ajout de tests/privacy.test.js (rouge avant : textarea, zone data-sensitive et montants bruts dans context ; vert après) et de tests/README.md ; la CI exécute désormais le test de confidentialité.",
  "files": [
    "extension/content.js",
    "extension/background.js",
    "tests/privacy.test.js",
    "tests/README.md",
    ".github/workflows/ci.yml"
  ],
  "tests": [
    {
      "command": "node tests/privacy.test.js",
      "result": "pass",
      "note": "rouge avant correctif : context contenait CONFIDENTIEL, 9876, CODE-1234, 1 000 et 25 000 ; vert après"
    },
    {
      "command": "node tests/content.test.js",
      "result": "pass",
      "note": "texte, attributs, jetons, restauration"
    },
    {
      "command": "node scripts/test-extension.js",
      "result": "pass",
      "note": "registre, détection, packs, jetons, qualité"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "25 passed"
    },
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "3 fichiers, 3 feuilles"
    },
    {
      "command": "node --check extension/background.js && node --check extension/content.js",
      "result": "pass",
      "note": "syntaxe JS"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "tests/privacy.test.js ; avant : context='Votre code confidentiel est requis. CONFIDENTIEL — dossier 9876 Code secret : CODE-1234' ; après : aucun champ context dans NK_TRANSLATE_SEGMENTS ; sortie « privacy OK — aucun context, aucune valeur de formulaire dans les messages »",
  "next": "M2 — retirer MyMemory du chemin de démo : cloudAllowed() en opt-in explicite, case décochée par défaut, parcours pack-only sans réseau",
  "blockers": []
}
```

## 2026-11-08T06:22:00+01:00 — Marius — M2 — done

```json
{
  "timestamp": "2026-11-08T06:22:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M2",
  "status": "done",
  "summary": "MyMemory n'est plus autorisé par défaut : cloudAllowed() exige nkCloudFallback === true, la case du popup est décochée et son texte décrit l'opt-in. Ajout de tests/cloud-gating.test.js : pack validé sans aucune requête réseau, cloud jamais appelé sans opt-in, appel cloud seulement avec opt-in.",
  "files": [
    "extension/background.js",
    "extension/popup.js",
    "extension/popup.html",
    "tests/cloud-gating.test.js",
    "tests/README.md",
    ".github/workflows/ci.yml"
  ],
  "tests": [
    {
      "command": "node tests/cloud-gating.test.js",
      "result": "pass",
      "note": "rouge avant : MyMemory appelé sans opt-in ; vert après ; hit de pack avec 0 requête réseau"
    },
    {
      "command": "node tests/privacy.test.js",
      "result": "pass",
      "note": "non-régression M1"
    },
    {
      "command": "node tests/content.test.js",
      "result": "pass",
      "note": "texte, attributs, jetons, restauration"
    },
    {
      "command": "node scripts/test-extension.js",
      "result": "pass",
      "note": "registre, détection, packs, jetons, qualité"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "25 passed"
    },
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "3 fichiers, 3 feuilles"
    },
    {
      "command": "node --check extension/background.js && node --check extension/popup.js",
      "result": "pass",
      "note": "syntaxe JS"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "avant : https://api.mymemory.translated.net/get?... appelé sans opt-in ; après : aucun appel cloud avec stockage vide, appel uniquement avec nkCloudFallback=true, pack ewo simulé avec 0 requête ; sortie « cloud-gating OK — pack sans réseau, cloud off par défaut, opt-in respecté »",
  "next": "M4 — détecteur de collisions de packs (M3 reste bloqué par les packs vides de Klein)",
  "blockers": []
}
```

## 2026-11-08T06:26:00+01:00 — Marius — M4 — done

```json
{
  "timestamp": "2026-11-08T06:26:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M4",
  "status": "done",
  "summary": "Ajout de scripts/check-pack-collisions.py : normalisation NFC/casse/espaces des sources et cibles, détection de deux sources différentes pour une même cible, codes 0/1/2. Le script est exécuté par package-extension.sh et par la CI ; tests/check-pack-collisions.test.py couvre collision, normalisation, doublon de source et pack invalide.",
  "files": [
    "scripts/check-pack-collisions.py",
    "tests/check-pack-collisions.test.py",
    "scripts/package-extension.sh",
    ".github/workflows/ci.yml",
    "scripts/README.md",
    "tests/README.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-pack-collisions.py",
      "result": "pass",
      "note": "3 packs actuels, 0 collision"
    },
    {
      "command": "python3 tests/check-pack-collisions.test.py",
      "result": "pass",
      "note": "6 cas : cibles distinctes, collision, normalisation, doublon de source, JSON invalide, entries absent"
    },
    {
      "command": "./scripts/package-extension.sh",
      "result": "pass",
      "note": "contrôle exécuté avant build ; 3 ZIP de 369 Ko"
    },
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "3 fichiers, 3 feuilles"
    },
    {
      "command": "node tests/privacy.test.js && node tests/cloud-gating.test.js",
      "result": "pass",
      "note": "non-régression M1/M2"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "25 passed"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "sortie « Collisions OK — 3 pack(s), aucune cible partagée par deux sources différentes » ; test « check-pack-collisions OK — 6 cas » ; build « Collisions OK » puis 3 ZIP",
  "next": "M13 — verrou de concurrence backend (deux requêtes FR/EN simultanées)",
  "blockers": []
}
```

## 2026-11-08T06:30:00+01:00 — Marius — M13 — done

```json
{
  "timestamp": "2026-11-08T06:30:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M13",
  "status": "done",
  "summary": "Le tokenizer NLLB partagé a désormais une section critique verrouillée : _MODEL_LOCK couvre src_lang, l'encodage, la génération et le décodage dans _generate_locked(). Test concurrent FR/EN avec tokenizer factice : il échoue sans verrou et passe avec.",
  "files": [
    "server/app.py",
    "server/test_api.py"
  ],
  "tests": [
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "26 passed, dont test_concurrent_sources_do_not_mix"
    },
    {
      "command": "vérification de sensibilité sans verrou",
      "result": "pass",
      "note": "avec _MODEL_LOCK remplacé par nullcontext, le test échoue ; le verrou est donc bien couvert"
    },
    {
      "command": "python3 -m py_compile server/app.py server/test_api.py",
      "result": "pass",
      "note": "syntaxe Python"
    },
    {
      "command": "node tests/privacy.test.js && node tests/cloud-gating.test.js && node tests/content.test.js",
      "result": "pass",
      "note": "non-régression extension"
    },
    {
      "command": "python3 scripts/check-language-packs.py && python3 scripts/check-pack-collisions.py",
      "result": "pass",
      "note": "packs et collisions"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "server/app.py _MODEL_LOCK + _generate_locked ; sortie pytest « 26 passed » ; sans verrou : « OK — échoue sans verrou » (AssertionError)",
  "next": "M10 — packaging et CI : build Firefox, web-ext lint, 3 ZIP, documentation du statut",
  "blockers": []
}
```

## 2026-11-08T06:36:00+01:00 — Marius — M10 — in_progress

```json
{
  "timestamp": "2026-11-08T06:36:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M10",
  "status": "in_progress",
  "summary": "Packaging vérifié localement : 3 ZIP de 377 Ko (< 10 Mo) avec contrôle de collisions avant build, build Firefox et web-ext lint à 0 erreur/warning/notice, manifests valides, scan de secrets et suite CI équivalente verte. Restent la CI GitHub distante et le chargement réel des ZIP dans Chrome/Firefox.",
  "files": [
    "docs/SUBMISSION.md",
    "tests/README.md"
  ],
  "tests": [
    {
      "command": "./scripts/package-extension.sh",
      "result": "pass",
      "note": "3 ZIP : 376965, 377097 et 377069 octets ; contrôle collisions exécuté"
    },
    {
      "command": "./scripts/build-firefox.sh && npx --yes web-ext lint --source-dir dist/firefox",
      "result": "pass",
      "note": "0 erreur, 0 warning, 0 notice"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "26 passed"
    },
    {
      "command": "node tests/content.test.js && node tests/privacy.test.js && node tests/cloud-gating.test.js",
      "result": "pass",
      "note": "jsdom : contenu, confidentialité, verrou cloud"
    },
    {
      "command": "python3 scripts/check-language-packs.py && python3 scripts/check-pack-collisions.py && python3 tests/check-pack-collisions.test.py",
      "result": "pass",
      "note": "packs, collisions, 6 cas"
    },
    {
      "command": "validation JSON des 3 manifests + scan de secrets CI",
      "result": "pass",
      "note": "manifests ok ; aucun motif de secret"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "ZIP : dist/nkaplingua-extension.zip 377097 octets ; web-ext « errors 0 / notices 0 / warnings 0 » ; statut local documenté dans docs/SUBMISSION.md et tests/README.md",
  "next": "Pousser puis vérifier la CI GitHub, charger nkaplingua-chrome.zip et nkaplingua-firefox.zip dans Chrome/Firefox réels, puis repasser M10 en done",
  "blockers": [
    "CI GitHub non observée : aucun push effectué",
    "ZIP non chargés dans Chrome/Firefox réels sur ce poste"
  ]
}
```

## 2026-11-08T06:44:00+01:00 — Marius — M3 — in_progress

```json
{
  "timestamp": "2026-11-08T06:44:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M3",
  "status": "in_progress",
  "summary": "Classification A/B par segment : un terme critique (solde, frais, total, bénéficiaire, PIN/OTP, confirmer, annuler, erreur, sécurité, réessayer, référence) force le pack validé uniquement. Si le pack ne contient pas la phrase, l'original est conservé avec raison untranslated_critical et aucun appel local/cloud. Le content script pose l'attribut data-nk-untranslated ; le badge visuel reste à styler avec Freedy.",
  "files": [
    "extension/background.js",
    "extension/content.js",
    "tests/criticality.test.js",
    "tests/cloud-gating.test.js",
    "tests/README.md",
    ".github/workflows/ci.yml"
  ],
  "tests": [
    {
      "command": "node tests/criticality.test.js",
      "result": "pass",
      "note": "A absent du pack : original + untranslated_critical, 0 requête ; A pack validé : pack ; A cible MT + cloud autorisé : 0 appel MT ; B : MT autorisée"
    },
    {
      "command": "node tests/cloud-gating.test.js",
      "result": "pass",
      "note": "phrase de test passée en niveau B pour ne pas confondre M2 et M3"
    },
    {
      "command": "node tests/privacy.test.js && node tests/content.test.js",
      "result": "pass",
      "note": "non-régression M1 et DOM"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "26 passed"
    },
    {
      "command": "python3 scripts/check-language-packs.py && python3 scripts/check-pack-collisions.py",
      "result": "pass",
      "note": "packs et collisions"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "sortie « criticality OK — niveau A pack-only, zéro MT, niveau B autorisé » ; background.js classifyCriticality + untranslated_critical ; content.js data-nk-untranslated",
  "next": "Appliquer le badge visuel « non traduit » dès que Freedy fournit le style, puis reprendre M7 sur navigateur réel",
  "blockers": [
    "Badge visuel par segment non stylé : dépend de Freedy (F1)",
    "Test navigateur réel bloqué sur ce poste : Chrome branded refuse --load-extension, Chromium de test crashe (crashpad)"
  ]
}
```

## 2026-11-08T06:52:00+01:00 — Marius — M10 — in_progress

```json
{
  "timestamp": "2026-11-08T06:52:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M10",
  "status": "in_progress",
  "summary": "Après push de a89e427, la CI GitHub est verte sur develop et marius : 5 jobs sur 5 (backend, journal, données linguistiques, extension, scan de secrets) pour chaque run. Les docs de soumission et tests/README ne disent plus que la CI est non observée. Reste uniquement le chargement réel des ZIP dans Chrome/Firefox.",
  "files": [
    "docs/SUBMISSION.md",
    "tests/README.md"
  ],
  "tests": [
    {
      "command": "gh run view 42451073346 --json jobs",
      "result": "pass",
      "note": "develop : Backend, Journal, Secret scan, Données linguistiques, Extension — tous success"
    },
    {
      "command": "gh run view 42451073378 --json jobs",
      "result": "pass",
      "note": "marius : 5 jobs success"
    },
    {
      "command": "gh run view 42451073346/42451073378 --json status,conclusion",
      "result": "pass",
      "note": "completed / success pour les deux runs"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "https://github.com/TSEFACKDEV/safinum-nkaplingua/actions/runs/42451073346 et /42451073378 ; jobs listés en succès ; docs/SUBMISSION.md § État vérifié",
  "next": "Charger nkaplingua-chrome.zip et nkaplingua-firefox.zip dans des navigateurs réels, puis repasser M10 en done",
  "blockers": [
    "ZIP non chargés dans Chrome/Firefox réels sur ce poste"
  ]
}
```

## 2026-11-08T07:00:00+01:00 — Marius — M7 — in_progress

```json
{
  "timestamp": "2026-11-08T07:00:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M7",
  "status": "in_progress",
  "summary": "Test réel Chrome for Testing 158 sur safinum.cm/hackathon-test : 5 étapes + bascule EN, 23 à 45 segments traduits par étape, 10 à 13 segments niveau A laissés en français, 0 pageerror/console.error, montants/noms/téléphone/références préservés, champs et boutons du site intacts, restauration exacte. Le test a révélé que les références SAF-2026-XXXX n'étaient pas tokenisées : correctif dans languages.js/content.js + tests. Firefox reste à tester.",
  "files": [
    "extension/languages.js",
    "extension/content.js",
    "scripts/test-extension.js",
    "tests/content.test.js",
    "docs/SITE_TEST_2026-11-08.md",
    "tests/README.md"
  ],
  "tests": [
    {
      "command": "node .cache/m7/m7_test.js (harnais Playwright local)",
      "result": "pass",
      "note": "5 étapes + EN : 36/29/23/29/28/45 segments traduits, 10/12/11/13/11/1 niveau A, 0 erreur page, montants et références préservés, restauration exacte"
    },
    {
      "command": "node scripts/test-extension.js",
      "result": "pass",
      "note": "référence SAF-2026-AB12CD tokenisée puis restaurée"
    },
    {
      "command": "node tests/content.test.js",
      "result": "pass",
      "note": "référence préservée dans le DOM après traduction"
    },
    {
      "command": "node tests/privacy.test.js && node tests/cloud-gating.test.js && node tests/criticality.test.js",
      "result": "pass",
      "note": "non-régression M1/M2/M3"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "26 passed"
    },
    {
      "command": "python3 scripts/check-language-packs.py && python3 scripts/check-pack-collisions.py",
      "result": "pass",
      "note": "packs et collisions"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "docs/SITE_TEST_2026-11-08.md ; sortie « M7 OK — 5 étapes + EN, montants/noms/références préservés, boutons intacts, 0 erreur » ; avant correctif : « 4-recapitulatif: référence perdue SAF-2026-OMMWS3 »",
  "next": "Tester Firefox avec un binaire chargeable, puis couvrir les iframes et Shadow DOM fermés (M12)",
  "blockers": [
    "Firefox non testé : Snap Firefox ne peut pas créer son profil (système de fichiers en lecture seule) et web-ext run n'accepte pas --headless"
  ]
}
```

## 2026-11-08T07:15:00+01:00 — Marius — M5 — done

```json
{
  "timestamp": "2026-11-08T07:15:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M5",
  "status": "done",
  "summary": "Le contrôle lexical glossaire est intégré à l'import : pour chaque terme validé de la langue cible, si la source contient le terme, la cible doit contenir exactement la traduction validée ; sinon l'import est refusé. Ajout de tests/import-glossary.test.py (5 cas). Le backend protège/restaure déjà les termes du glossaire validés et le background contrôle les termes critiques identiques (FCFA, PIN, OTP, KYC).",
  "files": [
    "scripts/import-language-pack.py",
    "tests/import-glossary.test.py",
    "scripts/README.md",
    "tests/README.md",
    ".github/workflows/ci.yml"
  ],
  "tests": [
    {
      "command": "python3 tests/import-glossary.test.py",
      "result": "pass",
      "note": "5 cas : terme validé absent → refus, présent → acceptation, glossaire non validé, autre langue, FCFA traduit → refus"
    },
    {
      "command": "python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "3 fichiers, 3 feuilles"
    },
    {
      "command": "node scripts/test-extension.js && node tests/content.test.js",
      "result": "pass",
      "note": "registre, jetons, restauration"
    },
    {
      "command": "node tests/privacy.test.js && node tests/cloud-gating.test.js && node tests/criticality.test.js",
      "result": "pass",
      "note": "non-régression M1/M2/M3"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "26 passed"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "sortie « import-glossary OK — 5 cas » ; scripts/import-language-pack.py load_glossary + validate ; glossaire actuel : 0 terme validé, donc le contrôle est sans effet tant que K2 n'est pas rempli",
  "next": "M3 — badge visuel du niveau A non traduit, puis M12 (Shadow DOM/iframes)",
  "blockers": []
}
```

## 2026-11-08T07:30:00+01:00 — Marius — M3 — done

```json
{
  "timestamp": "2026-11-08T07:30:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M3",
  "status": "done",
  "summary": "Badge « non traduit » du niveau A implémenté sans remplacer de nœud : marqueur data-nk-untranslated=\"A\" et règle CSS ::after provisoire (or #C9A45C), injectée une seule fois et retirée à la restauration. Vérifié en jsdom et sur le site réel Chrome (computed style « non traduit »). M7 complet repasse avec le badge : 0 erreur page.",
  "files": [
    "extension/content.js",
    "tests/content.test.js",
    "docs/SITE_TEST_2026-11-08.md",
    "docs/assets/badge-non-traduit.png"
  ],
  "tests": [
    {
      "command": "node tests/content.test.js",
      "result": "pass",
      "note": "segment critique non traduit marqué, style injecté, marqueur et style retirés à la restauration"
    },
    {
      "command": "node .cache/m7/m7_test.js (harnais Playwright local)",
      "result": "pass",
      "note": "5 étapes + EN, badge rendu, 0 pageerror/console.error, montants et références préservés"
    },
    {
      "command": "getComputedStyle(el, '::after').content (Chrome 158)",
      "result": "pass",
      "note": "content « non traduit », background rgb(255,248,225), color rgb(92,74,18)"
    },
    {
      "command": "node tests/privacy.test.js && node tests/cloud-gating.test.js && node tests/criticality.test.js",
      "result": "pass",
      "note": "non-régression M1/M2/M3"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "26 passed"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "docs/assets/badge-non-traduit.png ; computed style vérifié sur https://safinum.cm/hackathon-test ; content.js ensureBadgeStyle + [data-nk-untranslated=\"A\"]::after",
  "next": "M12 — tester les Shadow DOM ouverts/fermés et les iframes, documenter ce qui marche",
  "blockers": []
}
```

## 2026-11-08T07:45:00+01:00 — Marius — M12 — done

```json
{
  "timestamp": "2026-11-08T07:45:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M12",
  "status": "done",
  "summary": "Test réel Chrome 158 sur une page locale : le document principal est traduit, les Shadow DOM ouvert et fermé ne sont pas parcourus, les iframes ne le sont pas en injection top-frame. Avec injection allFrames et message par frameId (permissions des deux origines), les iframes même-origine et cross-origin sont traduites. chrome.dom.openOrClosedShadowRoot est disponible. Aucune promesse activeTab pour les iframes cross-origin ; limites documentées.",
  "files": [
    "docs/SHADOW_DOM_IFRAMES.md"
  ],
  "tests": [
    {
      "command": "harnais Playwright M12 (page locale, Shadow DOM ouvert/fermé, iframes)",
      "result": "pass",
      "note": "top traduit ; open/closed shadow intacts ; iframes top-frame intactes ; allFrames + host permissions : les deux iframes traduites"
    },
    {
      "command": "chrome.dom.openOrClosedShadowRoot dans le content script",
      "result": "pass",
      "note": "fonction disponible ; Shadow fermé lisible via l'API, element.shadowRoot null"
    },
    {
      "command": "node tests/content.test.js && node tests/privacy.test.js && node tests/cloud-gating.test.js && node tests/criticality.test.js",
      "result": "pass",
      "note": "non-régression extension"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "26 passed"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "docs/SHADOW_DOM_IFRAMES.md : tableau des résultats ; sortie du harnais « OPEN_SHADOW non traduit », « FRAMES_AFTER_ALLFRAMES : nde nje »",
  "next": "M9 — harnais e2e/API et preuves de latence",
  "blockers": []
}
```

## 2026-11-08T08:00:00+01:00 — Marius — M9 — in_progress

```json
{
  "timestamp": "2026-11-08T08:00:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M9",
  "status": "in_progress",
  "summary": "Ajout de tests/api.robust.py (17 contrats HTTP, CORS, refus, JSON sans HTML) et tests/pipeline.e2e.js (pack/edge : zéro réseau, latence 3,62 ms, jetons/références préservés). Le champ segments est désormais requis (422 au lieu de 200 silencieux). Les résultats sont versionnés dans docs/test-results/. Les modes unseen et demo restent bloqués : modèle NLLB absent et pack 102/102 vide.",
  "files": [
    "tests/api.robust.py",
    "tests/pipeline.e2e.js",
    "docs/test-results/api-robust.json",
    "docs/test-results/pipeline-pack.json",
    "docs/test-results/pipeline-edge.json",
    "docs/test-results/pipeline-unseen.json",
    "docs/test-results/pipeline-demo.json",
    "docs/test-results/README.md",
    "server/app.py",
    ".github/workflows/ci.yml",
    "tests/README.md"
  ],
  "tests": [
    {
      "command": "NK_MOCK=1 server/.venv/bin/python tests/api.robust.py",
      "result": "pass",
      "note": "17/17 cas"
    },
    {
      "command": "node tests/pipeline.e2e.js --mode=all",
      "result": "pass",
      "note": "pack 3,62 ms, 0 réseau ; edge 4 cas ; unseen/demo non exécutés"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "26 passed"
    },
    {
      "command": "node tests/content.test.js && node tests/privacy.test.js && node tests/cloud-gating.test.js && node tests/criticality.test.js",
      "result": "pass",
      "note": "non-régression extension"
    },
    {
      "command": "python3 tests/import-glossary.test.py && python3 scripts/check-language-packs.py",
      "result": "pass",
      "note": "glossaire et packs"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "docs/test-results/api-robust.json (17 cas ok) ; pipeline-pack.json latencyMs 3.62, networkCalls 0 ; pipeline-unseen.json et pipeline-demo.json status blocked",
  "next": "Télécharger NLLB et remplir le pack 102/102 pour exécuter unseen/demo ; récupérer tests/demo.e2e.js de l'audit Freedy",
  "blockers": [
    "Modèle NLLB non téléchargé : mode unseen non exécutable",
    "Pack 102/102 absent : mode demo non exécutable",
    "tests/demo.e2e.js absent du dépôt (artefact local)"
  ]
}
```

## 2026-11-08T08:15:00+01:00 — Marius — M10 — done

```json
{
  "timestamp": "2026-11-08T08:15:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M10",
  "status": "done",
  "summary": "Packaging complet : 3 ZIP de 370 Ko, contrôle de collisions avant build, web-ext lint 0/0/0. Le paquet Chrome chargé dans Chrome for Testing 158 démarre son service worker et affiche les 3 langues dans le popup. Firefox 159 téléchargé hors Snap installe le paquet comme add-on temporaire via web-ext run. CI GitHub verte sur develop et marius.",
  "files": [
    "docs/SUBMISSION.md",
    "tests/README.md"
  ],
  "tests": [
    {
      "command": "./scripts/package-extension.sh",
      "result": "pass",
      "note": "3 ZIP 370 Ko, collisions OK"
    },
    {
      "command": "chargement de dist/package/chrome dans Chrome for Testing 158",
      "result": "pass",
      "note": "service worker chrome-extension://.../background.js actif ; popup 3 langues ; 0 erreur page"
    },
    {
      "command": "web-ext run --source-dir dist/firefox --firefox=.cache/firefox/firefox/firefox --arg=-headless",
      "result": "pass",
      "note": "« Installed ... as a temporary add-on » (Firefox 159)"
    },
    {
      "command": "npx web-ext lint --source-dir dist/firefox",
      "result": "pass",
      "note": "0 erreur, 0 warning, 0 notice"
    },
    {
      "command": "gh run list / gh run view",
      "result": "pass",
      "note": "5/5 jobs verts sur develop et marius"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "sortie Chrome « SW chrome-extension://.../background.js », options popup « Fulfulde MT / Ewondo PACK / Duala PACK » ; sortie Firefox « Installed ... as a temporary add-on » ; docs/SUBMISSION.md § État vérifié",
  "next": "M7 Firefox site automation, puis traiter M6/M8/M11 (blocages données/modèle)",
  "blockers": []
}
```

## 2026-11-08T08:30:00+01:00 — Marius — M7 — in_progress

```json
{
  "timestamp": "2026-11-08T08:30:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M7",
  "status": "in_progress",
  "summary": "Tentative Firefox réelle avec Firefox 159 téléchargé hors Snap et Selenium/geckodriver : l'extension s'installe en add-on temporaire, le content script s'injecte (marqueur DOM présent), mais le background répond « Cloud désactivé et backend local indisponible ». Les host_permissions MV3 ne sont pas accordées à un add-on temporaire, donc le fetch vers 127.0.0.1:8000 est refusé ; les packs étant vides, 0 segment n'est traduit. Le test Chrome complet reste la référence.",
  "files": [],
  "tests": [
    {
      "command": "Selenium Firefox 159 + install_addon(nkaplingua-test.xpi, temporary=True)",
      "result": "pass",
      "note": "add-on nkaplingua@safinum.cm installé ; marqueur data-nk-autotrigger présent"
    },
    {
      "command": "browser.runtime.sendMessage NK_TRANSLATE_SEGMENTS depuis le content script Firefox",
      "result": "fail",
      "note": "réponse « Cloud désactivé et backend local indisponible. Lancez le backend ou autorisez le cloud. »"
    },
    {
      "command": "node .cache/m7/m7_test.js (Chrome 158)",
      "result": "pass",
      "note": "référence M7 : 5 étapes + EN, 0 erreur, montants/références préservés"
    },
    {
      "command": "node tests/content.test.js && node tests/privacy.test.js && node tests/cloud-gating.test.js && node tests/criticality.test.js",
      "result": "pass",
      "note": "aucune régression côté code"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "26 passed"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "Firefox 159 : « Installed ... as a temporary add-on » ; data-nk-debug = {\"lang\":\"object\",\"browser\":\"object\",\"hasTranslate\":\"function\"} ; réponse background « backend local indisponible » ; 0 segment traduit",
  "next": "Accorder explicitement les host_permissions dans un profil Firefox réel (ou construire un pack de test couvrant la page) puis rejouer le parcours",
  "blockers": [
    "Firefox MV3 : host_permissions non accordées à l'add-on temporaire, backend local inaccessible",
    "Firefox n'a pas de pack fub rempli pour compenser sans backend"
  ]
}
```

## 2026-11-08T08:40:00+01:00 — Marius — M6 — blocked

```json
{
  "timestamp": "2026-11-08T08:40:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M6",
  "status": "blocked",
  "summary": "Les 20 phrases de data/unseen_finance.txt sont prêtes, mais la comparaison des 4 formats de jetons exige le modèle NLLB. Le modèle n'est pas téléchargé et torch/transformers ne sont pas installés dans l'environnement de test ; aucun résultat de format ne peut être produit sans inventer des mesures.",
  "files": [],
  "tests": [
    {
      "command": "wc -l data/unseen_finance.txt",
      "result": "pass",
      "note": "20 phrases disponibles"
    },
    {
      "command": "server/.venv/bin/python -c 'import torch, transformers'",
      "result": "not_run",
      "note": "ModuleNotFoundError: torch absent"
    },
    {
      "command": "téléchargement facebook/nllb-200-distilled-600M",
      "result": "not_run",
      "note": "modèle ~2,4 Go absent de models/"
    }
  ],
  "evidence": "models/ absent ; torch absent ; data/unseen_finance.txt = 20 lignes",
  "next": "Installer torch/transformers, télécharger NLLB, comparer [[NUM_0]], [[0]], [[N0]] et X0 sur les 20 phrases, mesurer token_lost et latence",
  "blockers": [
    "Modèle NLLB-200 non téléchargé",
    "torch/transformers absents du venv de test",
    "Aucune mesure réelle des 4 formats disponible"
  ]
}
```

## 2026-11-08T08:45:00+01:00 — Marius — M8 — blocked

```json
{
  "timestamp": "2026-11-08T08:45:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M8",
  "status": "blocked",
  "summary": "Les 15 phrases audio sans montant et le template d'index existent, mais aucun fichier OGG, aucun index.json rempli et aucun consentement audio ne sont fournis par Klein. Le bouton « Écouter » et le service local ne peuvent pas être testés avec de vrais fichiers ; je n'ai pas fabriqué d'audio.",
  "files": [],
  "tests": [
    {
      "command": "python3 -c 'csv data/audio/fub/phrases.csv : 15 lignes, has_amount=no'",
      "result": "pass",
      "note": "15/15 sans montant"
    },
    {
      "command": "ls data/audio/fub/index.json",
      "result": "not_run",
      "note": "index.json absent (seul index.template.json)"
    },
    {
      "command": "lecture de 15 OGG",
      "result": "not_run",
      "note": "aucun fichier audio versionné"
    }
  ],
  "evidence": "data/audio/fub : index.template.json + phrases.csv seulement ; 15 lignes has_amount=no ; aucun OGG ; aucun consentement",
  "next": "Recevoir de Klein les 15 OGG, l'index.json (phrase, fichier, durée, relecteur, licence) et les consentements, puis implémenter le bouton conditionnel",
  "blockers": [
    "15 fichiers OGG absents",
    "index.json absent",
    "consentements audio non signés",
    "licences audio non documentées"
  ]
}
```

## 2026-11-08T08:50:00+01:00 — Marius — M11 — blocked

```json
{
  "timestamp": "2026-11-08T08:50:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M11",
  "status": "blocked",
  "summary": "docs/ORTHOGRAPHY.md indique explicitement que ɲ → ny est une hypothèse à valider, que la table de validation est vide et qu'il ne faut pas remplacer ɲ dans l'extension tant que les natifs n'ont pas tranché. Aucune table validée fournie par Klein ; implémenter un normaliseur maintenant risquerait de changer le sens des mots.",
  "files": [],
  "tests": [
    {
      "command": "lecture de docs/ORTHOGRAPHY.md",
      "result": "pass",
      "note": "table de validation vide, règle keep_ɲ_or_map_to_ny non tranchée"
    },
    {
      "command": "normalisation ɲ → ny sur 10 exemples",
      "result": "not_run",
      "note": "table native absente, pas de règle validée"
    }
  ],
  "evidence": "docs/ORTHOGRAPHY.md §3 : table vide ; §4 : ne pas remplacer ɲ par ny dans l'extension ; aucune table validée dans data/",
  "next": "Recevoir la table ɲ/ny, tons et exceptions validée par les natifs, puis implémenter le normaliseur déterministe avec 10 tests",
  "blockers": [
    "Table orthographique ɲ/ny non validée par les natifs",
    "Aucune règle validée pour les noms propres et emprunts"
  ]
}
```

## 2026-11-08T09:05:00+01:00 — Marius — M10 — done

```json
{
  "timestamp": "2026-11-08T09:05:00+01:00",
  "person": "Marius",
  "branch": "marius",
  "task": "M10",
  "status": "done",
  "summary": "Corrections R0 de discours : le README affiche un état réel (packs 0/102 et 0/20, glossaire 0 validé, audio 0, MT duala échouée, test Chrome, Firefox, CI), EVAL distingue 45 % texte brut / 30 % inédites / 23 % démo, et les docs ne présentent plus MyMemory comme un secours automatique. COMPLIANCE, SECURITY, TECHNICAL, DATA_LICENSES, VIDEO_SCRIPT et SUBMISSION alignés.",
  "files": [
    "README.md",
    "docs/EVAL.md",
    "docs/COMPLIANCE.md",
    "docs/SECURITY.md",
    "docs/TECHNICAL.md",
    "docs/DATA_LICENSES.md",
    "docs/VIDEO_SCRIPT.md",
    "docs/SUBMISSION.md"
  ],
  "tests": [
    {
      "command": "grep -RIn 'cloud de secours|bascule sur un service cloud|84–95|sept langues' README.md docs/*.md",
      "result": "pass",
      "note": "aucune formulation automatique restante ; seul le 45 % texte brut est conservé, explicitement distingué"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "README.md § État réel au 8 novembre 2026 ; docs/EVAL.md § Résultats réels ; docs/COMPLIANCE.md total objectif 80+",
  "next": "Poursuivre M7 (Firefox) et M9 (unseen/demo) dès que les données/modèle seront disponibles",
  "blockers": []
}
```

## 2026-11-08T10:00:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-08T10:00:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Inventaire externe : modèles flagship-ai fr→fulfulde/ewondo/bulu, audio Common Voice/AfriSpeech/SOREVA, corpus mt560 basaa/bulu, lexiques PanLex/Suzuya. Aucun modèle duala prêt ; le bulu est le meilleur candidat pour une 4e langue, sous réserve d'un natif.",
  "files": [
    "docs/EXTERNAL_RESOURCES.md",
    "docs/TRAINING_DATA_AUDIT.md",
    "docs/DATA_LICENSES.md",
    "docs/DUALA_MT.md",
    "data/reference/external-resources.csv",
    "data/reference/panlex/panlex-targets.csv",
    "data/reference/panlex/README.md",
    "data/reference/fulfulde-suzuya.csv",
    "data/reference/NOTICE.md",
    "data/reference/README.md",
    "data/training/README.md",
    "README.md"
  ],
  "tests": [
    {
      "command": "python3 scripts/check-training-data.py",
      "result": "pass",
      "note": "11 sources : 7 bloquées, 3 sous autorisation, 1 utilisable ; aucun fichier versionné"
    },
    {
      "command": "server/.venv/bin/python -c \"import ctranslate2; print(ctranslate2.__version__)\"",
      "result": "pass",
      "note": "ctranslate2 4.8.5 installé pour les modèles int8"
    },
    {
      "command": "python3 scripts/check-evolution.py",
      "result": "pass",
      "note": "journal valide après ajout de l'entrée"
    }
  ],
  "evidence": "docs/EXTERNAL_RESOURCES.md §4.1 (sorties flagship int8 sur 10 phrases) ; data/reference/external-resources.csv (88 ressources) ; docs/DUALA_MT.md §8",
  "next": "Trancher la licence du sous-modèle francais-ewondo avec flagship-ai, décider du mode brouillon ewo/fub, puis du bulu comme 4e langue si un natif est disponible",
  "blockers": []
}
```

## 2026-11-08T12:00:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-08T12:00:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Backend flagship-ai branché : brouillon fr→ewo et fr→fub (CTranslate2 int8, NLLB en secours pour fub), duala pack-only. Barrière niveau A dans l'extension et le backend : les phrases critiques sans pack validé restent en français. Tests backend, extension et bout en bout passés.",
  "files": [
    "server/app.py",
    "server/flagship_mt.py",
    "server/test_api.py",
    "server/requirements.txt",
    "extension/languages.js",
    "extension/background.js",
    "extension/content.js",
    "extension/popup.js",
    "scripts/test-extension.js",
    "docs/TECHNICAL.md",
    "docs/LANGUAGES.md",
    "docs/LANGUAGE_VALIDATION.md",
    "docs/DATA_LICENSES.md",
    "docs/DEMO.md",
    "docs/SECURITY.md",
    "docs/COMPLIANCE.md",
    "docs/SUBMISSION_CHECKLIST.md",
    "docs/PRESELECTION.md",
    "docs/PITCH.md",
    "docs/SUBMISSION.md",
    "docs/EVAL.md",
    "docs/VIDEO_SCRIPT.md",
    "docs/SUBMISSION_DOCUMENT.html",
    "docs/EXTERNAL_RESOURCES.md",
    "README.md"
  ],
  "tests": [
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "29 tests, dont ewondo mock, segments critiques ewo/fub bloqués et découpage des jetons"
    },
    {
      "command": "node scripts/test-extension.js",
      "result": "pass",
      "note": "registre, packs, jetons, qualité, isCriticalText et critical_pack_only"
    },
    {
      "command": "node tests/content.test.js",
      "result": "pass",
      "note": "content script jsdom, texte/attributs/restauration"
    },
    {
      "command": "NK_MOCK=0 NK_FLAGSHIP_MODEL_DIR=dist/models/flagship-int8 ...",
      "result": "pass",
      "note": "ewo -> « Mina, eyë miakòbò ya? » ; fub -> « Jaŋngo, noy on ɗon njahata? » ; critique -> critical_pack_only"
    }
  ],
  "evidence": "server/flagship_mt.py ; docs/EXTERNAL_RESOURCES.md §4.5 ; sorties locales ewondo/fufulde et test extension bout en bout",
  "next": "Mettre à jour le HTML/PDF de soumission et la vidéo, puis remplir les packs avec des natifs ; sans natif, les phrases critiques restent en français",
  "blockers": [
    "aucun natif disponible pour les trois langues",
    "licence du sous-modèle francais-ewondo à clarifier"
  ]
}
```

## 2026-11-08T14:00:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-08T14:00:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Test réel du site https://safinum.cm/hackathon-test : 104 segments collectés, 71 uniques, 0 texte visible non collecté. Mode démo SAFINUM ajouté (MT critique autorisée avec badge), titre/select/attributs couverts, pré-pass MyMemory fr|ff pour les libellés fulfulde, filtre english_leak. Fulfulde 66/71 ok, ewondo 61/71, duala sans MT.",
  "files": [
    "docs/SITE_TEST_SAFINUM.md",
    "docs/LANGUAGE_VALIDATION.md",
    "docs/EXTERNAL_RESOURCES.md",
    "docs/DATA_LICENSES.md",
    "extension/languages.js",
    "extension/content.js",
    "extension/background.js",
    "extension/popup.js",
    "server/flagship_mt.py",
    "server/app.py",
    "tests/criticality.test.js",
    "tests/content.test.js",
    "README.md",
    "tasks/EVOLUTION.md"
  ],
  "tests": [
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "30 tests, dont mode démo et filtre english_leak"
    },
    {
      "command": "node tests/criticality.test.js && node tests/cloud-gating.test.js && node tests/content.test.js && node scripts/test-extension.js",
      "result": "pass",
      "note": "niveau A strict, démo étiquetée, cloud opt-in, titre et couverture"
    },
    {
      "command": "Chrome headless + CDP sur https://safinum.cm/hackathon-test",
      "result": "pass",
      "note": "5 étapes, 104 segments, 0 texte visible non collecté, titre traduit"
    },
    {
      "command": "background réel + backend flagship + MyMemory sur 71 segments",
      "result": "pass",
      "note": "fub 66/71, ewo 61/71 ; 5 échecs fub et 5 ewo sont des fragments de jetons"
    }
  ],
  "evidence": "docs/SITE_TEST_SAFINUM.md ; sorties Montant->Limgal, Sécurité->Jam, etc. ; captures CDP locales",
  "next": "Utiliser le mode démo Fulfulde pour la vidéo, faire relire l'ewondo par un professionnel, et ne pas présenter le duala comme MT",
  "blockers": [
    "ewondo local insuffisant sur les libellés d'interface",
    "aucun natif pour valider le niveau A",
    "MyMemory est cloud, opt-in, et ne couvre pas l'ewondo"
  ]
}
```

## 2026-11-08T16:45:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-08T16:45:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Audit des classeurs T1/T2 reçus : 85 lignes fulfulde « Tafsiri: » recopiées du français rejetées, T2 identique à T1 sur 210/212 (99,1 %). Ewondo et duala plausibles mais T2 dérivé (95,4 % et 90,0 %) : aucune ligne validée. Packs reconstruits : fub 107, ewo 122, dua 121 entrées, toutes draft sauf 1 reviewed. Le mode démo applique les brouillons humains avec badge ; le mode strict reste validated-only. Test réel du site : 104 segments, 71 uniques, fub 71/71 (60 pack), ewo 71/71 (59 pack), dua 64/71 (58 pack, 4 libellés restants).",
  "files": [
    "scripts/audit-native-reviews.py",
    "scripts/build-reviewed-packs.py",
    "scripts/check-language-data.py",
    "scripts/check-language-packs.py",
    "scripts/check-pack-collisions.py",
    "data/review/fulfulde.t1.csv",
    "data/review/fulfulde.t2.csv",
    "data/review/ewondo.t1.csv",
    "data/review/ewondo.t2.csv",
    "data/review/duala.t1.csv",
    "data/review/duala.t2.csv",
    "data/review/README.md",
    "data/site-officiel/messages.fr-en.csv",
    "data/site-officiel/messages-extra.csv",
    "data/site-officiel/messages-gaps.csv",
    "data/reference/collision-allowlist.csv",
    "data/glossary.template.csv",
    "data/language-packs/fub.csv",
    "data/language-packs/ewo.csv",
    "data/language-packs/dua.csv",
    "data/language-packs/import/fub.csv",
    "data/language-packs/import/ewo.csv",
    "data/language-packs/import/dua.csv",
    "extension/language-packs/fub.json",
    "extension/language-packs/ewo.json",
    "extension/language-packs/dua.json",
    "extension/background.js",
    "extension/content.js",
    "extension/languages.js",
    "extension/popup.js",
    "tests/pipeline.e2e.js",
    "tests/criticality.test.js",
    "tests/check-pack-collisions.test.py",
    "tests/import-glossary.test.py",
    "docs/NATIVE_REVIEW_AUDIT.md",
    "docs/SITE_TEST_SAFINUM.md",
    "docs/LANGUAGE_VALIDATION.md",
    "docs/VALIDATION_REPORT.md",
    "docs/DATA_LICENSES.md",
    "README.md",
    "tasks/EVOLUTION.md"
  ],
  "tests": [
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "30 tests backend"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python tests/api.robust.py",
      "result": "pass",
      "note": "17/17 contrats HTTP"
    },
    {
      "command": "python3 scripts/audit-native-reviews.py",
      "result": "pass",
      "note": "472 lignes auditées ; fub 99 dures T1, ewo 5, dua 5 ; indépendance copied/derived"
    },
    {
      "command": "python3 scripts/build-reviewed-packs.py --write",
      "result": "pass",
      "note": "packs fub 107, ewo 122, dua 121 ; 0 validée"
    },
    {
      "command": "python3 scripts/check-language-data.py && python3 scripts/check-language-packs.py && python3 scripts/check-native-kit.py && python3 scripts/check-pack-collisions.py",
      "result": "pass",
      "note": "données, packs, kit, collisions arbitrées"
    },
    {
      "command": "node tests/criticality.test.js && node tests/cloud-gating.test.js && node tests/content.test.js && node tests/privacy.test.js && node scripts/test-extension.js && node tests/pipeline.e2e.js --mode=all",
      "result": "pass",
      "note": "mode strict, reviewed/draft en démo, cache isolé, jetons, confidentialité"
    },
    {
      "command": "Chrome headless + CDP sur https://safinum.cm/hackathon-test",
      "result": "pass",
      "note": "5 étapes, 104 segments, 71 uniques, 0 texte visible non collecté"
    },
    {
      "command": "background réel + packs + backend flagship/MyMemory sur 71 segments",
      "result": "pass",
      "note": "fub 71/71 (60 pack, 1 MT critique), ewo 71/71 (59 pack, 1 MT critique), dua 64/71 (58 pack, 4 libellés restants)"
    }
  ],
  "evidence": "docs/NATIVE_REVIEW_AUDIT.md ; docs/SITE_TEST_SAFINUM.md ; docs/test-results/native-review-audit.csv ; docs/test-results/reviewed-packs.json ; data/site-officiel/messages-gaps.csv",
  "next": "Faire refaire les 85 lignes fulfulde « Tafsiri » et les 4 libellés duala de messages-gaps.csv ; obtenir un T2 indépendant et un arbitre distinct pour passer des drafts à validated",
  "blockers": [
    "aucune validation native : T2 dérive de T1 dans les trois langues",
    "85 lignes fulfulde « Tafsiri » recopient le français",
    "4 libellés duala du site restent en français",
    "consentement écrit des relecteurs à confirmer"
  ]
}
```

## 2026-11-08T17:30:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-08T17:30:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Vérification d'assemblage : origin/marius, origin/freedy et origin/design/popup sont des ancêtres de HEAD (0 commit unique) ; leurs travaux sont déjà dans le paquet. Extension installée dans Chromium/Chrome for Testing : popup 3 langues, service worker actif. Parcours réel SAFINUM 5/5 étapes en fulfulde, montants et référence préservés, titre traduit, restauration OK. Premier écran : fub 43 traduits/0 non traduit, ewo 43/0, dua 35/8 (3 libellés + dates). Nouveau contenu fub traité avec badge démo MT mais qualité faible. Auto-évaluation officielle : 88/100 brut, 78/100 prudent, éligibilité estimée 75–85% si vidéo et PDF soumis.",
  "files": [
    "docs/INSTALLED_EXTENSION_TEST.md",
    "docs/SAFINUM_ELIGIBILITY.md",
    "README.md",
    "tasks/EVOLUTION.md"
  ],
  "tests": [
    {
      "command": "git merge-base --is-ancestor origin/marius HEAD ; origin/freedy ; origin/design/popup",
      "result": "pass",
      "note": "0 commit unique : Marius et Freedy déjà assemblés"
    },
    {
      "command": "Chromium/Chrome for Testing 156 + extension non empaquetée + site SAFINUM",
      "result": "pass",
      "note": "popup 3 langues, service worker actif, parcours 5/5 en fulfulde, montants/référence préservés, restauration"
    },
    {
      "command": "Premier écran fub/ewo/dua avec l'extension installée",
      "result": "pass",
      "note": "fub 43/0 non traduit ; ewo 43/0 ; dua 35/8 (Protocole de test, Banque en ligne, Compte courant, dates)"
    },
    {
      "command": "Nouveau contenu + restauration",
      "result": "pass",
      "note": "nouveau texte fub traité avec badge démo MT, montant préservé ; restauration titre/page OK"
    },
    {
      "command": "Popup du paquet de production",
      "result": "pass",
      "note": "3 langues, texte inédit critique bloqué en strict, texte non critique traité"
    }
  ],
  "evidence": "docs/INSTALLED_EXTENSION_TEST.md ; docs/SAFINUM_ELIGIBILITY.md ; résultats CDP locaux",
  "next": "Enregistrer la vidéo de 3 minutes, remplacer l'asset PDF de release, faire traduire les 4 libellés duala, obtenir un T2 indépendant et un arbitre",
  "blockers": [
    "aucune validation native (0 validée)",
    "3 libellés duala visibles + dates non traduits",
    "qualité du nouveau contenu MT insuffisante",
    "vidéo et asset PDF de release à finaliser"
  ]
}
```

## 2026-11-08T17:32:00+01:00 — Freedy — F3 — in_progress

```json
{
  "timestamp": "2026-11-08T17:32:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F3",
  "status": "in_progress",
  "summary": "Test réel du site SAFINUM avec extension + NLLB : étape 1 seulement, 6/44 segments traduits, 38 restent en français, numéro de compte et casse du nom altérés.",
  "files": [
    "docs/AUDIT_2026-11-08.md",
    "docs/test-results/real-site-step1-2026-11-08.json",
    "docs/SITE_TEST_SAFINUM.md",
    "docs/COMPLIANCE.md"
  ],
  "tests": [
    {
      "command": "Playwright extension + https://safinum.cm/hackathon-test + NLLB réel",
      "result": "fail",
      "note": "6/44 traduits, 38 en français, 2 critiques en MT démo, 0 erreur page"
    },
    {
      "command": "node scripts/test-extension.js",
      "result": "pass",
      "note": "registre, détection, packs, jetons, qualité, niveau A"
    }
  ],
  "evidence": "docs/test-results/real-site-step1-2026-11-08.json",
  "next": "Réduire la démo à un paragraphe court et corriger la tokenisation compte/nom",
  "blockers": []
}
```

## 2026-11-08T17:35:00+01:00 — Freedy — F4 — in_progress

```json
{
  "timestamp": "2026-11-08T17:35:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F4",
  "status": "in_progress",
  "summary": "Tests profonds réels : 1/20 phrases inédites en production, 4/20 en démo ; suite mock/CI verte ; message d'erreur low_roundtrip trompeur.",
  "files": [
    "docs/AUDIT_2026-11-08.md",
    "docs/test-results/real-unseen-2026-11-08.json",
    "docs/test-results/real-tokens-2026-11-08.json",
    "docs/test-results/README.md"
  ],
  "tests": [
    {
      "command": "20 phrases inédites via background réel + NLLB",
      "result": "fail",
      "note": "production 1/20 ; démo 4/20"
    },
    {
      "command": "node tests/content.test.js && node tests/privacy.test.js && node tests/cloud-gating.test.js && node tests/criticality.test.js",
      "result": "pass",
      "note": "après installation locale de jsdom"
    },
    {
      "command": "NK_MOCK=1 python tests/api.robust.py && NK_MOCK=1 pytest -q server/test_api.py",
      "result": "pass",
      "note": "17/17 contrats, 30 tests"
    }
  ],
  "evidence": "docs/test-results/real-unseen-2026-11-08.json ; docs/AUDIT_2026-11-08.md",
  "next": "Corriger la taxonomie d'erreur et refaire le test des 5 étapes",
  "blockers": []
}
```

## 2026-11-08T18:00:00+01:00 — Freedy — F3 — in_progress

```json
{
  "timestamp": "2026-11-08T18:00:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F3",
  "status": "in_progress",
  "summary": "Parcours réel des 5 étapes SAFINUM avec NLLB : 31/192 segments traduits, 161 restent en français, 9 critiques en MT démo ; restauration 5/5, champs et boutons actifs, aucune erreur page.",
  "files": [
    "docs/AUDIT_2026-11-08.md",
    "docs/test-results/real-site-5steps-2026-11-08.json",
    "docs/test-results/README.md",
    "docs/COMPLIANCE.md",
    "docs/SUBMISSION_CHECKLIST.md",
    "docs/SAFINUM_ELIGIBILITY.md",
    "README.md",
    "tasks/README.md"
  ],
  "tests": [
    {
      "command": "Playwright extension + site SAFINUM 5 étapes + NLLB réel",
      "result": "fail",
      "note": "31/192 traduits ; 6/7/9/5/4 par étape ; 0 erreur page ; restauration 5/5"
    },
    {
      "command": "Contrôle champs/boutons/restauration sur les 5 étapes",
      "result": "pass",
      "note": "champs et cases conservés ; boutons actifs ; texte de bouton parfois traduit"
    }
  ],
  "evidence": "docs/test-results/real-site-5steps-2026-11-08.json",
  "next": "Réduire la démo à un paragraphe court, corriger compte/nom, re-mesurer les 3 langues avec un harnais fiable",
  "blockers": []
}
```

## 2026-11-08T18:15:00+01:00 — Freedy — F3 — in_progress

```json
{
  "timestamp": "2026-11-08T18:15:00+01:00",
  "person": "Freedy",
  "branch": "freedy",
  "task": "F3",
  "status": "in_progress",
  "summary": "Bascule FR→EN testée en réel : 7/44 segments traduits, 37 restent en anglais, compte et nom préservés, titre de l'onglet non traduit.",
  "files": [
    "docs/AUDIT_2026-11-08.md",
    "docs/test-results/real-site-en-2026-11-08.json",
    "docs/test-results/README.md",
    "docs/SITE_TEST_SAFINUM.md",
    "docs/COMPLIANCE.md"
  ],
  "tests": [
    {
      "command": "Playwright site SAFINUM + bouton EN + NLLB réel",
      "result": "fail",
      "note": "7/44 traduits, 37 en anglais, titre non traduit, 1 erreur ressource"
    }
  ],
  "evidence": "docs/test-results/real-site-en-2026-11-08.json",
  "next": "Corriger la traduction du titre et re-mesurer les 3 langues avec un harnais fiable",
  "blockers": []
}
```

## 2026-11-09T11:30:00+01:00 — Klein — K2 — in_progress

```json
{
  "timestamp": "2026-11-09T11:30:00+01:00",
  "person": "Klein",
  "branch": "klein",
  "task": "K2",
  "status": "in_progress",
  "summary": "Rebasé sur origin/develop 2f39537. Appliqué les correctifs J0-J3 : préservation du compte (un seul jeton, espaces restaurés), protection des prénoms après salutation, réparation des jetons NAME_0/[[0]] côté serveur, titre traduit séparément en FR/EN, taxonomie d'erreur popup, application des hits pack même si la MT échoue. Ajout d'une mémoire bilingue FR/EN aux packs, de gabarits éditoriaux pour les 4 libellés duala et des libellés fub/ewo manquants. Test packs + flagship, cloud désactivé : 39/39 segments traduits au premier écran dans les 3 langues, 0 MT critique, 0 non traduit, compte CM 001 2345 6789 01 préservé, parcours fulfulde 5/5, nouveau contenu « Jawdindi ko 25 000 FCFA. », titre EN traduit. Aucune entrée validée.",
  "files": [
    "extension/languages.js",
    "extension/content.js",
    "extension/background.js",
    "extension/popup.js",
    "server/app.py",
    "data/site-officiel/messages-extra.csv",
    "data/language-packs/import/fub.csv",
    "data/language-packs/import/ewo.csv",
    "data/language-packs/import/dua.csv",
    "extension/language-packs/fub.json",
    "extension/language-packs/ewo.json",
    "extension/language-packs/dua.json",
    "scripts/build-reviewed-packs.py",
    "scripts/check-language-data.py",
    "scripts/check-language-packs.py",
    "scripts/check-pack-collisions.py",
    "scripts/import-language-pack.py",
    "tests/preservation.test.js",
    "tests/title.test.js",
    "tests/token-repair.test.py",
    "tests/site-demo.e2e.js",
    "docs/REAL_TEST_2026-11-09.md",
    "docs/INSTALLED_EXTENSION_TEST.md",
    "docs/SAFINUM_ELIGIBILITY.md",
    "docs/test-results/final-packs-flagship-2026-11-09.json",
    "README.md",
    "tasks/EVOLUTION.md"
  ],
  "tests": [
    {
      "command": "NK_MOCK=1 server/.venv/bin/python -m pytest -q server/test_api.py",
      "result": "pass",
      "note": "30 tests"
    },
    {
      "command": "NK_MOCK=1 server/.venv/bin/python tests/api.robust.py",
      "result": "pass",
      "note": "17/17"
    },
    {
      "command": "node tests/preservation.test.js && node tests/title.test.js && node tests/pipeline.e2e.js --mode=all && node tests/site-demo.e2e.js",
      "result": "pass",
      "note": "compte, prénom, nom, montant, titre FR sur page EN, pack/revue/edge, badges"
    },
    {
      "command": "server/.venv/bin/python tests/token-repair.test.py",
      "result": "pass",
      "note": "NAME_0 et [[0]] réparés sans invention"
    },
    {
      "command": "Chrome headless + extension installée + packs + flagship-ai, cloud désactivé",
      "result": "pass",
      "note": "39/39 fub, ewo, dua ; 0 MT critique ; 0 non traduit ; compte avec espaces ; parcours 5/5 ; nouveau contenu éditorial ; titre EN traduit"
    }
  ],
  "evidence": "docs/REAL_TEST_2026-11-09.md ; docs/test-results/final-packs-flagship-2026-11-09.json ; docs/INSTALLED_EXTENSION_TEST.md",
  "next": "Enregistrer la vidéo de 3 min, remplacer l'asset PDF de release, faire relire les entrées editorial, obtenir un T2 indépendant et un arbitre",
  "blockers": [
    "0 entrée validée : les packs restent humains/éditoriaux",
    "couverture EN partielle (14/44)",
    "vidéo et asset PDF de release à finaliser",
    "validation native indépendante absente"
  ]
}
```
