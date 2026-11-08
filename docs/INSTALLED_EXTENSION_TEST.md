# Test de l’extension installée — site SAFINUM

> **Réconciliation du 8 novembre 2026** : ce test annonce 43/0 sur le premier
> écran et 5/5 étapes. Il **ne précise pas le backend** (flagship-ai, NLLB,
> MyMemory ou pack de démo). Avec le backend NLLB seul, l’audit indépendant
> mesure **6/44 segments** sur l’étape 1. Les deux résultats ne décrivent donc
> pas le même environnement ; voir
> [`AUDIT_2026-11-08.md`](AUDIT_2026-11-08.md).

**Date** : 8 novembre 2026  
**Site** : <https://safinum.cm/hackathon-test>  
**Paquet** : `dist/package/chrome` (production) et copie de test avec permission
d’hôte `safinum.cm` pour l’automatisation.

---

## 0. Assemblage Marius / Freedy

Vérification avant build :

```text
origin/marius        ancêtre de HEAD : 0 commit unique
origin/freedy        ancêtre de HEAD : 0 commit unique
origin/design/popup  ancêtre de HEAD : 0 commit unique
```

Le travail de Marius (niveau A, import, tests API/pipeline, packaging) et de
Freedy (popup 3 langues, design, captures) est donc **déjà intégré** dans la
version courante. Il n’y avait pas de commit à cherry-picker : le paquet testé
contient bien les deux contributions.

---

## 1. Installation

- Chromium/Chrome for Testing 156, chargement de l’extension non empaquetée.
- Service worker `NkapLingua — SAFINUM 2026` actif.
- Popup : **3 langues** (fulfulde, ewondo, duala), moteurs affichés
  (`MT` pour fulfulde/ewondo, `PACK` pour duala).
- Le paquet de production utilise `activeTab` : la traduction de page démarre
  par un clic utilisateur sur l’icône, puis « Traduire la page ».
- Pour automatiser le parcours, une **copie de test** avec
  `https://safinum.cm/*` dans `host_permissions` a été utilisée. Le paquet de
  soumission n’a pas cette permission.

## 2. Parcours complet en fulfulde

Les 5 étapes ont été parcourues avec l’extension réelle :

| Étape | Résultat | Preuve |
|---|---|---|
| Solde | traduit | `JAWDINDI NDI YAMI`, `250 000 FCFA` |
| Frais | traduit | `NJOƁDI NAWGOL`, `25 000 FCFA`, total `225 000 FCFA` |
| Bénéficiaire | traduit | `INNDE KEƁOOWO`, `LIMRE CINNDEL` |
| Récapitulatif | traduit | `KOOLOL`, `SAF-2026-H1X9UR`, `Jean-Paul Mbarga` |
| Confirmation | traduit | `Nawgol naatii`, `Nasara`, référence conservée |

- **Montants préservés** : `250 000`, `25 000`, `0`, `225 000`, `12 500`,
  `180 000`, `50 000`, `7 500 FCFA`.
- **Référence préservée** : `SAF-2026-H1X9UR`.
- **Titre traduit** : `Nokku ƴeewndo — Hackathon SAFINUM Innovate 2026 - Safinum`.
- **Restauration** : titre et page reviennent en français, 0 nœud traduit.

## 3. Premier écran, trois langues

| Langue | Traduits | Humain | MT démo | Non traduits |
|---|---:|---:|---:|---:|
| Fulfulde | 43 | 17 | 2 | **0** |
| Ewondo | 43 | 17 | 2 | **0** |
| Duala | 35 | 17 | 0 | **8** |

Les 8 non-traduits duala sont :

- `Protocole de test` (P1) ;
- `Banque en ligne` (P1) ;
- `Compte courant` (P0, deux occurrences) ;
- quatre dates (`05 nov. 2026`, `04 nov. 2026`, `02 nov. 2026`,
  `31 oct. 2026`).

Aucun libellé français n’est visible en fulfulde ou en ewondo sur ce premier
écran. En duala, les trois libellés métier restent en français avec le badge
« non traduit ».

## 4. Nouveau contenu

Ajout d’un paragraphe inédit après la traduction :

```text
Le solde est de 25 000 FCFA.
```

Résultat fulfulde :

```text
Ɓaawo man, nden kam ɓe mbaŋginan on. 25 000 FCFA.
```

- montant préservé ;
- marqueur `data-nk-demo-critical="A"` présent (badge « démo MT ») ;
- **qualité sémantique faible** : la phrase est un brouillon MT, pas une
  traduction fiable.

En duala, une phrase absente du pack reste en français avec le badge
« non traduit » : il n’y a pas de moteur MT duala.

## 5. Popup de production

- 3 langues listées.
- `Traduire la page`, `Restaurer`, `Traduire la sélection` présents.
- Texte inédit critique (`Le solde est de 25 000 FCFA.`) : **refusé en mode
  strict**, message explicite « aucun pack validé » ; l’original reste en
  français. C’est le comportement attendu du niveau A.
- Texte inédit non critique (`Bonjour, Amina`) : traité par le moteur.

## 6. Ce que le test prouve

- L’extension **s’installe et fonctionne** dans un navigateur Chromium.
- Le parcours financier complet fonctionne sans modifier le site.
- Les montants, la référence et les noms sont préservés.
- Le titre, les libellés, les options et les attributs sont couverts.
- Le nouveau contenu est traité, mais avec une qualité MT insuffisante pour
  le niveau A ; le badge le dit.
- Le duala est **pack-only** : 3 libellés métier et les dates restent en
  français.

## 7. Limites

- Aucune entrée de pack n’est `validated`.
- Le test automatisé utilise une copie avec permission d’hôte ; le paquet de
  production reste en `activeTab`.
- La qualité du nouveau contenu fulfulde/ewondo n’est pas validée.
- Le duala ne couvre pas les 3 libellés manquants.
- Le test ne remplace pas une démonstration devant le jury avec un vrai clic
  sur l’icône de l’extension.
