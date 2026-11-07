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
