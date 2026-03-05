# Subash

A modern fragrance discovery and community platform built with Next.js. Browse 70,000+ perfumes, write reviews, build your wardrobe, and explore scent profiles — all in a responsive, glass-themed UI.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)

---

## Features

- **Discovery Matrix** — Filter perfumes by accords, gender, mood, weather, time, and notes with infinite scroll and alphabetical organization
- **Scent Engine** — Interactive scent pyramid with longevity, sillage, projection, and intensity metrics
- **Community Reviews** — Star ratings, performance sliders, weather/time tags, and community consensus panels
- **Wardrobe** — Organize fragrances into shelves (Own, Wishlist, Tried, Sold)
- **Leaderboards** — Weekly and all-time top reviewers
- **Verified Retailers & Decants** — Marketplace with verified shop listings and decant sales
- **Dupe Engine** — Community-voted fragrance clones and alternatives
- **Encyclopedia** — 70,000+ perfumes with detailed notes, accords, and perfumer data
- **Creator Profiles** — Browse perfumers and their portfolios
- **Dark/Light Mode** — Full theme support with glass-morphism design system
- **Admin Dashboard** — God Mode toggles, user management, bulk CSV import, POTD

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC, ISR) |
| Language | TypeScript 5 |
| Database | SQLite via Prisma 6 |
| Auth | Auth.js v5 (Google, Facebook, Credentials, Firebase Phone OTP) |
| Styling | Tailwind CSS + CSS custom properties |
| Animations | Framer Motion |
| Icons | Lucide React |
| UI Primitives | Radix UI |
| Bot Protection | Cloudflare Turnstile |
| Email | Resend |
| Deployment | Docker / CasaOS / Standalone Node |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
git clone https://github.com/Redwan99/Subash.git
cd Subash
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`. See [.env.example](.env.example) for all available variables.

At minimum you need:
- `DATABASE_URL` — SQLite path (default: `file:./subash.db`)
- `AUTH_SECRET` — Generate with `npx auth secret`

### Database Setup

```bash
npx prisma db push
npx prisma generate
```

To seed with the bundled 70k perfume dataset:

```bash
npm run import-csv
```

### Development

```bash
npm run dev
```

The app runs on [http://localhost:9864](http://localhost:9864) by default.

### Production Build

```bash
npm run build
npm start
```

## Docker

```bash
docker compose up -d
```

Set `SEED_DB=true` on first boot to import the perfume dataset. See [CASAOS_DEPLOYMENT.md](CASAOS_DEPLOYMENT.md) for CasaOS/ZimaBoard setup.

## Project Structure

```
app/              → Next.js App Router pages and API routes
components/       → React components (layout, perfume, reviews, admin, etc.)
lib/              → Utilities, Prisma client, server actions, constants
prisma/           → Schema, seed scripts, CSV data
scripts/          → Admin utilities and deployment scripts
types/            → TypeScript type declarations
public/           → Static assets
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 9864 |
| `npm run build` | Prisma push + generate + Next.js build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run import-csv` | Import perfumes from bundled CSV |
| `npm run db:studio` | Open Prisma Studio |

## License

Proprietary — see [LICENSE](LICENSE) for details.

Copyright (c) 2026 Subash. All rights reserved.
