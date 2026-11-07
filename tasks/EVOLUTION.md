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
