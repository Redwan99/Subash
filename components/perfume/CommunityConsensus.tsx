"use client";
// components/perfume/CommunityConsensus.tsx
// Community consensus panel: Verdict bars + Season/Time mini-cards.
// Placeholder percentages until the voting backend is wired.

import { motion, useReducedMotion } from "framer-motion";

type ConsensusProps = {
  reviewCount: number;
  avgRating: number; // 1–5 scale from ReviewForm
};

const SEASONS = [
  { key: "spring", label: "Spring", emoji: "🌸" },
  { key: "summer", label: "Summer", emoji: "☀️" },
  { key: "autumn", label: "Autumn", emoji: "🍂" },
  { key: "winter", label: "Winter", emoji: "❄️" },
];

const TIMES = [
  { key: "morning", label: "Morning", emoji: "🌅" },
  { key: "day",      label: "Day",      emoji: "🌤️" },
  { key: "evening",  label: "Evening",  emoji: "🌇" },
  { key: "night",    label: "Night",    emoji: "🌙" },
  { key: "anytime",  label: "Anytime",  emoji: "⚡" },
];

// Derive rough community verdict from avg rating
function deriveVerdictBars(avgRating: number, reviewCount: number) {
  if (reviewCount === 0) return null;

  const total = reviewCount;
  // Approximate dist based on avg. Placeholder until real vote tallying exists.
  const love    = Math.round(total * Math.max(0, (avgRating - 4) / 1) * 0.8);
  const like    = Math.round(total * Math.min(0.5, (avgRating / 5) * 0.4));
  const ok      = Math.round(total * 0.15);
  const mixed   = Math.round(total * Math.max(0, (3 - avgRating) * 0.12));
  const dislike = Math.max(0, total - love - like - ok - mixed);

  return [
    { label: "Love it",  count: love,    color: "bg-brand-500",   textColor: "text-brand-400" },
    { label: "Like it",  count: like,    color: "bg-brand-300",   textColor: "text-brand-300" },
    { label: "It's OK",  count: ok,      color: "bg-slate-400",   textColor: "text-slate-400" },
    { label: "Mixed",    count: mixed,   color: "bg-amber-400",   textColor: "text-amber-400" },
    { label: "Dislike",  count: dislike, color: "bg-rose-500",    textColor: "text-rose-400"  },
  ];
}

// Placeholder season/time consensus — later driven by review weather_tags / time_tags
const ACTIVE_SEASONS = ["winter", "autumn"];
const ACTIVE_TIMES   = ["night"];

export function CommunityConsensus({ reviewCount, avgRating }: ConsensusProps) {
  const shouldReduceMotion = useReducedMotion();
  const verdictBars = deriveVerdictBars(avgRating, reviewCount);

  if (reviewCount === 0) return null;

  const total = reviewCount;

  return (
    <div className="rounded-3xl border border-[var(--bg-glass-border)] bg-[var(--bg-glass)] backdrop-blur-xl p-6 shadow-[var(--shadow-glass)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)] mb-5">
        Community Consensus · {total} review{total !== 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── Verdict ───────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">
            Verdict
          </p>
          {verdictBars?.map((bar) => {
            const pct = total > 0 ? Math.round((bar.count / total) * 100) : 0;
            return (
              <div key={bar.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-[var(--text-secondary)]">{bar.label}</span>
                  <span className={`font-bold tabular-nums ${bar.textColor}`}>{pct}%</span>
                </div>
                <div className="h-[3px] w-full rounded-full bg-[var(--bg-glass-border)] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${bar.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }
                    }
                    style={{
                      boxShadow: pct > 10 ? `0 0 8px var(--tw-shadow-color, rgba(16,185,129,0.4))` : "none",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Season & Time ─────────────────────────── */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
              Best Season
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SEASONS.map(({ key, label, emoji }) => {
                const active = ACTIVE_SEASONS.includes(key);
                return (
                  <div
                    key={key}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl border text-center transition-all duration-200 ${
                      active
                        ? "bg-brand-500/10 border-brand-500/50 shadow-[0_0_14px_rgba(16,185,129,0.25)]"
                        : "bg-white/[0.03] border-[var(--bg-glass-border)] opacity-50"
                    }`}
                  >
                    <span className="text-lg leading-none">{emoji}</span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider leading-none ${
                        active ? "text-brand-400" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
              Best Time of Day
            </p>
            <div className="flex flex-wrap gap-2">
              {TIMES.map(({ key, label, emoji }) => {
                const active = ACTIVE_TIMES.includes(key);
                return (
                  <div
                    key={key}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-3 rounded-2xl border text-center transition-all duration-200 min-w-[120px] ${
                      active
                        ? "bg-brand-500/10 border-brand-500/50 shadow-[0_0_14px_rgba(16,185,129,0.25)]"
                        : "bg-white/[0.03] border-[var(--bg-glass-border)] opacity-50"
                    }`}
                  >
                    <span className="text-2xl leading-none">{emoji}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        active ? "text-brand-400" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
