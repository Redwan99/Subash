#!/bin/sh
# scripts/entrypoint.sh
# Docker entrypoint for Subash on CasaOS.
# Runs on every container start:
#   1. Ensures SQLite database file exists
#   2. Applies schema (prisma db push — idempotent)
#   3. Seeds all perfumes from CSV only on the very first boot
#   4. Starts the Next.js server
set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Subash — starting up"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Ensure SQLite file exists ─────────────────────────────────────────────
DB_PATH="$(echo "${DATABASE_URL:-file:./subash.db}" | sed 's|^file:||')"
mkdir -p "$(dirname "$DB_PATH")"
if [ ! -f "$DB_PATH" ]; then
  echo "📄  Creating SQLite database at $DB_PATH"
  touch "$DB_PATH"
else
  echo "📄  Using existing SQLite database at $DB_PATH"
fi

# ── 2. Apply schema ──────────────────────────────────────────────────────────
echo "🔄  Syncing database schema (prisma db push)..."
node node_modules/.bin/prisma db push --skip-generate --accept-data-loss
echo "✅  Schema up to date."

# ── 3. Seed on first boot ────────────────────────────────────────────────────
if [ "${SEED_DB}" = "true" ]; then
  COUNT=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.perfume.count()
      .then(n => { console.log(n); return p.\$disconnect(); })
      .catch(() => { console.log(0); process.exit(0); });
  " 2>/dev/null || echo "0")

  if [ "$COUNT" = "0" ]; then
    echo "🌱  DB is empty — importing all perfumes from CSV..."
    echo "    (This takes ~3-5 minutes for 70k perfumes. Logs below.)"
    echo ""
    node /app/scripts/seed.js
    echo ""
    echo "✅  Seed complete."
  else
    echo "✅  DB already has $COUNT perfumes — skipping seed."
  fi
else
  echo "ℹ️   SEED_DB is not 'true' — skipping seed. Set SEED_DB=true to import."
fi

# ── 4. Start Next.js ─────────────────────────────────────────────────────────
echo ""
echo "🚀  Starting Subash on port ${PORT:-3000}..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exec node server.js
