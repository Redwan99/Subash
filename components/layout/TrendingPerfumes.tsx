// components/layout/TrendingPerfumes.tsx
// Server Component — Sidebar widget showing top 5 Trending Perfumes
// ranked by search-click count (searchCount field).

import Link from "next/link";
import Image from "next/image";
import { Flame, TrendingUp } from "lucide-react";
import { getCachedTrendingPerfumes } from "@/lib/actions/search";

// Rank badge colours: gold → silver → bronze → normal → normal
const RANK_STYLES = [
    "text-brand-400",   // #1
    "text-slate-300",   // #2
    "text-brand-300",   // #3
    "text-[var(--text-muted)]",
    "text-[var(--text-muted)]",
];

export async function TrendingPerfumes() {
    const trending = await getCachedTrendingPerfumes(5);

    const trendingPerfumes = trending.filter(
        (p): p is NonNullable<(typeof trending)[number]> => Boolean(p)
    );

    if (!trendingPerfumes || trendingPerfumes.length === 0) return null;

    return (
        <div className="rounded-2xl p-4 glass border border-[var(--bg-glass-border)] bg-black/5 dark:bg-white/5 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(232,67,147,0.18)]">
                    <TrendingUp size={13} className="text-brand-500" />
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-brand-500">
                    Trending Perfumes
                </span>
            </div>

            {/* Ranked list */}
            <ul className="space-y-2">
                {trendingPerfumes.map((p, i) => (
                    <li key={p.id}>
                        <Link href={`/perfume/${p.slug}`} prefetch={false}>
                            <div className="group gpu-accelerate flex items-center gap-2.5 p-1.5 rounded-xl transition-colors hover:bg-black/10 dark:hover:bg-white/10">
                                {/* Rank number — gold / silver / bronze tiers */}
                                <span className={`w-4 text-center text-[11px] font-extrabold shrink-0 ${RANK_STYLES[i] ?? RANK_STYLES[4]}`}>
                                    {i + 1}
                                </span>

                                {/* Bottle thumbnail */}
                                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-black/20 border border-black/10 dark:border-white/10 shrink-0">
                                    {p.image_url ? (
                                        <Image
                                            src={p.image_url}
                                            alt={p.name}
                                            fill
                                            className="object-contain p-0.5"
                                            sizes="36px"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="absolute inset-0 flex items-center justify-center text-sm">
                                            🧴
                                        </span>
                                    )}
                                </div>

                                {/* Name + brand */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors leading-tight">
                                        {p.name}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)] truncate leading-tight mt-0.5">
                                        {p.brand}
                                    </p>
                                </div>

                                {/* 🔥 Heat indicator (weekly search count) */}
                                <div className="flex items-center gap-0.5 text-brand-500 shrink-0">
                                    <Flame size={10} className="fill-current opacity-80" />
                                    <span className="text-[9px] font-bold tabular-nums">
                                        {p.weeklySearchCount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Footer hint */}
            <p className="mt-3 text-[9px] text-[var(--text-muted)] text-center opacity-60">
                Based on search &amp; click activity
            </p>
        </div>
    );
}

