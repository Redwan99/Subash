"use client";
// components/perfume/CommunityConsensus.tsx
// Community consensus panel: Verdict bars + Season/Time mini-cards.
// Placeholder percentages until the voting backend is wired.

import { motion, useReducedMotion } from "framer-motion";
import { Flower2, Sun, Leaf, Snowflake, Sunrise, SunMedium, Sunset, Moon, Zap, Timer, Volume2, Radio, Gauge, Briefcase, Heart, Coffee, Wine } from "lucide-react";
import { type LucideIcon } from "lucide-react";

type ConsensusProps = {
  reviewCount: number;
  avgRating: number; // 1–10 scale from ReviewForm
  ratingCounts?: { love: number; like: number; ok: number; mixed: number; dislike: number };
  avgLongevity?: number; // 1–10
  avgSillage?: number;   // 1–10
  avgProjection?: number; // 1–10 (actual from reviews)
  avgIntensity?: number;  // 1–10 (actual from reviews)
  activeSeasons?: string[];
  activeTimes?: string[];
  occasionCounts?: Record<string, number>;
};

const SEASONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "spring", label: "Spring", icon: Flower2 },
  { key: "summer", label: "Summer", icon: Sun },
  { key: "autumn", label: "Autumn", icon: Leaf },
  { key: "winter", label: "Winter", icon: Snowflake },
];

const TIMES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "morning", label: "Morning", icon: Sunrise },
  { key: "day",      label: "Day",      icon: SunMedium },
  { key: "evening",  label: "Evening",  icon: Sunset },
  { key: "night",    label: "Night",    icon: Moon },
  { key: "anytime",  label: "Anytime",  icon: Zap },
];

// Derive community verdict from individual review ratings
function deriveVerdictBars(avgRating: number, reviewCount: number, ratingCounts?: { love: number; like: number; ok: number; mixed: number; dislike: number }) {
  if (reviewCount === 0) return null;

  // Use actual counts if provided, otherwise estimate from average
  const love    = ratingCounts?.love    ?? Math.round(reviewCount * Math.max(0, Math.min(1, (avgRating - 4) / 1)));
  const like    = ratingCounts?.like    ?? Math.round(reviewCount * Math.max(0, Math.min(1, avgRating >= 3.5 && avgRating < 4.5 ? 0.6 : avgRating >= 4.5 ? 0.15 : 0.1)));
  const ok      = ratingCounts?.ok      ?? Math.round(reviewCount * Math.max(0, Math.min(1, avgRating >= 2.5 && avgRating < 3.5 ? 0.6 : 0.05)));
  const mixed   = ratingCounts?.mixed   ?? Math.round(reviewCount * Math.max(0, Math.min(1, avgRating >= 1.5 && avgRating < 2.5 ? 0.6 : 0.03)));
  const dislike = ratingCounts?.dislike ?? Math.max(0, reviewCount - love - like - ok - mixed);

  return [
    { label: "Love it",  count: love,    color: "bg-brand-500",   textColor: "text-brand-400" },
    { label: "Like it",  count: like,    color: "bg-brand-300",   textColor: "text-brand-300" },
    { label: "It's OK",  count: ok,      color: "bg-slate-400",   textColor: "text-slate-400" },
    { label: "Mixed",    count: mixed,   color: "bg-amber-400",   textColor: "text-amber-400" },
    { label: "Dislike",  count: dislike, color: "bg-rose-500",    textColor: "text-rose-400"  },
  ];
}

// Occasion metadata
const OCCASIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "office", label: "Office/Work", icon: Briefcase },
  { key: "date",   label: "Date Night",  icon: Heart },
  { key: "casual", label: "Casual/Daily", icon: Coffee },
  { key: "formal", label: "Formal/Event", icon: Wine },
];

const PERF_LABELS = ["Minimal", "Very Weak", "Weak", "Mild", "Moderate", "Noticeable", "Strong", "Very Strong", "Powerful", "Enormous"];

