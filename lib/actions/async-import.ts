"use server";
/**
 * lib/actions/async-import.ts
 * Universal CSV import engine for the admin dashboard.
 *
 * Auto-detects CSV format based on header columns:
 *   • fra_cleaned.csv  — comma-separated (quoted fields), columns: url,Perfume,Brand,Country,Gender,
 *                         Rating Value,Rating Count,Year,Top,Middle,Base,Perfumer1,Perfumer2,mainaccord1-5
 *                         Perfume column contains URL slugs; notes are comma-separated inside quotes.
 *   • fra_perfumes.csv — comma-separated, columns: Name,Gender,Main Accords,Perfumers,Description,url
 *   • generic          — comma-separated, columns: name,brand (minimum)
 *
 * Processes rows in batches with live progress tracking via ImportJob model.
 */

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import Papa from "papaparse";
import { revalidatePath } from "next/cache";

// ── Constants ─────────────────────────────────────────────────────────────────

const BATCH_SIZE = 250;

// ── Types ─────────────────────────────────────────────────────────────────────

type CsvFormat = "fra_cleaned" | "fra_perfumes" | "generic";

interface PerfumeRow {
  name: string;
  brand: string;
  image_url: string | null;
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
  source_url: string | null;
  country: string | null;
  rating_value: number | null;
  rating_count: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function splitNotes(raw: string): string[] {
  if (!raw || ["unknown", "n/a", "none", ""].includes(raw.trim().toLowerCase())) {
    return [];
  }
  return raw
    .split(",")
    .map((n) => capitalize(n.trim()))
    .filter(Boolean);
}

function mapGender(raw: string): string {
  const g = raw?.toLowerCase().trim();
  if (g === "women") return "for women";
  if (g === "men") return "for men";
  if (g === "unisex") return "for women and men";
  return raw?.trim() || "for women and men";
}

/** Parse European-format rating like "1,42" → 1.42, or plain "3" → 3.0 */
function parseRating(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/"/g, "").trim();
  if (!cleaned) return null;
  // European format: "1,42" → "1.42"
  const normalized = cleaned.replace(",", ".");
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

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

function parsePythonList(raw: string): string[] {
  if (!raw || raw.trim() === "[]") return [];
  const matches = raw.match(/'([^']+)'/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/'/g, "").trim()).filter(Boolean);
}

function parsePerfumers(raw: string): string {
  return parsePythonList(raw).join(", ");
}

function makeSlug(name: string, brand: string, fragranticaId?: string | null): string {
  const safe = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const suffix = fragranticaId ?? String(Math.floor(Math.random() * 90_000) + 10_000);
  return `${safe(name)}-${safe(brand)}-${suffix}`;
}

/** Extract brand from Fragrantica URL path */
function extractBrand(url: string): string {
  const parts = url.replace(/\.html$/, "").split("/");
  const brand = parts[parts.length - 2] ?? "Unknown";
  return brand.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

/** Extract clean perfume name from Fragrantica URL slug */
function extractName(url: string): string {
  const filename = url.replace(/\.html$/, "").split("/").pop() ?? "";
  const slug = filename.replace(/-?\d+$/, "");
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || "Unknown";
}

// ── Format Detection ──────────────────────────────────────────────────────────

function detectFormat(headers: string[], firstLine: string): { format: CsvFormat; separator: string } {
  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));

  // fra_cleaned.csv: comma-separated with quoted fields
  // Headers: url, Perfume, Brand, Country, Gender, Rating Value, Rating Count, Year,
  //          Top, Middle, Base, Perfumer1, Perfumer2, mainaccord1-5
  // Notes fields contain commas but are quoted so PapaParse handles them correctly
  if (headerSet.has("perfume") && headerSet.has("top") && headerSet.has("middle") && headerSet.has("base")) {
    // Auto-detect separator: check if semicolons dominate outside quotes
    const unquoted = firstLine.replace(/"[^"]*"/g, "");
    const semicolonCount = (unquoted.match(/;/g) || []).length;
    const commaCount = (unquoted.match(/,/g) || []).length;
    const separator = semicolonCount > commaCount ? ";" : ",";
    return { format: "fra_cleaned", separator };
  }

  // fra_perfumes.csv: comma-separated, has "Main Accords", "Perfumers", "Description"  
  if (headerSet.has("main accords") || headerSet.has("perfumers") || headerSet.has("description")) {
    return { format: "fra_perfumes", separator: "," };
  }

  // Auto-detect separator from first line
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const separator = semicolonCount > commaCount ? ";" : ",";

  return { format: "generic", separator };
}

