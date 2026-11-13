# Feuille de route — audio humain validé

> Document de travail du 13 novembre 2026. Il décrit la seule voie retenue
> pour une lecture vocale fiable en production : des clips enregistrés par un
> locuteur natif, avec consentement écrit. Il ne s'agit pas d'une
> fonctionnalité livrée dans la version soumise.

## 1. Constat

Dans un contexte financier, une personne qui parle bien sa langue mais lit mal
le français a besoin d'**audio**, pas seulement de texte. En revanche, le mode
vocal n'est pas un critère direct du barème SAFINUM : il renforce
l'**accessibilité/UX** (15 points) et la pertinence du produit. Il ne remplace
pas la validation linguistique, qui reste le point critique.

## 2. Ce qui est réaliste : de l'audio humain, pas du TTS

Aucun moteur TTS fiable et licencié n'a été identifié pour le fulfulde,
l'ewondo ou le duala. Les modèles disponibles publiquement restent à vérifier
et peuvent être liés à des corpus dont la licence ou la provenance n'est pas
clarifiée : **ne pas les utiliser sans autorisation écrite**.

La voie réaliste est donc :

1. **traduire et valider** un petit noyau de phrases critiques avec un locuteur
   natif ;
2. **enregistrer** ces phrases avec la même personne, avec consentement écrit ;
3. **embarquer les clips** dans l'extension (Opus/MP3, quelques centaines de Ko) ;
4. **jouer les clips** hors ligne, sans serveur et sans TTS ;
5. **ne jamais inventer** l'audio d'une phrase non validée.

### Montants

Deux options, par ordre de prudence :

- **Option A (recommandée pour la démo)** : enregistrer les phrases complètes
  avec les montants exacts du parcours (25 000, 125 000, 3 750 FCFA). Simple,
  vérifiable, mais limité aux montants enregistrés.
- **Option B (plus tard)** : clips de chiffres et de puissances de dix, assemblés
  localement. Plus souple, mais la grammaire des nombres doit être validée ;
  ne pas bricoler.

Dans les deux cas : **le montant affiché et le montant prononcé doivent être
identiques au caractère près**.

## 3. Architecture proposée

- `extension/audio/index.json` : manifeste `phrase_id → fichier + langue +
  texte validé + hash`.
- `extension/audio/<lang>/*.opus` : clips enregistrés.
- `extension/voice.js` : lecteur de clips, file d'attente, arrêt, rejouer.
- Bouton **« Écouter »** dans la notice et le popup ; pas d'autoplay forcé.
- Un segment sans clip affiche « audio pas encore enregistré » et reste en texte.
- Aucun clip pour une phrase `draft`/`reviewed` : seulement `validated`.
- Tests : manifeste complet, hash, absence de clip pour non validé, montants
  identiques, arrêt/rejouer, clavier, pas de requête réseau.

## 4. Noyau de phrases à traduire et enregistrer (12)

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

Ces phrases sont des **sources** : aucune traduction n'est fournie ici. Le
locuteur natif doit donner le texte et l'audio, et signer le consentement.

## 5. Ce qu'il ne faut pas faire

- Utiliser la Bible, des corpus non licenciés ou un modèle non autorisé pour
  fabriquer les clips.
- Utiliser un TTS pour les montants ou pour une phrase non validée.
- Promettre une voix pour tout texte inédit : ce n'est pas faisable sans moteur
  TTS validé.
- Présenter une prosodie simulée comme une voix native.

## 6. Décision prise pour la soumission

Le mode vocal **n'est pas livré** dans la version soumise :

- aucun locuteur natif n'était disponible pour traduire, enregistrer et signer
  le consentement des 12 phrases ;
- aucun TTS fiable et licencié n'existe pour les trois langues du projet ;
- un TTS non validé sur un montant serait un défaut majeur au sens du règlement.

La voix reste donc documentée comme **feuille de route d'inclusion**, avec
l'architecture et le noyau de phrases ci-dessus. Elle ne doit pas être
présentée comme une fonctionnalité déjà livrée. La prochaine étape est un
locuteur natif, 12 phrases, un consentement écrit, puis des clips hors ligne
dans l'extension.
