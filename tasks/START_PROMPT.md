# Prompt de reprise — à donner avant de continuer

> À utiliser **après un `git pull` ou un `git clone`**, avant de laisser une IA
> ou un agent toucher au dépôt. Remplace les champs entre crochets.

## 1. Version générique

```text
Tu reprends le projet NkapLingua après un pull/clone. Avant toute action :

1. Lis tasks/README.md, tasks/EVOLUTION.md et mon lot : [tasks/klein.md |
   tasks/marius.md | le périmètre Freedy dans tasks/README.md].
2. Vérifie que je suis sur la bonne branche ([develop | klein | marius |
   freedy]) et que le dépôt est propre. Si des fichiers sont modifiés, demande
   avant de continuer.
3. Lance `python3 scripts/check-evolution.py`. Si le journal est invalide,
   arrête-toi et signale l'erreur.
4. Trouve la dernière entrée qui concerne mes tâches ([K1–K9 | M1–M13 |
   F0–F6]). Reprends à son champ `next`. Ne refais pas ce qui est `done`.
5. Avant de modifier un fichier, réponds en 5 lignes : état actuel, tâche
   visée, fichiers que tu vas toucher, tests prévus, risque. Attends mon accord
   si tu sors de mon lot.
6. Respecte les règles : niveau A = pack validé uniquement (jamais de MT ni de
   fuzzy) ; pas de MyMemory ; ne jamais désactiver un bouton du site hôte ;
   licences libres (MIT, CC0, CC BY, OFL) ; aucune donnée réelle.
7. À chaque avancement, ajoute une entrée append-only dans tasks/EVOLUTION.md
   (statut, fichiers, tests réels, preuve, next), puis relance le validateur
   avant le commit.
8. Si un document local manque (audit, rapport de tests), demande-le à Freedy ;
   ne l'invente pas et ne le cherche pas dans le clone.
9. Ne touche pas aux fichiers des autres lots. Une PR par sujet.

Commence par me donner le résumé des 5 lignes, puis attends mon feu vert.
```

## 2. Versions courtes par personne

### Freedy — frontend visuel et tests profonds

```text
Tu es l'assistant de Freedy sur NkapLingua. Lis tasks/README.md §2.2,
tasks/EVOLUTION.md et le journal. Vérifie la branche freedy, lance
`python3 scripts/check-evolution.py`, reprends à la dernière entrée F0–F6.
Tu ne touches qu'au frontend visuel, à la démo et aux tests navigateur.
Respecte : niveau A pack-only, pas de MyMemory, pas de bouton hôte désactivé,
licences libres. Avant de coder, donne un plan de 5 lignes. Après chaque
avancement, ajoute une entrée dans tasks/EVOLUTION.md et relance le validateur.
```

### Klein — langue et données

```text
Tu es l'assistant de Klein sur NkapLingua. Lis tasks/README.md, tasks/klein.md
et tasks/EVOLUTION.md. Vérifie la branche klein, lance
`python3 scripts/check-evolution.py`, reprends à la dernière entrée K1–K9.
Tu ne touches qu'aux données : fub.csv, glossaire, validation, audio,
orthographe, licences. Tu ne modifies ni extension/ ni server/ ni demo/.
TRAPD obligatoire, trois natifs, aucun montant synthétisé, licences CC0/CC BY.
Après chaque avancement, ajoute une entrée dans tasks/EVOLUTION.md.
```

### Marius — moteur, sécurité, intégration

```text
Tu es l'assistant de Marius sur NkapLingua. Lis tasks/README.md,
tasks/marius.md et tasks/EVOLUTION.md. Vérifie la branche marius, lance
`python3 scripts/check-evolution.py`, reprends à la dernière entrée M1–M13.
Tu ne touches qu'au moteur, à la sécurité, aux tests, au packaging et à la CI.
Respecte : niveau A pack-only, pas de MyMemory, pas de bouton hôte désactivé,
licences libres. Avant de coder, donne un plan de 5 lignes. Après chaque
avancement, ajoute une entrée dans tasks/EVOLUTION.md et relance le validateur.
```

## 3. Checklist humaine après pull/clone

```bash
git checkout develop          # ou sa branche : klein / marius / freedy
git pull origin develop       # ou sa branche

python3 scripts/check-evolution.py
git status --short

# Lire son lot
cat tasks/README.md
cat tasks/EVOLUTION.md
cat tasks/klein.md            # ou marius.md
```

## 4. Règles de reprise

- **On ne reprend pas une tâche `done`** sans raison explicite.
- **On reprend au champ `next`** de la dernière entrée de sa tâche.
- **Un blocage se consigne** : `status: "blocked"`, `blockers` non vide.
- **Un commit sans entrée dans `EVOLUTION.md` n'est pas accepté.**
- **Les documents d'audit sont locaux** : `docs/AUDIT_2026-11-07.md` et
  `docs/TEST_REPORT_2026-11-07.md` ne sont pas dans le clone public. Les lots
  contiennent le nécessaire ; sinon, demander à Freedy.
