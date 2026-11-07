# Intégrer les données d’un centre linguistique camerounais

Ce document répond à une question précise : **comment brancher NkapLingua sur
des données produites par un centre de linguistique camerounais**, sans
scraper, sans violer les licences et sans mettre en danger les montants
financiers.

## 1. Identifier le bon interlocuteur

Le paysage est fragmenté. Il faut distinguer :

| Acteur | Rôle | Pertinence pour NkapLingua |
|---|---|---|
| **Observatoire des Langues Camerounaises (OLC)**, Université de Dschang | Plateforme de veille, base numérique des langues, publications | Point d’entrée académique le plus solide |
| **ERDELAP / Laboratoire Techno2LAP**, Université de Dschang | Recherche-développement en linguistique appliquée, technologies des langues, manuels en 11 langues dont yémba et medumba | Partenaire idéal pour un lot de données validées |
| **Comités de langues** (ex. Comité d’étude de la langue Yémba) | Orthographe, lexique, relecture | Validation native de proximité |
| **ANACLAC** | Coordination des comités de langues camerounaises | Recommandation et gouvernance |
| **SIL Cameroun** | Dictionnaires, alphabets, outils lexicographiques | Données structurées, formats LIFT/XML |
| **NTeALan** | Dictionnaires collaboratifs, APIs, plateforme NATP, dictionnaire Yemba-Français XMLisé | Intégration technique et corpus |
| **Centre Linguistique Régional de Douala** | Formation en français et anglais | **Pas** une source de données en langues nationales |

Le « centre linguistique » auquel on pense est souvent le centre de Douala,
mais son mandat porte sur les deux langues officielles. Pour les langues
nationales, il faut plutôt viser l’OLC/ERDELAP à Dschang, les comités de
langues et les académies de langues camerounaises.

> Si le partenaire du challenge désigne un centre précis, vérifier son mandat
> et sa politique de partage avant toute intégration.

## 2. Ce qu’il faut demander

Ne pas demander « toutes vos données ». Demander un **lot borné, licencié et
versionné** :

- 500 à 2 000 phrases finance en français et en langue cible ;
- un lexique de 200 à 500 termes métier : solde, frais, transfert, bénéficiaire,
  échéance, taux, pénalité, code PIN, OTP, opposition, réclamation ;
- les variantes dialectales et l’orthographe retenue (AGLC) ;
- les métadonnées : source, auteur, date, licence, statut de relecture ;
- un contact pour la relecture et les mises à jour.

Pour l'ewondo et le duala, le chemin le plus crédible est TRAPD : deux
locuteurs natifs de variétés différentes traduisent, un troisième arbitre, puis
un prétest avec 5 à 8 personnes peu alphabétisées. Le corpus Common Voice
(CC0) sert de référence audio, pas de traduction.

## 3. Formats d’échange

| Usage | Format | Remarque |
|---|---|---|
| Relecture communautaire | CSV / TSV | simple, ouvrable dans Excel ou LibreOffice |
| Runtime extension | JSON | chargé localement, aucun réseau |
| Terminologie | TBX | standard ISO 30042, utile pour un centre linguistique |
| Mémoire de traduction | TMX | échange avec CAT tools |
| Lexicographie | LIFT / XML | format SIL, compatible NTeALan |
| Corpus annoté | CoNLL-U | si l’on veut mesurer la qualité morphosyntaxique |

Le dépôt utilise CSV pour la relecture et JSON pour l’exécution. Le script
`scripts/import-language-pack.py` fait la conversion.

## 4. Schéma minimal d’une entrée

```json
{
  "source": "Le solde est de [[NUM_0]] FCFA.",
  "target": "…",
  "source_lang": "fr",
  "target_lang": "ewo",
  "dialect": "Menoua",
  "orthography": "AGLC",
  "domain": "finance",
  "context": "solde",
  "part_of_speech": "sentence",
  "license": "CC BY 4.0",
  "source_url": "…",
  "reviewer": "…",
  "review_status": "validated",
  "reviewed_at": "2026-11-10",
  "version": "0.1.0"
}
```

Le champ `review_status` est structurant :

- `draft` : proposition, jamais appliquée ;
- `reviewed` : relue une fois, encore en attente ;
- `validated` : appliquée par l’extension ;
- `deprecated` : retirée.

## 5. Pipeline d’intégration

```text
Centre / comité de langue
        │  CSV, TBX, LIFT, TMX
        ▼
scripts/import-language-pack.py
        │  normalisation Unicode NFC, contrôle des jetons
        ▼
extension/language-packs/<code>.json
        │  relecture native + tests
        ▼
ZIP de l’extension (hors ligne)
```

Étapes concrètes :

1. **Convention de partage** : écrire un mail ou une convention courte avec
   l’OLC/ERDELAP ou le comité de langue. Préciser l’usage (hackathon,
   prototype non commercial), la licence, l’attribution et la durée.
2. **Normalisation** : Unicode NFC, apostrophes droites, espaces insécables
   contrôlées, respect des tons et des caractères AGLC.
3. **Alignement** : une phrase source = une phrase cible. Ne pas aligner des
   paragraphes entiers.
