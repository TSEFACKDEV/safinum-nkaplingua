# Vidéo de démonstration — 3 minutes maximum

## Objectif

Montrer que NkapLingua :

1. traduit une interface financière existante ;
2. suit un parcours financier (solde, frais, transfert, récapitulatif) ;
3. préserve les montants, frais, bénéficiaires et avertissements ;
4. fonctionne sans modifier le site source ;
5. traduit un message nouveau introduit par le jury ;
6. protège les données de l’utilisateur.

## Format

- Durée cible : **2 min 40**
- Résolution : 1920×1080 ou 1280×720
- Voix off : français, claire, sans jargon
- Sous-titres : recommandés
- Aucune donnée réelle, aucun compte bancaire réel
- Page utilisée : `http://127.0.0.1:8000/demo` (FINAKA, fictive)

---

## Découpage

### 0:00 — 0:15 · Introduction

**Écran** : logo NkapLingua, titre, mention « SAFINUM Innovate 2026 ».

**Voix off** :

> « Au Cameroun, des millions de personnes utilisent le mobile money, mais les
> frais, les conditions de crédit et les alertes de sécurité restent souvent en
> français ou en anglais. NkapLingua traduit ces interfaces en fulfulde,
> directement dans le navigateur, sans modifier le site. »

### 0:15 — 0:35 · Le problème

**Écran** : page FINAKA en français, montrer le solde, les frais, les conditions.

**Voix off** :

> « Voici une interface financière typique. Le solde, les frais de transfert et
> les conditions sont en français. Une utilisatrice qui ne maîtrise pas cette
> langue ne peut pas vérifier ce qu’elle va payer. »

### 0:35 — 1:00 · Traduction de la page

**Action** : cliquer sur l’icône NkapLingua → **Traduire cette page**.

**Voix off** :

> « L’extension lit uniquement les textes visibles. Elle ignore les champs de
> formulaire, les mots de passe et les codes OTP. Elle remplace les montants
> par des jetons avant l’envoi, puis les restaure à l’identique. »

**Écran** : montrer la page traduite en fulfulde.

### 1:00 — 1:25 · Préservation des informations

**Action** : pointer le solde `125 000 FCFA`, les frais `1 000 FCFA`, le
bénéficiaire `Aïcha`, le total `26 000 FCFA`.

**Voix off** :

> « Les montants, les frais et le bénéficiaire restent identiques. Si un chiffre
> ou un terme critique change, la traduction est refusée et l’original est
> conservé. »

**Action** : cliquer sur **Restaurer l’original** → la page redevient française.

**Voix off** :

> « Le site source n’a jamais été modifié. L’utilisateur peut revenir à
> l’original à tout moment. »

### 1:25 — 1:50 · Parcours financier

**Action** : montrer le formulaire de transfert, le récapitulatif avant
confirmation, puis le message d’erreur / avertissement de sécurité.

**Voix off** :

> « Le parcours est complet : vérifier le solde, lire les frais, préparer un
> transfert, relire le récapitulatif et comprendre une alerte de sécurité. »

### 1:50 — 2:15 · Contenu inédit

**Action** : ouvrir le popup, coller un paragraphe court que le jury choisit,
cliquer sur **Traduire ce texte**.

**Voix off** :

> « Le jury peut introduire un message qui n’était pas dans la page. Le moteur
> le traduit à la volée. »

**Plan B** : si le modèle est lent, utiliser la traduction de sélection sur une
phrase courte déjà chargée.

### 2:15 — 2:35 · Sécurité

**Action** : ouvrir les DevTools → onglet Réseau.

**Voix off** :

> « L’extension utilise le backend local s’il est disponible. Le service cloud
> expérimental n’est contacté que si l’utilisateur l’autorise explicitement,
> avec un texte pseudonymisé. Dans les deux cas : pas de cookies, pas de mot de
> passe, pas de code PIN. »

**Écran** : montrer `docs/DATA_LICENSES.md` ou le tableau des composants.

### 2:35 — 2:55 · Limites et honnêteté

**Voix off** :

> « flagship-ai et NLLB sont des brouillons. Les phrases courtes sont plus
> fiables ; les phrases longues doivent encore être validées par un locuteur
> natif. Les phrases critiques sans pack restent en français. C’est pourquoi
> nous avons un protocole de validation et un contrôle de préservation des
> montants. »

### 2:55 — 3:00 · Conclusion

**Voix off** :

> « NkapLingua : une couche de confiance pour l’inclusion financière, sans
> toucher au site et sans exposer les données sensibles. »

---

## Checklist d’enregistrement

- [ ] Extension seule testée avec les packs (le cloud ne couvre pas l’ewondo)
- [ ] Backend local lancé pour le mode 100 % local
- [ ] Modèles flagship-ai/NLLB préchauffés si mode local
- [ ] Extension chargée dans Chrome/Firefox
- [ ] Page `http://127.0.0.1:8000/demo` ouverte
- [ ] Zoom navigateur à 100 %
- [ ] Notifications système coupées
- [ ] Aucune donnée personnelle visible
- [ ] Durée ≤ 3 min
- [ ] Sous-titres / voix off vérifiés
- [ ] Vidéo de secours enregistrée si la démo live échoue

## Plan B si la traduction live est trop lente

1. Montrer la page déjà traduite (cache préchauffé).
2. Montrer le texte inédit sur une phrase courte.
3. Montrer le contrôle de sécurité et le toggle original.
4. Expliquer clairement la limite de latence CPU.
