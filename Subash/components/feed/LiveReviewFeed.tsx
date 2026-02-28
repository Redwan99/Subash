"use client";
// components/feed/LiveReviewFeed.tsx
// Phase 13 — Live Review Feed powered by SWR (polls /api/reviews every 5 seconds)
// New reviews slide in via Framer Motion AnimatePresence without disrupting scroll.

import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Wind, Thermometer, Zap } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { VerifiedNoseBadge } from "@/components/ui/VerifiedNoseBadge";

// ── Types ─────────────────────────────────────────────────────────────────────
type ReviewUser = { id: string; name: string | null; image: string | null; reputationScore?: number };
type ReviewPerfume = { id: string; name: string; brand: string; image_url: string | null; slug: string };

export type LiveReview = {
    id: string;
    text: string;
    overall_rating: number;
    longevity_score: number;
    sillage_score: number;
    time_tags: string[];
    weather_tags: string[];
    upvote_count: number;
    createdAt: string;
    user: ReviewUser;
    perfume: ReviewPerfume;
};

// ── Star Row ──────────────────────────────────────────────────────────────────
function StarRow({ rating, max = 10 }: { rating: number; max?: number }) {
    const filled = Math.round((rating / max) * 5);
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={11}
                    fill={i <= filled ? "currentColor" : "none"}
                    className={i <= filled ? "text-[var(--accent)]" : "text-[var(--border-color)]"}
                />
            ))}
            <span className="ml-1 text-[11px] font-bold text-[var(--accent)]">{rating.toFixed(1)}</span>
        </div>
    );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, isNew }: { review: LiveReview; isNew: boolean }) {
    const initials = (review.user.name ?? "?")
        .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

    const timeAgo = (() => {
        const diff = Date.now() - new Date(review.createdAt).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return "just now";
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    })();

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`relative rounded-2xl p-4 border transition-colors duration-300 glass overflow-hidden ${isNew
                ? "border-[rgba(139,92,246,0.4)] shadow-[0_0_24px_rgba(139,92,246,0.15)]"
                : "border-[var(--bg-glass-border)]"
                }`}
        >
            {/* NEW flash banner */}
            {isNew && (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 3, duration: 1 }}
                    className="absolute top-0 left-0 right-0 h-[2px] bg-[linear-gradient(90deg,transparent,#8B5CF6,#A78BFA,transparent)]"
                />
            )}

            <div className="flex gap-3">
                {/* Perfume thumb */}
                <Link href={`/perfume/${review.perfume.slug}`} className="shrink-0">
                    <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-[rgba(139,92,246,0.08)] border border-[var(--bg-glass-border)]">
                        {review.perfume.image_url ? (
                            <Image
                                src={review.perfume.image_url}
                                alt={review.perfume.name}
                                fill sizes="48px"
                                className="object-contain p-1"
                                unoptimized
                            />
                        ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-xl opacity-20">🧴</span>
                        )}
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    {/* Perfume name */}
                    <Link href={`/perfume/${review.perfume.slug}`} className="group">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] truncate">
                            {review.perfume.brand}
                        </p>
                        <h3 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                            {review.perfume.name}
                        </h3>
                    </Link>

                    {/* Rating */}
                    <div className="mt-1">
                        <StarRow rating={review.overall_rating} />
                    </div>
                </div>

                {/* Time */}
                <div className="shrink-0 flex items-start gap-1 text-[10px] text-[var(--text-muted)]">
                    <Clock size={10} className="mt-0.5" />
                    {timeAgo}
                </div>
            </div>

            {/* Review text */}
            <p className="mt-3 text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                {review.text}
            </p>

            {/* Stats row */}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
                {/* Longevity */}
                <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <Clock size={10} className="text-[#60A5FA]" />
                    <span>Longevity <strong className="text-[var(--text-secondary)]">{review.longevity_score}/10</strong></span>
                </div>
                {/* Sillage */}
                <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <Wind size={10} className="text-[#34D399]" />
                    <span>Sillage <strong className="text-[var(--text-secondary)]">{review.sillage_score}/10</strong></span>
                </div>

                {/* Weather tags */}
                {review.weather_tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(139,92,246,0.08)] text-[var(--text-muted)] capitalize">
                        <Thermometer size={8} /> {tag.toLowerCase()}
                    </span>
                ))}
                {/* Time tags */}
                {review.time_tags.slice(0, 1).map((tag) => (
                    <span key={tag} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(245,158,11,0.08)] text-[#F59E0B] capitalize">
                        <Zap size={8} /> {tag.replace("_", " ").toLowerCase()}
                    </span>
                ))}
            </div>

            {/* User row */}
            <div className="mt-3 pt-3 border-t border-[var(--bg-glass-border)] flex items-center gap-2">
                {review.user.image ? (
                    <Image src={review.user.image} alt={review.user.name ?? ""} width={20} height={20} className="rounded-full" />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-[linear-gradient(135deg,#8B5CF6,#6D28D9)] flex items-center justify-center text-[8px] font-black text-white">
                        {initials}
                    </div>
                )}
                <span className="text-[10px] text-[var(--text-muted)]">{review.user.name ?? "Anonymous"}</span>
                <VerifiedNoseBadge score={review.user.reputationScore ?? 0} />
            </div>
        </motion.article>
    );
}

// ── Main Live Feed ─────────────────────────────────────────────────────────────
export function LiveReviewFeed({ initialReviews = [] }: { initialReviews?: LiveReview[] }) {
    const { data, error, isLoading } = useSWR<LiveReview[]>(
        "/api/reviews",
        fetcher,
        {
            refreshInterval: 5000,         // silent background poll
            fallbackData: initialReviews,  // SSR data — no loading flash
            revalidateOnFocus: true,
            dedupingInterval: 4000,
        }
    );

    const reviews = data ?? [];

    return (
        <section className="space-y-3">
            {/* Header — title only, no status indicators */}
            <div className="flex items-center gap-2">
                <Zap size={14} className="text-[var(--accent)]" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">Community Reviews</h2>
            </div>

            {/* Feed */}
            {isLoading && reviews.length === 0 ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl h-36 glass border border-[var(--bg-glass-border)] animate-pulse" />
                    ))}
                </div>
            ) : error && reviews.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
                    <Star size={28} className="mb-2 opacity-20" />
                    <p className="text-sm">Reviews unavailable right now.</p>
                </div>
            ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-[var(--text-muted)]">
                    <Star size={28} className="mb-2 opacity-20" />
                    <p className="text-sm">No reviews yet. Be the first!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {reviews.map((review) => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                isNew={false}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </section>
    );
}
