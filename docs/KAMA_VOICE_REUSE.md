# Réutiliser KAMA pour un mode vocal — inventaire et cadrage

> Document de travail du 12 novembre 2026. Source analysée :
> `/home/klein/vps-backup/KAMA` (backup du projet de l’encadreur).
> Objectif : vérifier ce qui est réellement réutilisable pour un mode vocal
> destiné aux commerçants peu alphabétisés.

## 1. Constat

L’intuition est bonne : dans un contexte financier, une personne qui parle bien
sa langue mais lit mal le français a besoin d’**audio**, pas seulement de texte.
En revanche, le mode vocal n’est pas un critère direct du barème SAFINUM : il
renforce l’**accessibilité/UX** (15 points) et la pertinence du produit. Il ne
remplace pas la validation linguistique, qui reste le point critique.

## 2. Ce que KAMA contient vraiment

| Élément | Présent dans le backup | Réutilisable pour la voix ? |
|---|---|---|
| 64 gabarits bancaires FR/EN (`content-data/templates.json`) | Oui | Oui, comme **liste de phrases sources** |
| 7 intentions vocales FR/EN (`content-data/intents.json`) | Oui | Oui, pour la grammaire des commandes |
| Traductions ghomálá’/pidgin | **Non : 0 traduction** | Non |
| Fichiers audio | **Aucun** `.wav/.mp3/.ogg/.flac` | Non |
| Moteur TTS | **Aucun** : route `/v1/tts` déclarée, `tts: {}` | Non |
| Moteur ASR | **Aucun** : route `/v1/voice/intent` déclarée, `asr: {}` | Non |
| Extension / interface | **Aucune** : pas de `manifest.json` | Non |
| Évaluation de 12 modèles | Oui (`evaluation/results/summary.csv`) | Oui, comme **preuve** que la MT est insuffisante |
| Phrases SOREVA ghomálá’/pidgin | Oui, 150 phrases texte | Oui pour l’évaluation, **pas pour la banque** |
| Audio SOREVA | Non : seuls les noms de fichiers sont référencés | Non sans téléchargement séparé |

**Conclusion : KAMA ne contient aucune donnée vocale exploitable.** Il contient
une excellente architecture et une évaluation honnête, mais pas de voix.

## 3. Ce que dit l’évaluation de KAMA

Sur les 150 phrases SOREVA jamais vues :

- meilleur chrF ghomálá’ : **18,4/100** ;
- meilleur chrF pidgin : **30,2/100** ;
- réponses exactes : **0 à 8 %** selon le modèle ;
- plusieurs modèles détruisent les balises `{xN}` ou recopient la source.

Sur les 64 phrases bancaires, les modèles qui conservent les balises recopient
souvent la source. C’est exactement pourquoi un montant ne doit jamais être
généré par un modèle.

## 4. Ce qui est réaliste : de l’audio humain, pas du TTS

Aucun moteur TTS fiable et licencié n’a été identifié pour le fulfulde, le
ghomálá’ ou le duala. Le seul modèle ewondo repéré (`OlameMend/mms-tts-ewo`)
reste à vérifier et peut être lié à des données bibliques : **ne pas l’utiliser
sans clarification de licence**.

La voie réaliste est donc :

1. **traduire et valider** un petit noyau de phrases critiques avec un locuteur
   natif ;
2. **enregistrer** ces phrases avec la même personne, avec consentement écrit ;
3. **embarquer les clips** dans l’extension (Opus/MP3, quelques centaines de Ko) ;
4. **jouer les clips** hors ligne, sans serveur et sans TTS ;
5. **ne jamais inventer** l’audio d’une phrase non validée.

### Montants

Deux options, par ordre de prudence :

- **Option A (recommandée pour la démo)** : enregistrer les phrases complètes
  avec les montants exacts du parcours (25 000, 125 000, 3 750 FCFA). Simple,
  vérifiable, mais limité aux montants enregistrés.
- **Option B (plus tard)** : clips de chiffres et de puissances de dix, assemblés
  localement. Plus souple, mais la grammaire des nombres en fulfulde/ghomálá’
  doit être validée ; ne pas bricoler.

Dans les deux cas : **le montant affiché et le montant prononcé doivent être
identiques au caractère près**.

## 5. Architecture proposée dans NkapLingua

- `extension/audio/index.json` : manifeste `phrase_id → fichier + langue +
  texte validé + hash`.
- `extension/audio/<lang>/*.opus` : clips enregistrés.
- `extension/voice.js` : lecteur de clips, file d’attente, arrêt, rejouer.
- Bouton **« Écouter »** dans la notice et le popup ; pas d’autoplay forcé.
- Un segment sans clip affiche « audio pas encore enregistré » et reste en texte.
- Aucun clip pour une phrase `draft`/`reviewed` : seulement `validated`.
- Tests : manifeste complet, hash, absence de clip pour non validé, montants
  identiques, arrêt/rejouer, clavier, pas de requête réseau.

## 6. Noyau de phrases à traduire et enregistrer (12)

| # | Source française | Usage |
|---|---|---|
| 1 | Votre solde est de {montant}. | solde |
| 2 | Les frais sont de {montant}. | frais |
| 3 | Le total à débiter est de {montant}. | total |
| 4 | Voulez-vous confirmer ce transfert ? | confirmation |
| 5 | Confirmer | action |
| 6 | Annuler | action |
| 7 | Le transfert a été effectué. | succès |
| 8 | Votre solde est insuffisant. | erreur |
| 9 | Le code saisi est incorrect. | erreur |
| 10 | Ne partagez jamais votre code PIN. | sécurité |
| 11 | Vérifiez le nom du bénéficiaire. | sécurité |
| 12 | Montant | libellé |

Ces phrases sont des **sources** : aucune traduction n’est fournie ici. Le
locuteur natif doit donner le texte et l’audio, et signer le consentement.

## 7. Ce qu’il ne faut pas faire

- Copier les traductions de KAMA : **elles sont vides**.
- Utiliser la Bible, SOREVA ou un modèle non licencié pour fabriquer les clips.
- Utiliser un TTS pour les montants ou pour une phrase non validée.
- Promettre une voix pour tout texte inédit : ce n’est pas faisable sans moteur
  TTS validé.
- Choisir le ghomálá’ uniquement parce que l’encadreur l’a fait : il faut un
  locuteur natif disponible, sinon le texte restera vide.

## 8. Décision prise pour la soumission

Le mode vocal **n’est pas livré** dans le prototype soumis :

- aucun locuteur natif n’était disponible pour traduire, enregistrer et signer
  le consentement des 12 phrases ;
- aucun TTS fiable et licencié n’existe pour le fulfulde/ghomálá’ ;
- un TTS non validé sur un montant serait un défaut majeur au sens du règlement.

La voix est donc documentée comme **feuille de route d’inclusion**, avec
l’architecture et le noyau de phrases ci-dessus. Elle ne doit pas être
présentée comme une fonctionnalité déjà livrée. La prochaine étape est un
locuteur natif, 12 phrases, un consentement écrit, puis des clips hors ligne
dans l’extension.
