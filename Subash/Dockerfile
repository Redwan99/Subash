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
ENV NEXT_TELEMETRY_DISABLED=1
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

# Copy the standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema + generated client (needed for runtime queries + db push)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Prisma CLI binary (needed for db push in entrypoint)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Copy csv-parser (needed by seed.js at runtime)
COPY --from=builder /app/node_modules/csv-parser ./node_modules/csv-parser

# Compiled seed script — runs at first boot to import all perfumes
COPY --from=builder /app/.ts-out/prisma/import-csv.js ./scripts/seed.js

# The two CSV data files (total ~37MB, embedded in image once)
COPY --from=builder /app/prisma/fra_perfumes.csv ./prisma/fra_perfumes.csv
COPY --from=builder /app/prisma/fra_cleaned.csv  ./prisma/fra_cleaned.csv

# Entrypoint: migrate → conditional seed → start
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# CSV_DIR tells seed.js where to find the CSV files inside the image
ENV CSV_DIR=/app/prisma

CMD ["/bin/sh", "/app/scripts/entrypoint.sh"]
