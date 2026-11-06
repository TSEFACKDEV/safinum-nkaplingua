# Vidéo de démonstration

La vidéo finale est générée à partir de `slides.html` et d’une voix off
française. Elle dure environ 2 min 20, sous la limite de 3 minutes.

## Fichiers

- `slides.html` : 7 slides 1920×1080 (design NkapLingua).
- `assets/` : captures d’écran de l’extension et de la démo.
- `NkapLingua-Demo.mp4` : vidéo finale (non versionnée, générée localement).
- `frames/`, `audio/`, `clips/` : fichiers intermédiaires (non versionnés).

## Régénérer les slides

```bash
for i in 1 2 3 4 5 6 7; do
  chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
    --window-size=1920,1080 --virtual-time-budget=2500 \
    --screenshot="frames/0${i}.png" \
    "file://$PWD/slides.html?s=${i}"
done
```

## Régénérer la voix off

La voix off utilise `edge-tts` (voix `fr-FR-DeniseNeural`) :

```bash
pip install edge-tts
python3 make_audio.py
```

## Assembler la vidéo

Les clips sont générés avec FFmpeg (image fixe + audio, fondu de 0,4 s), puis
concaténés. Voir l’historique du dépôt ou `docs/VIDEO_SCRIPT.md` pour le script
de narration.

## Sous-titres

Le script complet est dans [`../docs/VIDEO_SCRIPT.md`](../docs/VIDEO_SCRIPT.md).
