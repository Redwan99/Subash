"use client";

import { useState, useEffect } from "react";
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
                <div className="flex p-1 bg-[rgba(255,255,255,0.03)] rounded-lg">
                    {(["today", "week", "month"] as Timeframe[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setTimeframe(tab)}
                            className={`flex-1 text-[10px] font-bold py-1.5 uppercase rounded-md transition-colors ${timeframe === tab
                                    ? "bg-[rgba(139,92,246,0.15)] text-[var(--accent)] shadow-sm"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-3 space-y-4">
                {loading ? (
                    <div className="h-40 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={timeframe}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* Top Perfumes */}
                            <div>
                                <h3 className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2 px-1">
                                    Most Reviewed (Top 10)
                                </h3>
                                <div className="space-y-1">
                                    {perfumes.length > 0 ? (
                                        perfumes.map((p, i) => (
                                            <Link key={p.id} href={`/perfume/${p.slug}`} prefetch={false}>
                                                <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[rgba(139,92,246,0.08)] transition-colors">
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
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] shrink-0">
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

                            {/* Top Users */}
                            <div>
                                <h3 className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-2 px-1">
                                    Top Reviewers (Top 50)
                                </h3>
                                {users.length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto pr-1 space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                        {users.map((u, i) => (
                                            <div
                                                key={u.id}
                                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                                            >
                                                <span className="text-[10px] font-bold w-4 text-center text-[#34D399] shrink-0">
                                                    {i + 1}
                                                </span>
                                                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                                                    {u.image ? (
                                                        <Image src={u.image} alt={u.name} width={20} height={20} className="object-cover" />
                                                    ) : (
                                                        <UserIcon size={12} className="text-[var(--text-muted)]" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-[var(--text-primary)] font-medium truncate flex-1 block">
                                                    {u.name}
                                                </span>
                                                <div className="flex items-center gap-1 shrink-0 bg-[#34D399]/10 px-1.5 py-0.5 rounded">
                                                    <Award size={9} className="text-[#34D399]" />
                                                    <span className="text-[9px] font-bold text-[#34D399]">{u.reviewCount}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-[var(--text-muted)] p-2">No active reviewers.</p>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
