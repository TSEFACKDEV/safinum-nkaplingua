# Évaluation — contenu inédit

## Objectif

Prouver que le système traduit du **texte jamais vu**, pas seulement des
phrases pré-traduites. Le jury doit pouvoir choisir un paragraphe au hasard.

## Jeu de test

- 100 à 200 phrases finance **tenues à l’écart** ;
- jamais utilisées pour le prompt, le glossaire de démo ou le fine-tuning ;
- si possible, phrases rédigées par le centre linguistique ou un locuteur
  natif ;
- conserver un fichier `eval/test.jsonl` avec :
  ```json
  {"id": "t001", "source": "...", "reference": "...", "domain": "mobile_money"}
  ```

Le corpus Adamawa Fulfulde–French peut fournir des phrases de référence, mais
il est littéraire. Ajouter au moins 50 phrases finance écrites pour le projet.

## Métriques

| Métrique | Ce qu’elle mesure | Cible |
|---|---|---|
| chrF++ | similarité globale avec la référence | à mesurer, pas de cible inventée |
| COMET | qualité sémantique | si disponible |
| Terminologie | respect du glossaire finance | > 90 % sur les termes validés |
| Montants | nombres identiques | **100 %** |
| Entités | noms/URLs/numéros préservés | **100 %** |
| Adéquation humaine | note 1–5 par un natif | moyenne ≥ 3,5 |
| Latence | temps par segment | < 3 s sur CPU, < 1 s sur GPU |
| Fuite de données | PII envoyée | **0** |

## Protocole humain

1. Un locuteur natif du fulfulde adamawa évalue 50 phrases.
2. Il ne voit pas la sortie du modèle avant d’avoir lu la source.
3. Il note :
   - compréhension ;
   - fidélité ;
   - terminologie ;
   - sécurité (un montant ou un avertissement est-il faux ?).
4. Les désaccords sont consignés, pas moyennés silencieusement.

## Démo « inédit »

Deux options :

1. **Popup** : le jury colle un paragraphe dans « Tester un texte inédit ».
2. **Sélection** : le jury sélectionne un paragraphe sur une page, clic droit →
   « Traduire la sélection ».

Avant la démo :

- vider le cache de l’extension ;
- ne pas préparer la phrase à l’avance ;
- accepter que le modèle échoue et montrer le fallback sécurisé.

## Commandes utiles

```bash
# Vérifier que le backend répond
curl http://127.0.0.1:8000/health

# Tester une phrase
curl -s http://127.0.0.1:8000/translate \
  -H 'Content-Type: application/json' \
  -d '{"target":"fub","segments":[{"id":"t1","text":"Les frais de transfert sont de 1 000 FCFA.","context":"mobile money"}]}'
```

## Ce qu’il ne faut pas faire

- Choisir les phrases de test parmi celles utilisées pour la démo.
- Annoncer « 98 % de précision » sans protocole.
- Cacher les erreurs du modèle.
- Utiliser une traduction humaine comme si c’était la sortie du modèle.
- Comparer uniquement sur des phrases courtes et faciles.
