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
# Dummy build-time args prevent Prisma/NextAuth from retrying
# connections to a DB that doesn't exist during the build stage.
# These are overridden by real values in docker-compose.yml at runtime.
# Using ARG (not ENV) so secrets don't persist in the final image layer.
ENV NEXT_TELEMETRY_DISABLED=1
ARG DATABASE_URL="file:./subash.db"
ARG AUTH_SECRET=build-time-placeholder
ARG AUTH_URL=http://localhost:9864
ARG GOOGLE_CLIENT_ID=build-dummy
ARG GOOGLE_CLIENT_SECRET=build-dummy
ARG FACEBOOK_CLIENT_ID=build-dummy
ARG FACEBOOK_CLIENT_SECRET=build-dummy
ENV DATABASE_URL=$DATABASE_URL \
    AUTH_SECRET=$AUTH_SECRET \
    AUTH_URL=$AUTH_URL \
    GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
    GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
    FACEBOOK_CLIENT_ID=$FACEBOOK_CLIENT_ID \
    FACEBOOK_CLIENT_SECRET=$FACEBOOK_CLIENT_SECRET
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
# Runtime default — overridden by docker-compose DATABASE_URL env var.
# Points to the bind-mounted volume so SQLite survives container updates.
ENV DATABASE_URL="file:/app/data/subash.db"

# Create scripts and data directories
# /app/data is the bind-mount target for the persistent SQLite file.
RUN mkdir -p /app/scripts /app/data

# Copy the standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
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

# Entrypoint: schema sync → conditional seed → start
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/entrypoint.sh

# Create .next/cache; ensure /app/data is writable at runtime.
# Running as root so the bind-mounted /app/data (which Docker creates as
# root on the CasaOS host) is always writable.
RUN mkdir -p /app/.next/cache

EXPOSE 9864
ENV PORT=9864
ENV HOSTNAME="0.0.0.0"
# CSV_DIR tells seed.js where to find the CSV files inside the image
ENV CSV_DIR=/app/prisma

CMD ["/bin/sh", "/app/scripts/entrypoint.sh"]
