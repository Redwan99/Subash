"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Award, Trophy, User as UserIcon } from "lucide-react";

type Timeframe = "today" | "week" | "month";

interface TopPerfume {
    id: string;
    reviewCount: number;
    name: string;
    brand: string;
    slug: string;
    image_url: string | null;
}

interface TopUser {
    id: string;
    reviewCount: number;
    name: string;
    image: string | null;
}

export function LeaderboardWidget() {
    const [timeframe, setTimeframe] = useState<Timeframe>("week");
    const [listView, setListView] = useState<"perfumes" | "reviewers">("perfumes");
    const [perfumes, setPerfumes] = useState<TopPerfume[]>([]);
    const [users, setUsers] = useState<TopUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/leaderboard?timeframe=${timeframe}`)
            .then((res) => res.json())
            .then((data) => {
                setPerfumes(data.topPerfumes || []);
                setUsers(data.topUsers || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [timeframe]);

    return (
        <div className="mx-4 mb-4 rounded-xl bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--border-color)] overflow-hidden">
            {/* Header & Tabs */}
            <div className="p-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-3">
                    <Trophy size={14} className="text-[#F59E0B]" />
                    <h2 className="text-xs font-bold tracking-widest uppercase text-[#F59E0B]">
                        Leaderboards
                    </h2>
                </div>
                <div className="flex p-1 bg-gray-100 dark:bg-[rgba(255,255,255,0.03)] rounded-lg">
                    {(["today", "week", "month"] as Timeframe[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setTimeframe(tab)}
                            className={`flex-1 text-[10px] font-bold py-1.5 uppercase rounded-md transition-colors ${timeframe === tab
                                    ? "bg-[rgba(232,67,147,0.15)] text-[var(--accent)] shadow-sm"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex p-1 bg-gray-100 dark:bg-[rgba(255,255,255,0.03)] rounded-lg mt-2">
                    {(["perfumes", "reviewers"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setListView(tab)}
                            className={`flex-1 text-[10px] font-bold py-1.5 capitalize rounded-md transition-colors ${listView === tab
                                    ? "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] shadow-sm"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            {tab === "perfumes" ? "Top Perfumes" : "Top Reviewers"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-3 flex-1 min-h-0 relative">
                {loading ? (
                    <div className="h-40 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                    </div>
                ) : (
                    <LeaderboardScrollArea timeframe={timeframe} listView={listView} perfumes={perfumes} users={users} />
                )}
            </div>
        </div>
    );
}

function LeaderboardScrollArea({ timeframe, listView, perfumes, users }: { timeframe: string; listView: string; perfumes: TopPerfume[]; users: TopUser[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [fadeTop, setFadeTop] = useState(false);
    const [fadeBottom, setFadeBottom] = useState(false);

    const updateFade = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setFadeTop(el.scrollTop > 4);
        setFadeBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateFade();
        el.addEventListener("scroll", updateFade, { passive: true });
        return () => el.removeEventListener("scroll", updateFade);
    }, [timeframe, listView, updateFade]);

    return (
        <div className="relative h-full">
            <div
                className="pointer-events-none absolute top-0 left-0 right-0 h-6 z-10 transition-opacity duration-300"
                style={{ opacity: fadeTop ? 1 : 0, background: "linear-gradient(to bottom, var(--bg-glass), transparent)" }}
            />
            <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 z-10 transition-opacity duration-300"
                style={{ opacity: fadeBottom ? 1 : 0, background: "linear-gradient(to top, var(--bg-glass), transparent)" }}
            />
            <div ref={scrollRef} className="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <AnimatePresence mode="wait">
                        <motion.div
                            key={`${timeframe}-${listView}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                        >
                            {listView === "perfumes" ? (
                            <div>
                                <h3 className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2 px-1">
                                    Most Reviewed (Top 10)
                                </h3>
                                <div className="space-y-1">
                                    {perfumes.length > 0 ? (
                                        perfumes.map((p, i) => (
                                            <Link key={p.id} href={`/perfume/${p.slug}`} prefetch={false}>
                                                <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[rgba(232,67,147,0.08)] transition-colors">
                                                    <span className="text-[10px] font-bold w-4 text-center text-[var(--accent)] shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-xs text-[var(--text-primary)] font-medium truncate block">
                                                            {p.name}
                                                        </span>
                                                        <span className="text-[9px] text-[var(--text-muted)] truncate block">
                                                            {p.brand}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] shrink-0">
                                                        {p.reviewCount}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-[var(--text-muted)] p-2">No reviews found.</p>
                                    )}
                                </div>
                            </div>
                            ) : (
                            <div>
                                <h3 className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2 px-1">
                                    Top Reviewers (Top 50)
                                </h3>
                                {users.length > 0 ? (
                                    <div className="space-y-1">
                                        {users.map((u, i) => (
                                            <div
                                                key={u.id}
                                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                                            >
                                                <span className="text-[10px] font-bold w-4 text-center text-[#F783AC] shrink-0">
                                                    {i + 1}
                                                </span>
                                                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                                                    {u.image ? (
                                                        <Image src={u.image} alt={u.name} width={20} height={20} className="object-cover" />
                                                    ) : (
                                                        <UserIcon size={12} className="text-[var(--text-muted)]" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-[var(--text-primary)] font-medium truncate flex-1 block">
                                                    {u.name}
                                                </span>
                                                <div className="flex items-center gap-1 shrink-0 bg-[#F783AC]/10 px-1.5 py-0.5 rounded">
                                                    <Award size={9} className="text-[#F783AC]" />
                                                    <span className="text-[9px] font-bold text-[#F783AC]">{u.reviewCount}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-[var(--text-muted)] p-2">No active reviewers.</p>
                                )}
                            </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
            </div>
        </div>
    );
}
