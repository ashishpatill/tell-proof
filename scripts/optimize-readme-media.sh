#!/usr/bin/env bash
# Convert docs/media showcase (+ README demo poster) to WebP at display-appropriate widths.
# GitHub README tables show ~2-col ~400–480px cells; hero ~900–1100px. Encode @~1.5–2x CSS.
#
# Usage:
#   pnpm media:webp
#   scripts/optimize-readme-media.sh --prune   # also delete superseded PNG/GIF sources
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SHOW="$ROOT/docs/media/showcase"
MEDIA="$ROOT/docs/media"
PRUNE=0
for arg in "$@"; do
  [[ "$arg" == "--prune" ]] && PRUNE=1
done

need() { command -v "$1" >/dev/null || { echo "missing $1"; exit 1; }; }
need ffmpeg

encode_still() {
  local src="$1" dst="$2" maxw="$3" q="${4:-78}"
  ffmpeg -y -hide_banner -loglevel error -i "$src" \
    -vf "scale='min(${maxw},iw)':-2:flags=lanczos" \
    -c:v libwebp -quality "$q" -compression_level 6 "$dst"
}

encode_anim() {
  local src="$1" dst="$2" maxw="$3" q="${4:-68}"
  ffmpeg -y -hide_banner -loglevel error -i "$src" \
    -vf "scale='min(${maxw},iw)':-2:flags=lanczos" \
    -c:v libwebp -quality "$q" -compression_level 6 -loop 0 "$dst"
}

echo "== showcase stills =="
shopt -s nullglob
for src in "$SHOW"/*.png; do
  base="$(basename "$src" .png)"
  dst="$SHOW/${base}.webp"
  if [[ "$base" == "01-showcase-featured" || "$base" == "02-showcase-gallery" ]]; then
    maxw=1100
  else
    maxw=720
  fi
  encode_still "$src" "$dst" "$maxw"
  echo "  $(basename "$dst")  $(du -h "$dst" | awk '{print $1}')  ← $(du -h "$src" | awk '{print $1}') png"
  if [[ "$PRUNE" -eq 1 ]]; then
    rm -f "$src"
  fi
done

echo "== showcase reels =="
for src in "$SHOW"/*-reel.gif; do
  base="$(basename "$src" .gif)"
  dst="$SHOW/${base}.webp"
  # Table reel cells are ~400px CSS; 480w is enough for 1x/light 2x.
  encode_anim "$src" "$dst" 480
  echo "  $(basename "$dst")  $(du -h "$dst" | awk '{print $1}')  ← $(du -h "$src" | awk '{print $1}') gif"
  if [[ "$PRUNE" -eq 1 ]]; then
    rm -f "$src"
  fi
done

echo "== README demo poster =="
# Full-length animated WebP of the ~40s demo is larger than the GIF — use a still poster
# in the README and link the MP4 for motion.
demo_src=""
if [[ -f "$MEDIA/tell-proof-demo.mp4" ]]; then
  demo_src="$MEDIA/tell-proof-demo.mp4"
elif [[ -f "$MEDIA/tell-proof-demo.gif" ]]; then
  demo_src="$MEDIA/tell-proof-demo.gif"
fi
if [[ -n "$demo_src" ]]; then
  ffmpeg -y -hide_banner -loglevel error -ss 2 -i "$demo_src" -frames:v 1 \
    -vf "scale='min(1100,iw)':-2:flags=lanczos" \
    -c:v libwebp -quality 82 -compression_level 6 \
    "$MEDIA/tell-proof-demo-poster.webp"
  echo "  tell-proof-demo-poster.webp  $(du -h "$MEDIA/tell-proof-demo-poster.webp" | awk '{print $1}')  ← still from $(basename "$demo_src")"
  # Drop accidental full-length animated demo webp (too heavy for README).
  rm -f "$MEDIA/tell-proof-demo.webp"
fi

echo
echo "Totals:"
du -sh "$SHOW" 2>/dev/null || true
du -h "$MEDIA/tell-proof-demo-poster.webp" 2>/dev/null || true
if [[ "$PRUNE" -eq 1 ]]; then
  echo "Pruned PNG/GIF sources after WebP encode."
fi
echo "Done."
