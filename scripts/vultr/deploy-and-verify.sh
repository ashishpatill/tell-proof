#!/usr/bin/env bash
# Tell Vultr — pull latest code, build (cached layers), start, verify.
#
# Usage (on the VPS as root):
#   bash /opt/tell/scripts/vultr/deploy-and-verify.sh
#   TELL_FORCE_REBUILD=1 bash ...   # ignore cache / redeploy anyway
#   TELL_VERCEL_AUTO_DEPLOY=0 bash ...   # verify Vercel without deploying it
#
# Vercel deploys are optional but automatic when:
#   - Vercel CLI is installed/authenticated on the VPS, or VERCEL_TOKEN is exported
#   - the checkout is linked with .vercel/project.json, or VERCEL_ORG_ID/VERCEL_PROJECT_ID are exported
#
# First-time bootstrap still works via setup.sh (installs Docker + clones repo).

set -euo pipefail

REPO="${TELL_REPO:-https://github.com/ashishpatill/tell-ai-ui-critic.git}"
BRANCH="${TELL_BRANCH:-master}"
APP_DIR="${TELL_APP_DIR:-/opt/tell}"
ENV_FILE="${TELL_ENV_FILE:-/etc/tell-capture.env}"
CONTAINER_NAME="${TELL_CONTAINER_NAME:-tell-capture}"
IMAGE_NAME="${TELL_IMAGE_NAME:-tell-capture:latest}"
STATE_DIR="${TELL_STATE_DIR:-/var/lib/tell-capture}"
DEPLOYED_COMMIT_FILE="$STATE_DIR/deployed-commit"
CAPTURE_URL="${TELL_TEST_URL:-https://example.com}"
CAPTURE_TIMEOUT="${TELL_VERIFY_TIMEOUT:-120}"
PORT="${TELL_PORT:-3000}"
VERCEL_PROD_URL="${TELL_VERCEL_PROD_URL:-https://tell-five.vercel.app}"
VERCEL_CLI="${TELL_VERCEL_CLI:-vercel}"
VERCEL_DEPLOYED_COMMIT_FILE="$STATE_DIR/vercel-deployed-commit"
VERCEL_AUTO_DEPLOY="${TELL_VERCEL_AUTO_DEPLOY:-1}"
VERCEL_CHECK="${TELL_VERCEL_CHECK:-1}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $*"; }
fail() { echo -e "${RED}✗${NC} $*"; FAILURES+=("$*"); }
warn() { echo -e "${YELLOW}!${NC} $*"; Warnings+=("$*"); }
info() { echo -e "→ $*"; }

FAILURES=()
Warnings=()

require_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    echo "Run as root: sudo bash $0"
    exit 1
  fi
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1; then
    return 0
  fi
  info "Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl git
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
}

print_github_push_instructions() {
  local reason="$1"
  warn "$reason"
  cat <<EOF

Ship code to GitHub first, then rerun this VPS deploy:

  cd "\${LOCAL_TELL_REPO:-/path/to/tell}"
  git status --short
  git add .
  git commit -m "Prepare demo deployment"
  git push origin ${BRANCH}

Then on Vultr:

  ssh root@YOUR_VULTR_IP
  bash ${APP_DIR}/scripts/vultr/deploy-and-verify.sh

EOF
}

checkout_dirty() {
  [[ -d "$APP_DIR/.git" ]] && [[ -n "$(git -C "$APP_DIR" status --porcelain)" ]]
}

ensure_repo() {
  if [[ ! -d "$APP_DIR/.git" ]]; then
    info "Cloning Tell into $APP_DIR..."
    mkdir -p "$(dirname "$APP_DIR")"
    git clone --depth 1 --branch "$BRANCH" "$REPO" "$APP_DIR"
    return 0
  fi

  if checkout_dirty; then
    print_github_push_instructions "VPS checkout has local changes; refusing to reset or deploy a dirty tree."
    fail "Commit/push local changes to GitHub before backend or frontend deployment"
    print_summary
  fi

  info "Fetching latest code..."
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH" || git -C "$APP_DIR" reset --hard "origin/$BRANCH"
}

