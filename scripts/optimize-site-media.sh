#!/usr/bin/env bash
# Convert specimen / site photography under apps/web/public to display-sized WebP.
# Runs for every site folder (crease, baseline, future specimens) — not README-only.
#
# Budgets (CSS × ~2 for retina):
#   *hero* / fold  → max 1600w @ q82
#   story / editorial → max 1200w @ q78
#   default stills → max 1000w @ q78
#
# Usage:
#   pnpm media:site
#   scripts/optimize-site-media.sh --prune   # delete superseded jpg/png after webp
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/apps/web/public"
PRUNE=0
for arg in "$@"; do
  [[ "$arg" == "--prune" ]] && PRUNE=1
done

need() { command -v "$1" >/dev/null || { echo "missing $1"; exit 1; }; }
need ffmpeg

maxw_for() {
  local base="$1"
  if [[ "$base" == *hero* || "$base" == *fold* ]]; then
    echo 1600
  elif [[ "$base" == *story* || "$base" == *notebook* || "$base" == *feature* ]]; then
    echo 1200
  else
    echo 1000
  fi
}

quality_for() {
  local base="$1"
  if [[ "$base" == *hero* || "$base" == *fold* ]]; then
    echo 82
  else
    echo 78
  fi
}

encode_still() {
  local src="$1" dst="$2" maxw="$3" q="$4"
  ffmpeg -y -hide_banner -loglevel error -i "$src" \
    -vf "scale='min(${maxw},iw)':-2:flags=lanczos" \
    -c:v libwebp -quality "$q" -compression_level 6 "$dst"
}

echo "== site media → WebP (apps/web/public) =="
if [[ ! -d "$PUBLIC" ]]; then
  echo "no public dir; skip"
  exit 0
fi

mapfile -t sources < <(find "$PUBLIC" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) | sort)
count=0
for src in "${sources[@]}"; do
  [[ -f "$src" ]] || continue
  dir="$(dirname "$src")"
  base="$(basename "$src")"
  stem="${base%.*}"
  ext="${base##*.}"
  [[ "${ext,,}" == "webp" ]] && continue
  dst="$dir/${stem}.webp"
  maxw="$(maxw_for "$stem")"
  q="$(quality_for "$stem")"
  encode_still "$src" "$dst" "$maxw" "$q"
  before="$(du -h "$src" | awk '{print $1}')"
  after="$(du -h "$dst" | awk '{print $1}')"
  rel="${dst#"$ROOT/"}"
  echo "  ${rel}  ${after}  ← ${before} ${ext}  (@${maxw}w q${q})"
  if [[ "$PRUNE" -eq 1 ]]; then
    rm -f "$src"
    echo "    pruned $(basename "$src")"
  fi
  count=$((count + 1))
done

echo "== done: ${count} still(s) =="
