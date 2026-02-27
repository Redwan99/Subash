# Subash — CasaOS Home Server Deployment Guide

This document explains how to deploy the complete Subash stack (Next.js + PostgreSQL)
on a CasaOS home server using the `docker-compose.yml` at the project root.

---

## Architecture Overview

```
Your Home Network
└── CasaOS Machine
    ├── subash_db   (postgres:16-alpine, volume: postgres_data)
    └── subash_web  (Next.js 15, port 3000)
```

Your router will point `subash.com.bd` → your home IP via DDNS, then the request
hits port 3000 on the CasaOS machine.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| CasaOS installed | Comes with Docker + Docker Compose pre-installed |
| Git installed | `sudo apt install git` on the CasaOS host |
| Domain (optional) | Point `subash.com.bd` → your home WAN IP. Use a DDNS service if IP is dynamic. |
| SSL (optional) | Run Nginx Proxy Manager as a CasaOS app for HTTPS termination |

---

## Step-by-Step Deployment

### 1 — SSH into your CasaOS machine

```bash
ssh casaos@<your-casaos-local-ip>
```

### 2 — Clone the repository

```bash
cd /DATA/AppData
git clone https://github.com/YOUR_ORG/subash.git
cd subash
```

### 3 — Create your `.env` file

CasaOS reads a `.env` file automatically when using `docker compose`.

```bash
cp .env.example .env
nano .env
```

Fill in every blank value. Key fields:

```dotenv
# DB credentials (must match between POSTGRES_* and DATABASE_URL)
POSTGRES_USER=subash_user
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=subash_db

# NOTE: In docker-compose the host is "db" not "localhost"
DATABASE_URL=postgresql://subash_user:<password>@db:5432/subash_db?schema=public

# Auth.js v5
AUTH_SECRET=<output of: npx auth secret>
AUTH_URL=https://subash.com.bd        # or http://<casaos-ip>:3000 if no domain yet

# OAuth (must match redirect URIs registered in Google/Facebook consoles)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

NEXT_PUBLIC_SITE_URL=https://subash.com.bd
```

### 4 — Push the database schema

Run the migration once before first launch. The `db` service must be running:

```bash
# Start only the database first
docker compose up db -d

# Wait ~5 seconds, then push the schema
docker compose run --rm web npx prisma db push
```

### 5 — Build and launch everything

```bash
docker compose up -d --build
```

The build will take 2–4 minutes on first run (installs npm deps, compiles Next.js).

### 6 — Verify it's running

```bash
# Check container status
docker compose ps

# Follow live logs
docker compose logs -f web

# Check DB is healthy
docker compose exec db pg_isready -U subash_user
```

Open `http://<casaos-ip>:3000` in a browser. You should see the Subash landing page.

---

## Switching Between Local Dev & Docker

| Context | DATABASE_URL host | AUTH_URL |
|---|---|---|
| `npm run dev` (local) | `localhost:5432` | `http://localhost:3000` |
| `docker compose up` (CasaOS) | `db:5432` | `http://<casaos-ip>:3000` |
| Production domain | `db:5432` (internal) | `https://subash.com.bd` |

Keep two files locally:
- `.env.local` — for `npm run dev` (points to `localhost:5432`)
- `.env` — for Docker Compose (points to `db:5432`, **only on the server**)

---

## Updating the App (Re-deploy)

```bash
cd /DATA/AppData/subash
git pull origin main

# Rebuild & restart only the web container (DB keeps running)
docker compose up -d --build web

# If schema changed:
docker compose run --rm web npx prisma db push
```

---

## HTTPS with Nginx Proxy Manager (Recommended)

1. Install **Nginx Proxy Manager** from the CasaOS app store.
2. Add a Proxy Host: `subash.com.bd` → `subash_web:3000`
3. Request a free Let's Encrypt certificate in the SSL tab.
4. Update `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://subash.com.bd` in your `.env` and rebuild.

---

## Backup & Restore

```bash
# Backup the Postgres volume
docker exec subash_db pg_dump -U subash_user subash_db > subash_backup_$(date +%Y%m%d).sql

# Restore
cat subash_backup_YYYYMMDD.sql | docker exec -i subash_db psql -U subash_user -d subash_db
```

---

## Switching to Managed Hosting Later

When you're ready to move off the home server:

1. Provision a managed Postgres (Neon.tech, Supabase, AWS RDS).
2. Dump the DB (`pg_dump`), restore to new host.
3. Update `DATABASE_URL` to the new host's connection string.
4. For the Next.js app: deploy to Vercel (`vercel deploy`) or any Docker host.
5. Update `AUTH_URL` and OAuth redirect URIs to the production domain.

Everything else (schema, code, env vars) stays exactly the same.
