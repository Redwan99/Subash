"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star, CheckCircle2, Clock, Heart, Droplet } from "lucide-react";
import { AddToWardrobeButton } from "@/components/perfume/AddToWardrobeButton";
import { addToWardrobe } from "@/lib/actions/reviews";

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
  const [activeShelf, setActiveShelf] = useState<string | null>(initialShelf ?? null);
  const [isPending, startTransition] = useTransition();

  const displayImage = perfume.transparentImageUrl || perfume.image_url;

  const handleShelf = (shelf: "HAVE" | "HAD" | "WANT") => {
    if (!isSignedIn) return;
    startTransition(async () => {
      const result = await addToWardrobe(perfume.id, shelf);
      if (result.success) setActiveShelf(shelf);
    });
  };

  const handleWearingToday = () => {
    window.dispatchEvent(new Event("open-status-modal"));
  };

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
                  ? "bg-gradient-to-b from-brand-900/40 to-black border border-brand-500/20 shadow-[0_0_50px_-15px_rgba(16,185,129,0.3)]"
                  : "bg-white/5 border border-white/10"
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
              <span className="text-7xl">🧴</span>
            </div>
          )}
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

      {/* ── Wardrobe Action Bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 mt-6 bg-white/5 dark:bg-black/40 backdrop-blur-2xl border border-[var(--bg-glass-border)] rounded-2xl shadow-xl">
        <div className="flex flex-1 items-center gap-1">
          {/* I have it */}
          <button
            onClick={() => handleShelf("HAVE")}
            disabled={isPending || !isSignedIn}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors group disabled:opacity-50 ${
              activeShelf === "HAVE"
                ? "bg-brand-500/15 text-brand-500"
                : "hover:bg-brand-500/10 text-gray-400 hover:text-brand-500"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider">I have it</span>
          </button>

          {/* I had it */}
          <button
            onClick={() => handleShelf("HAD")}
            disabled={isPending || !isSignedIn}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors group disabled:opacity-50 ${
              activeShelf === "HAD"
                ? "bg-sky-500/15 text-sky-400"
                : "hover:bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Clock className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider">I had it</span>
          </button>

          {/* I want it */}
          <button
            onClick={() => handleShelf("WANT")}
            disabled={isPending || !isSignedIn}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors group disabled:opacity-50 ${
              activeShelf === "WANT"
                ? "bg-pink-500/15 text-pink-400"
                : "hover:bg-pink-500/10 text-gray-400 hover:text-pink-500"
            }`}
          >
            <Heart className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider">I want it</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-white/10 hidden sm:block mx-1" />

        {/* Wearing Today CTA */}
        <button
          onClick={handleWearingToday}
          className="flex-shrink-0 flex items-center gap-2 py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all active:scale-95 w-full sm:w-auto justify-center mt-2 sm:mt-0"
        >
          <Droplet className="w-4 h-4" />
          Wearing Today
        </button>
      </div>
    </motion.section>
  );
}
