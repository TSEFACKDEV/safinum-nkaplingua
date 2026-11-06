#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROFILE="${NK_FIREFOX_PROFILE:-$HOME/.tmp/opencode/nk-firefox-profile2}"

mkdir -p "$PROFILE"

# Snap Firefox : utiliser le binaire réel, pas le wrapper /usr/bin/firefox.
FIREFOX_BIN="/snap/firefox/current/usr/lib/firefox/firefox"
if [ ! -x "$FIREFOX_BIN" ]; then
  FIREFOX_BIN="$(command -v firefox)"
fi

cd "$ROOT"
exec npx --yes web-ext run \
  --source-dir "$ROOT/dist/firefox" \
  --firefox="$FIREFOX_BIN" \
  --firefox-profile="$PROFILE" \
  --start-url "http://127.0.0.1:8000/demo" \
  --no-reload
