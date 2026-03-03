/**
 * prisma/import-csv.ts
 * Dual-CSV importer for Subash fragrance platform.
 *
 * Step A — Load fra_perfumes.csv (comma-sep) into a url→{description,perfumer} Map.
 * Step B — Stream fra_cleaned.csv (semicolon-sep), merge, batch-insert into Postgres.
 *
 * Run: npm run import-csv
 */

import * as fs from "fs";
import * as path from "path";
import csvParser from "csv-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Config ────────────────────────────────────────────────────────────────────

// Rows to insert: unlimited by default. Override with IMPORT_LIMIT=500 env var.
const LIMIT: number | undefined = process.env.IMPORT_LIMIT
  ? parseInt(process.env.IMPORT_LIMIT, 10)
  : undefined;

const BATCH_SIZE = 500; // rows per createMany call

// CSV files live in prisma/ locally. When running from the compiled seed.js
// inside the Docker image they live at /app/prisma/. Using CSV_DIR env var
// allows overriding for any layout.
const CSV_DIR = process.env.CSV_DIR ?? path.join(__dirname, "..", "prisma");

/**
 * Extract the numeric Fragrantica perfume ID from the URL.
 * e.g. "https://www.fragrantica.com/perfume/xerjoff/accento-overdose-pride-edition-74630.html" → "74630"
 * Real bottle image is served from fimgs.net CDN at 375×500 px.
 */
function extractFragranticaId(url: string): string | null {
  const m = url.match(/(\d+)\.html$/);
  return m ? m[1] : null;
}

function buildImageUrl(url: string): string {
  const id = extractFragranticaId(url);
  if (id) return `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`;
  // Fallback: deterministic picsum using the URL itself as seed
  const seed = url.replace(/[^a-z0-9]/gi, "").slice(-10);
  return `https://picsum.photos/seed/${seed}/375/500`;
}

// ── Type for a row we're building ─────────────────────────────────────────────

