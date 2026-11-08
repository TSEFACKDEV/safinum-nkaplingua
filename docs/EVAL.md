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
| Taux d’acceptation | sorties acceptées par les contrôles | à mesurer |
| Rétro-traduction | similarité source ↔ retour français | ≥ 0,45 (configurable) |
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

## Filtres automatiques de précision

Le backend applique désormais trois garde-fous sur le contenu inédit :

1. **Jetons** : montants, noms, URLs et emails doivent être présents une seule
   fois.
2. **Qualité** : rejet des sorties identiques à la source, trop courtes, trop
   longues, répétitives ou avec une fuite de français.
3. **Rétro-traduction** (`NK_ROUNDTRIP=1`, actif par défaut) : NLLB traduit la
   sortie fulfulde vers le français, puis on compare avec la source. Un score
   inférieur à `NK_ROUNDTRIP_MIN` (0,45 par défaut) refuse la traduction.

La rétro-traduction double le temps d’inférence. Pour une démonstration sur CPU
lent :

```bash
NK_ROUNDTRIP=0 NK_DEVICE=cpu uvicorn app:app --host 127.0.0.1 --port 8000
```

## Commandes utiles

```bash
# Vérifier que le backend répond
curl http://127.0.0.1:8000/health

# Tester une phrase
curl -s http://127.0.0.1:8000/translate \
  -H 'Content-Type: application/json' \
  -d '{"target":"fub","segments":[{"id":"t1","text":"Les frais de transfert sont de 1 000 FCFA.","context":"mobile money"}]}'

# Évaluer les 20 phrases finance « jamais vues »
python3 scripts/evaluate-unseen.py --url http://127.0.0.1:8000 \
  --output eval-unseen.json
```

Le rapport contient le taux d’acceptation, la préservation des montants, le
score de rétro-traduction moyen et la distribution des raisons de refus. Il ne
remplace pas une évaluation native : il sert à détecter les régressions.

## Résultats réels du 7 novembre 2026 (modèle 600M)

Trois mesures distinctes, à ne pas confondre :

- **texte brut, sans pseudonymisation** : **9/20 acceptées (45 %)**,
  100 % des montants préservés, rétro-traduction moyenne 0,442 ;
- **pipeline réel de l’extension** (pseudonymisation + jetons) :
  **6/20 inédites (30 %)** et **26/112 segments de la démo (23 %)** ; le
  chiffre de 45 % ne décrit donc pas le pipeline réel ;
- **pré-évaluation K5** (protection des nombres et termes, sans
  rétro-traduction) : **12/20 acceptées** par les contrôles et **8/20
  refusées** (montant, terme critique ou jeton perdu).

La seconde opinion cloud ciblée a accepté 20/20 sur le même échantillon, mais
elle envoie chaque phrase pseudonymisée à MyMemory : elle reste **hors du
chemin de démo**, opt-in et non recommandée pour le jury.

Lecture honnête : la MT locale seule ne couvre pas le parcours aujourd’hui.
C’est le **pack validé** qui doit couvrir le niveau A et les 102 phrases de la
démo. La vérité terrain reste la relecture native.

## Ce qu’il ne faut pas faire

- Choisir les phrases de test parmi celles utilisées pour la démo.
- Annoncer « 98 % de précision » sans protocole.
- Cacher les erreurs du modèle.
- Utiliser une traduction humaine comme si c’était la sortie du modèle.
- Comparer uniquement sur des phrases courtes et faciles.
