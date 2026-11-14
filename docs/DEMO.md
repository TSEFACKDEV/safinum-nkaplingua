# Script de démonstration

## Préparation (5 minutes avant)

```bash
# Terminal 1
cd server
source .venv/bin/activate
uvicorn app:app --host 127.0.0.1 --port 8000
```

Vérifier :

```bash
curl http://127.0.0.1:8000/health
```

Puis :

1. Ouvrir Chrome.
2. Charger l’extension non empaquetée depuis `extension/`.
3. Ouvrir `demo/index.html`.
4. Vérifier que le popup affiche « Prêt ».
5. Vider le cache de l’extension si besoin (recharger l’extension).

## Démo 3 minutes

### 0:00 — Contexte

« Une utilisatrice de mobile money ne comprend pas les frais et les conditions
de crédit. Elle n’a pas de dictionnaire financier. Nous ajoutons une couche de
traduction dans son navigateur, sans que la banque change son site. »

### 0:20 — Traduction de la page

Cliquer sur l’icône NkapLingua → **Traduire cette page**.

Pendant le chargement :

« Le content script lit uniquement les nœuds texte visibles. Il ignore les
champs de formulaire, les mots de passe et les codes OTP. »

### 0:40 — Preuve de non-régression

- Montrer le solde `125 000 FCFA` : il est identique.
- Montrer les frais `1 000 FCFA` : identiques.
- Montrer le numéro `+237 6 99 12 34 56` : intact.
- Cliquer sur **Restaurer l’original** : la page redevient française.

### 1:10 — Contenu inédit

Ouvrir le popup, coller un paragraphe que le jury choisit, cliquer sur
**Traduire ce texte**.

« Ce paragraphe n’était pas dans la page. Les phrases déjà présentes dans le
pack sont traduites ; les phrases inconnues restent en français, sans mot à
mot. Le popup indique combien de phrases restent en français et pourquoi. »

### 1:40 — Sécurité

Ouvrir DevTools → onglet Réseau.

« Une seule requête : `127.0.0.1:8000`. Pas de cloud, pas de cookies, pas de
mot de passe. Les montants sont remplacés par des jetons avant l’envoi, puis
restaurés. Si un jeton manque, la traduction est refusée. Et une phrase
critique — solde, frais, PIN, OTP — n’est jamais envoyée à la MT sans pack
validé : elle reste en français. »

### 2:10 — Données et limites

Montrer `docs/DATA_LICENSES.md`.

« Le moteur principal est `flagship-ai` (Marian), avec NLLB en secours pour le
fulfulde. Les licences sont CC BY-NC 4.0 pour le bundle et CC BY 4.0 pour les
modèles fp32 fulfulde/bulu. Le corpus est open data. Les recherches du centre
linguistique sont citées comme référence. Nous ne distribuons aucune donnée
sans licence. »

« Le modèle est un baseline. Nous avons un protocole d’évaluation et une
validation native. Nous ne prétendons pas que c’est déjà une traduction
certifiée. »

### 2:40 — Impact

« Zéro intégration côté fintech. Un language pack par langue. Une couche de
confiance : l’original reste accessible, les montants sont vérifiés, et
l’utilisateur garde le contrôle. »

## Checklist de secours

| Problème | Solution |
|---|---|
| Backend lent | `NK_MOCK=1`, montrer l’UX puis une phrase courte |
| Modèle non téléchargé | Lancer le backend 10 min avant |
| Page cassée | Utiliser `demo/index.html`, pas un vrai site |
| Extension non injectée | Recharger l’extension, ouvrir un onglet normal |
| Traduction refusée | C’est le comportement attendu : montrer le fallback |
| Jury demande une autre langue | Expliquer le language pack, ne pas improviser |

## Ce qu’il ne faut pas faire

- Traduire un vrai site bancaire avec un compte réel.
- Montrer des données personnelles.
- Promettre 100 % de précision.
- Cacher que le modèle est un baseline.
- Utiliser une page pré-traduite en prétendant que c’est du direct.



## Démo publique et overlay

La page `https://tsefackdev.github.io/safinum-nkaplingua/demo/` est reconnue
comme démo. Elle charge un overlay `extension/demo/fub-demo.json` réservé au
fulfulde et à cette page : les libellés FINAKA sont ainsi traduits même sans
backend. Le pack principal et les vrais sites ne sont pas modifiés ; aucun
résultat de démonstration n'entre dans le cache strict.
