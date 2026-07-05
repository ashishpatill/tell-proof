#!/usr/bin/env bash
# Tell capture backend on a Vultr VPS (Docker + Playwright).
# Run as root on a fresh Ubuntu 22.04/24.04 instance:
#   curl -fsSL https://raw.githubusercontent.com/ashishpatill/tell-ai-ui-critic/master/scripts/vultr/setup.sh | bash
#
# Or after cloning:
#   sudo bash scripts/vultr/setup.sh

set -euo pipefail

REPO="${TELL_REPO:-https://github.com/ashishpatill/tell-ai-ui-critic.git}"
BRANCH="${TELL_BRANCH:-master}"
APP_DIR="${TELL_APP_DIR:-/opt/tell}"
ENV_FILE="${TELL_ENV_FILE:-/etc/tell-capture.env}"
CONTAINER_NAME="tell-capture"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl git
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

echo "==> Cloning Tell..."
mkdir -p "$(dirname "$APP_DIR")"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull origin "$BRANCH"
else
  rm -rf "$APP_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$APP_DIR"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "==> Creating $ENV_FILE (edit before first capture if keys missing)..."
  cat >"$ENV_FILE" <<'EOF'
GEMINI_API_KEY=
CURSOR_API_KEY=
TELL_DISABLE_REPO_SETUP=1
TELL_REPO_ROOT=/app
TELL_CAPTURE_TIMEOUT_MS=90000
NODE_ENV=production
PORT=3000
EOF
  chmod 600 "$ENV_FILE"
  echo "    Add GEMINI_API_KEY:  sudo nano $ENV_FILE"
fi

echo "==> Building Docker image (10–15 min first time)..."
docker build -t tell-capture:latest "$APP_DIR"

echo "==> Starting container..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 3000:3000 \
  -e PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright \
  --env-file "$ENV_FILE" \
  tell-capture:latest

if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp >/dev/null 2>&1 || true
  ufw allow 3000/tcp >/dev/null 2>&1 || true
  echo "y" | ufw enable >/dev/null 2>&1 || true
fi

PUBLIC_IP="$(curl -4 -s ifconfig.me || hostname -I | awk '{print $1}')"
echo ""
echo "Done. Capture API: http://${PUBLIC_IP}:3000"
echo "Smoke test:"
echo "  curl -X POST http://${PUBLIC_IP}:3000/api/diagnose \\"
echo "    -H 'content-type: application/json' \\"
echo "    -d '{\"url\":\"https://example.com\"}'"
echo ""
echo "Set on Vercel: TELL_CAPTURE_API_URL=http://${PUBLIC_IP}:3000"
