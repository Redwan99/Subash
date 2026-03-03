// prisma/seed.ts  (v2 — uses raw pg to avoid Prisma client type issues)
// Imports fra_cleaned.csv into the local Postgres DB using direct SQL.
// Run:  npx tsx prisma/seed.ts

import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

// ── connection ─────────────────────────────────────────────────────────────────
const DB_URL =
    process.env.DATABASE_URL ||
    "postgresql://subash_user:strong_password@localhost:5435/subash_db";

// ── helpers ────────────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ";" && !inQuotes) { result.push(current.trim()); current = ""; }
        else { current += ch; }
    }
    result.push(current.trim());
    return result;
}

function toSlug(name: string, brand: string): string {
    return `${brand}-${name}`
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

function cleanStr(s: string | undefined): string | null {
    const v = s?.replace(/^['"\[{]+|['"\]}]+$/g, "").trim();
    return (!v || v.toLowerCase() === "nan" || v.toLowerCase() === "unknown") ? null : v;
}

function splitNotes(raw: string | undefined): string[] {
    if (!raw) return [];
    const clean = raw.replace(/^['"\[{]+|['"\]}]+$/g, "").trim();
    if (!clean || clean.toLowerCase() === "unknown" || clean.toLowerCase() === "nan") return [];
    return clean.split(",").map((n) => n.replace(/^['"\s]+|['"\s]+$/g, "").trim()).filter(Boolean);
}

function cuid(): string {
    // simple enough for seeding — collision-safe within a session
    return "c" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ── main ───────────────────────────────────────────────────────────────────────
async function main() {
    const client = new Client({ connectionString: DB_URL });
    await client.connect();
    console.log("✓ Connected to Postgres");

    const csvPath = path.join(__dirname, "fra_cleaned.csv");
    const raw = fs.readFileSync(csvPath, "utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const [headerLine, ...dataLines] = lines;

    const headers = parseCSVLine(headerLine);
    const col = (n: string) => headers.findIndex((h) => h.trim() === n);

    const C = {
        url: col("url"), name: col("Perfume"), brand: col("Brand"),
        gender: col("Gender"), year: col("Year"),
        top: col("Top"), mid: col("Middle"), base: col("Base"),
        p1: col("Perfumer1"), p2: col("Perfumer2"),
        a1: col("mainaccord1"), a2: col("mainaccord2"), a3: col("mainaccord3"),
        a4: col("mainaccord4"), a5: col("mainaccord5"),
    };

    console.log(`Total rows: ${dataLines.length}`);

    let imported = 0, skipped = 0;
    const BATCH = 100;
    const slugsSeen = new Set<string>(); // deduplicate within the CSV itself

    for (let i = 0; i < dataLines.length; i += BATCH) {
        const batch = dataLines.slice(i, i + BATCH);

        for (const line of batch) {
            const c = parseCSVLine(line);

            const name = cleanStr(c[C.name]);
            const brand = cleanStr(c[C.brand]);
            if (!name || !brand) { skipped++; continue; }

            const slug = toSlug(name, brand);
            if (slugsSeen.has(slug)) { skipped++; continue; }
            slugsSeen.add(slug);

            const yearRaw = parseInt(c[C.year] ?? "", 10);
            const year = isNaN(yearRaw) || yearRaw < 1900 || yearRaw > 2030 ? null : yearRaw;

            const perfumers = [cleanStr(c[C.p1]), cleanStr(c[C.p2])].filter(Boolean);
            const perfumer = perfumers.join(", ") || null;

            const top_notes = splitNotes(c[C.top]);
            const heart_notes = splitNotes(c[C.mid]);
            const base_notes = splitNotes(c[C.base]);

            const accords = [c[C.a1], c[C.a2], c[C.a3], c[C.a4], c[C.a5]]
                .map(cleanStr).filter(Boolean) as string[];

            const image_url = cleanStr(c[C.url]);   // Fragrantica page URL
            const gender = cleanStr(c[C.gender]);
            const id = cuid();
            const now = new Date().toISOString();

            try {
                await client.query(
                    `INSERT INTO perfumes
             (id, name, brand, slug, gender, release_year, perfumer,
              top_notes, heart_notes, base_notes, accords, image_url,
              scraped, "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           ON CONFLICT (slug) DO UPDATE
             SET name=$2, brand=$3, gender=$5, release_year=$6, perfumer=$7,
                 top_notes=$8, heart_notes=$9, base_notes=$10, accords=$11,
                 image_url=$12, scraped=$13, "updatedAt"=$15`,
                    [
                        id, name, brand, slug, gender, year, perfumer,
                        top_notes, heart_notes, base_notes, accords, image_url,
                        true, now, now,
                    ]
                );
                imported++;
            } catch (e: unknown) {
                skipped++;
                if (skipped <= 3) console.warn("  ⚠", (e as Error).message?.slice(0, 100));
            }
        }

        process.stdout.write(`\r  → ${imported} imported, ${skipped} skipped  (${Math.min(i + BATCH, dataLines.length)}/${dataLines.length})`);
    }

    console.log(`\n\n✅ Done — ${imported} perfumes imported, ${skipped} skipped.`);
    await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
