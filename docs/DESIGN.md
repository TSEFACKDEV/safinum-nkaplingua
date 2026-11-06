# Design system — NkapLingua / FINAKA

## Intention

Le design doit inspirer **confiance, calme et clarté** dans un contexte
financier. Il ne doit pas ressembler à une application de démonstration
générique, ni à un catalogue de motifs « africains ». La camerounité est
présente par la palette, les noms, la langue et la retenue graphique — pas par
des clichés.

Trois principes :

1. **Financier, pas froid** : vert profond, ivoire chaud, or discret.
2. **Éditorial, pas chargé** : titres serif, corps sans-serif, beaucoup d’air.
3. **Sobre, pas pauvre** : peu de couleurs, mais des détails soignés.

## Palette

| Rôle | Valeur | Usage |
|---|---|---|
| Forest 900 | `#123B2E` | header, CTA primaire, carte solde |
| Forest 950 | `#0D2A20` | profondeur, dégradés |
| Forest 700 | `#1D5A45` | accents, liens |
| Forest 100 | `#DCEBE3` | fonds doux, séparateurs |
| Gold 500 | `#C9A45C` | accent, chiffres clés, badges |
| Gold 700 | `#7A5A22` | texte doré accessible sur fond clair |
| Ivory | `#F8F4EC` | fond de page |
| Sand | `#F2ECE0` | surfaces secondaires |
| Ink 900 | `#14201B` | texte principal |
| Ink 500 | `#5D6D64` | texte secondaire |
| Terracotta | `#A94D35` | erreurs, sorties d’argent |
| Success | `#2F7D5B` | confirmations, entrées d’argent |
| Warning | `#A97728` | alertes, pénalités |

Règles :

- texte courant : `Ink 900` sur `Ivory` / `White` ;
- texte secondaire : `Ink 500` minimum ;
- or uniquement en accent ou en texte sur fond très clair avec `Gold 700` ;
- erreur : terracotta + fond `#FDF3F1`, jamais uniquement par la couleur ;
- succès : vert + coche + libellé.

## Typographie

| Style | Police | Taille | Usage |
|---|---|---|---|
| Display | Fraunces 500/600 | 44–58 px | titre de page, solde |
| H2 | Fraunces 600 | 26–30 px | titres de cartes |
| H3 | Noto Sans 700 | 15–17 px | sous-titres |
| Body | Noto Sans 400 | 15 px | texte courant |
| Body small | Noto Sans 400 | 12–13 px | aides, métadonnées |
| Label | Noto Sans 800 | 9–10 px | labels uppercase, tracking large |

- Fraunces apporte la « classe » éditoriale ; Noto Sans assure la lisibilité
  et couvre les caractères étendus du fulfulde (`ɓ`, `ɗ`, `ƴ`, `ŋ`) via le
  sous-ensemble `latin-ext`.
- Pas plus de 5 tailles visibles par écran.
- Les montants utilisent `font-variant-numeric: tabular-nums`.

## Espacement

Base 4 px :

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

- padding carte : 24 px desktop, 20 px mobile ;
- gap entre cartes : 20 px ;
- gap entre champs : 14 px ;
- hauteur de contrôle : 44 px minimum.

## Composants

- **Cartes** : rayon 22 px, bord 1 px `#E3DBCD`, ombre très douce.
- **Boutons** : primaire forest, secondaire ivoire bordé, quiet transparent.
- **Champs** : fond ivoire clair, focus ring or 3 px.
- **Badges** : pill 9–10 px, uppercase, tracking large.
- **Alertes** : bord gauche 3 px + icône + titre + texte.
- **Hero** : carte forest avec arcs décoratifs, solde tabulaire, actions rapides.

## Mouvement

| Token | Valeur | Usage |
|---|---|---|
| fast | 120 ms | hover, focus |
| normal | 200 ms | boutons, champs |
| moderate | 300 ms | entrées de carte |

- easing standard : `cubic-bezier(0.2, 0, 0, 1)`.
- Aucun mouvement qui bloque la lecture.
- `prefers-reduced-motion: reduce` réduit toutes les durées à 1 ms.

## Accessibilité

- Contraste texte : viser AA (4,5:1) pour le corps, AAA si possible.
- Focus visible sur tous les contrôles.
- Libellés explicites, pas seulement des placeholders.
- Alertes avec rôle `alert` et texte, pas seulement couleur.
- `lang="fub"` ajouté par le content script sur les zones traduites.
- Images décoratives marquées `aria-hidden="true"`.
- Zones cliquables ≥ 44 px.

## Contexte camerounais

- FCFA, mobile money, transfert national, épargne, crédit instantané.
- Noms et villes fictifs, pas de données réelles.
- Palette inspirée du drapeau et des paysages (vert, or, terre cuite) sans
  reprendre les symboles officiels.
- La langue fulfulde est traitée comme une langue de travail, pas comme un
  décor : elle apparaît dans la promesse, l’interface de traduction et la
  validation.

## À éviter

- jaune fluo + vert saturé + cartes blanches génériques ;
- motifs wax utilisés comme simple habillage ;
- texte gris trop clair sur fond crème ;
- icônes de tailles et graisses incohérentes ;
- animations qui retardent la lecture ;
- multiplier les CTA primaires dans un même écran.