current_commit() {
  git -C "$APP_DIR" rev-parse --short HEAD
}

deployed_commit() {
  if [[ -f "$DEPLOYED_COMMIT_FILE" ]]; then
    cat "$DEPLOYED_COMMIT_FILE"
  else
    echo "none"
  fi
}

container_running() {
  docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"
}

ensure_env_file() {
  if [[ -f "$ENV_FILE" ]]; then
    return 0
  fi
  warn "Creating $ENV_FILE — add GEMINI_API_KEY before demo"
  mkdir -p "$(dirname "$ENV_FILE")"
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
}

gemini_key_set() {
  [[ -f "$ENV_FILE" ]] && grep -q '^GEMINI_API_KEY=.\+' "$ENV_FILE"
}

needs_rebuild() {
  local head deployed
  head="$(current_commit)"
  deployed="$(deployed_commit)"

  if [[ "${TELL_FORCE_REBUILD:-0}" == "1" ]]; then
    info "Force rebuild requested"
    return 0
  fi
  if ! container_running; then
    info "Container not running"
    return 0
  fi
  if [[ "$head" != "$deployed" ]]; then
    info "Code changed ($deployed → $head)"
    return 0
  fi
  if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    info "Image $IMAGE_NAME missing"
    return 0
  fi
  return 1
}

build_image() {
  local commit
  commit="$(current_commit)"
  mkdir -p "$STATE_DIR"
  info "Building Docker image (commit $commit) — Playwright layer cached unless deps changed..."
  # DO NOT use --no-cache unless forcing; layer cache reuses deps/Playwright on code-only changes.
  if docker buildx version >/dev/null 2>&1; then
    DOCKER_BUILDKIT=1 docker build \
      --build-arg "GIT_COMMIT=$commit" \
      -t "$IMAGE_NAME" \
      "$APP_DIR"
  else
    docker build \
      --build-arg "GIT_COMMIT=$commit" \
      -t "$IMAGE_NAME" \
      "$APP_DIR"
  fi
  echo "$commit" >"$DEPLOYED_COMMIT_FILE"
  pass "Image built and tagged $IMAGE_NAME @ $commit"
}

start_container() {
  info "Starting container $CONTAINER_NAME..."
  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "${PORT}:3000" \
    -e PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright \
    --env-file "$ENV_FILE" \
    "$IMAGE_NAME"
  pass "Container started on port $PORT"
}

wait_for_http() {
  local url="$1" max="${2:-60}" i
  for ((i = 1; i <= max; i++)); do
    if curl -fsS -m 3 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

verify_home() {
  local code
  code="$(curl -sS -m 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/" || echo 000)"
  if [[ "$code" == "200" ]]; then
    pass "GET / → $code"
  else
    fail "GET / → $code (expected 200)"
  fi
}

verify_health() {
  local body code
  body="$(curl -sS -m 30 "http://127.0.0.1:${PORT}/api/health/capture" 2>/dev/null || true)"
  if [[ "$body" == *'"ok":true'* ]]; then
    pass "GET /api/health/capture → Playwright OK"
    return 0
  fi
  if [[ "$body" == *'404'* ]] || [[ -z "$body" ]] || [[ "$body" == *'not found'* ]]; then
    fail "GET /api/health/capture → 404 or missing (old image — rebuild required)"
    return 1
  fi
  fail "GET /api/health/capture → $body"
  return 1
}

verify_capture() {
  info "Live capture test ($CAPTURE_URL) — may take up to ${CAPTURE_TIMEOUT}s..."
  local body
  body="$(curl -sS -m "$CAPTURE_TIMEOUT" -X POST "http://127.0.0.1:${PORT}/api/diagnose" \
    -H 'content-type: application/json' \
    -d "{\"url\":\"$CAPTURE_URL\"}" 2>/dev/null || echo '{}')"

  if [[ "$body" == *'"live":true'* ]] || [[ "$body" == *'"live": true'* ]]; then
    pass "POST /api/diagnose → live capture OK"
    return 0
  fi

  local detail error
  detail="$(printf '%s' "$body" | python3 -c "import json,sys; d=json.load(sys.stdin); m=d.get('meta',{}); print(m.get('detail') or m.get('error') or 'unknown')" 2>/dev/null || echo unknown)"
  fail "POST /api/diagnose → offline fallback ($detail)"
  return 1
}

