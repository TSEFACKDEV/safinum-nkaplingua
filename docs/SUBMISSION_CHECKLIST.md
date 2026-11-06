# Checklist de soumission — SAFINUM Innovate 2026

## 1. Livrables

- [ ] Description de la solution : `README.md` + `docs/PRESELECTION.md`
- [ ] Prototype fonctionnel : `extension/` + `server/` + `demo/`
- [ ] Vidéo ≤ 3 minutes : à enregistrer avec `docs/VIDEO_SCRIPT.md`
- [ ] Document technique : `docs/TECHNICAL.md`
- [ ] Langue + validation : `docs/LANGUAGE_VALIDATION.md`
- [ ] Licences et composants : `docs/DATA_LICENSES.md`
- [ ] Démonstration reproductible : commandes dans `README.md`
- [ ] Dépôt GitHub à jour : https://github.com/TSEFACKDEV/safinum-nkaplingua

## 2. Avant l’enregistrement

- [ ] Backend lancé : `NK_DEVICE=cpu uvicorn app:app --host 127.0.0.1 --port 8000`
- [ ] `curl http://127.0.0.1:8000/health` renvoie `loaded: true`
- [ ] Page `http://127.0.0.1:8000/demo` ouverte
- [ ] Extension chargée dans Chrome/Edge ou Firefox
- [ ] Traduction préchauffée (première page déjà traduite)
- [ ] Un locuteur natif a relu les 20 phrases critiques
- [ ] Aucune donnée réelle à l’écran
- [ ] Vidéo de secours enregistrée

## 3. Avant la démonstration devant le jury

- [ ] Backend démarré sur la machine de démonstration
- [ ] Modèle NLLB téléchargé (ou mode `NK_MOCK=1` pour l’UI)
- [ ] Extension épinglée dans la barre d’outils
- [ ] Page de l’interface fournie par le jury ouverte
- [ ] Test de traduction sur un court paragraphe
- [ ] Test du toggle « Restaurer l’original »
- [ ] Test d’un message d’erreur
- [ ] Test d’un contenu inédit court
- [ ] Connaître les limites par cœur (pas de survente)

## 4. Questions probables du jury

**Quelle langue ?**
Fulfulde (Adamawa), code `fub`, variété à valider avec un natif.

**Pourquoi NLLB ?**
Meilleure qualité que M2M100 sur les phrases courtes fulfulde. Licence
CC BY-NC 4.0, utilisable pour ce hackathon non commercial.

**Comment garantissez-vous les montants ?**
Pseudonymisation côté extension, contrôle d’unicité côté backend, refus de la
traduction si un jeton manque.

**Comment fonctionne l’intégration ?**
Extension navigateur, `activeTab` + `scripting`, aucun changement du code
source, rendu réversible.

**Et un contenu nouveau ?**
Popup « texte inédit » et traduction de sélection ; le jury peut saisir un
message pendant la démo.

**Quelle est la limite principale ?**
La qualité linguistique de NLLB sur les phrases longues et certaines tournures
finance. La validation native est la prochaine étape.

**Est-ce que ça marche sur l’interface du jury ?**
Oui si c’est une page web. Le pipeline est générique ; nous ne dépendons pas
des identifiants de la page FINAKA.

## 5. Fichiers à ne pas oublier

```text
README.md
CONTRIBUTING.md
docs/COMPLIANCE.md
docs/TECHNICAL.md
docs/LANGUAGE_VALIDATION.md
docs/DATA_LICENSES.md
docs/SECURITY.md
docs/EVAL.md
docs/VIDEO_SCRIPT.md
docs/DEMO.md
docs/FIREFOX.md
docs/PITCH.md
docs/PRESELECTION.md
```