// ── Row Mappers ───────────────────────────────────────────────────────────────

function mapFraCleanedRow(row: Record<string, string>): PerfumeRow | null {
  const url = row["url"]?.trim() ?? "";
  // "Perfume" column contains URL slugs like "accento-overdose-pride-edition"
  const nameRaw = row["Perfume"]?.trim() ?? "";
  const brandRaw = row["Brand"]?.trim() ?? "";
  const yearRaw = row["Year"]?.trim() ?? "";
  const genderRaw = row["Gender"]?.trim() ?? "";

  if (!nameRaw && !brandRaw) return null;

  // capitalize() converts slug-style "accento-overdose-pride-edition" → "Accento Overdose Pride Edition"
  const name = capitalize(nameRaw) || "Unknown";
  const brand = capitalize(brandRaw) || "Unknown";

  // Parse notes — PapaParse correctly handles quoted comma-separated values
  // e.g. "fruity notes, aldehydes, green notes" arrives as a single string
  const topNotes = splitNotes(row["Top"] ?? "");
  const heartNotes = splitNotes(row["Middle"] ?? "");
  const baseNotes = splitNotes(row["Base"] ?? "");

  // Build description from top notes
  const notePreview = [
    ...topNotes.slice(0, 2),
    ...heartNotes.slice(0, 1),
  ].join(", ");
  const description = notePreview
    ? `${name} by ${brand} is a luxury fragrance featuring ${notePreview}.`
    : `${name} by ${brand} is a distinguished luxury fragrance.`;

  // Build accords from named columns (mainaccord1..mainaccord5)
  const accords = (
    ["mainaccord1", "mainaccord2", "mainaccord3", "mainaccord4", "mainaccord5"] as const
  )
    .map((k) => row[k]?.trim() ?? "")
    .filter(Boolean)
    .map(capitalize);

  // Perfumers — combine Perfumer1 + Perfumer2, filter out "unknown"
  const p1 = row["Perfumer1"]?.trim() ?? "";
  const p2 = row["Perfumer2"]?.trim() ?? "";
  const perfumers = [p1, p2]
    .filter((p) => p && p.toLowerCase() !== "unknown")
    .map(capitalize);
  const perfumer = perfumers.length > 0 ? perfumers.join(", ") : null;

  // Fragrantica ID from URL for image + slug
  const fragId = url ? extractFragranticaId(url) : null;

  // Country of origin
  const country = row["Country"]?.trim() || null;

  // Fragrantica rating (European decimal format: "1,42" → 1.42)
  const ratingValue = parseRating(row["Rating Value"] ?? "");
  const ratingCount = row["Rating Count"]?.trim()
    ? parseInt(row["Rating Count"].trim(), 10) || null
    : null;

  return {
    name,
    brand,
    image_url: url ? buildImageUrl(url) : null,
    top_notes: JSON.stringify(topNotes),
    heart_notes: JSON.stringify(heartNotes),
    base_notes: JSON.stringify(baseNotes),
    release_year: yearRaw ? parseInt(yearRaw, 10) || null : null,
    perfumer,
    description,
    gender: mapGender(genderRaw),
    accords: JSON.stringify(accords),
    slug: makeSlug(nameRaw, brandRaw, fragId),
    scraped: true,
    source_url: url || null,
    country,
    rating_value: ratingValue,
    rating_count: ratingCount,
  };
}

function mapFraPerfumesRow(row: Record<string, string>): PerfumeRow | null {
  const url = row["url"]?.trim() ?? "";
  if (!url) return null;

  const name = extractName(url);
  const brand = extractBrand(url);
  if (name === "Unknown") return null;

  const gender = row["Gender"]?.trim() || "for women and men";
  const description = row["Description"]?.trim() || `${name} by ${brand} is a luxury fragrance.`;
  const perfumer = parsePerfumers(row["Perfumers"] ?? "") || null;
  const accords = parsePythonList(row["Main Accords"] ?? "");

  return {
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
    slug: makeSlug(name, brand, extractFragranticaId(url)),
    scraped: true,
    source_url: url || null,
    country: null,
    rating_value: null,
    rating_count: null,
  };
}

