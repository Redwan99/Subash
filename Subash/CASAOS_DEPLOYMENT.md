# Subash — CasaOS Deployment Guide

Run the full Subash stack (Next.js + PostgreSQL + 70k perfumes) on your CasaOS
home server. The Docker image is self-contained — it holds the app, the CSV data,
and the seed logic. No extra steps needed between clone and run.

---

## What runs automatically on every start

| Stage | What happens |
|---|---|
| Always | Waits for Postgres → runs `prisma db push` (schema sync, safe to repeat) |
| First boot (`SEED_DB=true`) | Imports all ~70,103 perfumes from the bundled CSV (~3–5 min) |
| Every subsequent boot | DB already has data — skips seed, starts in seconds |

---

## Step 1 — SSH into CasaOS and clone

```bash
ssh casaos@<your-casaos-ip>
cd /DATA/AppData
git clone https://github.com/Redwan002117/Subash.git subash
cd subash
```

---

## Step 2 — Create your `.env` file

```bash
cp .env.example .env
nano .env
```

Fill in these critical values:

```dotenv
# Database — "db" is the Docker service name, not localhost
POSTGRES_USER=subash_user
POSTGRES_PASSWORD=use_something_strong_here
POSTGRES_DB=subash_db
DATABASE_URL=postgresql://subash_user:use_something_strong_here@db:5432/subash_db?schema=public

# Auth  (generate: openssl rand -base64 32)
AUTH_SECRET=<generated-secret>
AUTH_URL=http://<casaos-ip>:3000

# Weather
OPENWEATHERMAP_API_KEY=<your-key>
NEXT_PUBLIC_DEFAULT_CITY=Dhaka

# ★ FIRST BOOT: set true to import all 70k perfumes
# ★ AFTER SEED:  set false so restarts skip the check
SEED_DB=true

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
NEXT_PUBLIC_SITE_URL=http://<casaos-ip>:3000
```

---

## Step 3 — Build and start

```bash
docker compose up -d --build
```

First build: **4–8 min** (compiles Next.js, downloads base images).

Watch live:
```bash
docker compose logs -f web
```

Output during first boot:
```
⏳  Waiting for Postgres...
✅  Postgres is up.
🔄  Syncing database schema...
🌱  DB is empty — importing all perfumes from CSV...
  📦 Flushed batch → 500 inserted (running total: 500)
  📦 Flushed batch → 500 inserted (running total: 1000)
  ...
✅  Seed complete.
🚀  Starting Subash on port 3000...
```

Open **`http://<casaos-ip>:3000`** — all 70k perfumes are live.

---

## Step 4 — Disable re-seeding after first boot

```bash
nano .env
# Change:  SEED_DB=true  →  SEED_DB=false
docker compose up -d
```

Restarts now take **under 10 seconds**.

---

## Updating while you develop

```bash
# On Windows dev machine:
git push

# On CasaOS via SSH — one command does everything:
bash /DATA/AppData/subash/scripts/update.sh
```

The script:
- Pulls latest code from GitHub
- Skips the rebuild if nothing changed
- Rebuilds the Docker image and restarts the container
- Waits for a health check before exiting
- Logs everything to `logs/update.log`

**Options:**
```bash
./scripts/update.sh --force     # rebuild even if no git changes
./scripts/update.sh --no-build  # git pull only, no Docker rebuild
```

**Auto-update via cron (e.g. daily at 3 AM):**
```bash
crontab -e
# Add:
0 3 * * * /DATA/AppData/subash/scripts/update.sh >> /DATA/AppData/subash/logs/update.log 2>&1
```

Database is in a Docker volume — rebuilds never touch it.

---

## Connect Prisma Studio from Windows

```bash
DATABASE_URL="postgresql://subash_user:<pw>@<casaos-ip>:5432/subash_db?schema=public" npx prisma studio
```

Or use TablePlus / DBeaver pointing at `<casaos-ip>:5432`.

---

## HTTPS (optional)

1. Install **Nginx Proxy Manager** from the CasaOS app store.
2. Add proxy host: `subash.com.bd` → `subash_web:3000`.
3. Request a Let's Encrypt cert.
4. Update `.env`: `AUTH_URL=https://subash.com.bd` and `NEXT_PUBLIC_SITE_URL=https://subash.com.bd`.
5. `docker compose up -d` — no rebuild.

---

## Useful commands

```bash
docker compose logs -f web            # live app logs
docker compose up -d                  # restart (env change only)
docker compose up -d --build          # rebuild after code change
docker compose down                   # stop (keeps DB)
docker compose down -v                # stop + wipe DB

# Auto-update (pull + rebuild + health check)
bash /DATA/AppData/subash/scripts/update.sh

# Re-run seed manually (e.g. after wiping DB)
docker exec -it subash_web node /app/scripts/seed.js

# Backup DB
docker exec subash_db pg_dump -U subash_user subash_db > backup.sql

# Restore DB
cat backup.sql | docker exec -i subash_db psql -U subash_user -d subash_db
```

---

## Architecture

```
Dev machine (Windows)
  └── git push → GitHub (Redwan002117/Subash)
                        │
                   git pull (SSH)
                        ↓
CasaOS machine
  ├── subash_db   postgres:16-alpine  :5432 (LAN only)
  └── subash_web  Next.js 15          :3000
        │  scripts/entrypoint.sh
        │    ├─ prisma db push  (schema sync, every start)
        │    ├─ seed.js         (first boot only: 70k perfumes)
        │    └─ node server.js
        │
  Nginx Proxy Manager (optional)
        │
   subash.com.bd (HTTPS)
```

