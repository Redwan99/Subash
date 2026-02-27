#!/bin/sh
# =============================================================================
# Subash — Remote Auto-Update Script
# Run on CasaOS to pull latest code and rebuild the app.
#
# Usage:
#   ./scripts/update.sh              # manual run
#   ./scripts/update.sh --force      # rebuild even if no git changes
#   ./scripts/update.sh --no-build   # git pull only, no rebuild
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
NO_BUILD=false

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------
for arg in "$@"; do
  case "$arg" in
    --force)   FORCE=true ;;
    --no-build) NO_BUILD=true ;;
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
  log "  Use --force to rebuild anyway."
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
# 3. Skip rebuild if --no-build
# ---------------------------------------------------------------------------
if [ "$NO_BUILD" = "true" ]; then
  log "--no-build: skipping Docker rebuild. Run 'docker compose up -d --build' manually."
  exit 0
fi

# ---------------------------------------------------------------------------
# 4. Rebuild and restart
# ---------------------------------------------------------------------------
log "Rebuilding Docker image..."
docker compose build --no-cache web 2>&1

log "Restarting containers..."
docker compose up -d 2>&1

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
