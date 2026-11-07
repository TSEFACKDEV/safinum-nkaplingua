# Sources de référence — audit et règles d’usage

**Date de l’audit** : 7 novembre 2026  
**Langues** : fulfulde (`fub`), ewondo (`ewo`), duala (`dua`)  
**Objet** : vérifier ce que Glosbe, Resulam et Webonary permettent réellement
de réutiliser dans NkapLingua.

## 1. Conclusion

Le scraping massif de Glosbe, Resulam et Webonary n’est **pas compatible** avec
les règles du projet :

- Glosbe interdit la copie automatisée d’une partie substantielle de sa base ;
  son contenu utilisateur est sous **CC BY-NC-SA 4.0**, licence non autorisée
  par le concours (MIT, CC0, CC BY, OFL uniquement).
- Resulam vend des livres et des applications protégés par le droit d’auteur ;
  aucune licence ouverte n’est publiée.
- Webonary héberge des dictionnaires dont les droits appartiennent à chaque
  auteur ou communauté ; les mentions « © … All rights reserved » sont
  fréquentes. Le `robots.txt` autorise la recherche et la référence, pas la
  réutilisation du contenu.

La stratégie retenue est donc :

1. **ne copier aucun contenu** de ces plateformes dans le dépôt ;
2. construire un **navigateur de références** (liens de consultation) ;
3. demander une autorisation écrite si un partenaire veut fournir un lexique ;
4. faire écrire la traduction finale par le natif, qui atteste `human`.

## 2. Glosbe

| Élément | Constat |
|---|---|
| URL | <https://glosbe.com> |
| Contenu | traductions communautaires, mémoire de traduction, exemples |
| Licence du contenu utilisateur | **CC BY-NC-SA 4.0** (conditions d’utilisation) |
| Base de données | droits de base de données revendiqués par Glosbe |
| API | service de test, peut être limité ou coupé |
| Copie automatisée | **interdite** pour toute partie substantielle de la base |
| Verdict NkapLingua | **référence manuelle seulement**, aucun import |

Extraits pertinents des conditions (traduction OCR du PDF anglais) :

- « using the Services through the means and technologies designated for
  copying the entire or a material part of the Dictionary database, in
  particular automates, bots, and similar means » est interdit ;
- l’utilisateur qui ajoute du contenu autorise son usage sous CC BY-NC-SA 4.0.

**Conséquence** : on peut ouvrir une page Glosbe pour comprendre un terme,
mais on ne peut ni aspirer les pages, ni recopier les traductions dans un pack.
Une traduction finale identique à une entrée Glosbe doit être évitée : le
natif doit produire sa propre formulation et documenter sa source.

## 3. Resulam

| Élément | Constat |
|---|---|
| URL | <https://resulam.com> |
| Contenu | livres, phrasebooks, dictionnaires visuels, applications, vidéos |
| Licence | aucune licence ouverte publiée ; produits payants |
| Exemples utiles | phrasebook ewondo, phrasebook duala, dictionnaire visuel ewondo |
| Verdict NkapLingua | **lien de référence**, achat éventuel, aucune copie |

Resulam est une association de promotion des langues ancestrales. Ses
produits peuvent aider un natif à vérifier un usage, mais ils ne peuvent pas
être intégrés au dépôt sans accord écrit. Le site ne publie pas de lexique
libre réutilisable.

## 4. Webonary (SIL Cameroon)

| Élément | Constat |
|---|---|
| URL | <https://www.webonary.org> |
| Contenu | dictionnaires et grammaires publiés par des communautés |
| Licence | propre à chaque dictionnaire ; souvent « © … All rights reserved » |
| `robots.txt` | `search=yes`, `ai-train=no`, `use=reference` |
| Verdict NkapLingua | **référence seulement**, pas de copie en masse |

Webonary n’est pas une base unique : chaque dictionnaire a son auteur, son
copyright et ses conditions. Le `robots.txt` autorise l’indexation de recherche
et un usage de référence, mais **ne donne pas** une licence de réutilisation.

### Résultat pour nos trois langues

- Aucun dictionnaire Webonary dédié à l’**ewondo** ou au **duala** n’a été
  trouvé lors de l’audit.
