# Pitch — 3 minutes

## Une phrase

> **NkapLingua traduit n’importe quelle interface financière en fulfulde, ewondo et duala, directement dans le navigateur, sans modifier le site et sans exposer les données sensibles.**

## Structure du pitch

### 1. Le problème (30 s)

Des millions de Camerounais utilisent le mobile money, mais les frais, les
conditions de crédit et les alertes de sécurité restent en français ou en
anglais. Les traducteurs classiques ne comprennent ni « KYC », ni « pénalité de
retard », ni « solde disponible ».

### 2. La solution (30 s)

Une extension navigateur qui ajoute une **couche de traduction réversible** à
n’importe quelle page financière. L’utilisateur clique, choisit sa langue, et
la page devient lisible — sans que le site ait besoin d’intégrer quoi que ce
soit. Le fulfulde d’Adamawa et l’ewondo combinent pack et MT brouillon ; le
duala utilise un pack de brouillons. La validation native TRAPD reste à
finaliser : **0 phrase validée** à ce jour.

### 3. La démo (60 s)

1. Ouvrir la page FINAKA.
2. Traduire la page.
3. Montrer que les montants (`125 000 FCFA`, `1 000 FCFA`) et les numéros sont
   intacts.
4. Restaurer l’original : la page est identique.
5. Coller un paragraphe inédit dans le popup : il est traduit en direct.
6. Ouvrir DevTools → réseau : une seule requête vers `127.0.0.1:8000`.

### 4. La technique (30 s)

- Manifest V3, `activeTab` uniquement.
- Segmentation par nœuds texte, pas de `innerHTML`.
- Pseudonymisation des montants, numéros, URLs, emails et noms.
- Post-contrôle : si un chiffre ou un nom change, la traduction est refusée.
- Backend local, brouillon `flagship-ai` + NLLB en secours (CC BY-NC 4.0,
  usage hackathon non commercial).
- Les phrases critiques (solde, frais, PIN/OTP) ne passent jamais en MT sans
  pack validé : elles restent en français.
- Aucune lecture des mots de passe, OTP ou valeurs de formulaire.

### 5. L’impact (30 s)

- **Inclusion** : une interface financière comprise dans une langue nationale.
- **Déploiement** : zéro intégration côté banque ou fintech.
- **Confiance** : les données ne quittent pas la machine.
- **Extensibilité** : un « language pack » par langue, avec glossaire finance.

## Tableau de correspondance avec le cahier des charges

| Exigence | Réponse |
|---|---|
| Extension navigateur | Manifest V3, Chrome/Edge |
| Au moins une langue | Fulfulde `fub` + ewondo `ewo` en MT brouillon ; duala `dua` en pack |
| Page financière ou autre | Pipeline DOM générique + page FINAKA |
| Sans modifier le contexte | Segmentation par bloc, glossaire, jetons |
| Sans modifier le site source | Injection à l’exécution, réversible |
| Contenu inédit | `flagship-ai`/NLLB + test en direct |
| Sécurité | `activeTab`, pas de PII, backend local, niveau A pack-only |
| Orientation finance | Frais, crédit, épargne, alertes |
| Données du centre | Références citées ; corpus ouvert NOODL |
| Licences | NLLB-200 CC BY-NC 4.0 (hackathon), corpus NOODL, Common Voice CC0 |

## Questions probables du jury

**« Pourquoi le fulfulde ? »**
C’est la langue nationale la plus parlée du Cameroun, avec une forte
pertinence pour l’inclusion financière dans le Grand Nord. C’est aussi la
langue qui dispose du meilleur compromis données ouvertes + qualité de
traduction disponible.

**« Votre modèle est-il fiable ? »**
Non, pas encore. C’est un baseline mesuré. Nous avons un protocole
d’évaluation, un contrôle des montants et un mode bilingue. La validation
native est la prochaine étape, pas une option.

**« Où sont les données du centre linguistique ? »**
Nous utilisons leurs publications comme référence orthographique et
terminologique. Le corpus d’entraînement est open data. Nous ne distribuons
aucune donnée sans licence.

**« Pourquoi pas une API cloud ? »**
Pour un service financier, envoyer le contenu d’une page bancaire à un tiers
est un risque inutile. Le backend local est notre choix par défaut.

**« Et si le site a une CSP stricte ? »**
Le content script est isolé ; l’UI utilise un Shadow DOM. En cas de blocage
de style, la traduction reste fonctionnelle. Les iframes cross-origin ne sont
pas couvertes dans le MVP.

**« Comment passe-t-on à une autre langue ? »**
Un language pack : code ISO, orthographe, glossaire, règles, jeu d’évaluation.
Le pipeline DOM et la sécurité ne changent pas.

## Ce qu’il faut montrer absolument

- Les montants intacts.
- Le toggle original.
- Le texte inédit traduit en direct.
- Le réseau qui ne sort pas de la machine.
- Le `DATA_LICENSES.md`.
- Le contrôle de sûreté qui refuse une traduction si un chiffre disparaît.

## Plan B si le modèle est lent

1. Utiliser `NK_MOCK=1` pour montrer l’UX et le pipeline.
2. Garder 3 phrases déjà traduites et validées par un natif pour la page de
   démo.
3. Montrer la traduction en direct sur une phrase courte.
4. Expliquer clairement la limite : « le moteur est un baseline, la validation
   native est planifiée ».
