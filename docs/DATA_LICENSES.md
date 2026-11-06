# Données, modèles et licences

## Principe

« Publié sur internet » ne veut pas dire « libre de droit ». Pour chaque
ressource utilisée, il faut pouvoir répondre à :

1. Qui est l’auteur / l’institution ?
2. Quelle est la licence exacte (SPDX si possible) ?
3. Autorise-t-elle l’usage, la modification et la redistribution ?
4. Autorise-t-elle un usage commercial ?
5. Une attribution est-elle requise ?
6. La ressource a-t-elle été obtenue légalement et avec consentement ?

## Ressources utilisées dans ce prototype

### Modèle de traduction

| Élément | Valeur |
|---|---|
| Modèle | `facebook/nllb-200-distilled-600M` |
| Licence | **CC BY-NC 4.0** |
| Usage | traduction français → fulfulde (`fuv_Latn`) |
| Source | https://huggingface.co/facebook/nllb-200-distilled-600M |
| Remarque | usage non commercial autorisé pour le hackathon ; accord nécessaire pour une exploitation commerciale |

**Pourquoi NLLB et pas M2M100 ?** M2M100 est sous MIT, mais sa sortie `ff`
s’est révélée très instable sur le fulfulde (répétitions, anglais). NLLB
`fuv_Latn` produit des phrases courtes nettement plus cohérentes. Pour une
version commerciale, il faudra soit obtenir un accord pour NLLB, soit
fine-tuner M2M100 (MIT) sur le corpus adamawa.

### Corpus de référence / évaluation

| Élément | Valeur |
|---|---|
| Corpus | Adamawa Fulfulde–French Parallel Corpus of Narratives 1.2 |
| Contenu | ~1 977 lignes de récits alignés |
| Licence | **NOODL-1.0** (Nwulite Obodo Open Data License) |
| Source | Mozilla Data Collective |
| Usage prévu | évaluation et adaptation, pas de redistribution dans le dépôt |
| Remarque | lire les obligations de la NOODL avant tout usage commercial |

La NOODL est une licence ouverte africaine à obligations graduées. Elle peut
imposer des obligations de partage ou de bénéfice pour certains usages. Pour le
hackathon, utilisez le corpus pour l’évaluation interne et citez la source. Ne
copiez pas le corpus dans le dépôt public sans vérifier les termes.

### Données audio (optionnel)

| Élément | Valeur |
|---|---|
| Dataset | Common Voice Scripted Speech — Adamawa Fulfulde |
| Licence | **CC0 1.0** |
| Source | Mozilla Data Collective / Common Voice |
| Usage | démonstration audio, pas nécessaire au MVP |

### Polices

| Élément | Valeur |
|---|---|
| Polices | Noto Sans, Fraunces |
| Licence | **SIL Open Font License 1.1** |
| Source | Google Fonts, sous-ensembles WOFF2 locaux |
| Usage | interface et page de démonstration |

### Recherches du centre linguistique

Les publications du centre linguistique camerounais peuvent être utilisées
comme **référence scientifique** : orthographe, grammaire, terminologie,
variétés. Elles ne doivent pas être transformées en corpus d’entraînement sans
autorisation explicite.

À faire :

- conserver la référence bibliographique complète ;
- demander une autorisation écrite si des extraits sont intégrés ;
- ne pas recopier un dictionnaire ou un lexique sous droit d’auteur ;
- citer l’AGLC (Alphabet général des langues camerounaises) pour l’orthographe.

## Ce qu’il ne faut pas faire

- Scraper un dictionnaire en ligne sans licence.
- Utiliser des traductions de forums, réseaux sociaux ou sites religieux sans
  vérifier la licence.
- Prendre un PDF « accessible gratuitement » pour une ressource libre.
- Utiliser un modèle CC BY-NC dans un produit commercial sans accord.
- Mélanger des données de provenances différentes sans documenter la source.

## Data card à remplir avant la démo

```yaml
language: Fulfulde (Adamawa)
iso639_3: fub
model_code: fuv_Latn
orthography: AGLC
sources:
  - name: NLLB-200 600M
    license: CC BY-NC 4.0 (non commercial)
    role: model
  - name: Adamawa Fulfulde–French Parallel Corpus of Narratives 1.2
    license: NOODL-1.0
    role: evaluation
  - name: Centre linguistique camerounais
    license: à confirmer
    role: reference_only
validation:
  native_speakers: à remplir
  sentences_validated: à remplir
  date: à remplir
limitations:
  - domaine littéraire, pas financier
  - variété régionale à valider
  - pas de traduction certifiée
```
