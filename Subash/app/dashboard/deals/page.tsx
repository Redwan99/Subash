// app/dashboard/deals/page.tsx
// Phase 5 — Seller Deal Tracker Dashboard
// Protected by middleware: SELLER or SUPER_ADMIN only.
// Sellers list/manage their shop deals (external shop links + BDT price).

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Tag, ExternalLink, Plus } from "lucide-react";
import { DealForm } from "./DealForm";
import { DealActions } from "./DealActions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Deals Dashboard" };

// ─── Types ────────────────────────────────────────────────────────────────────

type DealRow = {
  id: string;
  price: number;
  link: string | null;
  is_active: boolean;
  is_featured: boolean;
  last_updated: Date;
  perfume: { id: string; name: string; brand: string };
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DealsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard/deals");

  const role = session.user.role;
  if (role !== "SELLER" && role !== "SUPER_ADMIN") redirect("/");

  const userId = session.user.id;

  const [myDeals, allPerfumes] = await Promise.all([
    prisma.deal.findMany({
      where: { sellerId: userId },
      orderBy: { last_updated: "desc" },
      include: { perfume: { select: { id: true, name: true, brand: true } } },
    }) as Promise<DealRow[]>,
    prisma.perfume.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, brand: true },
      take: 200,
    }),
  ]);

  const activeDeals   = myDeals.filter((d) => d.is_active);
  const inactiveDeals = myDeals.filter((d) => !d.is_active);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-10">

        {/* ─── Header ────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl px-6 py-8 bg-[linear-gradient(135deg,rgba(139,92,246,0.12)_0%,rgba(109,40,217,0.06)_60%,transparent_100%)] border border-[#8B5CF6]/25">
          <div className="flex items-center gap-3 mb-2">
            <Tag size={20} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Deals Dashboard</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage your shop&apos;s live price listings on Subash.
          </p>
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <p className="text-xl font-bold text-[var(--text-primary)]">{activeDeals.length}</p>
              <p className="text-[11px] text-[var(--text-muted)]">Active</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[var(--text-primary)]">{inactiveDeals.length}</p>
              <p className="text-[11px] text-[var(--text-muted)]">Inactive</p>
            </div>
          </div>
        </div>

        {/* ─── New Deal Form ──────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)] flex items-center gap-2">
            <Plus size={14} /> Add New Deal
          </h2>
          <DealForm perfumes={allPerfumes} sellerId={userId} />
        </section>

        {/* ─── Active Deals ───────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
            Your Active Listings
          </h2>
          {activeDeals.length === 0 ? (
            <div className="rounded-2xl p-10 text-center bg-[var(--bg-glass)] border border-dashed border-[var(--border-color)]">
              <p className="text-sm text-[var(--text-muted)]">No active deals. Add one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)]">
                  <Tag size={16} className="shrink-0 text-[var(--accent)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
                      {deal.perfume.brand} · {deal.perfume.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] font-bold text-[#34D399]">৳{deal.price.toLocaleString()}</span>
                      {deal.is_featured && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    {deal.link && (
                      <a
                        href={deal.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] truncate flex items-center gap-1 mt-0.5 text-[var(--accent)] hover:underline"
                      >
                        <ExternalLink size={10} /> {deal.link}
                      </a>
                    )}
                  </div>
                  <DealActions dealId={deal.id} isActive={deal.is_active} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Inactive Deals ─────────────────────────────────────── */}
        {inactiveDeals.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
              Paused / Inactive
            </h2>
            <div className="space-y-3 opacity-60">
              {inactiveDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)]">
                  <Tag size={16} className="shrink-0 text-[var(--text-muted)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-[var(--text-secondary)]">
                      {deal.perfume.brand} · {deal.perfume.name}
                    </p>
                    <span className="text-[11px] text-[var(--text-muted)]">৳{deal.price.toLocaleString()}</span>
                  </div>
                  <DealActions dealId={deal.id} isActive={deal.is_active} />
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
