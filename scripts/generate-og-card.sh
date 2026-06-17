#!/usr/bin/env bash
# 1200×630 Open Graph card (iMessage / Messenger large preview) from the square app icon.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICON="$ROOT/public/og-image.png"
OUT="$ROOT/public/og-card.png"
sips -p 630 1200 --padColor 121212 "$ICON" --out "$OUT" >/dev/null
