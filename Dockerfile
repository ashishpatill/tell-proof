# Tell — full-stack deployment (Option B: live Playwright capture)
#
# Layer order is tuned for cache: dependency + Playwright layers survive source-only changes.
#
# Build:  docker build -t tell-capture:latest .
# Run:    docker run --rm -p 3000:3000 --env-file /etc/tell-capture.env tell-capture:latest

FROM node:20-bookworm

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Layer 1: manifests (cache until lockfile changes) ──
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/schema/package.json ./packages/schema/
COPY packages/core/package.json ./packages/core/
COPY packages/taste/package.json ./packages/taste/
COPY packages/redesign/package.json ./packages/redesign/
COPY packages/mcp/package.json ./packages/mcp/
COPY apps/web/package.json ./apps/web/
COPY fixtures/generic-app/package.json ./fixtures/generic-app/

RUN pnpm install --frozen-lockfile

# ── Layer 2: Playwright browsers (cache until deps change — skip on code-only edits) ──
RUN pnpm --filter @tell/core exec playwright install --with-deps chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

# ── Layer 3: source + build (re-runs when app code changes) ──
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
COPY fixtures ./fixtures

ARG GIT_COMMIT=unknown
LABEL org.opencontainers.image.revision=$GIT_COMMIT

RUN pnpm -F @tell/web... build

ENV NODE_ENV=production
ENV PORT=3000
ENV TELL_REPO_ROOT=/app
ENV TELL_DISABLE_REPO_SETUP=1
ENV TELL_CAPTURE_TIMEOUT_MS=90000

EXPOSE 3000

WORKDIR /app/apps/web
CMD ["pnpm", "start"]
