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
## Surface popup — console de traduction

Le popup est un **outil**, pas la page éditoriale FINAKA. Il abandonne le crème,
le serif et l'or pour un panneau neutre, dense et précis : fond blanc, gris
froid, monochrome, bouton primaire noir. L'icône forêt/or porte la
marque ; l'interface reste une console.

### Format

- Largeur de référence : **380 px**.
- Hauteur utile : **~426 px** ; 600 px maximum.
- Le parcours principal (langue, traduire, restaurer) tient sans scroll.
- Le test de texte et la confidentialité sont des accordéons.

### Tokens du popup

| Rôle | Valeur |
|---|---|
| Encre | `#111111` |
| Encre secondaire | `#333333` |
| Texte discret | `#666666` |
| Ligne | `#E5E5E2` |
| Ligne forte | `#DCDCD7` |
| Surface | `#FFFFFF` |
| Surface douce | `#FAFAF8` |
| Fond page large | `#F2F2EF` |
| Focus | `#111111` |
| Sélection | `#ECECE8` |
| Erreur | `#B42318` |

L'or et le forêt restent dans l'icône ; le popup n'utilise ni or, ni crème, ni
dégradé.

### Typographie

| Rôle | Style |
|---|---|
| Mot-symbole | Noto Sans 700, 15 px |
| Titre | Noto Sans 700, 18 px |
| Corps | Noto Sans 400, 12 px |
| Libellé de rail | Noto Sans 800, 11 px, majuscules, tracking 0.08em |
| Route / tag | mono système, 9–11 px |
| Bouton primaire | Noto Sans 600, 13 px |
| Statut / pied | Noto Sans 400, 11–12 px |

Pas de Fraunces dans le popup : le serif reste réservé à la page FINAKA.

### Composants

- **Topbar** : 48 px, blanc, bord bas 1 px, icône 26 px, wordmark sans.
- **Rail de langues** : un seul bloc bordé, cellule Source grise à gauche,
  cellule Cible à droite, bouton sans bord et listbox custom, chevron dessiné.
- **Ligne moteur** : `MT:` ou `PACK:`, mono, sans bord ni fond, alignée avec l'état de la langue.
- **Listbox** : panneau arrondi 10 px, options de 30 px à 6 px de rayon, tag `MT`/`PACK`, coche à droite.
- **Bouton primaire** : 44 px, noir, texte blanc, flèche.
- **Actions secondaires** : deux boutons 34 px bordés, grille 1fr 1fr.
- **Statut** : ligne de texte simple, rouge en erreur, `aria-live` ; aucun point décoratif.
- **Test** : accordéon `details/summary`, chevron qui pivote, textarea et
  bouton 34 px.
- **Pied** : 1 px de bord haut, « Local · pseudonymisé » et
  « Confidentialité » en `details`.

### États

- Prêt, traduction lancée, original restauré, sélection traduite.
- Erreur d'injection, texte vide, traduction refusée, pack absent.
- Ligne `MT:` vs `PACK:`.
- Cloud autorisé / local uniquement.

### Rayons

| Élément | Rayon |
|---|---|
| Rail de langues, liste | 10 px |
| Bouton primaire | 8 px |
| Actions, champs, résultat, confidentialité | 6 px |
| Cadre large | 12 px |
| Icône | 7 px |
| Checkbox | 3 px |

### Mouvement

- Chevron de l'accordéon : 160 ms.
- Aucune animation d'entrée, aucun mouvement décoratif.
- `prefers-reduced-motion` réduit les durées à 1 ms.

### Accessibilité

- Contraste : encre/blanc 18,9:1 ; discret/blanc 5,7:1 ;
  discret/surface douce 5,3:1 ; erreur/blanc 6,3:1.
- Focus visible noir 2 px ; le rail entier réagit au focus du bouton.
- Cibles : primaire 44 px, actions 34 px, test 34 px, options 30 px.
- `aria-live` sur le statut, le résultat et les métadonnées.
- Ordre de tabulation : langue → traduire → restaurer → sélection → test →
  confidentialité → case cloud.

### Page large

Au-delà de 560 px, le panneau de 380 px se centre sur un fond `#F2F2EF`, avec
un bord 1 px et un rayon de 12 px. Le popup Chrome reste à 380 px.
