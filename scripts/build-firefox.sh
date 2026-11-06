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
cp -R "$ROOT"/extension/fonts "$OUT"/fonts
cp "$ROOT"/extension/manifest.firefox.json "$OUT"/manifest.json

echo "Build Firefox prêt : $OUT"
echo "Ouvrir Firefox → about:debugging#/runtime/this-firefox → Charger un module temporaire → choisir $OUT/manifest.json"
