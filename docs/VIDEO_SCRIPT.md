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
- Page utilisée : `https://safinum.cm/hackathon-test` (données fictives)

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

**Écran** : page SAFINUM en français, montrer le solde, les frais, le bénéficiaire.

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

**Écran** : montrer la page traduite en fulfulde, puis basculer en ewondo et duala.

### 1:00 — 1:25 · Préservation des informations

**Action** : pointer le solde `250 000 FCFA`, les frais `25 000 FCFA`, le
bénéficiaire `Jean-Paul Mbarga`, le total `225 000 FCFA`, le compte
`CM 001 2345 6789 01`.

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

### 1:50 — 2:15 · Contenu inédit, phrase par phrase

**Action** : ajouter dans la page le paragraphe
`Le solde est de 25 000 FCFA. Le vendeur arrive demain.` ; montrer
`Jawdindi ko 25 000 FCFA.` suivi de la phrase inconnue restée en français,
avec la mention discrète et « 1 traduction(s) partielle(s) ».

**Voix off** :

> « Le jury peut introduire un message qui n’était pas dans la page. NkapLingua
> traduit les phrases connues du pack et laisse les autres en français. Il ne
> fait jamais de traduction mot à mot et n’invente pas de phrase. »

**Plan B** : si l’insertion live échoue, montrer la capture de la sonde
`fallback` dans `docs/test-results/real-site-packs-2026-11-10-173547.json`.

### 2:15 — 2:35 · Sécurité

**Action** : ouvrir les DevTools → onglet Réseau.

**Voix off** :

> « Ici, aucun serveur n’est lancé : tout vient des packs embarqués dans
> l’extension. Le service cloud expérimental n’est contacté que si
> l’utilisateur l’autorise explicitement, avec un texte pseudonymisé. Dans tous
> les cas : pas de cookies, pas de mot de passe, pas de code PIN. »

**Écran** : montrer `docs/DATA_LICENSES.md` ou le tableau des composants.

### 2:35 — 2:55 · Limites et honnêteté

**Voix off** :

> « Les packs sont des brouillons humains ou éditoriaux : aucune phrase n’est
> encore validée par un panel natif indépendant. Une mention discrète le dit
> clairement, sans pastille sur chaque phrase. flagship-ai et NLLB restent des
> secours. Les montants, le compte et les noms sont préservés ; les phrases
> critiques sans pack restent en français. »

### 2:55 — 3:00 · Conclusion

**Voix off** :

> « NkapLingua : une couche de confiance pour l’inclusion financière, sans
> toucher au site et sans exposer les données sensibles. »

---

## Checklist d’enregistrement

- [ ] Extension seule testée avec les packs (le cloud ne couvre pas l’ewondo)
- [ ] Serveur local arrêté pour prouver l’autonomie du paquet
- [ ] Aucun opt-in cloud activé pendant la démonstration
- [ ] Extension chargée dans Chrome/Firefox
- [ ] Page `https://safinum.cm/hackathon-test` ouverte
- [ ] Zoom navigateur à 100 %
- [ ] Notifications système coupées
- [ ] Aucune donnée personnelle visible
- [ ] Durée ≤ 3 min
- [ ] Sous-titres / voix off vérifiés
- [ ] Vidéo de secours enregistrée si la démo live échoue

## Plan B si la traduction live est trop lente

1. Montrer la page déjà traduite depuis un rechargement propre.
2. Montrer le repli phrase par phrase sur le paragraphe mixte.
3. Montrer le contrôle de sécurité et le retour à l’original.
4. Expliquer clairement que le pack couvre les phrases connues, pas tout l’inédit.

## Screencast automatisé (sans voix)

Pour produire une base muette à recouvrir d’une voix off :

```bash
NK_TEST_CACHE=/home/klein/.tmp/opencode/demo-cache \
NODE_PATH=/home/klein/.npm/_npx/e41f203b7505f1fb/node_modules \
CHROME_PATH=/home/klein/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome \
node scripts/record-demo.js
```

Sortie : `dist/nkaplingua-demo.mp4`, 1280×720, environ 1 min 47, sans audio.
Le script utilise une copie de test de l’extension avec l’hôte SAFINUM pour
l’automatisation ; le paquet de production reste en `activeTab`. Les légendes
sont incrustées à l’image, ce qui permet d’ajouter la voix off sans sous-titrer.