verify_env_keys() {
  if gemini_key_set; then
    pass "GEMINI_API_KEY is set in $ENV_FILE"
  else
    warn "GEMINI_API_KEY missing in $ENV_FILE (voice/taste will use fallbacks)"
  fi
}

verify_firewall_hint() {
  local ip
  ip="$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
  local code
  code="$(curl -sS -m 5 -o /dev/null -w '%{http_code}' "http://${ip}:${PORT}/" 2>/dev/null || echo 000)"
  if [[ "$code" == "200" ]]; then
    pass "Public http://${ip}:${PORT}/ reachable"
  else
    warn "Public http://${ip}:${PORT}/ → $code — open TCP $PORT in Vultr firewall + ufw"
  fi
}

open_firewall() {
  if command -v ufw >/dev/null 2>&1; then
    ufw allow 22/tcp >/dev/null 2>&1 || true
    ufw allow "${PORT}"/tcp >/dev/null 2>&1 || true
    echo "y" | ufw enable >/dev/null 2>&1 || true
  fi
}

vercel_deployed_commit() {
  if [[ -f "$VERCEL_DEPLOYED_COMMIT_FILE" ]]; then
    cat "$VERCEL_DEPLOYED_COMMIT_FILE"
  else
    echo "unknown"
  fi
}

vercel_cli_available() {
  command -v "$VERCEL_CLI" >/dev/null 2>&1
}

run_vercel() {
  if [[ -n "${VERCEL_TOKEN:-}" ]]; then
    "$VERCEL_CLI" "$@" --token "$VERCEL_TOKEN"
  else
    "$VERCEL_CLI" "$@"
  fi
}

vercel_project_linked() {
  [[ -f "$APP_DIR/.vercel/project.json" ]] || [[ -n "${VERCEL_ORG_ID:-}" && -n "${VERCEL_PROJECT_ID:-}" ]]
}

vercel_alias_has_commit() {
  local commit="$1" inspect
  vercel_cli_available || return 1
  inspect="$(run_vercel inspect "$VERCEL_PROD_URL" 2>/dev/null || true)"
  [[ "$inspect" == *"$commit"* ]]
}

deploy_vercel_if_needed() {
  if [[ "$VERCEL_CHECK" != "1" ]]; then
    warn "Skipping Vercel check because TELL_VERCEL_CHECK=$VERCEL_CHECK"
    return 0
  fi

  local head known
  head="$(current_commit)"
  known="$(vercel_deployed_commit)"

  if [[ "$known" == "$head" && "${TELL_VERCEL_FORCE_DEPLOY:-0}" != "1" ]]; then
    pass "Vercel previously deployed commit $head from this script"
    return 0
  fi

  if vercel_alias_has_commit "$head" && [[ "${TELL_VERCEL_FORCE_DEPLOY:-0}" != "1" ]]; then
    mkdir -p "$STATE_DIR"
    echo "$head" >"$VERCEL_DEPLOYED_COMMIT_FILE"
    pass "Vercel alias already points at commit $head"
    return 0
  fi

  info "Vercel deployed commit: $known | HEAD: $head"

  if [[ "$VERCEL_AUTO_DEPLOY" != "1" ]]; then
    print_github_push_instructions "Vercel may not be on HEAD; auto deploy disabled with TELL_VERCEL_AUTO_DEPLOY=$VERCEL_AUTO_DEPLOY."
    return 0
  fi

  if ! vercel_cli_available; then
    print_github_push_instructions "Vercel CLI not found on this VPS; cannot deploy frontend from the script."
    warn "Install/authenticate Vercel CLI or deploy frontend locally: vercel deploy --prod --yes"
    return 0
  fi

  if ! vercel_project_linked; then
    print_github_push_instructions "Vercel project is not linked on this VPS."
    warn "Run vercel link in $APP_DIR, or set VERCEL_ORG_ID and VERCEL_PROJECT_ID with VERCEL_TOKEN."
    return 0
  fi

  info "Deploying Vercel frontend for commit $head..."
  if run_vercel deploy --prod --yes --cwd "$APP_DIR" --meta "tellGitCommit=$head"; then
    mkdir -p "$STATE_DIR"
    echo "$head" >"$VERCEL_DEPLOYED_COMMIT_FILE"
    pass "Vercel production deployed @ $head"
  else
    fail "Vercel production deploy failed"
  fi
}

