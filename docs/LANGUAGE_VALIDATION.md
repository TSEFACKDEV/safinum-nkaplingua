# Validation linguistique — fulfulde (Adamawa)

## 1. Langue supportée

| Élément | Valeur |
|---|---|
| Langue | fulfulde (Adamawa) |
| Code ISO 639-3 | `fub` |
| Code NLLB utilisé | `fuv_Latn` (fulfulde nigérian, proche de l’adamawa) |
| Orthographe de référence | AGLC (Alphabet général des langues camerounaises) |
| Variétés à vérifier | Maroua, Garoua, Ngaoundéré |
| Public visé | utilisateurs de mobile money / banque / microfinance |

Le prototype utilise `fuv_Latn` comme approximation. La validation doit
confirmer que les traductions sont compréhensibles pour des locuteurs de la
variété adamawa visée.

## 2. Méthode de validation

### Constitution du panel

- 2 à 3 locuteurs natifs du fulfulde adamawa.
- Au moins un linguiste ou enseignant de langues nationales.
- Si possible, un agent de service client financier pour vérifier la
  terminologie métier.

### Corpus de validation

- 20 phrases minimum pour la présélection ;
- 100 phrases pour la version finale ;
- phrases courtes et longues ;
- domaines : solde, frais, transfert, crédit, épargne, KYC, sécurité ;
- phrases jamais utilisées pour l’entraînement ou le prompt ;
- références conservées dans un fichier séparé, non versionné si sensible.

### Protocole

1. Le traducteur ne voit pas la sortie du modèle avant d’avoir lu la source.
2. Il lit la phrase source (français ou anglais).
3. Il lit la traduction proposée.
4. Il note :
   - **adéquation** (le sens est-il conservé ?) 1–5 ;
   - **fidélité** (aucun ajout, omission, contresens) 1–5 ;
   - **terminologie** (terme financier correct) oui/non ;
   - **préservation** (montant, nom, condition, alerte) oui/non ;
   - **défaut majeur** oui/non.
5. Un second locuteur révise les cas litigieux.
6. Les désaccords sont consignés et arbitrés, pas moyennés silencieusement.

### Défaut majeur

Un défaut est **majeur** si la traduction :

- modifie un montant, un frais ou un pourcentage ;
- change un nom de bénéficiaire ou une institution ;
- inverse une condition (« dans 30 jours » → « dans 30 mois ») ;
- affaiblit ou contredit un avertissement de sécurité ;
- transforme une confirmation en infirmation.

Un seul défaut majeur sur une phrase critique suffit à refuser la phrase.

### Seuils proposés

| Métrique | Seuil |
|---|---|
| Montants / frais / pourcentages préservés | **100 %** |
| Noms / bénéficiaires préservés | **100 %** |
| Défauts majeurs sur phrases critiques | **0** |
| Adéquation moyenne | ≥ 3,5 / 5 |
| Terminologie finance | ≥ 90 % |
| Accord entre réviseurs | ≥ 80 % |

## 3. État actuel du prototype

Le moteur NLLB a été testé sur quelques phrases courtes. Résultats observés :

| Phrase source | Sortie NLLB | Observation |
|---|---|---|
| Le solde disponible est de 125 000 FCFA. | `Fedde jaɓande nden ko 125 000 FCFA.` | montant préservé, sens plausible |
| Les frais de transfert sont de 1 000 FCFA. | `Fedde jaɓɓorgo nden ko 1 000 FCFA.` | frais et montant préservés |
| Le taux d’intérêt mensuel est de 2 %. | `Fedde faayiida lewru fuu ko 2%.` | pourcentage préservé |
| Ne partagez jamais votre code PIN. | `Taa ɓe nganndi PIN-ɗaa.` | avertissement à faire valider |
| Le bénéficiaire reçoit le montant net après déduction des frais. | sortie instable | **phrase trop complexe : à découper** |

**Conclusion actuelle** : le pipeline technique est fonctionnel, mais la
qualité linguistique n’est **pas encore validée**. Il faut un locuteur natif
avant la démonstration.

## 4. Fiche de validation à remplir

```text
Validateur :
Variété de fulfulde :
Date :
Nombre de phrases :
Phrases avec défaut majeur :
Adéquation moyenne :
Terminologie correcte :
Commentaires :
```

## 5. Données à utiliser

- `data/unseen_finance.txt` : 20 phrases finance de test.
- `data/glossary.template.csv` : glossaire à remplir avec un natif.
- `docs/EVAL.md` : protocole de mesure (chrF++, COMET, latence).
- `docs/DATA_LICENSES.md` : licences du corpus et du modèle.

## 6. Ce qu’il faut éviter

- Faire valider par une seule personne puis annoncer « validé par le centre ».
- Utiliser des phrases de la page de démo comme jeu de test.
- Corriger la traduction puis présenter la correction comme sortie du modèle.
- Annoncer un score sans protocole ni nombre de phrases.
- Traduire un contrat réel sans mention « traduction assistée ».
