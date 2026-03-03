/**
 * prisma/import-perfumes.ts
 * Standalone importer for fra_perfumes.csv.
 *
 * fra_perfumes.csv columns:
 *   Name, Gender, Rating Value, Rating Count, Main Accords, Perfumers, Description, url
 *
 * Brand + clean name are extracted from the Fragrantica URL path.
 * Note pyramids (top/heart/base) are not present in this file — stored as empty arrays.
 *
 * Run: npm run import-perfumes
 */

import * as fs from "fs";
import * as path from "path";
import csvParser from "csv-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Config ────────────────────────────────────────────────────────────────────

const LIMIT: number | undefined = process.env.IMPORT_LIMIT
  ? parseInt(process.env.IMPORT_LIMIT, 10)
  : undefined;

const BATCH_SIZE = 500;

const CSV_DIR = process.env.CSV_DIR ?? path.join(__dirname, "..", "prisma");

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractFragranticaId(url: string): string | null {
  const m = url.match(/(\d+)\.html$/);
  return m ? m[1] : null;
}

function buildImageUrl(url: string): string {
  const id = extractFragranticaId(url);
  if (id) return `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`;
  const seed = url.replace(/[^a-z0-9]/gi, "").slice(-10);
  return `https://picsum.photos/seed/${seed}/375/500`;
}

/**
 * Extract brand from URL: /perfume/Afnan/9am-70706.html → "Afnan"
 * URL has Title-cased brand in the second-to-last path segment.
 */
function extractBrand(url: string): string {
  const parts = url.replace(/\.html$/, "").split("/");
  // ["https:", "", "www.fragrantica.com", "perfume", "Brand", "name-id"]
  const brand = parts[parts.length - 2] ?? "Unknown";
  // Convert URL-hyphenated brand like "al-haramain-perfumes" → "Al Haramain Perfumes"
  return brand.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

/**
 * Extract clean perfume name from URL slug.
 * e.g. "9am-70706.html" → "9am" → "9Am" (capitalized)
 * e.g. "accento-overdose-74630.html" → "Accento Overdose"
 */
function extractName(url: string): string {
  const filename = url.replace(/\.html$/, "").split("/").pop() ?? "";
  const slug = filename.replace(/-?\d+$/, ""); // strip trailing numeric ID
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || "Unknown";
}

/**
 * Parse Python-style list strings: "['citrus', 'musky', 'woody']" → ["citrus", "musky", "woody"]
 */
function parsePythonList(raw: string): string[] {
  if (!raw || raw.trim() === "[]") return [];
  const matches = raw.match(/'([^']+)'/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/'/g, "").trim()).filter(Boolean);
}

function parsePerfumers(raw: string): string {
  return parsePythonList(raw).join(", ");
}

function makeSlug(name: string, brand: string, fragranticaId: string | null): string {
  const safe = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const suffix = fragranticaId ?? String(Math.floor(Math.random() * 90_000) + 10_000);
  return `${safe(name)}-${safe(brand)}-${suffix}`;
}

function loadCsv(
  filePath: string,
  separator: string,
  limit?: number
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    const stream = fs.createReadStream(filePath).pipe(csvParser({ separator }));
    stream
      .on("data", (row: Record<string, string>) => {
        if (limit !== undefined && rows.length >= limit) return;
        rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n🚀  fra_perfumes.csv Importer starting…\n");

  const filePath = path.join(CSV_DIR, "fra_perfumes.csv");
  const limitLabel = LIMIT === undefined ? "all" : String(LIMIT);
  console.log(`📂 Reading fra_perfumes.csv (limit: ${limitLabel} rows)…\n`);

  const rawRows = await loadCsv(filePath, ",", LIMIT);
  console.log(`  📄 ${rawRows.length} rows collected\n`);

  const batch: {
    name: string;
    brand: string;
    image_url: string;
    top_notes: string;
    heart_notes: string;
    base_notes: string;
    release_year: number | null;
    perfumer: string | null;
    description: string;
    gender: string;
    accords: string;
    slug: string;
    scraped: boolean;
  }[] = [];
  let totalInserted = 0;

  async function flushBatch(): Promise<void> {
    if (batch.length === 0) return;
    const toInsert = batch.splice(0);

    // Wrap all upserts in a single SQLite transaction — orders of magnitude
    // faster than individual statements (one BEGIN/COMMIT for 500 rows).
    await prisma.$transaction(
      toInsert.map((row) =>
        prisma.perfume.upsert({
          where: { slug: row.slug },
          update: {}, // keep existing record intact on re-run
          create: row,
          select: { id: true },
        })
      ),
    );

    totalInserted += toInsert.length;
    console.log(
      `  📦 Batch → ${toInsert.length} processed (running total: ${totalInserted})`
    );
  }

  let errorCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const url = row["url"]?.trim() ?? "";
    if (!url) continue;

    const fragranticaId = extractFragranticaId(url);
    const name = extractName(url);
    const brand = extractBrand(url);
    const gender = row["Gender"]?.trim() || "for women and men";
    const description =
      row["Description"]?.trim() ||
      `${name} by ${brand} is a luxury fragrance.`;
    const perfumer = parsePerfumers(row["Perfumers"] ?? "") || null;
    const accords = parsePythonList(row["Main Accords"] ?? "");
    const slug = makeSlug(name, brand, fragranticaId);

    if (!name || name === "Unknown") {
      errorCount++;
      continue;
    }

    batch.push({
      name,
      brand,
      image_url: buildImageUrl(url),
      top_notes: JSON.stringify([]),
      heart_notes: JSON.stringify([]),
      base_notes: JSON.stringify([]),
      release_year: null,
      perfumer,
      description,
      gender,
      accords: JSON.stringify(accords),
      slug,
      scraped: true,
    });

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }

  await flushBatch();

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ✅  Import complete!`);
  console.log(`  📊  Rows processed : ${rawRows.length}`);
  console.log(`  💾  Rows upserted  : ${totalInserted} (existing records untouched)`);
  if (errorCount > 0) console.log(`  ❌  Skipped (bad data) : ${errorCount}`);
  console.log(`${"─".repeat(60)}\n`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