verify_vercel_public_flow() {
  if [[ "$VERCEL_CHECK" != "1" ]]; then
    return 0
  fi

  local health diagnose detail
  info "Checking Vercel public health at ${VERCEL_PROD_URL}..."
  health="$(curl -sS -m 30 "${VERCEL_PROD_URL%/}/api/health/capture" 2>/dev/null || true)"
  if [[ "$health" == *'"ok":true'* && "$health" == *'"backend":"remote"'* ]]; then
    pass "Vercel /api/health/capture → remote backend OK"
  else
    fail "Vercel /api/health/capture is not using a healthy remote backend"
  fi

  info "Checking Vercel live capture proxy (${CAPTURE_URL})..."
  diagnose="$(curl -sS -m "$CAPTURE_TIMEOUT" -X POST "${VERCEL_PROD_URL%/}/api/diagnose" \
    -H 'content-type: application/json' \
    -d "{\"url\":\"$CAPTURE_URL\"}" 2>/dev/null || echo '{}')"
  if [[ "$diagnose" == *'"live":true'* ]] || [[ "$diagnose" == *'"live": true'* ]]; then
    pass "Vercel /api/diagnose → live capture OK"
    return 0
  fi

  detail="$(printf '%s' "$diagnose" | python3 -c "import json,sys; d=json.load(sys.stdin); m=d.get('meta',{}); print(m.get('detail') or m.get('error') or 'unknown')" 2>/dev/null || echo unknown)"
  fail "Vercel /api/diagnose did not return live capture ($detail)"
}

print_summary() {
  local ip commit
  ip="$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
  commit="$(deployed_commit)"
  echo ""
  echo "════════════════════════════════════════"
  echo " Tell capture — deploy summary"
  echo "════════════════════════════════════════"
  echo " Commit:    $commit"
  echo " API:       http://${ip}:${PORT}"
  echo " Vercel:    TELL_CAPTURE_API_URL=http://${ip}:${PORT}"
  echo " Frontend:  ${VERCEL_PROD_URL} (script state: $(vercel_deployed_commit))"
  echo " Health:    curl http://127.0.0.1:${PORT}/api/health/capture"
  echo ""

  if ((${#FAILURES[@]})); then
    echo -e "${RED}Failed checks:${NC}"
    for f in "${FAILURES[@]}"; do echo "  • $f"; done
  fi
  if ((${#Warnings[@]})); then
    echo -e "${YELLOW}Warnings:${NC}"
    for w in "${Warnings[@]}"; do echo "  • $w"; done
  fi
  if ((${#FAILURES[@]} == 0)); then
    echo -e "${GREEN}All critical checks passed.${NC}"
    exit 0
  fi
  echo -e "${RED}Fix failures above, then re-run this script.${NC}"
  exit 1
}

main() {
  require_root
  ensure_docker
  ensure_repo
  ensure_env_file

  info "Deployed commit: $(deployed_commit) | HEAD: $(current_commit)"

  if needs_rebuild; then
    build_image
    start_container
  elif container_running; then
    pass "Already running latest commit $(deployed_commit) — skipping rebuild"
  else
    build_image
    start_container
  fi

  info "Waiting for server..."
  if ! wait_for_http "http://127.0.0.1:${PORT}/" 90; then
    fail "Server did not respond on port $PORT within 90s"
    docker logs "$CONTAINER_NAME" --tail 40 2>/dev/null || true
    print_summary
  fi

  verify_home
  verify_health
  verify_capture || true
  verify_env_keys
  verify_firewall_hint
  open_firewall
  deploy_vercel_if_needed
  verify_vercel_public_flow
  print_summary
}

main "$@"
