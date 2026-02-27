// app/decants/page.tsx
// Phase 5 — Global Decant Exchange (server component)
// Lists all AVAILABLE decant listings; client sub-component handles sort toggle.

import prisma from "@/lib/prisma";
import { type DecantCardData } from "@/components/marketplace/DecantCard";
import { DecantMarketClient } from "@/components/marketplace/DecantMarketClient";
import { ShieldCheck, Package } from "lucide-react";

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getListings(): Promise<DecantCardData[]> {
  const rows = await prisma.decantListing.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { createdAt: "desc" },
    include: {
      perfume: { select: { id: true, name: true, brand: true, image_url: true } },
      seller:  { select: { id: true, name: true, image: true, phone: true } },
    },
  });

  return rows.map((l) => ({
    id:              l.id,
    price_5ml:       l.price_5ml,
    price_10ml:      l.price_10ml,
    batch_code:      l.batch_code,
    proof_image_url: l.proof_image_url,
    status:          l.status,
    createdAt:       l.createdAt,
    seller:          l.seller,
    perfume:         l.perfume,
  }));
}

// ─── Hero Banner ───────────────────────────────────────────────────────────────

function MarketHero({ total }: { total: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-8 px-6 py-10 md:px-10 bg-[linear-gradient(135deg,rgba(139,92,246,0.12)_0%,rgba(109,40,217,0.06)_50%,rgba(13,13,13,0)_100%)] border border-[#8B5CF6]/25"
    >
      {/* Decorative glow */}
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(139,92,246,0.18)_0%,transparent_70%)]"
      />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-[var(--accent)]" />
            <span
              className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]"
            >
              Verified Sellers Only
            </span>
          </div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-2 text-[var(--text-primary)]"
          >
            The Decant Exchange
          </h1>
          <p className="text-sm max-w-md text-[var(--text-secondary)]">
            Sample authentic fragrances from verified community members. Every listing
            carries a batch code and proof photo.
          </p>
        </div>

        {/* Stats pill */}
        <div
          className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--bg-glass)] backdrop-blur-[10px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]"
        >
          <Package size={18} className="text-[var(--accent)]" />
          <div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {total}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Active Listing{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DecantMarketPage() {
  const listings = await getListings();

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <MarketHero total={listings.length} />

        {/* Client component handles sort toggle */}
        <DecantMarketClient listings={listings} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "The Decant Exchange — Subash",
  description:
    "Browse authentic fragrance decants from verified sellers in Bangladesh's fragrance community.",
};
