#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist"
CHROME="$OUT/package/chrome"
FIREFOX="$OUT/package/firefox"
UNIVERSAL="$OUT/package/universal"

rm -rf "$OUT/package" \
  "$OUT/nkaplingua-extension.zip" \
  "$OUT/nkaplingua-chrome.zip" \
  "$OUT/nkaplingua-firefox.zip"
mkdir -p "$CHROME" "$FIREFOX" "$UNIVERSAL"

copy_common() {
  local target="$1"
  cp "$ROOT"/extension/*.js "$target"/
  cp "$ROOT"/extension/*.html "$target"/
  cp "$ROOT"/extension/*.css "$target"/
  cp "$ROOT"/extension/icon-*.png "$target"/
  cp "$ROOT"/extension/INSTALL.md "$target"/
  cp -R "$ROOT"/extension/fonts "$target"/fonts
  cp -R "$ROOT"/extension/language-packs "$target"/language-packs

  # Le service worker Chrome peut être chargé comme module (importScripts
  # interdit). On inline le registre des langues dans le background packagé
  # pour que Chrome et Firefox utilisent exactement le même fichier.
  cat "$ROOT"/extension/languages.js "$ROOT"/extension/background.js \
    > "$target"/background.js
}

copy_common "$CHROME"
cp "$ROOT"/extension/manifest.json "$CHROME"/manifest.json
cp "$ROOT"/extension/icon.svg "$CHROME"/icon.svg
cp "$ROOT"/LICENSE "$CHROME"/LICENSE

copy_common "$FIREFOX"
cp "$ROOT"/extension/manifest.firefox.json "$FIREFOX"/manifest.json
cp "$ROOT"/extension/icon.svg "$FIREFOX"/icon.svg
cp "$ROOT"/LICENSE "$FIREFOX"/LICENSE

copy_common "$UNIVERSAL"
cp "$ROOT"/extension/manifest.universal.json "$UNIVERSAL"/manifest.json
cp "$ROOT"/extension/icon.svg "$UNIVERSAL"/icon.svg
cp "$ROOT"/LICENSE "$UNIVERSAL"/LICENSE

(cd "$CHROME" && zip -qr "$OUT/nkaplingua-chrome.zip" .)
(cd "$FIREFOX" && zip -qr "$OUT/nkaplingua-firefox.zip" .)
(cd "$UNIVERSAL" && zip -qr "$OUT/nkaplingua-extension.zip" .)

echo "Universel : $OUT/nkaplingua-extension.zip"
echo "Chrome    : $OUT/nkaplingua-chrome.zip"
echo "Firefox   : $OUT/nkaplingua-firefox.zip"
