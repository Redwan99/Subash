"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { AddToWardrobeButton } from "@/components/perfume/AddToWardrobeButton";

interface PerfumeHeroProps {
  perfume: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    release_year: number | null;
    gender: string | null;
    accords: string[];
    top_notes: string[];
  };
  avgRating: number;
  reviewCount: number;
  avgLongevity: number;
  avgSillage: number;
  initialShelf: string | null;
  isSignedIn: boolean;
}

export function PerfumeHero({
  perfume,
  avgRating,
  reviewCount,
  avgLongevity,
  avgSillage,
  initialShelf,
  isSignedIn,
}: PerfumeHeroProps) {
  const shouldReduceMotion = useReducedMotion();

  const genderLabel = perfume.gender
    ?.replace("for ", "")
    .replace("women and men", "Unisex")
    .replace("women", "For Women")
    .replace("men", "For Men");

  const accords = (perfume.accords || []).slice(0, 4);
  const topNotes = (perfume.top_notes || []).slice(0, 3);

  return (
    <motion.section
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-[var(--bg-glass-border)] bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.16)_0,_transparent_55%),_linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.96))] shadow-[var(--shadow-glass)] px-5 py-6 sm:px-7 sm:py-7 lg:px-9 lg:py-8"
    >
      <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.28)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18)_0%,transparent_70%)]" />

      <div className="relative grid items-center gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Bottle */}
        <motion.div
          className="flex items-center justify-center"
          whileHover={
            shouldReduceMotion
              ? undefined
              : { y: -6, rotate: -1.5, transition: { type: "spring", stiffness: 260, damping: 30 } }
          }
        >
          <div className="relative w-full max-w-xs rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.14)_0,rgba(15,23,42,0.96)_55%)] px-6 py-7 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.8)]">
            <div className="pointer-events-none absolute inset-x-8 top-6 h-24 rounded-full bg-[radial-gradient(circle,rgba(248,250,252,0.22)_0,transparent_70%)] opacity-80" />
            <div className="relative flex h-56 items-center justify-center">
              {perfume.image_url ? (
                <Image
                  src={perfume.image_url}
                  alt={perfume.name}
                  width={260}
                  height={300}
                  className="h-full w-auto max-h-56 object-contain drop-shadow-[0_18px_45px_rgba(0,0,0,0.65)]"
                  priority
                />
              ) : (
                <span className="text-6xl">🧴</span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-semibold text-slate-200/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                In rotation
              </span>
              {perfume.release_year && (
                <span className="text-[10px] text-slate-300/70">Est. {perfume.release_year}</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Meta + stats */}
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300/70">
                {perfume.brand}
              </p>
              {genderLabel && (
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-100/90 backdrop-blur">
                  {genderLabel}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {perfume.name}
            </h1>
            {reviewCount > 0 && (
              <p className="mt-1 text-xs text-slate-300/80">
                Based on {reviewCount} review{reviewCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Rating + wardrobe */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 text-slate-100">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={avgRating >= i - 0.25 ? "currentColor" : "none"}
                    className={
                      avgRating >= i - 0.25
                        ? "text-[var(--accent)] drop-shadow-[0_0_12px_rgba(129,140,248,0.75)]"
                        : "text-slate-600"
                    }
                  />
                ))}
              </div>
              <span className="text-xs font-semibold">
                {avgRating ? avgRating.toFixed(1) : "No ratings yet"}
              </span>
            </div>

            {isSignedIn && (
              <div className="ml-1">
                <AddToWardrobeButton perfumeId={perfume.id} initialShelf={initialShelf} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-300/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                <span className="h-1 w-1 rounded-full bg-sky-400" />
                Longevity index {Math.max(1, Math.round(avgLongevity))}/10
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                Sillage index {Math.max(1, Math.round(avgSillage))}/10
              </span>
            </div>
          </div>

          {/* Accords & notes */}
          {(accords.length > 0 || topNotes.length > 0) && (
            <div className="space-y-3">
              {accords.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {accords.map((accord) => (
                    <span
                      key={accord}
                      className="inline-flex items-center gap-1 rounded-full bg-[rgba(15,23,42,0.85)] px-2.5 py-0.5 text-[11px] text-slate-100 shadow-[0_0_0_1px_rgba(148,163,184,0.35)]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-indigo-400 via-sky-400 to-emerald-400" />
                      {accord}
                    </span>
                  ))}
                </div>
              )}

              {topNotes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-200/90">
                  <span className="mr-1 text-[10px] uppercase tracking-[0.18em] text-slate-400/80">
                    Top notes
                  </span>
                  {topNotes.map((note) => (
                    <span
                      key={note}
                      className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px]"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