interface PerfumeRow {
  name: string;
  brand: string;
  image_url: string;
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  release_year: number | null;
  perfumer: string | null;
  description: string | null;
  gender: string | null;
  accords: string;
  slug: string;
  scraped: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Replace hyphens with spaces and Title Case every word. */
function capitalize(str: string): string {
  return str
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Split a comma-separated note string into a clean array. */
function splitNotes(raw: string): string[] {
  if (!raw || ["unknown", "n/a", "none", ""].includes(raw.trim().toLowerCase())) {
    return [];
  }
  return raw
    .split(",")
    .map((n) => capitalize(n.trim()))
    .filter(Boolean);
}

/** Map cleaned-csv gender strings to our display format. */
function mapGender(raw: string): string {
  const g = raw?.toLowerCase().trim();
  if (g === "women") return "for women";
  if (g === "men") return "for men";
  if (g === "unisex") return "for women and men";
  return raw?.trim() || "for women and men";
}

/**
 * Parse Perfumers field from fra_perfumes.csv.
 * Input example: "['Christian Carbonnel', 'Antoine Lie']" or "[]"
 * Output: "Christian Carbonnel, Antoine Lie"
 */
function parsePerfumers(raw: string): string {
  const matches = raw.match(/'([^']+)'/g);
  if (!matches || matches.length === 0) return "";
  return matches.map((m) => m.replace(/'/g, "").trim()).join(", ");
}

// (image URL is now derived from the Fragrantica URL via buildImageUrl)

/** Build a unique URL-safe slug: name-brand-{fragranticaId|random} */
function makeSlug(name: string, brand: string, fragranticaId?: string | null): string {
  const safe = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const suffix = fragranticaId ?? String(Math.floor(Math.random() * 90_000) + 10_000);
  return `${safe(name)}-${safe(brand)}-${suffix}`;
}

/** Load a CSV file into an array of row objects. */
function loadCsv(
  filePath: string,
  separator: string,
  limit?: number
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    const stream = fs
      .createReadStream(filePath)
      .pipe(csvParser({ separator }));

    stream
      .on("data", (row: Record<string, string>) => {
        if (limit !== undefined && rows.length >= limit) {
          // Don't destroy — just ignore extra rows to avoid stream errors.
          return;
        }
        rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// ── Step A: Build description map from fra_perfumes.csv ───────────────────────

async function buildDescriptionMap(): Promise<
  Map<string, { description: string; perfumer: string }>
> {
  const filePath = path.join(CSV_DIR, "fra_perfumes.csv");
  console.log(`📂 Loading fra_perfumes.csv from ${filePath}…`);

  const rows = await loadCsv(filePath, ",");
  const map = new Map<string, { description: string; perfumer: string }>();

  for (const row of rows) {
    const url = row["url"]?.trim();
    if (!url) continue;

    map.set(url, {
      description: row["Description"]?.trim() ?? "",
      perfumer: parsePerfumers(row["Perfumers"]?.trim() ?? ""),
    });
  }

  console.log(`  ✅ ${map.size} descriptions indexed from fra_perfumes.csv\n`);
  return map;
}

// ── Step B: Stream, merge, batch-insert from fra_cleaned.csv ─────────────────

async function importCleaned(
  descMap: Map<string, { description: string; perfumer: string }>
): Promise<void> {
  const filePath = path.join(CSV_DIR, "fra_cleaned.csv");
  const limitLabel = LIMIT === undefined ? "all" : String(LIMIT);
  console.log(`📂 Reading fra_cleaned.csv (limit: ${limitLabel} rows)…\n`);

  // Collect rows safely into memory (up to LIMIT) before async work.
  const rawRows = await loadCsv(filePath, ";", LIMIT);
  console.log(`  📄 ${rawRows.length} rows collected from fra_cleaned.csv\n`);

  const batch: PerfumeRow[] = [];
  let totalInserted = 0;
  let mergeHits = 0;
  let mergeMisses = 0;

  async function flushBatch(): Promise<void> {
    if (batch.length === 0) return;
    const toInsert = batch.splice(0); // clear in-place and take copy
    const result = await prisma.perfume.createMany({
      data: toInsert,
    });
    totalInserted += result.count;
    console.log(
      `  📦 Flushed batch → ${result.count} inserted (running total: ${totalInserted})`
    );
  }

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const url = row["url"]?.trim() ?? "";
    const nameRaw = row["Perfume"]?.trim() ?? "";
    const brandRaw = row["Brand"]?.trim() ?? "";
    const yearRaw = row["Year"]?.trim() ?? "";
    const genderRaw = row["Gender"]?.trim() ?? "";

    const meta = descMap.get(url);

    // Determine description source
    let description: string;
    let perfumer: string | null;

    if (meta && meta.description) {
      description = meta.description;
      perfumer = meta.perfumer || row["Perfumer1"]?.trim() || null;
      mergeHits++;
      if (mergeHits <= 3 || i % 100 === 0) {
        console.log(
          `  🔗 [${i + 1}] Merged: "${capitalize(nameRaw)}" by ${capitalize(brandRaw)} — desc ${description.length} chars`
        );
      }
    } else {
      // Fallback: synthesised description
      const noteList = [
        ...splitNotes(row["Top"] ?? "").slice(0, 2),
        ...splitNotes(row["Middle"] ?? "").slice(0, 1),
      ].join(", ");
      description = noteList
        ? `${capitalize(nameRaw)} by ${capitalize(brandRaw)} is a luxury fragrance featuring ${noteList}.`
        : `${capitalize(nameRaw)} by ${capitalize(brandRaw)} is a distinguished luxury fragrance.`;
      perfumer = row["Perfumer1"]?.trim() || null;
      mergeMisses++;
      if (mergeMisses <= 3) {
        console.log(
          `  ⚠️  [${i + 1}] No description for: …/${url.split("/").slice(-1)[0]} — using fallback`
        );
      }
    }

    // Build accords array from 5 named columns
    const accords = (
      ["mainaccord1", "mainaccord2", "mainaccord3", "mainaccord4", "mainaccord5"] as const
    )
      .map((k) => row[k]?.trim() ?? "")
      .filter(Boolean);

    const entry: PerfumeRow = {
      name: capitalize(nameRaw) || "Unknown",
      brand: capitalize(brandRaw) || "Unknown",
      image_url: buildImageUrl(url),
      top_notes: JSON.stringify(splitNotes(row["Top"] ?? "")),
      heart_notes: JSON.stringify(splitNotes(row["Middle"] ?? "")),
      base_notes: JSON.stringify(splitNotes(row["Base"] ?? "")),
      release_year: yearRaw ? parseInt(yearRaw, 10) || null : null,
      perfumer: perfumer || null,
      description,
      gender: mapGender(genderRaw),
      accords: JSON.stringify(accords),
      slug: makeSlug(nameRaw, brandRaw, extractFragranticaId(url)),
      scraped: true,
    };

    batch.push(entry);

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }

  // Flush remaining
  await flushBatch();

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ✅  Import complete!`);
  console.log(`  📊  Rows processed : ${rawRows.length}`);
  console.log(`  💾  Rows inserted  : ${totalInserted}`);
  console.log(`  🔗  Merge hits     : ${mergeHits}  (description from fra_perfumes.csv)`);
  console.log(`  ⚠️   Merge misses   : ${mergeMisses} (fallback description used)`);
  console.log(`${"─".repeat(60)}\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n🚀  Subash Dual-CSV Importer starting…\n");

  try {
    const descMap = await buildDescriptionMap();
    await importCleaned(descMap);
  } finally {
    await prisma.$disconnect();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
