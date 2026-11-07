# Validation linguistique — fulfulde et packs communautaires

## 1. Langues et statuts

| Langue | Code | Moteur | Statut | Ce qui reste à faire |
|---|---|---|---|---|
| Fulfulde (Adamawa) | `fub` | NLLB `fuv_Latn` + MyMemory | MT baseline | relecture native de 20 phrases |
| Yemba | `ybb` | Pack communautaire | 0/20 phrases | remplir `data/language-packs/ybb.csv` |
| Medumba | `byv` | Pack communautaire | 0/20 phrases | remplir `data/language-packs/byv.csv` |
| Ewondo | `ewo` | Pack communautaire | 0/20 phrases | remplir le CSV |
| Douala | `dua` | Pack communautaire | 0/20 phrases | remplir le CSV |
| Bassa | `bas` | Pack communautaire | 0/20 phrases | remplir le CSV |
| Ghomala' | `bbj` | Pack communautaire | 0/20 phrases | remplir le CSV |

**Règle** : aucune langue autre que le fulfulde n’est présentée comme
« traduction automatique ». Les six autres sont des mémoires de phrases
validées. Le popup et la page affichent explicitement cet état.

## 2. Pourquoi ne pas utiliser NLLB pour le yemba et le medumba

Le tokenizer NLLB-200 ne connaît pas les codes `ybb_Latn`, `byv_Latn`,
`ewo_Latn`, `dua_Latn`, `bas_Latn` ou `bbj_Latn` : ils sont rejetés comme
`unk`. MyMemory renvoie aussi une erreur de langue cible invalide pour `ybb`
et `byv`. Inventer une traduction mot à mot serait dangereux sur des montants
et des conditions financières.

La seule voie responsable est :

1. collecter des phrases finance ;
2. les faire traduire et relire par des locuteurs natifs ;
3. les importer comme mémoire de traduction ;
4. n’appliquer que les phrases validées ;
5. laisser l’original visible sinon.

## 3. Corpus de validation

Le fichier `data/language-packs/<code>.csv` contient 20 phrases finance :

- solde, frais, montant total, crédit, débit ;
- bénéficiaire, transfert, confirmation ;
- code PIN, OTP, alerte de sécurité ;
- erreur, annulation, service client ;
- conditions et pénalités.

Les jetons `[[NUM_n]]`, `[[NAME_n]]`, `[[URL_n]]` et `[[EMAIL_n]]` ne doivent
pas être traduits ni déplacés. Les termes `FCFA`, `PIN`, `OTP` et `FINAKA`
doivent rester identiques.

## 4. Protocole pour le fulfulde (MT)

### Panel

- 2 à 3 locuteurs natifs du fulfulde adamawa.
- Au moins un linguiste ou enseignant de langues nationales.
- Si possible, un agent de service client financier.

### Notation

1. Le relecteur lit la phrase source.
2. Il lit la traduction proposée.
3. Il note :
   - **adéquation** (sens conservé) 1–5 ;
   - **fidélité** (aucun ajout, omission, contresens) 1–5 ;
   - **terminologie** financière oui/non ;
   - **préservation** (montant, nom, condition, alerte) oui/non ;
   - **défaut majeur** oui/non.
4. Un second locuteur révise les cas litigieux.
5. Les désaccords sont consignés et arbitrés.

### Défaut majeur

Un défaut est majeur si la traduction :

- modifie un montant, un frais ou un pourcentage ;
- change un nom de bénéficiaire ou une institution ;
- inverse une condition (« dans 30 jours » → « dans 30 mois ») ;
- affaiblit ou contredit un avertissement de sécurité ;
- transforme une confirmation en infirmation.

Un seul défaut majeur sur une phrase critique suffit à refuser la phrase.

### Seuils

| Métrique | Seuil |
|---|---|
| Montants / frais / pourcentages préservés | **100 %** |
| Noms / bénéficiaires préservés | **100 %** |
| Défauts majeurs sur phrases critiques | **0** |
| Adéquation moyenne | ≥ 3,5 / 5 |
| Terminologie finance | ≥ 90 % |
| Accord entre réviseurs | ≥ 80 % |

## 5. Protocole pour les packs (yemba, medumba, etc.)

1. Remplir la colonne `target` du CSV.
2. Relire avec un second locuteur.
3. Passer `status` à `validated`.
4. Importer :

```bash
python3 scripts/import-language-pack.py data/language-packs/ybb.csv
python3 scripts/import-language-pack.py data/language-packs/byv.csv
```

5. Vérifier que le script ne signale aucun jeton manquant.
6. Tester dans le popup : la phrase doit apparaître, les montants et le nom du
   bénéficiaire doivent être identiques.
7. Tester une phrase absente : l’original doit rester affiché.

Le script refuse une entrée si :

- un jeton `[[...]]` a disparu ou est dupliqué ;
- `FCFA`, `XAF`, `PIN`, `OTP`, `KYC` ou `FINAKA` a été traduit.

## 6. État actuel du prototype fulfulde

Quelques sorties observées :

| Phrase source | Sortie NLLB | Observation |
|---|---|---|
| Le solde disponible est de 125 000 FCFA. | `Fedde jaɓande nden ko 125 000 FCFA.` | montant préservé, sens plausible |
| Les frais de transfert sont de 1 000 FCFA. | `Fedde jaɓɓorgo nden ko 1 000 FCFA.` | frais et montant préservés |
| Le taux d’intérêt mensuel est de 2 %. | `Fedde faayiida lewru fuu ko 2%.` | pourcentage préservé |
| Ne partagez jamais votre code PIN. | `Taa ɓe nganndi PIN-ɗaa.` | avertissement à faire valider |
| Le bénéficiaire reçoit le montant net après déduction des frais. | sortie instable | phrase trop complexe : à découper |

**Conclusion** : le pipeline technique est fonctionnel, mais la qualité
linguistique du fulfulde n’est **pas encore validée**. Les six packs sont
vides. Il faut des locuteurs natifs avant de présenter le prototype comme
« validé ».

Le backend applique un filtre de qualité et, si `NK_ROUNDTRIP=1`, une
rétro-traduction de contrôle. Ces filtres réduisent les hallucinations mais ne
remplacent pas la relecture native. Le script `scripts/evaluate-unseen.py`
mesure le taux d’acceptation et la préservation des montants sur 20 phrases
inédites.

## 7. Fiche de validation à remplir

```text
Validateur :
Langue / variété :
Date :
Nombre de phrases :
Phrases avec défaut majeur :
Adéquation moyenne :
Terminologie correcte :
Commentaires :
```

## 8. Données à utiliser

- `data/language-packs/ybb.csv` et `byv.csv` : 20 phrases finance.
- `data/unseen_finance.txt` : phrases de test fulfulde.
- `data/glossary.template.csv` : glossaire à remplir.
- `docs/EVAL.md` : protocole de mesure (chrF++, COMET, latence).
- `docs/LANGUAGES.md` : couverture et limites.
- `docs/DATA_INTEGRATION.md` : intégration des données d’un centre
  linguistique camerounais.
- `docs/DATA_LICENSES.md` : licences.

## 9. Ce qu’il faut éviter

- Faire valider par une seule personne puis annoncer « validé par le centre ».
- Utiliser des phrases de la page de démo comme jeu de test.
- Corriger la traduction puis présenter la correction comme sortie du modèle.
- Annoncer un score sans protocole ni nombre de phrases.
- Remplir un pack yemba/medumba sans locuteur natif.
- Traduire un contrat réel sans mention « traduction assistée ».