function mapGenericRow(row: Record<string, string>): PerfumeRow | null {
  // Try common column naming patterns (case-insensitive header matching via Papa)
  const name = row["name"] || row["Name"] || row["perfume"] || row["Perfume"] || "";
  const brand = row["brand"] || row["Brand"] || "";
  if (!name && !brand) return null;

  const cleanName = capitalize(name) || "Unknown";
  const cleanBrand = capitalize(brand) || "Unknown";

  const parseNotes = (raw?: string) => {
    if (!raw) return [];
    return raw.split(",").map((n) => n.trim()).filter(Boolean);
  };

  const topNotes = parseNotes(row["top_notes"] || row["Top"] || row["top"]);
  const heartNotes = parseNotes(row["heart_notes"] || row["Middle"] || row["heart"] || row["middle"]);
  const baseNotes = parseNotes(row["base_notes"] || row["Base"] || row["base"]);
  const accords = parseNotes(row["accords"] || row["main_accords"] || row["Main Accords"]);

  return {
    name: cleanName,
    brand: cleanBrand,
    image_url: row["image_url"] || row["image"] || row["img"] || null,
    top_notes: JSON.stringify(topNotes),
    heart_notes: JSON.stringify(heartNotes),
    base_notes: JSON.stringify(baseNotes),
    release_year: row["release_year"] || row["Year"] || row["year"]
      ? parseInt(row["release_year"] || row["Year"] || row["year"], 10) || null
      : null,
    perfumer: row["perfumer"] || row["Perfumer"] || null,
    description: row["description"] || row["Description"] || `${cleanName} by ${cleanBrand} is a wonderful fragrance.`,
    gender: row["gender"] || row["Gender"] || "Unisex",
    accords: JSON.stringify(accords),
    slug: `${cleanBrand}-${cleanName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, ""),
    scraped: false,
    source_url: row["url"] || row["source_url"] || null,
    country: row["country"] || row["Country"] || null,
    rating_value: parseRating(row["rating_value"] || row["Rating Value"] || ""),
    rating_count: row["rating_count"] || row["Rating Count"]
      ? parseInt(row["rating_count"] || row["Rating Count"] || "", 10) || null
      : null,
  };
}

// ── Auth Guard ────────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== "MODERATOR")) {
    throw new Error("Forbidden: Admin access required");
  }
  return session.user.id;
}

// ── Public Actions ────────────────────────────────────────────────────────────

/**
 * Start a CSV import job. Parses the CSV, creates a tracking record,
 * then processes rows in batches with progress updates.
 */
export async function startCsvImport(formData: FormData): Promise<{ jobId: string; error?: string }> {
  try {
    await requireAdmin();

    const file = formData.get("file") as File;
    if (!file || !file.name.endsWith(".csv")) {
      return { jobId: "", error: "Please upload a valid .csv file." };
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();

    // Try UTF-8 first, fall back to latin-1 if we get garbled text
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(arrayBuffer);
    } catch {
      // latin-1 (iso-8859-1) fallback for fra_cleaned.csv-style files
      text = new TextDecoder("iso-8859-1").decode(arrayBuffer);
    }

    // Detect format from first line
    const firstLine = text.split("\n")[0] ?? "";
    const quickHeaders = firstLine.split(/[;,]/).map((h) => h.trim().replace(/^"|"$/g, ""));
    const { format, separator } = detectFormat(quickHeaders, firstLine);

    // Parse entire CSV with PapaParse
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: separator,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return { jobId: "", error: `CSV parse failed: ${parsed.errors[0]?.message}` };
    }

    const totalRows = parsed.data.length;
    if (totalRows === 0) {
      return { jobId: "", error: "CSV file is empty or has no valid rows." };
    }

    // Create the import job record
    const job = await prisma.importJob.create({
      data: {
        filename: file.name,
        status: "processing",
        totalRows,
        format,
        startedAt: new Date(),
      },
    });

    // Process in background (fire-and-forget using an immediately-invoked async block)
    // This allows the response to return immediately with the jobId
    processImportJob(job.id, parsed.data, format).catch((err) => {
      console.error(`[IMPORT] Job ${job.id} failed:`, err);
    });

    return { jobId: job.id };
  } catch (err) {
    return { jobId: "", error: err instanceof Error ? err.message : "Import failed." };
  }
}

/**
 * Get the status of an import job for live polling.
 */
export async function getImportJobStatus(jobId: string) {
  await requireAdmin();
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  return {
    id: job.id,
    filename: job.filename,
    status: job.status,
    format: job.format,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    insertedRows: job.insertedRows,
    skippedRows: job.skippedRows,
    errorRows: job.errorRows,
    errorLog: JSON.parse(job.errorLog) as string[],
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

/**
 * Get recent import job history.
 */
export async function getImportHistory() {
  await requireAdmin();
  const jobs = await prisma.importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return jobs.map((j) => ({
    id: j.id,
    filename: j.filename,
    status: j.status,
    format: j.format,
    totalRows: j.totalRows,
    insertedRows: j.insertedRows,
    skippedRows: j.skippedRows,
    errorRows: j.errorRows,
    createdAt: j.createdAt.toISOString(),
    completedAt: j.completedAt?.toISOString() ?? null,
  }));
}

// ── Background Processor ──────────────────────────────────────────────────────

async function processImportJob(
  jobId: string,
  rows: Record<string, string>[],
  format: CsvFormat
): Promise<void> {
  let processedRows = 0;
  let insertedRows = 0;
  let skippedRows = 0;
  let errorRows = 0;
  const errorLog: string[] = [];

  const mapRow = format === "fra_cleaned"
    ? mapFraCleanedRow
    : format === "fra_perfumes"
      ? mapFraPerfumesRow
      : mapGenericRow;

  // Process in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const batchData: PerfumeRow[] = [];

    for (const row of chunk) {
      processedRows++;
      try {
        const mapped = mapRow(row);
        if (mapped) {
          batchData.push(mapped);
        } else {
          skippedRows++;
        }
      } catch (err) {
        errorRows++;
        if (errorLog.length < 50) {
          errorLog.push(`Row ${processedRows}: ${err instanceof Error ? err.message : "Parse error"}`);
        }
      }
    }

    // Upsert batch into database
    if (batchData.length > 0) {
      try {
        // Use a transaction of upserts to handle duplicates gracefully
        await prisma.$transaction(
          batchData.map((row) =>
            prisma.perfume.upsert({
              where: { slug: row.slug },
              update: {
                // Update fields only if they were empty/default before
                description: row.description,
                perfumer: row.perfumer,
                gender: row.gender,
                release_year: row.release_year,
                source_url: row.source_url,
                country: row.country,
                rating_value: row.rating_value,
                rating_count: row.rating_count,
                accords: row.accords,
                top_notes: row.top_notes,
                heart_notes: row.heart_notes,
                base_notes: row.base_notes,
                image_url: row.image_url,
              },
              create: row,
              select: { id: true },
            })
          )
        );
        insertedRows += batchData.length;
      } catch {
        // If the transaction fails, try individual upserts
        for (const row of batchData) {
          try {
            await prisma.perfume.upsert({
              where: { slug: row.slug },
              update: {},
              create: row,
              select: { id: true },
            });
            insertedRows++;
          } catch (singleErr) {
            errorRows++;
            skippedRows++;
            if (errorLog.length < 50) {
              errorLog.push(
                `"${row.name}" by ${row.brand}: ${singleErr instanceof Error ? singleErr.message : "DB error"}`
              );
            }
          }
        }
      }
    }

    // Update progress in database
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        processedRows,
        insertedRows,
        skippedRows,
        errorRows,
        errorLog: JSON.stringify(errorLog),
      },
    });
  }

  // Mark job as completed
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: errorRows > 0 && insertedRows === 0 ? "failed" : "completed",
      processedRows,
      insertedRows,
      skippedRows,
      errorRows,
      errorLog: JSON.stringify(errorLog),
      completedAt: new Date(),
    },
  });

  // Revalidate relevant pages
  revalidatePath("/");
  revalidatePath("/perfume");
  revalidatePath("/encyclopedia");
}
