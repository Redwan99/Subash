# Subash — CasaOS Deployment Guide

Run Subash (Next.js + SQLite + 70k perfumes) on your CasaOS / ZimaBoard home
server. The Docker image is self-contained — it holds the app, the CSV data,
and the seed logic. No extra steps needed between clone and run.

---

## What runs automatically on every start

| Stage | What happens |
|---|---|
| Always | Creates SQLite file if missing → runs `prisma db push` (schema sync, safe to repeat) |
| First boot (`SEED_DB=true`) | Imports all ~70,103 perfumes from the bundled CSV (~3–5 min) |
| Every subsequent boot | DB already has data — skips seed, starts in seconds |

---

## Step 1 — SSH into CasaOS and clone

```bash
ssh casaos@<your-casaos-ip>
cd /DATA/AppData
git clone https://github.com/Redwan99/Subash.git subash
cd subash/Subash
```

---

## Step 2 — Create your `.env` file

```bash
cp .env.example .env
nano .env
```

Fill in these values:

```dotenv
# Database — SQLite file inside the persistent bind-mount volume
# (docker-compose.yml hardcodes this; you don't need to set it here unless
# you override the compose file)
DATABASE_URL="file:/app/data/subash.db"

# Auth  (generate: openssl rand -base64 32)
AUTH_SECRET=<generated-secret>
AUTH_URL=http://<casaos-ip>:9864

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
NEXT_PUBLIC_SITE_URL=http://<casaos-ip>:9864
```

---

## Step 3 — Pull and start

```bash
docker compose pull
docker compose up -d
```

The pre-built image is downloaded from `ghcr.io/redwan99/subash:latest`
(published automatically by GitHub Actions on every push to `main`).
No compilation happens on the CasaOS box — pull takes ~1 min on a fast connection.

Watch live:
```bash
docker compose logs -f web
```

Output during first boot:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Subash — starting up
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄  Creating SQLite database at /app/data/subash.db
🔄  Syncing database schema (prisma db push)...
✅  Schema up to date.
🌱  DB is empty — importing all perfumes from CSV...
    (This takes ~3-5 minutes for 70k perfumes. Logs below.)
  ...
✅  Seed complete.
🚀  Starting Subash on port 9864...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Open **`http://<casaos-ip>:9864`** — all 70k perfumes are live.

---

## Step 4 — Disable re-seeding after first boot

Edit your `.env` (or the CasaOS app env UI):
```bash
SEED_DB=false
```
Then restart:
```bash
docker compose up -d
```

Restarts now take **under 10 seconds**.

---

## Where the database lives

The SQLite file is stored on the host at:
```
/DATA/AppData/subash/data/subash.db
```
This path is bind-mounted into the container at `/app/data/subash.db`.
Container updates (`docker compose pull && docker compose up -d`) **never touch this file**.

---

## Updating while you develop

```bash
# On Windows dev machine:
git push
# GitHub Actions builds and publishes a new Docker image automatically.

# On CasaOS via SSH — pull the new image and restart:
bash /DATA/AppData/subash/Subash/scripts/update.sh
```

**Auto-update via cron (e.g. daily at 3 AM):**
```bash
crontab -e
# Add:
0 3 * * * /DATA/AppData/subash/Subash/scripts/update.sh >> /DATA/AppData/subash/logs/update.log 2>&1
```

---

## Inspect the database from Windows (Prisma Studio)

Install a local copy of the repo, then open a tunnel or just copy the file:

```bash
# Copy SQLite from CasaOS to local machine
scp casaos@<casaos-ip>:/DATA/AppData/subash/data/subash.db ./subash.db

# Point Studio at the local copy
DATABASE_URL="file:./subash.db" npx prisma studio
```

Or use any SQLite GUI (DB Browser for SQLite, TablePlus, DBeaver) and open the file directly via SCP/SFTP.

---

## HTTPS (optional)

1. Install **Nginx Proxy Manager** from the CasaOS app store.
2. Add proxy host: `subash.yourdomain.com` → `subash_web:9864`.
3. Request a Let's Encrypt cert.
4. Update `.env`: `AUTH_URL=https://subash.yourdomain.com` and `NEXT_PUBLIC_SITE_URL=https://subash.yourdomain.com`.
5. `docker compose up -d` — no rebuild needed.

---

## Useful commands

```bash
docker compose logs -f web                        # live app logs
docker compose pull && docker compose up -d       # pull latest image + restart
docker compose up -d                              # restart (no image pull)
docker compose down                               # stop (keeps DB — safe)
docker compose down -v                            # stop + wipe anonymous volumes

# Re-run seed manually (e.g. after moving to a fresh DB file)
docker exec -it subash_web node /app/scripts/seed.js

# Backup SQLite DB
cp /DATA/AppData/subash/data/subash.db /DATA/AppData/subash/data/subash.db.bak

# Or copy off the box:
scp casaos@<casaos-ip>:/DATA/AppData/subash/data/subash.db ./backup-$(date +%Y%m%d).db
```

---

## Architecture

```
Dev machine (Windows)
  └── git push → GitHub (Redwan99/Subash)
                        │
              GitHub Actions builds Docker image
              publishes → ghcr.io/redwan99/subash:latest
                        │
              scripts/update.sh  (cron or manual SSH)
              docker compose pull
                        ↓
CasaOS / ZimaBoard
  └── subash_web  ghcr.io/redwan99/subash:latest  :9864
        │  bind-mount: /DATA/AppData/subash/data → /app/data
        │  scripts/entrypoint.sh
        │    ├─ prisma db push  (schema sync, every start)
        │    ├─ seed.js         (first boot only: 70k perfumes)
        │    └─ node server.js
        │
  Nginx Proxy Manager (optional HTTPS)
        │
   subash.yourdomain.com (HTTPS)
```
