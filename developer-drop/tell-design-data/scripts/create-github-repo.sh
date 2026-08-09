#!/usr/bin/env bash
# Create your private GitHub remote for this harness (run on your machine).
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v gh >/dev/null; then
  echo "Install GitHub CLI (gh), then re-run." >&2
  exit 1
fi
gh repo create tell-design-data --private --source=. --remote=origin --push
echo "Private repo created. Data still stays in ~/.tell-design-data (gitignored)."
