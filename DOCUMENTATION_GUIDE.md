# Subash — Documentation Guide

> **Version**: 0.5.0 (Phase 5 Complete)  
> **Last Updated**: 2026-02-27  
> **Stack**: Next.js 15 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Auth.js v5 · Firebase · Framer Motion · next-themes · Docker · react-hook-form · zod

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Installation & First Run](#2-installation--first-run)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Phase 1 — Project Init & Database Schema](#4-phase-1--project-init--database-schema)
5. [Phase 2 — Authentication & RBAC](#5-phase-2--authentication--rbac)
   - 5.1 [Social OAuth (Google + Facebook)](#51-social-oauth-google--facebook)
   - 5.2 [Manual Auth (Email + Password)](#52-manual-auth-email--password)
   - 5.3 [Firebase Phone OTP](#53-firebase-phone-otp)
   - 5.4 [RBAC Middleware](#54-rbac-middleware)
6. [Phase 3 — Pro Max Layout & Navigation UI](#6-phase-3--pro-max-layout--navigation-ui)
   - 6.1 [Design System Principles](#61-design-system-principles)
   - 6.2 [ThemeProvider & Dark/Light Mode](#62-themeprovider--darklight-mode)
   - 6.3 [LayoutShell — Master Wrapper](#63-layoutshell--master-wrapper)
   - 6.4 [Left Sidebar (Desktop)](#64-left-sidebar-desktop)
   - 6.5 [Right Sidebar (Desktop)](#65-right-sidebar-desktop)
   - 6.6 [Bottom Navigation (Mobile)](#66-bottom-navigation-mobile)
   - 6.7 [Adding Nav Items](#67-adding-nav-items)
7. [Phase 4 — Scent Engine](#7-phase-4--scent-engine)
8. [Phase 5 — Marketplace & Commerce](#8-phase-5--marketplace--commerce)
   - 8.1 [Global Color Theme Overhaul](#81-global-color-theme-overhaul)
   - 8.2 [Decant Exchange Marketplace](#82-decant-exchange-marketplace)
   - 8.3 [Leaderboards](#83-leaderboards)
   - 8.4 [User Profiles & Wardrobe](#84-user-profiles--wardrobe)
9. [Docker & CasaOS Deployment](#9-docker--casaos-deployment)
10. [Database — Prisma Workflow](#10-database--prisma-workflow)
11. [Testing Guide](#11-testing-guide)
12. [File Structure Reference](#12-file-structure-reference)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Project Overview

**Subash (সুবাশ)** is Bangladesh's first community-driven fragrance encyclopedia, review platform, and marketplace. The project is structured as a 7-phase build:

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project Init, Styling System, DB Schema, Scraper | ✅ Complete |
| 2 | Authentication (Social + Manual + OTP) + RBAC | ✅ Complete |
| 3 | Pro Max Layout & Navigation UI | ✅ Complete |
| 4 | Scent Engine (Search, Reviews, Dupe Finder) | ✅ Complete |
| 5 | BD Marketplace & Commerce | ✅ Complete (DB push pending) |
| 6 | Gamification, Social, Dynamic Content | 🔜 |
| 7 | Live Support & Polish | 🔜 |

**Domain**: subash.com.bd  
**Local dev URL**: http://localhost:3000  
**Project root**: `i:\Subash\Subash\`

---

## 2. Installation & First Run

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20.x | [nodejs.org](https://nodejs.org) |
| npm | ≥ 10.x | Bundled with Node |
| PostgreSQL | ≥ 15 | Or use Docker Compose (recommended) |
| Python | ≥ 3.10 | For the scraper only |
| Docker | latest | Optional — for containerised DB + app |

---

### Step-by-step: Local Development

#### 1. Clone / open the project

```bash
# The project lives at i:\Subash\Subash (already scaffolded)
cd "i:\Subash\Subash"
```

#### 2. Install Node dependencies

```bash
npm install
```

> **Installed packages include**: next, react, tailwindcss, prisma, @auth/prisma-adapter, next-auth@5.0.0-beta.25, bcryptjs, firebase, framer-motion, zod, lucide-react, and more.

#### 3. Set up environment variables

```bash
# Copy the template
copy .env.example .env.local
```

Then open `.env.local` and fill in every value. See [Section 3](#3-environment-variables-reference) for the full reference.

#### 4. Start PostgreSQL

**Option A — Docker (recommended)**
```bash
# Starts postgres:16-alpine container on localhost:5432
docker compose up db -d
```

**Option B — Local Postgres**
```sql
CREATE DATABASE subash_db;
CREATE USER subash_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE subash_db TO subash_user;
```

#### 5. Push the database schema

```bash
# Sync Prisma schema → Postgres (creates all tables)
npx prisma db push

# Optional: open Prisma Studio to inspect data
npx prisma studio
```

#### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

### Step-by-Step: Docker (Full Stack)

```bash
# Build and start both db + web containers
docker compose up --build

# On first boot only — push schema to the containerised database
docker compose exec web npx prisma db push
```

> The web service waits for the `db` healthcheck to pass before starting.

---

## 3. Environment Variables Reference

All variables live in `.env.local` (never committed to git). See `.env.example` for the template.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `POSTGRES_USER` | Docker only | DB username for docker-compose init |
| `POSTGRES_PASSWORD` | Docker only | DB password for docker-compose init |
| `POSTGRES_DB` | Docker only | DB name for docker-compose init |
| `AUTH_SECRET` | ✅ | Random 32-byte secret for Auth.js JWT signing. Generate: `npx auth secret` |
| `AUTH_URL` | ✅ | Full base URL: `http://localhost:3000` (dev) or `https://subash.com.bd` (prod) |
| `GOOGLE_CLIENT_ID` | OAuth | From [Google Cloud Console](https://console.developers.google.com) |
| `GOOGLE_CLIENT_SECRET` | OAuth | From Google Cloud Console |
| `FACEBOOK_CLIENT_ID` | OAuth | From [Facebook Developers](https://developers.facebook.com/apps) |
| `FACEBOOK_CLIENT_SECRET` | OAuth | From Facebook Developers |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Phone OTP | From Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Phone OTP | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Phone OTP | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Phone OTP | Firebase App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional | Firebase Analytics |
| `OPENWEATHERMAP_API_KEY` | Phase 6 | From [openweathermap.org/api](https://openweathermap.org/api) |
| `NEXT_PUBLIC_DEFAULT_CITY` | Phase 6 | Default city for weather widget (e.g. `Dhaka`) |

**Important distinction — `DATABASE_URL` host:**
- **Local dev**: `postgresql://user:pass@localhost:5432/subash_db?schema=public`
- **Docker Compose** (web container talking to db container): `postgresql://user:pass@db:5432/subash_db?schema=public`

---

## 4. Phase 1 — Project Init & Database Schema

### 4.1 Design System (`app/globals.css`)

The entire visual language is defined as **CSS custom properties** on `:root` and `[data-theme="light"]`. Key variables:

| Variable | Purpose |
|----------|---------|
| `--bg-primary` | Main page background (dark: `#0D0D0D`) |
| `--bg-surface` | Card and panel backgrounds |
| `--bg-glass` | Glassmorphism panel (semi-transparent) |
| `--bg-glass-border` | Border on glass panels |
| `--blur-glass` | Backdrop blur value (`16px`) |
| `--accent-gold` | Brand gold: `#C9A84C` |
| `--accent-gold-light` | Light gold: `#E8C97A` |
| `--text-primary` / `--text-secondary` / `--text-muted` | Text hierarchy |
| `--shadow-glass` | Drop shadow for glass panels |

**How to use**: Apply inline `style={{ color: "var(--text-primary)" }}` or reference from Tailwind config via `tailwind.config.ts`.

**Dark/Light toggle**: Toggle `data-theme="light"` on the `<html>` element. Will be wired to the UI in Phase 3.

---

### 4.2 Database Schema (`prisma/schema.prisma`)

**12 models, 6 enums:**

#### Enums

| Enum | Values |
|------|--------|
| `Role` | `SUPER_ADMIN`, `MODERATOR`, `SELLER`, `DECANTER`, `STANDARD` |
| `AuthProvider` | `GOOGLE`, `FACEBOOK`, `CREDENTIALS` |
| `Season` | `SPRING`, `SUMMER`, `AUTUMN`, `WINTER`, `ALL_SEASON` |
| `TimeOfDay` | `DAY`, `NIGHT`, `BOTH` |

> **Note**: `WardrobeShelf` was converted from a Prisma enum to a plain `String` field in Phase 5. Valid values are: `HAVE`, `HAD`, `WANT`, `SIGNATURE`.

#### Key Models

**`User`** — All platform users  
Key fields: `id`, `name`, `email`, `phone`, `phoneVerified`, `image`, `password` (nullable, bcrypt hash), `role`, `review_count`, `authProvider`

**`Perfume`** — The core encyclopedia  
Key fields: `name`, `brand`, `slug` (unique URL key), `top_notes[]`, `heart_notes[]`, `base_notes[]`, `image_url`, `release_year`

**`Review`** — User reviews with scoring  
Key fields: `overall_rating` (1–5 float), `longevity_score` (1–5), `sillage_score` (1–5), `time_tags[]`, `season_tags[]`

**`Deal`** — Live price tracker entries  
Links a seller (`User`) to a `Perfume` with a BDT price

**`DupeVote`** — Community clone/dupe matching  
Links `originalPerfumeId` → `clonePerfumeId` with upvotes/downvotes. Match score = `upvotes / (upvotes + downvotes) * 100`

**`WardrobeItem`** — Personal virtual shelves  
Shelf field: `String` — valid values `HAVE`, `HAD`, `WANT`, `SIGNATURE`. Compound unique index `@@unique([userId, perfumeId])` prevents duplicate entries per user.

**`DecantListing`** — Marketplace listing for decanted perfume samples  
Key fields: `price_5ml?`, `price_10ml?`, `batch_code`, `proof_image_url`, `status` (default `AVAILABLE`). Links seller (`User`) to a `Perfume`.

**`FragramPost`** — Scent of the Day (Instagram-style) feed

**`PerfumeOfTheDay`** — Daily admin-curated highlight  
Unique constraint on `date` ensures one POTD per day

**NextAuth required tables**: `Account`, `Session`, `VerificationToken`

#### Common Prisma Commands

```bash
# After changing schema.prisma:
npx prisma generate        # Regenerate the TypeScript client
npx prisma db push         # Push schema to DB (no migration file — good for dev)
npx prisma migrate dev     # Create a migration file (use for production)
npx prisma studio          # Open GUI to browse/edit DB data at localhost:5555
npx prisma db seed         # Run seed file (create seed.ts if needed)
```

---

### 4.3 Python Scraper (`scraper/scraper.py`)

**Purpose**: Populate the initial `Perfume` table with data from Fragrantica before users arrive.

**Setup**:
```bash
cd "i:\Subash\Subash\scraper"
pip install -r requirements.txt
```

**Usage**:
```bash
# Run the scraper — outputs CSV or writes to Postgres
python scraper.py

# Configuration is at the top of scraper.py:
# TARGET_URL = "https://www.fragrantica.com/..."
# OUTPUT_MODE = "csv" | "database"
# DATABASE_URL = "..." (from environment or hardcoded for local use)
```

**Output**: A `scraper_output.csv` or direct `INSERT` into the `perfumes` table.

---

## 5. Phase 2 — Authentication & RBAC

The auth layer uses **Auth.js v5** (`next-auth@5.0.0-beta.25`) with a **JWT session strategy**.

> **Why JWT and not database sessions?**  
> The `CredentialsProvider` (email/password) is **incompatible** with `strategy: "database"` in Auth.js v5. Switching to JWT lets both OAuth providers and credentials coexist. The `PrismaAdapter` still persists OAuth users and accounts to the DB; only sessions travel as encrypted cookies.

---

### 5.1 Social OAuth (Google + Facebook)

**Files:**
- `auth.ts` — Provider configuration + `SubashPrismaAdapter`
- `app/api/auth/[...nextauth]/route.ts` — Auth.js v5 route handler
- `app/providers.tsx` — Client-side `SessionProvider` wrapper
- `app/auth/signin/page.tsx` — Sign-in UI with Google + Facebook buttons
- `app/auth/error/page.tsx` — Auth error display

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create a project → **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://subash.com.bd/api/auth/callback/google`
5. Copy **Client ID** and **Client Secret** → paste into `.env.local`

#### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create App → **Consumer** type → Add **Facebook Login** product
3. In Facebook Login → Settings, add Valid OAuth Redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/facebook`
   - Production: `https://subash.com.bd/api/auth/callback/facebook`
4. Under **Settings → Basic**, copy the **App ID** and **App Secret** → paste into `.env.local`
5. For production: switch App from "Development" to "Live" mode

#### How `SubashPrismaAdapter` works

Located in `auth.ts`. It wraps the standard `PrismaAdapter` and overrides `createUser` to automatically seed Subash-specific fields whenever a new OAuth user registers:

```
role: "STANDARD"
review_count: 0
phoneVerified: false
authProvider: "GOOGLE" | "FACEBOOK"
```

This means you never need to manually set these fields for OAuth users — it's automatic on first login.

#### Testing OAuth

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/auth/signin`
3. Click **Continue with Google** or **Continue with Facebook**
4. Complete the OAuth flow
5. You should be redirected to `/` with session active
6. User row appears in the `users` table in Postgres

---

### 5.2 Manual Auth (Email + Password)

**Files:**
- `lib/actions/auth.ts` — Server Actions: `registerUser`, `loginWithCredentials`
- `app/auth/register/page.tsx` — Registration page (Server Component)
- `app/auth/register/RegisterForm.tsx` — Registration form (Client Component)
- `app/auth/signin/CredentialsForm.tsx` — Sign-in form (Client Component)

#### Registration Flow

```
User fills form → RegisterForm.tsx (client)
  → calls registerUser Server Action
    → Zod validation (name ≥ 2 chars, valid email, password ≥ 8 chars, passwords match)
    → check for duplicate email in DB
    → bcrypt.hash(password, 12) — 12 salt rounds
    → prisma.user.create(...)
    → returns { success: true }
  → useEffect detects success → router.push("/auth/signin?registered=1")
Sign-in page shows green "Account created!" banner
```

#### Sign-in Flow (Credentials)

```
User fills form → CredentialsForm.tsx (client)
  → calls signIn("credentials", { email, password, redirect: false }) from next-auth/react
    → Auth.js routes to Credentials authorize()
      → prisma.user.findUnique by email
      → checks user.password exists (OAuth users have null)
      → bcrypt.compare(inputPassword, hashedPassword)
      → returns user object or null
    → On success: session JWT created with id/role/review_count/phoneVerified
    → On failure: AuthError type "CredentialsSignin"
  → Client checks result → shows error or redirects
```

#### Password Security

- Bcrypt with **12 salt rounds** — computationally expensive to brute-force
- Passwords are **never stored in plain text**
- OAuth users have `password: null` — they cannot use the credentials form
- The `authorize()` function explicitly checks `if (!user.password) return null` to prevent OAuth users from being attacked via the credentials endpoint

#### Testing Manual Auth

```bash
# 1. Navigate to registration
http://localhost:3000/auth/register

# 2. Fill form:
#   Name: Test User
#   Email: test@example.com
#   Password: mypassword123
#   Confirm: mypassword123

# 3. On success → redirected to /auth/signin?registered=1
# 4. Sign in with the same email/password
# 5. Verify user appears in Prisma Studio with hashed password
npx prisma studio
# → users table → find test@example.com → password column shows "$2b$12$..."
```

**Error cases to test:**
- Duplicate email → "An account with this email already exists"
- Passwords don't match → field-level error on confirmPassword
- Password < 8 chars → field-level error on password
- Wrong password at sign-in → "Invalid email or password"

---

### 5.3 Firebase Phone OTP

**Files:**
- `lib/firebase.ts` — Firebase client initialisation (singleton with hot-reload guard)
- `lib/actions/phone.ts` — Server Action: `saveVerifiedPhone`
- `app/auth/verify-phone/page.tsx` — Full OTP verification UI (Client Component)

#### Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g. `subash-bd`)
3. **Authentication** → **Sign-in method** → Enable **Phone**
4. **Project Settings** → **Your apps** → Add a **Web app**
5. Copy the config object values into `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="subash-bd.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="subash-bd"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:xxx:web:yyy"
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXX"  # optional
   ```
6. **Authentication** → **Settings** → **Authorized domains** → Add:
   - `localhost`
   - `subash.com.bd` (for production)

#### Phone Verification Flow

```
User navigates to /auth/verify-phone
  (middleware redirects here if phoneVerified=false and they try /decant-market/create)

Step 1 — Phone Input:
  User enters BD number (+8801XXXXXXXXX)
  → invisible RecaptchaVerifier initialised in useEffect
  → signInWithPhoneNumber(firebaseAuth, phone, recaptchaVerifierRef.current)
  → Firebase sends SMS OTP
  → UI advances to Step 2

Step 2 — OTP Input:
  User enters 6-digit code
  → confirmation.confirm(otp) verifies with Firebase
  → on success: saveVerifiedPhone(phone) Server Action called
    → auth() checks session (must be signed in to Subash)
    → Zod validates BD number format: /^\+8801[3-9]\d{8}$/
    → checks for phone number conflicts across accounts
    → prisma.user.update({ phone, phoneVerified: true })
  → update() called (next-auth/react) to force JWT token refresh
    (phoneVerified=true is now embedded in the JWT)
  → UI advances to Step 3

Step 3 — Success:
  Green tick animation
  "Continue to Home" link → /
```

#### Testing Phone OTP

> Firebase Phone Auth in development supports **test phone numbers** — no real SMS needed.

1. In Firebase Console → **Authentication** → **Phone** → **Phone numbers for testing**
2. Add: `+8801700000000` with OTP code `123456`
3. In the app, enter `+8801700000000` → enter `123456` → verification completes without sending an SMS

**Validating the DB update:**
```bash
npx prisma studio
# → users table → find your user → phone and phoneVerified columns updated
```

---

### 5.4 RBAC Middleware

**File:** `middleware.ts`

The middleware runs on every request (except static assets and `/api/auth/*`) and enforces role-based access.

#### Route Guards

| Route | Requirement | Redirect if denied |
|-------|-------------|-------------------|
| `/admin/*` | `role === "SUPER_ADMIN"` | `/` (if signed in) or `/auth/signin?callbackUrl=...` |
| `/dashboard/deals/*` | `role === "SELLER"` or `"SUPER_ADMIN"` | `/auth/signin?callbackUrl=...` |
| `/decant-market/create` | Signed in + `phoneVerified=true` + `review_count ≥ 50` (SUPER_ADMIN bypasses count) | `/auth/verify-phone` if not phone verified, or `/` if reviews insufficient |
| `/wardrobe/*` | Any authenticated user | `/auth/signin?callbackUrl=...` |
| `/profile/edit/*` | Any authenticated user | `/auth/signin?callbackUrl=...` |
| `/fragram/new` | Any authenticated user | `/auth/signin?callbackUrl=...` |

#### How it reads user data

The middleware uses `req.auth` — the Auth.js session object enriched at the edge. The JWT callback in `auth.ts` embeds `role`, `review_count`, and `phoneVerified` into the token, so the middleware reads them without any DB query.

#### Adding new protected routes

In `middleware.ts`, extend the relevant section:

```typescript
// Add a new single-route guard:
const authRequired = ["/wardrobe", "/profile/edit", "/fragram/new", "/your-new-route"];
```

Or add a new role check:
```typescript
if (pathname.startsWith("/your-new-route")) {
  if (!isSignedIn) return toSignIn();
  if (role !== "MODERATOR" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
```

#### JWT Refresh After Role Change

Because sessions are JWTs (not DB-backed), changing a user's role in the database does **not** immediately update their session. To force a refresh:

- **Client**: call `update()` from `useSession()` → triggers the `jwt` callback which re-reads DB
- **Admin tools** (Phase 3+): user must sign out and back in for role changes to take effect immediately

---

## 6. Phase 3 — Pro Max Layout & Navigation UI

> **Design reference**: `github.com/nextlevelbuilder/ui-ux-pro-max-skill`  
> **New packages**: `next-themes`  
> **Components created**: `components/layout/` (5 files)

---

### 6.1 Design System Principles

All Phase 3 UI follows the "Pro Max" design language:

| Principle | Implementation |
|-----------|----------------|
| Glassmorphism | `backdrop-blur-[20px]` + `bg-white/80` (light) / `bg-black/40` (dark) |
| Animation timing | 150–300ms for micro-interactions, 200ms for page transitions |
| Spring physics | `stiffness: 400, damping: 28` for nav links; `stiffness: 600, damping: 20` for haptic |
| Reduced motion | All animations guarded by `useReducedMotion()` from Framer Motion |
| Icon system | `LucideIcon` type only — no inline SVGs, no `React.FC<{...}>` narrow types |
| Touch targets | Minimum 44×44px for all interactive elements |
| Contrast | Minimum 4.5:1 (WCAG AA) for all text |
| Active accent | CSS variable `--accent` (`#8B5CF6` violet) for active/accent states |

---

### 6.2 ThemeProvider & Dark/Light Mode

**Package**: `next-themes`  
**Files**: `app/providers.tsx`, `components/layout/ThemeToggle.tsx`, `tailwind.config.ts`

#### Setup

```tsx
// app/providers.tsx
<ThemeProvider
  attribute="class"        // adds/removes .dark class on <html>
  defaultTheme="dark"      // defaults to dark mode
  enableSystem={false}     // ignores OS preference
  disableTransitionOnChange={false}  // enables smooth theme transition
>
  <SessionProvider session={session}>
    {children}
  </SessionProvider>
</ThemeProvider>
```

`tailwind.config.ts` must have `darkMode: "class"` to match.

#### ThemeToggle Component

```tsx
import { ThemeToggle } from "@/components/layout/ThemeToggle";

// Default (full pill with label)
<ThemeToggle />

// Compact (icon only, for tight spaces)
<ThemeToggle compact />
```

- Uses a `mounted` guard to prevent hydration mismatch
- Animated knob slides with `animate={{ x: isDark ? 28 : 0 }}`
- Spring: `type: "spring", stiffness: 500, damping: 30`

---

### 6.3 LayoutShell — Master Wrapper

**File**: `components/layout/LayoutShell.tsx`

The `LayoutShell` is a client component that composes the full page chrome and wraps `{children}` with `AnimatePresence` for page transitions.

```tsx
// app/layout.tsx
import { LayoutShell } from "@/components/layout/LayoutShell";

<Providers session={session}>
  <LayoutShell>
    {children}
  </LayoutShell>
</Providers>
```

#### Auth Route Exclusion

Sidebars and BottomNav are automatically hidden on auth routes:

```typescript
const AUTH_ROUTES = [
  "/auth/signin",
  "/auth/register",
  "/auth/verify-phone",
  "/auth/error",
];
// Checked with: AUTH_ROUTES.some(r => pathname.startsWith(r))
```

#### Page Transition Config

```typescript
const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  duration: 0.2,
};
```

Layout: CSS custom properties drive the column widths:
```css
--sidebar-width: 260px;          /* Left sidebar */
--sidebar-right-width: 300px;    /* Right sidebar */
--bottom-nav-height: 64px;       /* Mobile bottom nav */
```

Main content offset classes:
```
md:ml-[var(--sidebar-width)] lg:mr-[var(--sidebar-right-width)] pb-16 md:pb-0
```

---

### 6.4 Left Sidebar (Desktop)

**File**: `components/layout/LeftSidebar.tsx`  
**Visibility**: hidden on mobile (`<md`), fixed on `md+`

#### Current Nav Items

| Label | href | Icon |
|-------|------|------|
| Home | `/` | `Home` |
| Discover | `/search` | `Search` |
| Scent of the Day | `/potd` | `Sparkles` |
| Leaderboards | `/leaderboards` | `Trophy` |
| Decant Market | `/decants` | `ShoppingBag` |
| My Wardrobe | `/wardrobe` | `Star` |

#### Adding a Nav Item

In `LeftSidebar.tsx`, add to the `NAV_ITEMS` array:

```typescript
const NAV_ITEMS = [
  // ...existing items...
  { href: "/your-route", icon: YourIcon, label: "Your Label" },
];
```

Then import the icon at the top:
```typescript
import { Home, Search, /* ..., */ YourIcon } from "lucide-react";
```

#### Animation Details

- **Entrance**: `staggerChildren: 0.05`, each item slides in with `y: 10 → 0`, `opacity: 0 → 1`
- **Hover**: `whileHover: { x: 4 }` — nudge right 4px
- **Tap**: `whileTap: { scale: 0.97 }` — slight press
- **Active bar**: `layoutId="active-bar"` — spring-animated violet bar slides between active items

---

### 6.5 Right Sidebar (Desktop)

**File**: `components/layout/RightSidebar.tsx`  
**Visibility**: hidden below `lg`, fixed on `lg+`

- Displays live community activity cards (Phase 4 replaced dummy data with real activity feed)
- Each card has `whileHover: { y: -2 }` lift effect
- Pulsing live dot: `animate={{ opacity: [1, 0.3, 1] }}` with `repeat: Infinity, duration: 2`
- Trending section at bottom with top 3 items

---

### 6.6 Bottom Navigation (Mobile)

**File**: `components/layout/BottomNav.tsx`  
**Visibility**: fixed bottom, visible only below `md`

#### Current Nav Items

| Label | href | Icon | Notes |
|-------|------|------|-------|
| Home | `/` | `Home` | |
| Search | `/search` | `Search` | |
| Add Review | `/review/new` | `Plus` | Violet accent, 48×48px |
| Wardrobe | `/wardrobe` | `Briefcase` | |
| Profile | `/profile` | `User` | |

#### Haptic-Pop Animation

```typescript
whileTap: { scale: 0.82, y: -2 }
transition: { type: "spring", stiffness: 600, damping: 20 }
```

#### Active Indicator

`layoutId="bottom-active-dot"` — a violet dot slides between active tab positions using Framer Motion shared layout.

---

### 6.7 Adding Nav Items

Quick reference for adding items to both sidebars at once:

1. Import the icon from `lucide-react` in both `LeftSidebar.tsx` and `BottomNav.tsx`
2. Add to the respective `NAV_ITEMS` / `BOTTOM_ITEMS` arrays
3. Create the route page under `app/your-route/page.tsx`
4. Run `npx tsc --noEmit` to validate no type errors

---

## 9. Docker & CasaOS Deployment

> Full step-by-step is in `CASAOS_DEPLOYMENT.md`. This section is a summary.

### Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: `deps` → `builder` → `runner` (node:20-alpine) |
| `docker-compose.yml` | Two services: `db` (postgres:16-alpine) + `web` (Next.js) |
| `.dockerignore` | Excludes `node_modules`, `.next`, `.env*`, scraper cache |

### Deployment Commands

```bash
# First time — build and start everything
docker compose up --build -d

# Push schema to containerised DB (first boot only)
docker compose exec web npx prisma db push

# View logs
docker compose logs -f web
docker compose logs -f db

# Restart just the web container after code changes
docker compose up --build web -d

# Stop everything
docker compose down

# Stop and delete DB data (nuclear option)
docker compose down -v
```

### Port Mapping

| Service | Internal Port | External Port |
|---------|--------------|---------------|
| Next.js web | 3000 | 3000 |
| Postgres db | 5432 | 5432 |

### Database Backup & Restore

```bash
# Backup
docker compose exec db pg_dump -U subash_user subash_db > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db psql -U subash_user subash_db < backup_YYYYMMDD.sql
```

---

## 10. Database — Prisma Workflow

### Daily Development Workflow

```bash
# 1. Make changes to prisma/schema.prisma
# 2. Regenerate the client (TypeScript types update)
npx prisma generate

# 3. Push changes to the dev database
npx prisma db push

# 4. (Optional) Inspect data
npx prisma studio
```

### Production Migrations

For a production database, use migrations instead of `db push`:

```bash
# Create a migration file (tracks schema history)
npx prisma migrate dev --name add_new_field

# Apply pending migrations in production
npx prisma migrate deploy
```

### Seeding Data

Create `prisma/seed.ts` and add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Then run:
```bash
npx prisma db seed
```

### Useful Prisma Studio Queries

Open Prisma Studio (`npx prisma studio`) to:
- Browse all tables at `localhost:5555`
- Manually set a user's `role` to `SUPER_ADMIN` for the first admin account
- Verify phone OTP updates (`phoneVerified: true`)
- Check review counts

**To make the first Super Admin:**
1. Run `npx prisma studio`
2. Click **Users** table
3. Find your account
4. Click the `role` field → change from `STANDARD` to `SUPER_ADMIN`
5. Click **Save 1 change**

---

## 11. Testing Guide

### 11.1 TypeScript Type Check

```bash
cd "i:\Subash\Subash"
npx tsc --noEmit
# Expected: 0 errors
```

Run this after every new file or significant edit.

### 11.2 Authentication Test Matrix

| Scenario | Steps | Expected Result |
|----------|-------|----------------|
| Google sign-in | `/auth/signin` → Google button | OAuth popup → redirect to `/` with session |
| Facebook sign-in | `/auth/signin` → Facebook button | OAuth popup → redirect to `/` with session |
| Register new user | `/auth/register` → submit form | Redirect to `/auth/signin?registered=1` |
| Sign in with credentials | `/auth/signin` → email form | Session established, redirect to `/` |
| Wrong password | `/auth/signin` → wrong pass | "Invalid email or password" error shown |
| Duplicate email | `/auth/register` same email | "An account with this email already exists" |
| Phone OTP (test) | `/auth/verify-phone` → test number | `phoneVerified: true` in DB |

### 11.3 RBAC Test Matrix

| Scenario | User State | Expected Result |
|----------|-----------|----------------|
| Visit `/admin` as unauthenticated | Not signed in | Redirect to `/auth/signin?callbackUrl=/admin` |
| Visit `/admin` as STANDARD user | Signed in, role=STANDARD | Redirect to `/` |
| Visit `/admin` as SUPER_ADMIN | Signed in, role=SUPER_ADMIN | Page loads ✓ |
| Visit `/decant-market/create` without phone verified | Signed in, phoneVerified=false | Redirect to `/auth/verify-phone` |
| Visit `/decant-market/create` with phone but < 50 reviews | phoneVerified=true, review_count=5 | Redirect to `/` |
| Visit `/wardrobe` unauthenticated | Not signed in | Redirect to `/auth/signin?callbackUrl=/wardrobe` |

**Setting up test roles via Prisma Studio:**
```bash
npx prisma studio
# Users table → change role field manually for testing
```

### 11.4 Build Check

```bash
npm run build
# Should complete with no errors
# Output: .next/ folder with standalone build
```

### 11.5 Linting

```bash
npm run lint
# Uses eslint.config.mjs
```

---

## 12. File Structure Reference

```
i:\Subash\Subash\
│
├── auth.ts                          # Auth.js v5 — all providers, adapter, JWT callbacks
├── middleware.ts                    # RBAC route guards (runs at Edge)
├── next.config.ts                   # Next.js config (standalone output, allowed origins)
├── tailwind.config.ts               # Tailwind + custom design tokens
├── tsconfig.json                    # TypeScript strict config
├── Dockerfile                       # Multi-stage Docker build
├── docker-compose.yml               # db + web services
├── .dockerignore
├── .env.example                     # Template — copy to .env.local
├── .gitignore
├── CASAOS_DEPLOYMENT.md             # CasaOS home server deployment guide
├── DOCUMENTATION_GUIDE.md          # ← This file
│
├── app/
│   ├── globals.css                  # CSS custom properties (design tokens, glassmorphism)
│   ├── layout.tsx                   # Root layout — fonts, metadata, <Providers> wrapper
│   ├── page.tsx                     # Homepage — session-aware UI
│   ├── providers.tsx                # Client-side SessionProvider
│   │
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts                 # Auth.js v5 route handler (GET + POST)
│   │
│   └── auth/
│       ├── signin/
│       │   ├── page.tsx             # Sign-in page (Google + Facebook + Credentials)
│       │   └── CredentialsForm.tsx  # Email/password form (Client Component)
│       ├── register/
│       │   ├── page.tsx             # Register page shell (Server Component)
│       │   └── RegisterForm.tsx     # Registration form (Client Component)
│       ├── verify-phone/
│       │   └── page.tsx             # Firebase OTP 3-step flow (Client Component)
│       └── error/
│           └── page.tsx             # Auth error display
│
├── lib/
│   ├── prisma.ts                    # PrismaClient singleton
│   ├── utils.ts                     # Shared helpers (cn, formatTaka, slugify, etc.)
│   ├── firebase.ts                  # Firebase Auth client (with hot-reload guard)
│   └── actions/
│       ├── auth.ts                  # registerUser + loginWithCredentials Server Actions
│       └── phone.ts                 # saveVerifiedPhone Server Action
│
├── prisma/
│   └── schema.prisma                # Full DB schema (12 models, 6 enums)
│
├── scraper/
│   ├── scraper.py                   # Fragrantica scraper (BeautifulSoup)
│   └── requirements.txt             # Python deps: requests, bs4, psycopg2
│
└── types/
    ├── next-auth.d.ts               # TypeScript augmentation for Session + JWT
    └── wardrobe.ts                  # Shared WardrobeShelf + WardrobePerfume types
```

**Phase 4 additions:**
```
app/
  perfume/[id]/page.tsx              # Perfume profile page (SSR)
components/
  ui/
    SmartSearch.tsx                  # Debounced autocomplete search
  perfume/
    ScentProfile.tsx                 # Hero + note pyramid + rating breakdown
    ReviewForm.tsx                   # Star rating + sliders + tag pickers
    DupeEngine.tsx                   # Community dupe voting interface
lib/actions/
  perfume.ts                         # searchPerfumes, submitReview, addDupeVote, castDupeVote
```

**Phase 5 additions:**
```
app/
  decants/
    page.tsx                         # Global Decant Exchange (server)
    create/page.tsx                  # Create listing form (react-hook-form + zod)
  leaderboards/page.tsx              # Top 50 users with gamification badges
  user/[id]/page.tsx                 # Public profile + wardrobe view
components/
  marketplace/
    DecantCard.tsx                   # Individual listing card
    DecantMarketClient.tsx           # Sort toggle + animated grid (client)
  wardrobe/
    WardrobePanel.tsx                # 4-shelf tab panel with add/remove modal
lib/actions/
  decant.ts                          # createDecantListing, upsertWardrobeItem, removeWardrobeItem
types/
  wardrobe.ts                        # WardrobeShelf, WardrobePerfume types
```

---

## 13. Troubleshooting

### "Error: Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

The Prisma client needs to be (re)generated after any schema change or fresh `npm install`.

---

### "Error: PrismaClientKnownRequestError — column does not exist"

The DB schema is out of sync with `schema.prisma`. Run:
```bash
npx prisma db push
```

---

### "AUTH_SECRET is not set"

Generate and set a secret in `.env.local`:
```bash
npx auth secret
# Copy the output into .env.local as AUTH_SECRET="..."
```

---

### OAuth Redirect URI Mismatch

Ensure the redirect URI registered in Google/Facebook Console **exactly** matches:
- Dev: `http://localhost:3000/api/auth/callback/google`
- `http` not `https`, no trailing slash

---

### Firebase "reCAPTCHA has already been rendered"

This happens when the component remounts in development hot-reload. The `RecaptchaVerifier` in `verify-phone/page.tsx` is guarded by a ref check, but if you see this error, do a full page refresh.

---

### "CredentialsProvider is not compatible with session strategy database"

This is already resolved — `auth.ts` uses `strategy: "jwt"`. If you ever see this error after editing `auth.ts`, ensure `session: { strategy: "jwt" }` is present in the NextAuth config.

---

### Phone number rejected by validator

The regex requires: `+880` + `1` + `[3-9]` + exactly 8 digits.

Valid example: `+8801712345678`  
Invalid (common mistake): `01712345678` (missing country code)

---

### Session not updating after phone verification

The `update()` call from `useSession()` should force a JWT refresh. If it doesn't work:
1. Sign out completely
2. Sign back in — the new JWT will contain `phoneVerified: true` from the DB

---

### Docker container keeps restarting

Check logs:
```bash
docker compose logs web
```

Common causes:
- Missing `.env` values (the container reads from `.env` in the project root)
- DB not ready yet — the healthcheck should handle this, but try `docker compose restart web` after a few seconds


---

## 7. Phase 4 — Scent Engine

> **Status**: ✅ Complete  
> **New files**: `lib/actions/perfume.ts`, `components/perfume/SmartSearch.tsx`, `components/perfume/ScentProfile.tsx`, `components/perfume/ReviewForm.tsx`, `components/perfume/DupeEngine.tsx`, `app/perfume/[id]/page.tsx`

### 7.1 Server Actions (`lib/actions/perfume.ts`)

| Export | Description |
|--------|-------------|
| `searchPerfumes(query)` | Full-text search across `name`, `brand`, `slug` — returns `PerfumeSearchResult[]` |
| `submitReview(_, formData)` | Zod-validated review creation; increments `user.review_count`; revalidates perfume page |
| `addDupeVote(originalId, cloneId)` | Creates or finds `DupeVote` row — called before casting |
| `castDupeVote(voteId, dir)` | Increments `upvotes` or `downvotes`; revalidates `/perfume/[id]` |

### 7.2 SmartSearch (`components/ui/SmartSearch.tsx`)

- Debounced input (300 ms) calls `searchPerfumes` server action
- Animated dropdown with `AnimatePresence` — each result fades/slides in with stagger
- Keyboard accessible: `↑/↓` navigation, `Enter` to navigate, `Escape` to close
- Integrated into `TopNavbar.tsx` replacing the old static search bar
- `useRef<ReturnType<typeof setTimeout>>(undefined)` — TypeScript-safe debounce

### 7.3 Perfume Profile Page (`app/perfume/[id]/page.tsx`)

Server Component. Fetches full perfume data including aggregated review stats, dupe votes, and decant listings. Renders:
- `<ScentProfile />` — parallax hero, note pyramid, star rating breakdown
- `<ReviewForm />` — session-aware review submission with longevity/sillage sliders
- `<DupeEngine />` — community dupe voting interface
- Decant listing grid with CTA to `/decants/create`

### 7.4 Review Form (`components/perfume/ReviewForm.tsx`)

- Star rating picker (hover + fill animation using `--accent` color)
- Season tags: multi-select pill grid (SPRING / SUMMER / AUTUMN / WINTER / ALL_SEASON)
- Time tags: DAY / NIGHT / BOTH
- Longevity and sillage: 1–5 integer selectors
- Calls `submitReview` server action via `useActionState`
- Login prompt shown if unauthenticated

### 7.5 Dupe Engine (`components/perfume/DupeEngine.tsx`)

- Debounced `searchPerfumes` for dupe-target picker
- Existing dupe votes rendered as cards with up/down vote buttons
- Match score computed as `upvotes / (upvotes + downvotes) * 100`
- Calls `addDupeVote` then `castDupeVote` server actions
- Optimistic UI: vote counts update immediately via `useOptimistic`

---

## 8. Phase 5 — Marketplace & Commerce

> **Status**: ✅ Code complete (DB push pending — start PostgreSQL then run `npx prisma db push`)  
> **New packages**: `react-hook-form@^7.54.2`, `@hookform/resolvers@^4.1.3`  
> **New files**: `lib/actions/decant.ts`, `types/wardrobe.ts`, `app/decants/page.tsx`, `app/decants/create/page.tsx`, `app/leaderboards/page.tsx`, `app/user/[id]/page.tsx`, `components/marketplace/DecantMarketClient.tsx`, `components/wardrobe/WardrobePanel.tsx`

### 8.1 Global Color Theme Overhaul

The original gold/yellow accent (`#C9A84C`) was replaced globally with a **violet** palette, following the Pro Max design system principles:

| Token | Old (Gold) | New (Violet) |
|-------|-----------|-------------|
| `--accent` | `#C9A84C` | `#8B5CF6` |
| `--accent-light` | `#E8C97A` | `#A78BFA` |
| `--accent-dark` | `#A07830` | `#6D28D9` |
| `--accent-glow` | `rgba(201,168,76,0.3)` | `rgba(139,92,246,0.3)` |

**Scope of replacement**: 42 source files — all hardcoded hex values, `rgba()` tints, inline gradient strings, and CSS variable references were replaced via automated script. Button text on violet backgrounds was updated from `#0D0D0D` → `#FFFFFF` for correct contrast. Tailwind config aliases `accent`, `accent-light`, `accent-dark`, `brand`, `brand-hover` were updated to match.

### 8.2 Decant Exchange Marketplace

**`app/decants/page.tsx`** — Server Component  
Fetches all `AVAILABLE` `DecantListing` rows with perfume + seller data. Renders a `MarketHero` banner and delegates to `<DecantMarketClient />` for client-side sort toggle.

**`components/marketplace/DecantMarketClient.tsx`** — Client Component  
- `useState<SortKey>("newest")` toggle: Newest | Lowest Price 5ml
- `motion.div` grid with `AnimatePresence mode="popLayout"` for smooth reordering
- Spring-animated sort pill indicator (`layoutId="decant-sort-pill"`)
- "List a Decant" CTA → `/decants/create`

**`app/decants/create/page.tsx`** — Client Component (protected by middleware)  
- `react-hook-form` + `zodResolver` for form validation
- `PerfumePicker` sub-component: debounced `searchPerfumes`, dropdown, selected state
- Fields: perfume picker, `batch_code`, `price_5ml`, `price_10ml`, `proof_image_url`
- Calls `createDecantListing` server action; success → `router.push("/decants")` after 1.6 s

**`lib/actions/decant.ts`** — Server Actions  
| Export | Description |
|--------|-------------|
| `createDecantListing(_, formData)` | Zod-validated insert; revalidates `/decants` and `/perfume/${id}` |
| `upsertWardrobeItem(perfumeId, shelf)` | Upsert by `@@unique([userId, perfumeId])` |
| `removeWardrobeItem(perfumeId)` | Delete by compound unique key |

### 8.3 Leaderboards

**`app/leaderboards/page.tsx`** — Server Component  
- Queries top 50 users ordered by `review_count DESC`
- `getBadge(count)` → `{ emoji, label, gradient, shadow }` tier system:
  - 🥇 VIP Nose (150+ reviews)
  - 🥈 Collector (50+)
  - 🥉 Enthusiast (11+)
  - 🌱 Novice (0–10)
- Top-3 rows get rank medals and accent border highlight
- Each row links to `/user/${user.id}`

### 8.4 User Profiles & Wardrobe

**`app/user/[id]/page.tsx`** — Server Component  
- Fetches user + wardrobe items with `include: { perfume: { select: { id, name, brand, image_url } } }`
- `isOwner = session?.user?.id === user.id` — enables add/remove controls
- `ProfileHeader` component renders avatar, badge, review count, bio
- Passes grouped shelves to `<WardrobePanel />`

**`components/wardrobe/WardrobePanel.tsx`** — Client Component  
- 4 shelf tabs: ✅ Have · 📦 Had · 💛 Want · ✍️ Signature
- `layoutId="wardrobe-tab-pill"` — spring-animated tab indicator
- `AnimatePresence` tab transitions (scale + opacity)
- `BottleCard` — bottle image, hover lift, remove button (owner-only, group-hover)
- `AddModal` — debounced `searchPerfumes`, result dropdown, shelf selector, `upsertWardrobeItem`

**`types/wardrobe.ts`** — Shared types to prevent circular imports  
```typescript
export type WardrobeShelf = "HAVE" | "HAD" | "WANT" | "SIGNATURE";
export type WardrobePerfume = { id: string; name: string; brand: string; image_url: string | null; shelf: WardrobeShelf };
```

### 8.5 Middleware Update

`middleware.ts` was updated to also protect `/decants/create` (in addition to the legacy `/decant-market/create` route). Both routes require: signed in + `phoneVerified=true` + `review_count ≥ 50` (SUPER_ADMIN bypasses the review count check).

### 8.6 Pending: DB Push

The Prisma schema has been updated (`WardrobeItem` model, `DecantListing` model) and `npx prisma generate` has been run successfully. The following command must be run **once PostgreSQL is reachable**:

```bash
npx prisma db push --accept-data-loss
```

---

*End of Documentation Guide — Phase 5 Complete*  
*Next: Phase 6 — Gamification, Social & Dynamic Content*
