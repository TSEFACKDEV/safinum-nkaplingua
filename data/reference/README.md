# Références de consultation — glossaire finance

Ce dossier contient des liens vers des sources externes et **deux lexiques
libres explicitement attribués**. Il ne contient **aucune traduction issue de
Glosbe, Resulam ou Webonary** : ces sources restent des points de consultation,
pour que les natifs puissent vérifier le sens d’un terme avant d’écrire leur
propre traduction.

## Fichier

[`glossary-links.csv`](glossary-links.csv) : 40 termes du glossaire, avec :

| Colonne | Usage |
|---|---|
| `item_id` | identifiant `G01`…`G40`, identique au kit natif |
| `source_fr`, `source_en` | terme source |
| `domain`, `priorite` | domaine et priorité P0/P1 |
| `glosbe_ewo`, `glosbe_dua`, `glosbe_fub` | page Glosbe français → langue |
| `webonary_search` | recherche Webonary |
| `resulam_search` | recherche Resulam |
| `silcam_ewo`, `silcam_dua`, `silcam_fub` | archives SIL Cameroon |
| `note` | règle d’usage |

Génération :

```bash
python3 scripts/build-reference-links.py
```

## Lexiques libres

| Fichier | Source | Licence | Volume |
|---|---|---|---:|
| [`panlex/panlex-targets.csv`](panlex/panlex-targets.csv) | `lbourdois/panlex` (PanLex) | CC0-1.0 | 3 573 entrées |
| [`fulfulde-suzuya.csv`](fulfulde-suzuya.csv) | `SuzuyaXIII/fulfulde` | MIT | 922 entrées |

Ce sont des **lexiques**, pas des corpus parallèles : ils servent à vérifier
une orthographe ou un terme, jamais à remplacer la traduction native. Voir
[`NOTICE.md`](NOTICE.md) pour les attributions et
[`../../docs/EXTERNAL_RESOURCES.md`](../../docs/EXTERNAL_RESOURCES.md) pour
l’inventaire complet.

## Règles

1. **Consulter, pas copier.** Glosbe, Resulam et Webonary ne sont pas sous
   licence libre compatible avec le concours. Leur contenu ne doit pas être
   recopié dans un pack.
2. **Écrire sa propre traduction.** Le natif lit la source, comprend le sens,
   puis formule la traduction dans sa langue.
3. **Citer la source** dans `commentaire` si elle a aidé :
   `réf. Glosbe consulté le 2026-11-10`.
4. **Ne jamais recopier une entrée entière** ni aspirer un dictionnaire.
5. **L’arbitre vérifie** que la traduction finale est humaine et originale ;
   `provenance=human` est obligatoire.

## État des sources pour nos langues

- **Glosbe** : quelques termes de base existent (ex. `argent` → `mòni` en
  ewondo, `mbolo` en duala), mais `solde` et `banque` n’ont pas de traduction
  dans les dictionnaires ewondo/duala consultés. Le fulfulde a un dictionnaire
  `fr/fub`.
- **Webonary** : pas de dictionnaire dédié ewondo/duala trouvé ; la recherche
  globale « solde » ne renvoie aucun résultat. Les dictionnaires voisins
  (bassa, bulu, akoose) mentionnent parfois l’ewondo ou le duala, mais leurs
  entrées sont protégées.
- **Resulam** : livres et phrasebooks payants, aucune licence ouverte ; la
  recherche « solde » ne renvoie rien.

Conclusion : ces sources ne peuvent pas remplacer le travail des natifs. Elles
servent à préparer les questions et à vérifier une orthographe, pas à remplir
un pack validé.

## Audit complet

Voir [`../../docs/REFERENCE_SOURCES.md`](../../docs/REFERENCE_SOURCES.md) :
licences, conditions d’utilisation, `robots.txt`, extraits des CGU Glosbe,
modèle de demande d’autorisation.
