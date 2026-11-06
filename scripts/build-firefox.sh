#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/firefox"

rm -rf "$OUT"
mkdir -p "$OUT"

cp "$ROOT"/extension/*.js "$OUT"/
cp "$ROOT"/extension/*.html "$OUT"/
cp "$ROOT"/extension/*.css "$OUT"/
cp "$ROOT"/extension/icon-*.png "$OUT"/
cp "$ROOT"/extension/INSTALL.md "$OUT"/
cp -R "$ROOT"/extension/fonts "$OUT"/fonts
cp -R "$ROOT"/extension/language-packs "$OUT"/language-packs
cp "$ROOT"/extension/manifest.firefox.json "$OUT"/manifest.json

# Inline le registre pour que le background Firefox soit aussi un fichier
# unique, sans dépendre d'un ordre de chargement de scripts.
cat "$ROOT"/extension/languages.js "$ROOT"/extension/background.js \
  > "$OUT"/background.js

echo "Build Firefox prêt : $OUT"
echo "Ouvrir Firefox → about:debugging#/runtime/this-firefox → Charger un module temporaire → choisir $OUT/manifest.json"