- La recherche globale « solde » ne renvoie aucun résultat.
- Des dictionnaires voisins (bassa, bulu, akoose, etc.) mentionnent parfois
  l’ewondo ou le duala, mais ces entrées appartiennent à leurs auteurs.
- SIL Cameroon recense 7 ressources en ewondo, 6 en duala et 8 en fulfulde
  Adamawa, mais beaucoup sont des archives « Contact the Archives », non
  publiées en ligne ou sans licence ouverte.

**Conséquence** : Webonary ne peut pas fournir directement les 40 termes
finance. Il peut aider à comprendre une variante ou une orthographe, pas à
remplir un pack validé.

## 5. Ce que nous faisons à la place

### 5.1 Navigateur de références

[`data/reference/glossary-links.csv`](../data/reference/glossary-links.csv)
contient, pour chacun des 40 termes du glossaire :

- le lien Glosbe français → ewondo, duala, fulfulde ;
- le lien de recherche Webonary ;
- le lien de recherche Resulam ;
- le lien SIL Cameroon de la langue.

Ces liens sont générés par
[`scripts/build-reference-links.py`](../scripts/build-reference-links.py).
Ils ne contiennent **aucune traduction** : ce sont des points d’entrée pour
une consultation humaine.

### 5.2 Règle pour les natifs

1. Consulter la source pour comprendre le sens, pas pour copier.
2. Écrire sa propre traduction.
3. Noter l’URL consultée dans `commentaire` si elle a aidé.
4. Ne jamais recopier une entrée de dictionnaire non libre.
5. L’arbitre vérifie que la traduction finale est bien humaine et originale.

### 5.3 Demande d’autorisation

Si un partenaire (SIL, Resulam, OLC/ERDELAP, NTeALan) veut fournir un lexique,
utiliser ce modèle :

```text
Objet : autorisation d’utiliser un lexique pour NkapLingua

Bonjour,

Nous développons NkapLingua, un prototype d’accessibilité financière pour le
fulfulde, l’ewondo et le duala, dans le cadre du SAFINUM Innovate Challenge
2026. Nous souhaitons utiliser [nom du lexique / dictionnaire] pour :

- vérifier la terminologie finance ;
- proposer des traductions à nos relecteurs natifs ;
- publier les phrases validées sous CC0-1.0 ou CC-BY-4.0.

Pouvez-vous nous confirmer :

1. la licence exacte du lexique ;
2. si la reproduction de termes isolés et de courts exemples est autorisée ;
3. si une mention d’attribution suffit ;
4. si un accord écrit est nécessaire pour un usage non commercial puis
   commercial.

Nous pouvons signer une convention et limiter l’usage aux besoins du prototype.

Cordialement,
L’équipe NkapLingua
```

## 6. Sources réellement libres

| Source | Licence | Usage |
|---|---|---|
| Common Voice 27.0 — ewondo, duala, fulfulde | CC0-1.0 | audio, ASR, évaluation |
| NLLB-200 | CC BY-NC 4.0 | démonstration non commerciale |
| Code NkapLingua | MIT | réutilisation |
| Polices Noto Sans / Fraunces | SIL OFL 1.1 | typographie |
| Contributions natives | CC0-1.0 ou CC-BY-4.0 | packs validés |

Les autres sources (Glosbe, Resulam, Webonary, SIL Cameroon, NTeALan,
Kemelang, Glosbe, Scribd, PDF LLACAN) restent des **références** tant qu’une
autorisation écrite n’a pas été obtenue.

## 7. Preuves

- Glosbe, conditions d’utilisation : <https://glosbe.com/terms> ; PDF anglais
  <https://glosbe.com/terms_en.pdf> ; `robots.txt` : <https://glosbe.com/robots.txt>.
- Resulam, conditions et boutique : <https://resulam.com> ;
  `robots.txt` : <https://resulam.com/robots.txt>.
- Webonary, conditions : <https://www.webonary.org/sil-international-terms-of-service-for-webonary-org/?lang=en> ;
  `robots.txt` : <https://www.webonary.org/robots.txt>.
- SIL Cameroon, archives : <https://www.silcam.org/resources/browse/language/all>.
- Glosbe ewondo : <https://glosbe.com/fr/ewo> ; duala :
  <https://glosbe.com/fr/dua> ; fulfulde : <https://glosbe.com/fr/fub>.
