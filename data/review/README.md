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
