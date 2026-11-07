# Messages FR/EN du site officiel — à traduire

[`messages.fr-en.csv`](messages.fr-en.csv) liste **70 messages** bilingues
réutilisés depuis les textes affichés de l'environnement officiel
<https://safinum.cm/hackathon-test>. Ce sont les libellés, erreurs et alertes
que le jury verra pendant la démonstration.

## Colonnes

| Colonne | Usage |
|---|---|
| `id` | identifiant stable (`SO-001`…) |
| `source_fr` | texte affiché en français |
| `source_en` | texte affiché en anglais |
| `niveau` | `A` (critique : pack validé uniquement) ou `B` (libellé) |
| `source_site` | provenance |
| `statut` | `a_traduire`, `en_cours`, `traduit`, `valide` |

Ces colonnes seront complétées par Klein (K11) :

- `target_fub`, `target_ewo`, `target_dua` ;
- `reviewer`, `reviewed_at`, `license`.

## Règles

1. **Niveau A** : traduction validée uniquement, jamais de MT.
2. Les jetons `[[NUM_n]]`, `[[NAME_n]]`, `FCFA`, `PIN`, `OTP` restent intacts.
3. Les erreurs `AMOUNT_002`, `SECURITY_001`, `SECURITY_002`, `NETWORK_001`,
   `CONFIRM_001` sont prioritaires : ce sont les messages injectés par le
   panneau Jury.
4. Les textes restent dans **notre** dépôt ; on ne copie pas le code, les
   styles ni les assets du site officiel.
5. Chaque traduction est relue par un natif et couverte par un consentement
   CC0 ou CC BY.

## Contrôle

```bash
python3 - <<'PY'
import csv
rows=list(csv.DictReader(open('data/site-officiel/messages.fr-en.csv',encoding='utf-8')))
print(len(rows), 'messages')
print('A:', sum(1 for r in rows if r['niveau']=='A'))
print('B:', sum(1 for r in rows if r['niveau']=='B'))
PY
```
