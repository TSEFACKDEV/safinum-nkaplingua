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

    ## 2026-11-07T18:00:00+01:00 — Klein — K3 — in_progress

    {
      "timestamp": "2026-11-07T18:00:00+01:00",
      "person": "Klein",
      "branch": "klein",
      "task": "K3",
      "status": "in_progress",
      "summary": "37 phrases P0 : première traduction indépendante terminée",
      "files": ["data/language-packs/fub.csv"],
      "tests": [
        {
          "command": "python3 scripts/import-language-pack.py data/language-packs/fub.csv",
          "result": "not_run",
          "note": "import après arbitrage"
        }
      ],
      "evidence": "fub.csv, lignes 1-37, colonne target",
      "next": "Deuxième traduction indépendante + arbitrage",
      "blockers": []
    }

## 3. Champs obligatoires

| Champ | Type | Règle |
|---|---|---|
| `timestamp` | string | ISO 8601 avec fuseau, ex. `2026-11-07T18:00:00+01:00` |
| `person` | string | `Freedy`, `Klein` ou `Marius` |
| `branch` | string | `freedy`, `klein` ou `marius` |
| `task` | string | `F0`…`F6`, `K1`…`K9`, `M1`…`M13` |
| `status` | string | `in_progress`, `blocked` ou `done` |
| `summary` | string | 1 à 3 phrases, concret |
| `files` | array | fichiers réellement modifiés |
| `tests` | array | `{command, result, note}` ; `result` ∈ `pass`, `fail`, `blocked`, `not_run` |
| `evidence` | string | lien, capture, ligne de CSV, sortie de test |
| `next` | string | prochaine action |
| `blockers` | array | obligatoire si `status=blocked` |

## 4. Entrée initiale

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
