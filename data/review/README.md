# Kit de relecture native

Fichiers générés le 10 novembre 2026. **Aucune ligne n'est `validated`.**

- `sentence-bank-50.csv` : 50 phrases par langue (150), issues des messages du
  site et des packs existants. Ce sont des traductions existantes, pas des
  phrases inventées. Chaque ligne a un type et une note de construction.
- `entry-audit-582.csv` : audit **structurel** des 583 entrées des packs
  (longueur, source identique, question, négation, possessif, chiffre).
  Il ne juge pas la qualité native.
- `native-kit.csv` : 150 phrases + 32 termes finance = **183 lignes** à relire.
  Colonnes vides : `reviewer_1`, `reviewer_2`, `arbiter`, `decision`, `comment`.
- `duala-helmlinger-comparison.csv` : recherche **de chaîne** des cibles duala
  dans la couche texte de Helmlinger 1972. `string_match` ne signifie pas
  « sens validé ».

## Procédure

1. Un relecteur natif remplit `reviewer_1` et `decision`.
2. Un second relecteur indépendant remplit `reviewer_2`.
3. Un arbitre tranche les désaccords dans `arbiter`.
4. Une entrée ne passe à `validated` que si les deux relecteurs et l'arbitre
   sont d'accord.
5. Ne jamais remplir `decision=validated` sans preuve et consentement.


## Fichiers ajoutés le 11 novembre 2026

- `fub-panel-P1P2P3.csv` : 185 entrées du pack fulfulde avec signaux de forme
  (35 types), priorité panel P1/P2/P3, colonnes de relecture vides.
  Ce n'est **pas une validation** : c'est la liste de ce qu'il faut faire relire.
- `fub-translation-queue.csv` : 416 sources françaises à traduire (actions,
  comptes, sécurité, erreurs, crédit, banque, phrases), **cibles vides**.
  Claude a volontairement refusé de traduire en aveugle ; tout est `proposed`.
- 406 nouvelles clés ajoutées au corpus `finance-multilingual.csv`
  (642 lignes au total), avec `status: missing`.

### Signaux prioritaires

- `NJOODI_MULTI_SENS` (18) : `njoɓdi` couvre frais, paiement, facture, salaire.
- `MOT_A_MOT_PROBABLE` (14) : plafond, découvert, agence, guichet, litige.
- `NAWGOL_VS_NELU` : `nawgol` pour envoyer et recevoir.
- `YOOBGOL_PAYER_VALIDER` : `yoɓgol` pour payer et valider.
- `EMPRUNT_A_DECLARER` (11) : emprunts non déclarés.


## Propositions IA du 11 novembre

- `fub-relecture-pack-ia.csv` : relecture des 185 entrées (4 sûr, 3 probable,
  178 incertain) ; aucune correction sûre.
- `fub-traductions-proposees-ia.csv` : 416 sources, 31 propositions utilisables,
  385 INCONNU.
- 31 entrées importées au pack en `draft` (contexte `proposition-relecture`).
