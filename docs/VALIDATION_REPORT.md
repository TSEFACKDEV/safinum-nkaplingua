# Rapport de validation linguistique — NkapLingua 0.6

**Date** : 7 novembre 2026 (état intermédiaire, non signé)  
**Version** : 0.6.0  
**Langues** : fulfulde (`fub`), ewondo (`ewo`), duala (`dua`)  
**Responsable** : Klein  
**Statut** : **en attente du panel complet** — un natif identifié par langue,
deux personnes supplémentaires par langue restent à recruter.

## 1. Panel

| Langue | Traducteur 1 | Traducteur 2 | Arbitre | Prétest | Consentements |
|---|---|---|---|---|---|
| Fulfulde | identifié | à recruter | à recruter | à organiser | à signer |
| Ewondo | identifié | à recruter | à recruter | à organiser | à signer |
| Duala | identifié | à recruter | à recruter | à organiser | à signer |

Utiliser [`CONSENT_TEMPLATE.md`](CONSENT_TEMPLATE.md). Ne pas publier les
coordonnées personnelles.

## 2. Corpus

| Lot | Fichier | Nombre | Statut |
|---|---|---:|---|
| Glossaire finance | `data/glossary.template.csv` | 40 | 0 validé |
| Fulfulde — page | `data/language-packs/fub.csv` | 102 | 0 validée |
| Ewondo — pack | `data/language-packs/ewo.csv` | 20 | 0 validée |
| Duala — pack | `data/language-packs/dua.csv` | 20 | 0 validée |
| Messages site officiel | `data/site-officiel/messages.fr-en.csv` | 70 | 0 traduit |
| Variantes FR/EN | `data/site-officiel/messages.variants.csv` | 10 messages × 3 | prêt |
| Audio fulfulde | `data/audio/fub/phrases.csv` | 15 | 0 enregistré |
| Phrases inédites | `data/unseen_finance.txt` | 20 | à juger |

## 2bis. Kit natif TRAPD

Les classeurs sont prêts dans [`../data/review/`](../data/review/) :

| Langue | T1 | T2 | Items | P0 | P1 |
|---|---|---|---:|---:|---:|
| Fulfulde | `fulfulde.t1.csv` | `fulfulde.t2.csv` | 212 | 90 | 122 |
| Ewondo | `ewondo.t1.csv` | `ewondo.t2.csv` | 130 | 73 | 57 |
| Duala | `duala.t1.csv` | `duala.t2.csv` | 130 | 73 | 57 |

Chaque classeur contient le glossaire (40), les 70 messages du site et les
phrases de pack (102 fulfulde, 20 ewondo, 20 duala). Les colonnes `target`
sont vides : aucune traduction n'a été inventée.

Commandes :

```bash
python3 scripts/make-native-kit.py
python3 scripts/check-native-kit.py
python3 scripts/merge-native-reviews.py --lang fub
python3 scripts/import-native-reviews.py --lang fub --dry-run
python3 scripts/import-native-reviews.py --lang fub
```

## 3. Procédure TRAPD

1. **Traduction** : traducteur 1 remplit la colonne cible.
2. **Révision** : traducteur 2 traduit sans voir la première version.
3. **Arbitrage** : l’arbitre tranche les écarts.
4. **Prétest** : 5 à 8 personnes peu alphabétisées répondent aux questions de
   compréhension.
5. **Documentation** : statut, relecteur, date, licence.

Une phrase ne passe à `validated` que si les deux traductions et l’arbitrage
sont terminés. L'import refuse une validation par une seule personne.

## 4. Résultats — à remplir

| Langue | Phrases validées | Défauts majeurs | Adéquation /5 | Terminologie | Montants/noms préservés |
|---|---:|---:|---:|---:|---:|
| Fulfulde | 0 / 102 | à mesurer | à mesurer | à mesurer | 100 % attendu |
| Ewondo | 0 / 20 | à mesurer | à mesurer | à mesurer | 100 % attendu |
| Duala | 0 / 20 | à mesurer | à mesurer | à mesurer | 100 % attendu |

## 5. Phrases inédites — jugement natif

`docs/UNSEEN_JUDGMENT.csv` contient les 20 phrases, la sortie NLLB brute
(`candidate_raw`), la sortie après protection/restauration (`candidate_fub`)
et les colonnes de verdict par langue.

Pré-évaluation mécanique du 7 novembre 2026 :

| Résultat | Nombre | Signification |
|---|---:|---|
| `candidate_status=mt_eval` | 12/20 | sortie acceptée par les contrôles de jetons/nombres |
| `candidate_status=rejected_auto` | 8/20 | montant, terme ou jeton perdu ; original conservé |

Les 12 sorties acceptées ne sont **pas** validées : elles doivent être jugées
`acceptable`, `trompeur` ou `faux` par un natif. Les 8 refus automatiques ne
doivent pas être présentés comme des traductions.

## 6. Audio (K6)

- 15 phrases sans montant : voir `data/audio/fub/phrases.csv`.
- Enregistrement mono, pièce calme, OGG/Opus.
- Deux relecteurs, consentement écrit, licence CC0/CC BY.
- Aucun montant fixe prononcé.
- État : 0/15 enregistrée, 0/15 relue.

## 7. Décision

- [ ] Panel complet pour les trois langues.
- [ ] 40 termes de glossaire validés.
- [ ] 37/37 phrases P0 fulfulde validées.
- [ ] 102/102 phrases fulfulde validées ou explicitement non traduites.
- [ ] 20/20 phrases ewondo et duala validées.
- [ ] 70 messages du site officiel traduits.
- [ ] 20 phrases inédites jugées.
- [ ] 15 audio validés.
- [ ] Rapport signé.

**Tant que ces cases ne sont pas cochées, le niveau A reste en `draft` et
l’extension conserve le texte original.**