4. **Contrôle automatique** : jetons `[[NUM_n]]`, `[[NAME_n]]`, `[[URL_n]]`,
   `[[EMAIL_n]]` présents une seule fois ; termes `FCFA`, `PIN`, `OTP`,
   `FINAKA` conservés.
5. **Relecture native** : deux relecteurs si possible ; désaccord tranché par
   un troisième.
6. **Tests** : les 20 phrases de `data/language-packs/` doivent passer.
7. **Publication** : version, date, relecteur, licence et empreinte du fichier.
8. **Mise à jour** : ne jamais écraser un pack validé sans nouvelle revue.

## 6. Contrôles qualité

- Taux de défauts majeurs : un montant, une condition ou un avertissement
  modifié = défaut majeur.
- Taux de phrases non traduites (pack miss) : doit être affiché, pas caché.
- Accord inter-relecteurs sur un échantillon de 20 %.
- Test à l’aveugle sur des phrases inédites.
- Vérification de l’orthographe AGLC et des tons.
- Test de non-régression : les 20 phrases finance + 10 phrases de sécurité.

## 7. Licence, éthique et protection des données

- **Ne pas redistribuer** un dictionnaire ou un corpus sans autorisation
  écrite. Les dictionnaires yemba et medumba cités en référence ont des ayants droit.
- **Attribuer** chaque lot : nom du centre, auteur, année, licence, URL.
- **Minimiser** : le pack ne contient que des phrases finance génériques,
  jamais de données clients réelles.
- **Consentement** : les locuteurs contributeurs sont crédités et peuvent
  retirer leur contribution.
- **Hors ligne par défaut** : les packs sont embarqués dans l’extension ;
  aucun appel réseau n’est nécessaire pour une langue en mode pack.
- **NLLB** reste CC BY-NC 4.0 : usage non commercial pour le hackathon.
- **MyMemory** est un service externe : ne pas y envoyer de données réelles ;
  le mode pack ne l’utilise jamais.
- Faire relire la convention par un juriste si le projet passe en production.

## 8. Plan Ewondo / Duala pour l’équipe

Yemba, medumba, bassa et ghomala' ne sont plus dans le prototype : les
ressources de parole et documentaires retenues sont désormais l'ewondo,
le duala et le fulfulde d'Adamawa (voir `docs/LANGUAGES.md` et
`tasks/klein.md`, K10).

Plan en 48 h pour l'ewondo et le duala :

1. Ouvrir `data/language-packs/ewo.csv` et `dua.csv`.
2. Traduire les 20 phrases finance, sans toucher aux jetons.
3. Relire à voix haute avec un second locuteur (TRAPD).
4. Passer `status` à `validated`, mettre le nom du relecteur.
5. Lancer :

```bash
python3 scripts/import-language-pack.py data/language-packs/ewo.csv
python3 scripts/import-language-pack.py data/language-packs/dua.csv
./scripts/package-extension.sh
```

6. Tester les phrases dans le popup, puis dans la page de démo.
7. Filmer la démonstration avec le pack ewondo ou duala.

## 9. Sources consultées

- OLC — Observatoire des Langues Camerounaises, Université de Dschang :
  <https://observatoiredeslangues.com/>
- OLC — Le livre harmonisé de langues nationales (yémba, medumba, fulfulde,
  basàa, beti, ghomala’, etc.) :
  <https://observatoiredeslangues.com/le-livre-harmonise-de-langues-nationales/>
- OLC — Laboratoire Techno2LAP / ERDELAP :
  <https://observatoiredeslangues.com/labo-techno2lap/>
- NTeALan — API et dictionnaires :
  <https://apis.ntealan.net/ntealan/fr>
- NTeALan — Dictionnaire Yemba-Français XMLisé :
  <https://natp.ntealan.net/discover/resources/dictionnaire-yemba-francais>
- Aleco — Yemba Language Learning Tools (3 000+ entrées) :
  <http://yemba.net/wdict/index.php?lang=fr>
- Petit Dictionnaire Yémba–Français, Steven Bird & Maurice Tadadjeu,
  Comité d’étude de la langue Yémba, 1997.
- Kemelang — dictionnaire Medumba (≈2 613 mots) :
  <https://kemelang.com/medumba/>
- LLACAN — manuel Medumba, orthographe AGLC :
  <https://llacan.cnrs.fr/escaged/resources/books/Medumba/Medumba%203.1.pdf>
- Alphabet général des langues camerounaises (AGLC), 1978 :
  <https://fr.wikipedia.org/wiki/Alphabet_général_des_langues_camerounaises>
- Centre Linguistique Régional de Douala (français/anglais) :
  <https://doualabil.net/>

## 10. Ce qu’il ne faut pas faire

- Promettre une traduction automatique ewondo/duala sans modèle validé.
- Scraper Glosbe, Kemelang ou un dictionnaire PDF et le revendre.
- Envoyer des noms de clients réels à MyMemory.
- Utiliser une traduction non relue pour un message de sécurité.
- Cacher les phrases non traduites : l’utilisateur doit voir l’original.
