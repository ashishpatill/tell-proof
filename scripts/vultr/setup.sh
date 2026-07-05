#!/usr/bin/env bash
# First-time Vultr bootstrap — installs Docker, clones repo, runs deploy-and-verify.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/deploy-and-verify.sh" "$@"
