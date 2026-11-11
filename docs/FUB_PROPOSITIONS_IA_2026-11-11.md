# Propositions fulfulde reçues le 11 novembre 2026

Deux fichiers reçus :

- `fub_relecture_pack.csv` — 185 lignes, relecture du pack existant ;
- `fub_traductions_proposees.csv` — 416 sources avec proposition de traduction.

## Résultat brut

### Relecture du pack

| Confiance | Lignes |
|---|---:|
| sûr | **4** |
| probable | **3** |
| incertain | **178** |

- Les 4 « sûr » sont des invariants (`[[NUM_0]] FCFA`, `Amina Ngo Bell`) :
  rien à traduire.
- Les 3 « probable » sont des emprunts usuels (`code PIN`, `code`, `Mobile Money`).
- **4 propositions de changement**, toutes `incertain` :
  - `Transfert effectué` : `Nawgol naatii` → `Nawgol nelaama` ;
  - `Transfert reçu` : `Kaalis naatii` → `Kaalis keɓaama` ;
  - leurs équivalents anglais.
- **Aucune correction « sûre »** du pack.

### Traductions proposées

| Statut | Lignes |
|---|---:|
| `INCONNU` | **385** |
| `incertain` | **16** |
| `probable` | **15** |

Sur 416 sources, **31 seulement** ont une proposition utilisable (−385
marquées INCONNU par le modèle).

## Ce qui a été importé

31 entrées ajoutées au pack fulfulde en `draft`, contexte
`proposition-relecture`, avec la confiance dans la note :

- actions : `Nelu`, `Teeŋtu`, `Yoɓu`, `Keɓu`, `Lonndu`, `Enndu kadi` ;
- phrases : solde, frais, bénéficiaire, transfert envoyé, accueil, merci ;
- termes : banque, IBAN, SWIFT, KYC, OTP, langue, monnaie.

Pack fulfulde : **185 → 216 entrées**. **0 validé.**

## Points chauds confirmés

- `Teeŋtu` sert à **confirmer et vérifier** : collision réelle, signalée P1.
- `njoɓdi` couvre frais, paiement, facture, salaire.
- `yoɓgol` couvre payer **et** valider.
- `naatii` est utilisé pour entrer, envoyer et recevoir : direction ambiguë.

## Décision

- **Ne pas passer** `Transfert effectué` / `Transfert reçu` → `nelaama` / `keɓaama`
  sans relecteur natif : c'est `incertain`.
- Les 31 propositions restent **en démonstration**.
- Les 385 `INCONNU` restent dans `fub-translation-queue.csv` pour le panel.
