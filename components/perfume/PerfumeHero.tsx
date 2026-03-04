"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Star, Droplets } from "lucide-react";

interface PerfumeHeroProps {
  perfume: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
    transparentImageUrl: string | null;
    release_year: number | null;
    gender: string | null;
    accords: string[];
    top_notes: string[];
  };
  avgRating: number;
  reviewCount: number;
  avgLongevity: number;
  avgSillage: number;
}

export function PerfumeHero({
  perfume,
  avgRating,
  reviewCount,
  avgLongevity,
  avgSillage,
}: PerfumeHeroProps) {
  const shouldReduceMotion = useReducedMotion();

  const displayImage = perfume.transparentImageUrl || perfume.image_url;

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
      className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-[var(--bg-glass-border)] bg-gradient-to-br from-gray-50 to-white dark:from-[rgba(15,23,42,0.96)] dark:to-[rgba(15,23,42,0.96)] dark:bg-[radial-gradient(circle_at_top,_rgba(232,67,147,0.16)_0,_transparent_55%)] shadow-sm dark:shadow-[var(--shadow-glass)] px-5 py-6 sm:px-7 sm:py-7 lg:px-9 lg:py-8"
    >
      <div className="pointer-events-none absolute -top-12 -right-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.28)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18)_0%,transparent_70%)]" />

      <div className="relative grid items-center gap-7 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Studio Lightbox Bottle */}
        <motion.div
          className="flex items-center justify-center"
          whileHover={
            shouldReduceMotion
              ? undefined
              : { y: -6, rotate: -1.5, transition: { type: "spring", stiffness: 260, damping: 30 } }
          }
        >
          {displayImage ? (
            <div
              className={`relative w-full aspect-square md:aspect-[4/5] rounded-[2.5rem] flex items-center justify-center p-8 group ${
                perfume.transparentImageUrl
                  ? "bg-gradient-to-b from-brand-900/40 to-black border border-brand-500/20 shadow-[0_0_50px_-15px_rgba(232,67,147,0.3)]"
                  : "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"
              }`}
            >
              {perfume.transparentImageUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1/2 h-1/2 bg-brand-500/20 blur-[100px] rounded-full" />
                </div>
              )}
              <Image
                src={displayImage}
                alt={perfume.name}
                fill
                className={`object-contain group-hover:scale-105 transition-transform duration-700 ease-out ${
                  perfume.transparentImageUrl ? "" : "drop-shadow-xl"
                }`}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {perfume.release_year && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    In rotation
                  </span>
                  <span className="text-[10px] text-white/60">Est. {perfume.release_year}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full max-w-xs aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-white/20">
              <span className="text-7xl text-[var(--text-muted)]"><Droplets className="w-16 h-16" /></span>
            </div>
          )}
        </motion.div>

        {/* Meta + stats */}
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300/70">
                {perfume.brand}
              </p>
              {genderLabel && (
                <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-100/90 backdrop-blur">
                  {genderLabel}
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {perfume.name}
            </h1>
            {reviewCount > 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300/80">
                Based on {reviewCount} review{reviewCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Rating + wardrobe */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-black/30 px-2.5 py-1.5 text-slate-700 dark:text-slate-100">
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
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-300/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/5 px-2 py-0.5">
                <span className="h-1 w-1 rounded-full bg-sky-400" />
                Longevity index {Math.max(1, Math.round(avgLongevity))}/10
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/5 px-2 py-0.5">
                <span className="h-1 w-1 rounded-full bg-brand-400" />
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
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-[rgba(15,23,42,0.85)] px-2.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-100 shadow-[0_0_0_1px_rgba(148,163,184,0.2)] dark:shadow-[0_0_0_1px_rgba(148,163,184,0.35)]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-indigo-400 via-sky-400 to-brand-400" />
                      {accord}
                    </span>
                  ))}
                </div>
              )}

              {topNotes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-200/90">
                  <span className="mr-1 text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-400/80">
                    Top notes
                  </span>
                  {topNotes.map((note) => (
                    <span
                      key={note}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/5 px-2 py-0.5 text-[11px]"
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
