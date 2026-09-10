#!/usr/bin/env bash
# Regenerates public/JoshuaHawksworthCV.pdf from docs/cv/JoshuaHawksworthCV.html
# using headless Chrome/Chromium. The HTML pulls the Lora font from Google Fonts,
# so the machine running this needs network access.
#
# Usage: docs/cv/build.sh [path-to-chrome]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/docs/cv/JoshuaHawksworthCV.html"
OUT="$ROOT/public/JoshuaHawksworthCV.pdf"

CHROME="${1:-}"
if [ -z "$CHROME" ]; then
  for candidate in google-chrome chromium chromium-browser \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    /opt/pw-browsers/chromium-*/chrome-linux/chrome; do
    if command -v "$candidate" >/dev/null 2>&1 || [ -x "$candidate" ]; then
      CHROME="$candidate"
      break
    fi
  done
fi
if [ -z "$CHROME" ]; then
  echo "Chrome/Chromium not found. Pass its path as the first argument." >&2
  exit 1
fi

"$CHROME" --headless=new --disable-gpu --no-sandbox \
  --no-pdf-header-footer --run-all-compositor-stages-before-draw \
  --virtual-time-budget=5000 \
  --print-to-pdf="$OUT" "file://$SRC"

echo "Wrote $OUT"