function PerfBar({ label, value, icon: Icon, color, shouldReduceMotion }: {
  label: string; value: number; icon: LucideIcon; color: string; shouldReduceMotion: boolean | null;
}) {
  const pct = Math.max(0, ((value - 1) / 9) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon size={13} style={{ color }} />
          <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {value.toFixed(1)} / 10
          <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1">
            ({PERF_LABELS[Math.min(9, Math.max(0, Math.round(value) - 1))]})
          </span>
        </span>
      </div>
      <div className="h-[3px] w-full rounded-full bg-[var(--bg-glass-border)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function CommunityConsensus({ reviewCount, avgRating, ratingCounts, avgLongevity = 0, avgSillage = 0, avgProjection, avgIntensity, activeSeasons = [], activeTimes = [], occasionCounts = {} }: ConsensusProps) {
  const shouldReduceMotion = useReducedMotion();
  const verdictBars = deriveVerdictBars(avgRating, reviewCount, ratingCounts);

  if (reviewCount === 0) return null;

  const total = reviewCount;
  // Use actual review data if available, otherwise derive from longevity/sillage
  const projection = avgProjection && avgProjection > 0 ? avgProjection : (avgSillage > 0 ? Math.min(10, avgSillage * 0.95 + 0.15) : 0);
  const intensity = avgIntensity && avgIntensity > 0 ? avgIntensity : (avgLongevity > 0 && avgSillage > 0 ? Math.min(10, (avgLongevity * 0.6 + avgSillage * 0.4)) : 0);

  return (
    <div className="rounded-3xl border border-[var(--bg-glass-border)] bg-[var(--bg-glass)] backdrop-blur-xl p-6 shadow-[var(--shadow-glass)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)] mb-5">
        Community Consensus · {total} review{total !== 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
                      boxShadow: pct > 10 ? `0 0 8px var(--tw-shadow-color, rgba(232,67,147,0.4))` : "none",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {/* ── Key Performance Metrics ─────────────────── */}
        {(avgLongevity > 0 || avgSillage > 0) && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">
              Key Performance
            </p>
            <PerfBar label="Longevity" value={avgLongevity} icon={Timer} color="#F59E0B" shouldReduceMotion={shouldReduceMotion} />
            <PerfBar label="Sillage" value={avgSillage} icon={Volume2} color="#F783AC" shouldReduceMotion={shouldReduceMotion} />
            <PerfBar label="Projection" value={projection} icon={Radio} color="#60A5FA" shouldReduceMotion={shouldReduceMotion} />
            <PerfBar label="Intensity" value={intensity} icon={Gauge} color="#A78BFA" shouldReduceMotion={shouldReduceMotion} />
          </div>
        )}
        {/* ── Season & Time ─────────────────────────── */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
              Best Season
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SEASONS.map(({ key, label, icon: Icon }) => {
                const active = activeSeasons.includes(key);
                return (
                  <div
                    key={key}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl border text-center transition-all duration-200 ${
                      active
                        ? "bg-brand-500/10 border-brand-500/50 shadow-[0_0_14px_rgba(232,67,147,0.25)]"
                        : "bg-gray-100 dark:bg-white/[0.03] border-[var(--bg-glass-border)] opacity-50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-brand-400" : "text-[var(--text-muted)]"}`} />
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
              {TIMES.map(({ key, label, icon: Icon }) => {
                const active = activeTimes.includes(key);
                return (
                  <div
                    key={key}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-3 rounded-2xl border text-center transition-all duration-200 min-w-[120px] ${
                      active
                        ? "bg-brand-500/10 border-brand-500/50 shadow-[0_0_14px_rgba(232,67,147,0.25)]"
                        : "bg-gray-100 dark:bg-white/[0.03] border-[var(--bg-glass-border)] opacity-50"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${active ? "text-brand-400" : "text-[var(--text-muted)]"}`} />
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

          {/* Best Occasion */}
          {Object.keys(occasionCounts).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                Best Occasion
              </p>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map(({ key, label, icon: Icon }) => {
                  const count = occasionCounts[key] || 0;
                  const active = count > 0;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-2xl border text-center transition-all duration-200 ${
                        active
                          ? "bg-brand-500/10 border-brand-500/50 shadow-[0_0_14px_rgba(232,67,147,0.25)]"
                          : "bg-gray-100 dark:bg-white/[0.03] border-[var(--bg-glass-border)] opacity-50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-brand-400" : "text-[var(--text-muted)]"}`} />
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          active ? "text-brand-400" : "text-[var(--text-muted)]"
                        }`}
                      >
                        {label}
                      </span>
                      {active && (
                        <span className="text-[9px] font-bold text-brand-300 bg-brand-500/15 px-1.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
