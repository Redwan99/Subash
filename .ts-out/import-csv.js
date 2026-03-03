"use strict";
/**
 * prisma/import-csv.ts
 * Dual-CSV importer for Subash fragrance platform.
 *
 * Step A — Load fra_perfumes.csv (comma-sep) into a url→{description,perfumer} Map.
 * Step B — Stream fra_cleaned.csv (semicolon-sep), merge, batch-insert into Postgres.
 *
 * Run: npm run import-csv
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ── Config ────────────────────────────────────────────────────────────────────
// Rows to insert: unlimited by default. Override with IMPORT_LIMIT=500 env var.
const LIMIT = process.env.IMPORT_LIMIT
    ? parseInt(process.env.IMPORT_LIMIT, 10)
    : undefined;
const BATCH_SIZE = 500; // rows per createMany call
// CSV files live in prisma/ locally. When running from the compiled seed.js
// inside the Docker image they live at /app/prisma/. Using CSV_DIR env var
// allows overriding for any layout.
const CSV_DIR = (_a = process.env.CSV_DIR) !== null && _a !== void 0 ? _a : path.join(__dirname, "..", "prisma");
/**
 * Extract the numeric Fragrantica perfume ID from the URL.
 * e.g. "https://www.fragrantica.com/perfume/xerjoff/accento-overdose-pride-edition-74630.html" → "74630"
 * Real bottle image is served from fimgs.net CDN at 375×500 px.
 */
function extractFragranticaId(url) {
    const m = url.match(/(\d+)\.html$/);
    return m ? m[1] : null;
}
function buildImageUrl(url) {
    const id = extractFragranticaId(url);
    if (id)
        return `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`;
    // Fallback: deterministic picsum using the URL itself as seed
    const seed = url.replace(/[^a-z0-9]/gi, "").slice(-10);
    return `https://picsum.photos/seed/${seed}/375/500`;
}
// ── Helpers ───────────────────────────────────────────────────────────────────
/** Replace hyphens with spaces and Title Case every word. */
function capitalize(str) {
    return str
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
}
/** Split a comma-separated note string into a clean array. */
function splitNotes(raw) {
    if (!raw || ["unknown", "n/a", "none", ""].includes(raw.trim().toLowerCase())) {
        return [];
    }
    return raw
        .split(",")
        .map((n) => capitalize(n.trim()))
        .filter(Boolean);
}
/** Map cleaned-csv gender strings to our display format. */
function mapGender(raw) {
    const g = raw === null || raw === void 0 ? void 0 : raw.toLowerCase().trim();
    if (g === "women")
        return "for women";
    if (g === "men")
        return "for men";
    if (g === "unisex")
        return "for women and men";
    return (raw === null || raw === void 0 ? void 0 : raw.trim()) || "for women and men";
}
/**
 * Parse Perfumers field from fra_perfumes.csv.
 * Input example: "['Christian Carbonnel', 'Antoine Lie']" or "[]"
 * Output: "Christian Carbonnel, Antoine Lie"
 */
