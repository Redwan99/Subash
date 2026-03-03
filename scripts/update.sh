#!/bin/sh
# =============================================================================
# Subash — Remote Auto-Update Script
# Pulls the latest pre-built Docker image from GitHub Container Registry
# (ghcr.io/redwan002117/subash) and restarts the stack.
#
# GitHub Actions builds and publishes a new image on every push to main.
# This script just pulls that image — no build step needed on CasaOS.
#
# Usage:
#   ./scripts/update.sh              # pull latest image + restart
#   ./scripts/update.sh --force      # restart even if image is already current
#   ./scripts/update.sh --git-only   # git pull only, no image pull/restart
#   ./scripts/update.sh --local-build # git pull + build image locally (no pull)
#
# Cron (auto-update every day at 3 AM):
#   crontab -e
#   0 3 * * * /DATA/AppData/subash/scripts/update.sh >> /DATA/AppData/subash/logs/update.log 2>&1
# =============================================================================

set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$APP_DIR/logs"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"
FORCE=false
GIT_ONLY=false
LOCAL_BUILD=false

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------
for arg in "$@"; do
  case "$arg" in
    --force)       FORCE=true ;;
    --git-only)    GIT_ONLY=true ;;
    --local-build) LOCAL_BUILD=true ;;
  esac
done

# ---------------------------------------------------------------------------
# Logging helper
# ---------------------------------------------------------------------------
mkdir -p "$LOG_DIR"
log() { echo "[$TIMESTAMP] $1"; }

log "============================================"
log "Subash update started"
log "Working dir: $APP_DIR"

cd "$APP_DIR"

# ---------------------------------------------------------------------------
# 1. Fetch latest from GitHub
# ---------------------------------------------------------------------------
log "Fetching from GitHub (Redwan002117/Subash)..."
git fetch origin main 2>&1

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ] && [ "$FORCE" = "false" ]; then
  log "Already up to date (${LOCAL:0:8}). Nothing to do."
  log "  Use --force to pull image and restart anyway."
  exit 0
fi

log "Changes detected: ${LOCAL:0:8} → ${REMOTE:0:8}"
git pull origin main 2>&1

# ---------------------------------------------------------------------------
# 2. Show what changed
# ---------------------------------------------------------------------------
CHANGED_FILES=$(git diff --name-only "$LOCAL" "$REMOTE" 2>/dev/null || echo "(unknown)")
log "Changed files:"
echo "$CHANGED_FILES" | while IFS= read -r f; do log "  • $f"; done

# ---------------------------------------------------------------------------
# 3. Git only mode
# ---------------------------------------------------------------------------
if [ "$GIT_ONLY" = "true" ]; then
  log "--git-only: skipping image pull/restart."
  exit 0
fi

# ---------------------------------------------------------------------------
# 4a. Local build mode (for dev/testing on the server itself)
# ---------------------------------------------------------------------------
if [ "$LOCAL_BUILD" = "true" ]; then
  log "--local-build: building image locally..."
  docker compose build --no-cache web 2>&1
  log "Restarting containers..."
  docker compose up -d 2>&1
else
# ---------------------------------------------------------------------------
# 4b. Normal mode: pull pre-built image from GitHub Container Registry
# ---------------------------------------------------------------------------
  log "Pulling latest image from ghcr.io/redwan002117/subash..."
  docker compose pull web 2>&1
  log "Restarting containers..."
  docker compose up -d 2>&1
fi

# ---------------------------------------------------------------------------
# 5. Health check — wait up to 60 s for the app to respond
# ---------------------------------------------------------------------------
log "Waiting for app to be healthy..."
TRIES=0
MAX=12
until docker compose ps web | grep -q "healthy\|running" && \
      wget -qO- http://localhost:3000/ > /dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge "$MAX" ]; then
    log "⚠ Health check timed out after $((MAX * 5)) seconds."
    log "  Check logs: docker compose logs --tail 50 web"
    exit 1
  fi
  log "  Still starting... (${TRIES}/${MAX})"
  sleep 5
done

log "✅ App is live at http://localhost:3000"
log "   Deployed commit: $(git rev-parse --short HEAD)"
log "   Commit message:  $(git log -1 --pretty=format:'%s')"
log "============================================"

# ---------------------------------------------------------------------------
# 5. Health check — wait up to 60 s for the app to respond
# ---------------------------------------------------------------------------
log "Waiting for app to be healthy..."
TRIES=0
MAX=12
until docker compose ps web | grep -q "healthy\|running" && \
      wget -qO- http://localhost:3000/ > /dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge "$MAX" ]; then
    log "⚠ Health check timed out after $((MAX * 5)) seconds."
    log "  Check logs: docker compose logs --tail 50 web"
    exit 1
  fi
  log "  Still starting... (${TRIES}/${MAX})"
  sleep 5
done

log "✅ App is live at http://localhost:3000"
log "   Deployed commit: $(git rev-parse --short HEAD)"
log "   Commit message:  $(git log -1 --pretty=format:'%s')"
log "============================================"
