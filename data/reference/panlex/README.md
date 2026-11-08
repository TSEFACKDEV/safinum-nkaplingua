# PanLex — vocabulaire cible

**Source** : `lbourdois/panlex` sur Hugging Face, dérivé de la version
PanLex Language Vocabulary du 1er janvier 2024.

**Licence** : **CC0-1.0** (domaine public). Attribution recommandée :
PanLex Project, <https://vocab.panlex.org/>.

**Fichier** : [`panlex-targets.csv`](panlex-targets.csv), 3 573 entrées
filtrées pour les trois langues du projet :

| Langue | Code | Entrées |
|---|---|---:|
| Fulfulde (Adamawa) | `fub` | 2 105 |
| Duala | `dua` | 1 009 |
| Ewondo | `ewo` | 459 |

**Colonnes** : `vocab;639-3;639-3_english_name;var_code;english_name_var`.

**Limite importante** : cet export ne contient que le vocabulaire, **sans
identifiant de sens ni traduction**. Il ne permet donc pas de construire des
paires parallèles. Il sert à vérifier une orthographe, une variante ou
l'existence d'un terme avant la relecture native.

**Règle** : ne pas utiliser ce lexique comme traduction automatique ni comme
remplacement du travail des natifs. Les entrées restent des références.
