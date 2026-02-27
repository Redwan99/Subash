// app/admin/page.tsx
// Phase 2.3 — SuperAdmin Dashboard
// Protected by middleware: only SUPER_ADMIN role can access.
// Shows platform KPIs, new users, POTD setter, and deal approvals.

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, BookOpen, Package, ShoppingBag, Shield, Star } from "lucide-react";
import { SetPOTDForm } from "./SetPOTDForm";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: "Admin Dashboard" };

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl p-5 bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value.toLocaleString()}</p>
      <p className="text-xs mt-0.5 text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin");
  if (session.user.role !== "SUPER_ADMIN") redirect("/");

  // ─── Parallel data fetching ───────────────────────────────────────────────
  const [
    userCount,
    perfumeCount,
    reviewCount,
    decantCount,
    newUsers,
    recentReviews,
    todayPOTD,
    allPerfumes,
    pendingDecants,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.perfume.count(),
    prisma.review.count(),
    prisma.decantListing.count({ where: { status: "AVAILABLE" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user:    { select: { id: true, name: true } },
        perfume: { select: { id: true, name: true, brand: true } },
      },
    }),
    prisma.perfumeOfTheDay.findFirst({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      include: { perfume: { select: { id: true, name: true, brand: true } } },
    }),
    prisma.perfume.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, brand: true },
      take: 200,
    }),
    prisma.decantListing.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        perfume: { select: { id: true, name: true, brand: true } },
        seller:  { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-10">

        {/* ─── Header ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[linear-gradient(135deg,#8B5CF6,#6D28D9)]">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
            <p className="text-xs text-[var(--text-muted)]">SuperAdmin panel — Subash</p>
          </div>
        </div>

        {/* ─── KPIs ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
            Platform Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPICard icon={Users}      label="Total Users"       value={userCount}    color="bg-[#8B5CF6]" />
            <KPICard icon={BookOpen}   label="Perfumes in DB"    value={perfumeCount} color="bg-[#F59E0B]" />
            <KPICard icon={Star}       label="Total Reviews"     value={reviewCount}  color="bg-[#34D399]" />
            <KPICard icon={Package}    label="Active Decants"    value={decantCount}  color="bg-[#60A5FA]" />
          </div>
        </section>

        {/* ─── POTD setter ───────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
            Perfume of the Day
          </h2>
          {todayPOTD ? (
            <div className="rounded-2xl px-5 py-4 mb-4 flex items-center gap-3 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30">
              <span className="text-xl">✨</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Today: {todayPOTD.perfume.name} · {todayPOTD.perfume.brand}
                </p>
                {todayPOTD.note && (
                  <p className="text-xs mt-0.5 text-[var(--text-muted)]">{todayPOTD.note}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm mb-4 text-[var(--text-secondary)]">
              No POTD set for today. Set one below.
            </p>
          )}
          <SetPOTDForm perfumes={allPerfumes} />
        </section>

        {/* ─── New Users ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
            Recent Registrations
          </h2>
          <div className="rounded-2xl overflow-hidden border border-[var(--bg-glass-border)] bg-[var(--bg-glass)] backdrop-blur-[8px] divide-y divide-[var(--border-color)]">
            {newUsers.map((u) => (
              <Link key={u.id} href={`/user/${u.id}`} prefetch={false}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#8B5CF6]/05 transition-colors cursor-pointer">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white bg-[linear-gradient(135deg,#8B5CF6,#6D28D9)]">
                    {(u.name ?? u.email ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-[var(--text-primary)]">
                      {u.name ?? u.email ?? "Anonymous"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">{u.role}</p>
                  </div>
                  <time className="text-[11px] shrink-0 text-[var(--text-muted)]">
                    {new Date(u.createdAt).toLocaleDateString("en-BD")}
                  </time>
                </div>
              </Link>
            ))}
            {newUsers.length === 0 && (
              <p className="p-6 text-center text-sm text-[var(--text-muted)]">No users yet.</p>
            )}
          </div>
        </section>

        {/* ─── Recent Reviews ────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
            Recent Reviews
          </h2>
          <div className="space-y-3">
            {recentReviews.map((r) => (
              <div key={r.id} className="rounded-2xl px-4 py-3 bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[var(--accent)]">
                    {r.perfume.brand} · {r.perfume.name}
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    <Star size={11} className="text-[#F59E0B]" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {r.overall_rating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <p className="text-xs line-clamp-2 text-[var(--text-secondary)]">{r.text}</p>
                <p className="text-[11px] mt-1 text-[var(--text-muted)]">
                  by {r.user.name ?? "Anonymous"}
                </p>
              </div>
            ))}
            {recentReviews.length === 0 && (
              <p className="text-sm text-center py-8 text-[var(--text-muted)]">No reviews yet.</p>
            )}
          </div>
        </section>

        {/* ─── Pending Decant Listings ────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
            Active Decant Listings
          </h2>
          <div className="space-y-3">
            {pendingDecants.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)]">
                <ShoppingBag size={16} className="shrink-0 text-[var(--accent)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
                    {d.perfume.name} · {d.perfume.brand}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    by {d.seller.name ?? "Unknown"} · Batch: {d.batch_code}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {d.price_5ml && (
                    <p className="text-xs font-bold text-[var(--accent)]">5ml: ৳{d.price_5ml}</p>
                  )}
                  {d.price_10ml && (
                    <p className="text-xs font-bold text-[var(--accent)]">10ml: ৳{d.price_10ml}</p>
                  )}
                </div>
              </div>
            ))}
            {pendingDecants.length === 0 && (
              <p className="text-sm text-center py-8 text-[var(--text-muted)]">No active listings.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
