# Import fulfulde — 11 novembre 2026

**Fichiers reçus** : `fub_nouvelles_sources.csv` (416 lignes) et
`fub_controle_forme.csv` (185 lignes).

## Ce que contiennent ces fichiers

Le premier est une **liste de sources françaises**, pas des traductions :
**413 / 416 cibles sont vides**. Claude a refusé de traduire en aveugle, et tout
est marqué `unsure` / `low`. Seules 3 cibles ont un candidat, dont deux non
confirmés (`kaalisi`, `mbuuɗu`).

Le second est un **audit de forme** des 185 entrées du pack, avec 35 signaux et
une priorité P1/P2/P3, colonnes de panel vides.

## Ce qui a été importé

| Fichier | Contenu | Statut |
|---|---|---|
| `data/review/fub-panel-P1P2P3.csv` | 185 entrées, 35 signaux, P1/P2/P3 | kit de relecture |
| `data/review/fub-translation-queue.csv` | 416 sources, cible vide | file de traduction |
| `data/corpus/finance-multilingual.csv` | 642 lignes (+406 clés) | `missing` |

**Aucune traduction inventée. Aucun statut `validated`.**

## Signaux à traiter en premier

- `NJOODI_MULTI_SENS` (18) : `njoɓdi` couvre frais, paiement, facture, salaire.
- `MOT_A_MOT_PROBABLE` (14) : plafond, découvert, agence, guichet, litige.
- `NAWGOL_VS_NELU` : `nawgol` pour envoyer et recevoir.
- `YOOBGOL_PAYER_VALIDER` : `yoɓgol` pour payer et valider.
- `EMPRUNT_A_DECLARER` (11).

## Prochaine étape

Le panel natif remplit `fub-translation-queue.csv` (cible, verdict,
commentaire) et `fub-panel-P1P2P3.csv` (traduction libre, rétro-traduction,
verdict). Ensuite seulement on passe au pack.
