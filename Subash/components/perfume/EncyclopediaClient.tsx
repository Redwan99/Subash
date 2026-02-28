"use client";
// components/perfume/EncyclopediaClient.tsx
// Phase 10 — Client-side Encyclopedia with real-time search, filters, and animated grid

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { Search, SlidersHorizontal, X, BookOpen, Filter } from "lucide-react";
import { getPerfumesPage } from "@/lib/actions/perfume";

// ── Types ─────────────────────────────────────────────────────────────────────

type Perfume = {
    id: string; slug: string; name: string; brand: string;
    image_url: string | null; gender: string | null;
    accords: string[]; release_year: number | null; perfumer: string | null;
};

type ActiveFilters = {
    brand: string | null; gender: string | null; accord: string | null;
};

type Props = {
    perfumes: Perfume[];
    brands: string[];
    accords: string[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    activeFilters: ActiveFilters;
};

// ── Gender pill color map ─────────────────────────────────────────────────────
const GENDER_COLORS: Record<string, string> = {
    men: "text-[#60A5FA] bg-[rgba(96,165,250,0.1)]",
    women: "text-[#F472B6] bg-[rgba(244,114,182,0.1)]",
    unisex: "text-[#A78BFA] bg-[rgba(167,139,250,0.1)]",
};

// ── Single perfume card ───────────────────────────────────────────────────────
function PerfumeCard({ perfume, index }: { perfume: Perfume; index: number }) {
    const genderKey = (perfume.gender ?? "").toLowerCase();
    const genderColor = GENDER_COLORS[genderKey] ?? "text-[var(--text-muted)] bg-[rgba(255,255,255,0.05)]";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.4) }}
            className="group"
        >
            <Link href={`/perfume/${perfume.slug}`} prefetch={false}>
                <div className="relative rounded-2xl overflow-hidden border border-[var(--bg-glass-border)] hover:border-[rgba(139,92,246,0.35)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(139,92,246,0.18)] hover:-translate-y-1 glass">
                    {/* Image */}
                    <div className="relative h-44 bg-gradient-to-b from-[rgba(139,92,246,0.06)] to-transparent flex items-center justify-center">
                        {perfume.image_url ? (
                            <Image
                                src={perfume.image_url}
                                alt={perfume.name}
                                fill
                                sizes="(max-width:768px) 50vw, 200px"
                                className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                                unoptimized
                            />
                        ) : (
                            <span className="text-5xl opacity-30">🧴</span>
                        )}
                        {/* Gender badge */}
                        {perfume.gender && (
                            <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${genderColor}`}>
                                {perfume.gender}
                            </span>
                        )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-0.5 truncate">
                            {perfume.brand}
                        </p>
                        <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug line-clamp-2 mb-2">
                            {perfume.name}
                        </h3>
                        {/* Accords */}
                        <div className="flex flex-wrap gap-1">
                            {perfume.accords.slice(0, 3).map((a) => (
                                <span key={a} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(139,92,246,0.1)] text-[var(--text-muted)] capitalize">
                                    {a}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// ── Filter panel ──────────────────────────────────────────────────────────────
function FilterPanel({
    brands, accords, activeFilters, onSetFilter, onClearAll,
}: {
    brands: string[];
    accords: string[];
    activeFilters: ActiveFilters;
    onSetFilter: (key: keyof ActiveFilters, value: string | null) => void;
    onClearAll: () => void;
}) {
    const GENDERS = ["men", "women", "unisex"];
    const hasFilters = Object.values(activeFilters).some(Boolean);

    return (
        <div className="space-y-6">
            {hasFilters && (
                <button
                    onClick={onClearAll}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#EF4444] hover:underline"
                >
                    <X size={12} /> Clear all filters
                </button>
            )}

            {/* Gender */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Gender</p>
                <div className="flex flex-col gap-1">
                    {GENDERS.map((g) => (
                        <button
                            key={g}
                            onClick={() => onSetFilter("gender", activeFilters.gender === g ? null : g)}
                            className={`text-left px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${activeFilters.gender === g
                                ? "bg-[rgba(139,92,246,0.2)] text-[var(--accent)] border border-[rgba(139,92,246,0.35)]"
                                : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)]"
                                }`}
                        >
                            {g === "men" ? "👤 Men" : g === "women" ? "💐 Women" : "⚡ Unisex"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Accords */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Accord</p>
                <div className="flex flex-wrap gap-1.5">
                    {accords.map((a) => (
                        <button
                            key={a}
                            onClick={() => onSetFilter("accord", activeFilters.accord === a ? null : a)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize transition-all border ${activeFilters.accord === a
                                ? "bg-[rgba(139,92,246,0.2)] border-[rgba(139,92,246,0.4)] text-[var(--accent)]"
                                : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[rgba(139,92,246,0.25)]"
                                }`}
                        >
                            {a}
                        </button>
                    ))}
                </div>
            </div>

            {/* Brand */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Brand</p>
                <div className="max-h-56 overflow-y-auto space-y-0.5 [scrollbar-width:none]">
                    {brands.map((b) => (
                        <button
                            key={b}
                            onClick={() => onSetFilter("brand", activeFilters.brand === b ? null : b)}
                            className={`w-full text-left px-2 py-1 rounded-lg text-xs transition-all truncate ${activeFilters.brand === b
                                ? "text-[var(--accent)] font-semibold bg-[rgba(139,92,246,0.1)]"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]"
                                }`}
                        >
                            {b}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main client ───────────────────────────────────────────────────────────────
export function EncyclopediaClient({ perfumes, brands, accords, totalCount, totalPages, currentPage, activeFilters }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState("");
    const [sidebarOpen, setSidebar] = useState(false);

    // Infinite Scroll State
    const [loadedPerfumes, setLoadedPerfumes] = useState(perfumes);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(totalPages > 1);

    const { ref: observerRef, inView } = useInView({
        threshold: 0.1,
        rootMargin: "400px",
    });

    // Reset when props (e.g. initial fetch) change
    useEffect(() => {
        setLoadedPerfumes(perfumes);
        setPage(1);
        setHasMore(totalPages > 1);
    }, [perfumes, activeFilters, totalPages]);

    // Trigger load more
    const loadNextPage = useCallback(async () => {
        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const newItems = await getPerfumesPage(nextPage, {
                brand: activeFilters.brand || undefined,
                gender: activeFilters.gender || undefined,
                accord: activeFilters.accord || undefined,
            });

            if (newItems.length > 0) {
                setLoadedPerfumes(prev => {
                    const existing = new Set(prev.map(p => p.id));
                    return [...prev, ...newItems.filter(n => !existing.has(n.id))];
                });
                setPage(nextPage);
            }
            if (newItems.length === 0 || newItems.length < 60) {
                setHasMore(false);
            }
        } catch (e) {
            console.error("Failed to load more perfumes", e);
        } finally {
            setLoadingMore(false);
        }
    }, [page, activeFilters]);

    useEffect(() => {
        if (inView && hasMore && !loadingMore && !query) {
            loadNextPage();
        }
    }, [inView, hasMore, loadingMore, query, loadNextPage]);

    // Client-side text search on top of loaded results
    const filtered = useMemo(() => {
        if (!query.trim()) return loadedPerfumes;
        const q = query.toLowerCase();
        return loadedPerfumes.filter(
            (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
        );
    }, [loadedPerfumes, query]);

    const navigate = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams();
        const merged = { ...activeFilters, ...updates };
        // We drop 'page' param from URL entirely since we infinite scroll now
        Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
        router.push(`${pathname}?${params.toString()}`);
    }, [activeFilters, pathname, router]);

    const setFilter = (key: keyof ActiveFilters, value: string | null) => navigate({ [key]: value });
    const clearAll = () => { navigate({ brand: null, gender: null, accord: null }); setQuery(""); };

    const hasFilters = Object.values(activeFilters).some(Boolean);

    return (
        <div className="min-h-screen">
            {/* ── Page Header ────────────────────────────────────────────── */}
            <div className="px-4 md:px-6 pt-6 pb-4">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(139,92,246,0.15)]">
                        <BookOpen size={17} className="text-[var(--accent)]" />
                    </div>
                    <h1 className="text-2xl font-black text-[var(--text-primary)]">Perfume Encyclopedia</h1>
                </div>
                <p className="text-sm text-[var(--text-muted)] ml-12">
                    {totalCount.toLocaleString()} fragrances · explore, filter, discover
                </p>
            </div>

            {/* ── Search + controls ─────────────────────────────────────── */}
            <div className="px-4 md:px-6 mb-4 flex gap-2">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name or brand…"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] text-[var(--text-primary)] outline-none focus:border-[rgba(139,92,246,0.5)] placeholder:text-[var(--text-muted)]"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X size={14} className="text-[var(--text-muted)]" />
                        </button>
                    )}
                </div>
                {/* Mobile filter toggle */}
                <button
                    onClick={() => setSidebar(!sidebarOpen)}
                    className={`md:hidden flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${hasFilters || sidebarOpen
                        ? "bg-[rgba(139,92,246,0.15)] border-[rgba(139,92,246,0.3)] text-[var(--accent)]"
                        : "bg-[var(--bg-glass)] border-[var(--bg-glass-border)] text-[var(--text-secondary)]"
                        }`}
                >
                    <SlidersHorizontal size={14} />
                    {hasFilters ? "Filters ✦" : "Filter"}
                </button>
            </div>

            {/* Active filter chips */}
            {hasFilters && (
                <div className="px-4 md:px-6 mb-3 flex flex-wrap gap-2">
                    {Object.entries(activeFilters).map(([k, v]) => v ? (
                        <span key={k}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.3)] text-[var(--accent)]"
                        >
                            <span className="capitalize">{v}</span>
                            <button onClick={() => setFilter(k as keyof ActiveFilters, null)}>
                                <X size={11} />
                            </button>
                        </span>
                    ) : null)}
                </div>
            )}

            {/* ── Body: sidebar + grid ──────────────────────────────────── */}
            <div className="flex px-4 md:px-6 gap-6">
                {/* Desktop filter sidebar */}
                <aside className="hidden md:block w-52 shrink-0">
                    <div className="sticky top-[72px] rounded-2xl p-4 glass border border-[var(--bg-glass-border)]">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={13} className="text-[var(--accent)]" />
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Filters</span>
                        </div>
                        <FilterPanel brands={brands} accords={accords} activeFilters={activeFilters}
                            onSetFilter={setFilter} onClearAll={clearAll} />
                    </div>
                </aside>

                {/* Mobile filter drawer */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="md:hidden fixed inset-x-0 top-[60px] bottom-0 z-50 overflow-y-auto p-4 bg-[var(--bg-surface)]/95 backdrop-blur-2xl border-r border-[var(--bg-glass-border)]"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-bold text-[var(--text-primary)]">Filters</span>
                                <button onClick={() => setSidebar(false)}><X size={18} className="text-[var(--text-muted)]" /></button>
                            </div>
                            <FilterPanel brands={brands} accords={accords} activeFilters={activeFilters}
                                onSetFilter={(k, v) => { setFilter(k, v); setSidebar(false); }} onClearAll={() => { clearAll(); setSidebar(false); }} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main grid */}
                <main className="flex-1 min-w-0">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
                            <span className="text-4xl mb-3">🔍</span>
                            <p className="font-semibold">No perfumes found</p>
                            <p className="text-sm mt-1">Try a different search or clear your filters.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
                                {filtered.map((p, i) => <PerfumeCard key={p.id} perfume={p} index={i} />)}
                            </div>

                            {/* Infinite Scroll Loader */}
                            {!query && hasMore && (
                                <div ref={observerRef} className="flex flex-col items-center justify-center py-12">
                                    <div className="w-8 h-8 rounded-full border-2 border-[rgba(139,92,246,0.3)] border-t-[var(--accent)] animate-spin mb-4"></div>
                                    <span className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase font-bold">Summoning more fragrances...</span>
                                </div>
                            )}

                            {!query && !hasMore && loadedPerfumes.length > 0 && (
                                <div className="text-center py-16 text-xs text-[var(--text-muted)]">
                                    — You have reached the bottom of the encyclopedia —
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
