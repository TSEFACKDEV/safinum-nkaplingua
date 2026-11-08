# Checklist de soumission — SAFINUM Innovate 2026

## 1. Livrables

- [ ] Description de la solution : `README.md` + `docs/PRESELECTION.md`
- [ ] Prototype fonctionnel : `extension/` + `server/` + `demo/`
- [x] Vidéo ≤ 3 minutes : `NkapLingua-Demo.mp4` (2 min 19)
- [ ] Document technique : `docs/TECHNICAL.md`
- [ ] Langues + validation : `docs/LANGUAGE_VALIDATION.md`, `docs/LANGUAGES.md`
- [ ] Intégration des données linguistiques : `docs/DATA_INTEGRATION.md`
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
- [ ] Modèles `flagship-ai/cameroon-int8` téléchargés dans `dist/models/flagship-int8`
- [ ] Modèle NLLB téléchargé en secours (ou mode `NK_MOCK=1` pour l’UI)
- [ ] `GET /health` confirme `flagship.models.ewo` et `flagship.models.fub`
- [ ] Extension épinglée dans la barre d’outils
- [ ] Page de l’interface fournie par le jury ouverte
- [ ] Test de traduction sur un court paragraphe
- [ ] Test du toggle « Restaurer l’original »
- [ ] Test d’un message d’erreur
- [ ] Test d’un contenu inédit court
- [ ] Test d’un nom de bénéficiaire (`Aïcha`) : montant et nom préservés
- [ ] Test des attributs (`title`, `aria-label`, `placeholder`, `alt`)
- [ ] Test d’une langue en pack : phrase validée, puis phrase absente
- [ ] Connaître les limites par cœur (pas de survente)

## 4. Questions probables du jury

**Quelles langues ?**
Fulfulde (Adamawa) et ewondo en **MT brouillon** (`flagship-ai`), duala en pack
de phrases validées. Ces trois langues sont retenues pour leurs corpus de
parole et leurs ressources documentaires.

**Pourquoi NLLB ?**
NLLB n’est plus le moteur principal : `flagship-ai` fournit le brouillon
fulfulde/ewondo. NLLB reste un secours pour le fulfulde (CC BY-NC 4.0,
hackathon non commercial).

**Comment garantissez-vous les montants et les noms ?**
Pseudonymisation côté extension (NUM, NAME), contrôle d’unicité côté backend,
refus de la traduction si un jeton manque. Surtout, une phrase contenant
solde/frais/PIN/OTP/transaction/confirmation est bloquée avant la MT si le pack
n’a pas d’entrée validée : elle reste en français.

**Comment fonctionne l’intégration ?**
Extension navigateur, `activeTab` + `scripting`, aucun changement du code
source, rendu réversible.

**Et un contenu nouveau ?**
Popup « texte inédit » et traduction de sélection ; le jury peut saisir un
message pendant la démo.

**Quelle est la limite principale ?**
La qualité linguistique du brouillon `flagship-ai` sur les phrases longues et
les tournures finance. Les packs contiennent des brouillons humains
(107/122/121) mais restent à valider par un T2 indépendant et un arbitre ; en
mode strict, les phrases critiques restent donc en français. La validation
native est la prochaine étape.

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
docs/LANGUAGES.md
docs/DATA_INTEGRATION.md
docs/DATA_LICENSES.md
docs/SECURITY.md
docs/EVAL.md
docs/VIDEO_SCRIPT.md
docs/DEMO.md
docs/FIREFOX.md
docs/PITCH.md
docs/PRESELECTION.md
```
