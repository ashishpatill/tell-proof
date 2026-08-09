#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="${1:-ashishpatill/tell-design-data}"
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Set GITHUB_TOKEN to a PAT with repo scope, or create the empty private repo and grant the Cursor GitHub App access, then re-run the cloud agent." >&2
  exit 1
fi
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git"
git push -u origin main
echo "Pushed to https://github.com/${REPO}"
