# =============================================
#  Subash — Multi-Stage Dockerfile
#  Produces a minimal production image using
#  Next.js standalone output mode.
# =============================================

# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ---- Stage 2: Generate Prisma client & build ----
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate the Prisma client (reads schema.prisma)
RUN npx prisma generate

# Build the Next.js app in standalone mode
# Dummy build-time env vars prevent Prisma/NextAuth from retrying
# connections to a DB that doesn't exist during the build stage.
# These are overridden by real values in docker-compose.yml at runtime.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public
ENV AUTH_SECRET=build-time-dummy-secret-not-used-at-runtime
ENV AUTH_URL=http://localhost:3000
ENV GOOGLE_CLIENT_ID=build-dummy
ENV GOOGLE_CLIENT_SECRET=build-dummy
ENV FACEBOOK_CLIENT_ID=build-dummy
ENV FACEBOOK_CLIENT_SECRET=build-dummy
RUN npm run build

# Compile the CSV seed script so it can run with plain node in production
# Output: .ts-out/prisma/import-csv.js
RUN npx tsc --project tsconfig.scripts.json

# ---- Stage 3: Production runtime ----
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Create scripts directory
RUN mkdir -p /app/scripts

# Copy the standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy entire node_modules to ensure all Prisma dependencies are available
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema (needed for runtime queries + db push)
COPY --from=builder /app/prisma ./prisma

# Compiled seed script — runs at first boot to import all perfumes
COPY --from=builder /app/.ts-out/import-csv.js ./scripts/seed.js

# The two CSV data files (total ~37MB, embedded in image once)
COPY --from=builder /app/prisma/fra_perfumes.csv ./prisma/fra_perfumes.csv
COPY --from=builder /app/prisma/fra_cleaned.csv  ./prisma/fra_cleaned.csv

# Entrypoint: migrate → conditional seed → start
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/entrypoint.sh

# Create and set permissions for .next/cache so nextjs user can write to it
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next

# Fix permissions for scripts and prisma directories
RUN chown -R nextjs:nodejs /app/scripts /app/prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# CSV_DIR tells seed.js where to find the CSV files inside the image
ENV CSV_DIR=/app/prisma

CMD ["/bin/sh", "/app/scripts/entrypoint.sh"]
