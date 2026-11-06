"""Génère la voix off française de la vidéo NkapLingua.

Prérequis :
    pip install edge-tts

Le service Edge TTS est utilisé uniquement pour la narration de la vidéo,
jamais pour les données de l’extension.
"""

import asyncio
from pathlib import Path

import edge_tts

VOICE = "fr-FR-DeniseNeural"

TEXTS = {
    "01": (
        "NkapLingua est une couche d'accessibilité linguistique pour les "
        "services financiers numériques camerounais. Elle traduit les "
        "interfaces de banque et de mobile money en fulfulde, directement "
        "dans le navigateur, sans modifier le site source."
    ),
    "02": (
        "Les interfaces de mobile money, de banque et de microfinance sont "
        "souvent en français ou en anglais. Comprendre un solde, des frais, "
        "une condition de crédit ou une alerte de sécurité devient difficile "
        "pour une partie de la population. Les traducteurs généralistes ne "
        "connaissent pas la terminologie financière."
    ),
    "03": (
        "NkapLingua ajoute une couche de traduction réversible. L'utilisateur "
        "clique, choisit le fulfulde, et la page devient lisible. Aucune ligne "
        "de code n'est ajoutée au site. L'original reste accessible à tout "
        "moment. L'extension fonctionne seule, avec un backend local optionnel."
    ),
    "04": (
        "Le parcours est complet. Vérifier le solde, lire les frais, préparer "
        "un transfert, relire le récapitulatif avant confirmation, et "
        "comprendre un message d'erreur ou une alerte de sécurité. Les "
        "montants, les frais et le bénéficiaire restent identiques."
    ),
    "05": (
        "Avant l'envoi, les montants, les numéros et les URLs sont remplacés "
        "par des jetons. Le moteur de traduction local ou cloud traduit, puis "
        "vérifie que chaque jeton est présent. Si un chiffre ou un terme "
        "critique manque, la traduction est refusée et l'original est "
        "conservé. Aucun mot de passe, aucun code PIN, aucun OTP n'est lu."
    ),
    "06": (
        "La langue cible est le fulfulde adamawa, code fub. Le prototype "
        "utilise NLLB comme base, avec un découpage en phrases courtes. La "
        "qualité linguistique est le point critique. Les phrases finance "
        "doivent être validées par un locuteur natif selon l'orthographe AGLC. "
        "C'est notre prochaine étape avant la démonstration."
    ),
    "07": (
        "NkapLingua : zéro intégration, un language pack par langue, et une "
        "couche de confiance pour l'inclusion financière. Le code, la "
        "documentation et la démo sont disponibles sur GitHub. Merci."
    ),
}


async def main() -> None:
    output = Path(__file__).parent / "audio"
    output.mkdir(exist_ok=True)
    for key, text in TEXTS.items():
        path = output / f"{key}.mp3"
        communicate = edge_tts.Communicate(text, VOICE, rate="-4%")
        await communicate.save(str(path))
        print("wrote", path)


if __name__ == "__main__":
    asyncio.run(main())
