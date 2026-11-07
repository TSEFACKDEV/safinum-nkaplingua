# Orthographe — fulfulde, ewondo, duala

**Statut** : document de travail, **non validé**. Aucune règle ne doit être
appliquée automatiquement dans l’extension avant validation par les natifs.

## 1. Contexte

L’**AGLC** (Alphabet général des langues camerounaises) est la référence
orthographique. Les langues cibles utilisent des caractères étendus
(notamment `ɓ`, `ɗ`, `ƴ`, `ŋ`, `ɲ`) et des tons.

La demande K8 porte sur la relation entre `ɲ` et `ny`. **Attention** : `ɲ` est
une lettre distincte dans plusieurs langues camerounaises ; la remplacer par
`ny` peut changer la prononciation ou le sens. La règle `ɲ → ny` est donc une
**hypothèse de travail**, pas une règle acquise.

## 2. Décision à prendre avec les natifs

Pour chaque langue, le panel doit trancher :

- `ɲ` est-il conservé dans l’orthographe officielle ?
- `ny` est-il une simple saisie de secours au clavier ?
- Quels mots doivent rester en `ɲ` (noms propres, emprunts, toponymes) ?
- Les tons sont-ils obligatoires dans le pack finance ?
- Quelles variantes régionales sont acceptées ?

## 3. Table de validation — à remplir

| Langue | Forme observée | Forme proposée | Source | Relecteur | Décision |
|---|---|---|---|---|---|
| Fulfulde |  |  |  |  | à valider |
| Fulfulde |  |  |  |  | à valider |
| Fulfulde |  |  |  |  | à valider |
| Ewondo |  |  |  |  | à valider |
| Ewondo |  |  |  |  | à valider |
| Ewondo |  |  |  |  | à valider |
| Duala |  |  |  |  | à valider |
| Duala |  |  |  |  | à valider |
| Duala |  |  |  |  | à valider |
| Commun |  |  |  |  | à valider |

## 4. Règle de mise en œuvre

Tant que la table n’est pas remplie :

- ne pas modifier le texte source ;
- ne pas remplacer `ɲ` par `ny` dans l’extension ;
- conserver les caractères Unicode NFC ;
- laisser le texte original si un caractère n’est pas disponible dans la police.

## 5. Handoff Marius (M11)

Après validation, fournir :

```json
{
  "language": "fub",
  "rule": "keep_ɲ_or_map_to_ny",
  "exceptions": ["nom propre", "emprunt"],
  "tone_marks": "required|optional",
  "reviewer": "nom public",
  "date": "2026-11-XX"
}
```

Marius intégrera un normaliseur **déterministe**, sans toucher aux noms propres
ni aux emprunts.

## 6. Sources

- AGLC — Alphabet général des langues camerounaises.
- OLC / ERDELAP, Université de Dschang.
- Comité de Langue Beti, ACAMLADU, comités fulfulde.
- `docs/DATA_INTEGRATION.md`.
