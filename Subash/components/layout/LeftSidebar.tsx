"use client";
// components/layout/LeftSidebar.tsx
// Live data sidebar: Perfume of the Day (real fimgs.net image) +
// Trending Brands from DB + Fragram CTA + Deal CTA.

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Tag, Camera, ExternalLink, Flame, Loader2 } from "lucide-react";

// Types
interface SidebarData {
  potd: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    image_url: string | null;
    accords: string[];
    gender: string | null;
    release_year: number | null;
    top_notes: string[];
  } | null;
  trendingBrands: { brand: string; count: number; badge: string }[];
  trendingPerfumes: { id: string; slug: string; name: string; brand: string }[];
  activity: unknown[];
}

// SideCard wrapper
function SideCard({ children, delay = 0, href }: { children: React.ReactNode; delay?: number; href?: string }) {
  const reduced = useReducedMotion();
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 26, delay }}
      whileHover={reduced ? {} : { y: -2 }}
      className="rounded-2xl p-4 cursor-pointer glass border border-[var(--bg-glass-border)] transition-all hover:border-[rgba(139,92,246,0.30)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.14)]"
    >
      {children}
    </motion.div>
  );
  return href ? <Link href={href} prefetch={false}>{inner}</Link> : inner;
}

// POTD Card
function POTDCard({ potd }: { potd: SidebarData["potd"] }) {
  if (!potd) {
    return (
      <SideCard delay={0.08}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[rgba(139,92,246,0.18)]">
            <Sparkles size={13} className="text-[var(--accent)]" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--accent)]">Scent of the Day</span>
        </div>
        <div className="w-full h-28 rounded-xl bg-[rgba(139,92,246,0.06)] flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-[var(--accent)] opacity-40" />
        </div>
      </SideCard>
    );
  }
  return (
    <SideCard delay={0.08} href={`/perfume/${potd.slug}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(139,92,246,0.18)]">
          <Sparkles size={13} className="text-[var(--accent)]" />
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--accent)]">Scent of the Day</span>
      </div>
      <div className="relative w-full h-28 rounded-xl mb-3 overflow-hidden bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.10)]">
        {potd.image_url ? (
          <Image src={potd.image_url} alt={potd.name} fill className="object-contain p-2" sizes="180px" unoptimized />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-4xl">🧴</span>
        )}
      </div>
      <p className="text-sm font-bold leading-snug text-[var(--text-primary)] line-clamp-1">{potd.name}</p>
      <p className="text-[11px] mb-2 text-[var(--accent)]">by {potd.brand}</p>
      {potd.top_notes.length > 0 && (
        <p className="text-[11px] leading-snug line-clamp-1 text-[var(--text-secondary)]">
          {potd.top_notes.slice(0, 4).join(" · ")}
        </p>
      )}
      {potd.accords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {potd.accords.slice(0, 3).map((a) => (
            <span key={a} className="text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-wide bg-[rgba(139,92,246,0.12)] text-[var(--accent)]">{a}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">{potd.release_year ?? ""}</span>
        <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">View <ExternalLink size={10} /></span>
      </div>
    </SideCard>
  );
}

// Trending Brands Card (live from DB)
function TrendingBrandsCard({ brands }: { brands: SidebarData["trendingBrands"] }) {
  const reduced = useReducedMotion();
  const BADGES = ["🔥", "📈", "⭐", "🏆", "💎"];
  const list = brands.length > 0 ? brands : Array.from({ length: 5 }, (_, i) => ({ brand: "—", count: 0, badge: BADGES[i] }));
  return (
    <SideCard delay={0.16}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(99,211,155,0.15)]">
          <TrendingUp size={13} className="text-[#34D399]" />
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-[#34D399]">Trending Houses</span>
      </div>
      <ul className="space-y-1.5">
        {list.map(({ brand, count, badge }, i) => (
          <li key={`${brand}-${i}`}>
            <motion.div
              whileHover={reduced ? {} : { x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${i === 0 ? "bg-[rgba(139,92,246,0.08)]" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-4 text-center text-[var(--text-muted)]">{i + 1}</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{brand}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {count > 0 && <span className="text-[9px] text-[var(--text-muted)]">{count}</span>}
                <span>{badge}</span>
              </div>
            </motion.div>
          </li>
        ))}
      </ul>
    </SideCard>
  );
}

// Fragram CTA
function FragramCard() {
  return (
    <SideCard delay={0.22} href="/fragram">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(139,92,246,0.18)]">
          <Camera size={13} className="text-[var(--accent)]" />
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--accent)]">Fragram</span>
      </div>
      <div className="w-full h-16 rounded-xl mb-3 flex items-center justify-center bg-[linear-gradient(135deg,rgba(139,92,246,0.10),rgba(139,92,246,0.03))] border border-[rgba(139,92,246,0.15)]">
        <span className="text-3xl">📸</span>
      </div>
      <p className="text-sm font-bold leading-snug text-[var(--text-primary)]">Scent of the Day Feed</p>
      <p className="text-[11px] leading-snug mt-1 text-[var(--text-secondary)]">Share your bottle. See what the community is wearing.</p>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[11px] font-semibold text-[var(--accent)]">Upload SOTD</span>
        <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">Open <ExternalLink size={10} /></span>
      </div>
    </SideCard>
  );
}

// Deal CTA
function TopDealCard() {
  return (
    <SideCard delay={0.28} href="/decants">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(239,68,68,0.15)]">
          <Flame size={13} className="text-[#EF4444]" />
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-[#EF4444]">Deal of the Week</span>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(52,211,153,0.15)] text-[#34D399]">✓ Live</span>
      </div>
      <p className="text-sm font-bold leading-snug mb-0.5 text-[var(--text-primary)]">Armaf Club de Nuit Intense EDP</p>
      <p className="text-[11px] mb-2.5 text-[var(--text-muted)]">Armaf · PerfumeBD</p>
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-[var(--accent)]">৳ 2,450</span>
        <span className="text-xs line-through text-[var(--text-muted)]">৳ 3,200</span>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)] text-[#EF4444]">23% off</span>
      </div>
      <div className="flex items-center gap-1.5 mt-2.5">
        <Tag size={11} className="text-[var(--text-muted)]" />
        <span className="text-[11px] text-[var(--text-muted)]">Limited time offer</span>
      </div>
    </SideCard>
  );
}

// Left Sidebar — fetches live data from /api/sidebar
export function LeftSidebar() {
  const reduced = useReducedMotion();
  const [data, setData] = useState<SidebarData | null>(null);

  useEffect(() => {
    fetch("/api/sidebar")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
      className="fixed left-0 top-[var(--topnav-height,60px)] h-[calc(100vh-var(--topnav-height,60px))] w-[var(--sidebar-width)] hidden md:flex flex-col z-40 overflow-y-auto bg-[var(--bg-glass)] backdrop-blur-[var(--blur-backdrop)] border-r border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)] [scrollbar-width:none] [-ms-overflow-style:none]"
      aria-label="Discover sidebar"
    >
      <div className="p-3 space-y-3 flex-1">
        <POTDCard potd={data?.potd ?? null} />
        <TrendingBrandsCard brands={data?.trendingBrands ?? []} />
        <FragramCard />
        <TopDealCard />
      </div>
      <p className="text-center text-[10px] py-3 shrink-0 text-[var(--text-muted)]">Subash · সুবাশ</p>
    </motion.aside>
  );
}