// app/search/page.tsx
// Phase 4.1 — Full Search Results Page
// Accepts ?q=query from URL params. Renders results + filter chips.
// Server component with instant data fetch.

import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Search, Droplets } from "lucide-react";
import type { Metadata } from "next";
import { SearchInput } from "./SearchInput";

export const dynamic = 'force-dynamic';

// ─── Meta ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" — Search` : "Search Perfumes",
    description: "Search Bangladesh's largest fragrance database by name, brand, or scent notes.",
  };
}

// ─── Data ─────────────────────────────────────────────────────────────────────

type PerfumeResult = {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
  slug: string;
  _count: { reviews: number };
};

async function search(q: string): Promise<PerfumeResult[]> {
  if (!q || q.trim().length < 2) return [];

  const results = await prisma.perfume.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { brand: { contains: q } },
        { top_notes: { contains: q } },
        { heart_notes: { contains: q } },
        { base_notes: { contains: q } },
        { perfumer: { contains: q } },
      ],
    },
    select: {
      id: true, name: true, brand: true, image_url: true, slug: true,
      _count: { select: { reviews: true } },
    },
    orderBy: [{ reviews: { _count: "desc" } }, { name: "asc" }],
    take: 40,
  });
  return results as unknown as PerfumeResult[];
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ p }: { p: PerfumeResult }) {
  return (
    <Link href={`/perfume/${p.slug}`} prefetch={false}>
      <div className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] hover:border-[#E84393]/35 hover:-translate-y-[2px] hover:shadow-[0_6px_24px_rgba(0,0,0,0.10)]">
        {/* Image */}
        <div className="shrink-0 w-12 h-16 rounded-xl flex items-center justify-center overflow-hidden bg-[#E84393]/10 border border-[#E84393]/20">
          {p.image_url ? (
            <Image
              src={p.image_url}
              alt={p.name}
              width={48}
              height={64}
              className="object-contain w-full h-full p-1"
            />
          ) : (
            <Droplets className="w-5 h-5 text-[var(--text-muted)]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5 text-[var(--accent)]">
            {p.brand}
          </p>
          <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
            {p.name}
          </p>
          {p._count.reviews > 0 && (
            <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">
              {p._count.reviews} review{p._count.reviews !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await search(q);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">

        {/* ─── Header ────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {q ? `Results for "${q}"` : "Search Perfumes"}
            </h1>
          </div>

          {/* Live search client input */}
          <SearchInput initialQuery={q} />
        </div>

        {/* ─── Results ───────────────────────────────────────────── */}
        {q.trim().length >= 2 ? (
          results.length > 0 ? (
            <>
              <p className="text-xs mb-4 text-[var(--text-muted)]">
                {results.length} result{results.length !== 1 ? "s" : ""}
                {results.length === 40 ? " (showing top 40)" : ""}
              </p>
              <div className="space-y-3">
                {results.map((p) => (
                  <ResultCard key={p.id} p={p} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl p-10 text-center bg-[var(--bg-glass)] border border-dashed border-[var(--border-color)]">
              <Search className="w-10 h-10 text-[var(--text-muted)] mb-3" />
              <p className="text-sm font-semibold mb-1 text-[var(--text-primary)]">
                No results for &ldquo;{q}&rdquo;
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Try a different name, brand, or note (e.g., &ldquo;oud&rdquo;, &ldquo;Lattafa&rdquo;).
              </p>
            </div>
          )
        ) : (
          <div className="rounded-2xl p-10 text-center bg-[var(--bg-glass)] border border-dashed border-[var(--border-color)]">
            <Droplets className="w-10 h-10 text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-muted)]">
              Type at least 2 characters to search perfumes by name, brand, or notes.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