function parsePerfumers(raw) {
    const matches = raw.match(/'([^']+)'/g);
    if (!matches || matches.length === 0)
        return "";
    return matches.map((m) => m.replace(/'/g, "").trim()).join(", ");
}
// (image URL is now derived from the Fragrantica URL via buildImageUrl)
/** Build a unique URL-safe slug: name-brand-{fragranticaId|random} */
function makeSlug(name, brand, fragranticaId) {
    const safe = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const suffix = fragranticaId !== null && fragranticaId !== void 0 ? fragranticaId : String(Math.floor(Math.random() * 90000) + 10000);
    return `${safe(name)}-${safe(brand)}-${suffix}`;
}
/** Load a CSV file into an array of row objects. */
function loadCsv(filePath, separator, limit) {
    return new Promise((resolve, reject) => {
        const rows = [];
        const stream = fs
            .createReadStream(filePath)
            .pipe((0, csv_parser_1.default)({ separator }));
        stream
            .on("data", (row) => {
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
async function buildDescriptionMap() {
    var _a, _b, _c, _d, _e;
    const filePath = path.join(CSV_DIR, "fra_perfumes.csv");
    console.log(`📂 Loading fra_perfumes.csv from ${filePath}…`);
    const rows = await loadCsv(filePath, ",");
    const map = new Map();
    for (const row of rows) {
        const url = (_a = row["url"]) === null || _a === void 0 ? void 0 : _a.trim();
        if (!url)
            continue;
        map.set(url, {
            description: (_c = (_b = row["Description"]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : "",
            perfumer: parsePerfumers((_e = (_d = row["Perfumers"]) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : ""),
        });
    }
    console.log(`  ✅ ${map.size} descriptions indexed from fra_perfumes.csv\n`);
    return map;
}
// ── Step B: Stream, merge, batch-insert from fra_cleaned.csv ─────────────────
async function importCleaned(descMap) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const filePath = path.join(CSV_DIR, "fra_cleaned.csv");
    const limitLabel = LIMIT === undefined ? "all" : String(LIMIT);
    console.log(`📂 Reading fra_cleaned.csv (limit: ${limitLabel} rows)…\n`);
    // Collect rows safely into memory (up to LIMIT) before async work.
    const rawRows = await loadCsv(filePath, ";", LIMIT);
    console.log(`  📄 ${rawRows.length} rows collected from fra_cleaned.csv\n`);
    let batch = [];
    let totalInserted = 0;
    let mergeHits = 0;
    let mergeMisses = 0;
    async function flushBatch() {
        if (batch.length === 0)
            return;
        const toInsert = batch.splice(0); // clear in-place and take copy
        const result = await prisma.perfume.createMany({
            data: toInsert,
            skipDuplicates: true,
        });
        totalInserted += result.count;
        console.log(`  📦 Flushed batch → ${result.count} inserted (running total: ${totalInserted})`);
    }
    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const url = (_b = (_a = row["url"]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
        const nameRaw = (_d = (_c = row["Perfume"]) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
        const brandRaw = (_f = (_e = row["Brand"]) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : "";
        const yearRaw = (_h = (_g = row["Year"]) === null || _g === void 0 ? void 0 : _g.trim()) !== null && _h !== void 0 ? _h : "";
        const genderRaw = (_k = (_j = row["Gender"]) === null || _j === void 0 ? void 0 : _j.trim()) !== null && _k !== void 0 ? _k : "";
        const meta = descMap.get(url);
        // Determine description source
        let description;
        let perfumer;
        if (meta && meta.description) {
            description = meta.description;
            perfumer = meta.perfumer || ((_l = row["Perfumer1"]) === null || _l === void 0 ? void 0 : _l.trim()) || null;
            mergeHits++;
            if (mergeHits <= 3 || i % 100 === 0) {
                console.log(`  🔗 [${i + 1}] Merged: "${capitalize(nameRaw)}" by ${capitalize(brandRaw)} — desc ${description.length} chars`);
            }
        }
        else {
            // Fallback: synthesised description
            const noteList = [
                ...splitNotes((_m = row["Top"]) !== null && _m !== void 0 ? _m : "").slice(0, 2),
                ...splitNotes((_o = row["Middle"]) !== null && _o !== void 0 ? _o : "").slice(0, 1),
            ].join(", ");
            description = noteList
                ? `${capitalize(nameRaw)} by ${capitalize(brandRaw)} is a luxury fragrance featuring ${noteList}.`
                : `${capitalize(nameRaw)} by ${capitalize(brandRaw)} is a distinguished luxury fragrance.`;
            perfumer = ((_p = row["Perfumer1"]) === null || _p === void 0 ? void 0 : _p.trim()) || null;
            mergeMisses++;
            if (mergeMisses <= 3) {
                console.log(`  ⚠️  [${i + 1}] No description for: …/${url.split("/").slice(-1)[0]} — using fallback`);
            }
        }
        // Build accords array from 5 named columns
        const accords = ["mainaccord1", "mainaccord2", "mainaccord3", "mainaccord4", "mainaccord5"]
            .map((k) => { var _a, _b; return (_b = (_a = row[k]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ""; })
            .filter(Boolean);
        const entry = {
            name: capitalize(nameRaw) || "Unknown",
            brand: capitalize(brandRaw) || "Unknown",
            image_url: buildImageUrl(url),
            top_notes: splitNotes((_q = row["Top"]) !== null && _q !== void 0 ? _q : ""),
            heart_notes: splitNotes((_r = row["Middle"]) !== null && _r !== void 0 ? _r : ""),
            base_notes: splitNotes((_s = row["Base"]) !== null && _s !== void 0 ? _s : ""),
            release_year: yearRaw ? parseInt(yearRaw, 10) || null : null,
            perfumer: perfumer || null,
            description,
            gender: mapGender(genderRaw),
            accords,
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
async function main() {
    console.log("\n🚀  Subash Dual-CSV Importer starting…\n");
    try {
        const descMap = await buildDescriptionMap();
        await importCleaned(descMap);
    }
    finally {
        await prisma.$disconnect();
    }
    process.exit(0);
}
main().catch((err) => {
    console.error("\n💥 Fatal error:", err);
    process.exit(1);
});
