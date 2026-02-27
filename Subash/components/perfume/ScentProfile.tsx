"use client";
// components/perfume/ScentProfile.tsx
// Phase 4.3 — Interactive Scent Profile
//   · Expanding Note Pyramid (whileInView stagger)
//   · Performance Radar (aggregated longevity + sillage bar display)
//   · Description expand/collapse toggle
//   · Accord pills with accent glow on hover

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScentProfileProps = {
  top_notes:    string[];
  heart_notes:  string[];
  base_notes:   string[];
  /** Aggregated from all reviews */
  avgLongevity: number; // 1–5
  avgSillage:   number; // 1–5
  reviewCount:  number;
  // Kaggle-imported enrichment fields
  description:  string | null;
  perfumer:     string | null;
  accords:      string[];
};

// ─── Note Chip ────────────────────────────────────────────────────────────────

const NOTE_COLORS = {
  top: {
    chip: "bg-[#A7F3D0]/15 border-[#34D399]/30 text-[#34D399]",
    label: "text-[#34D399]",
  },
  heart: {
    chip: "bg-[#FCD34D]/15 border-[#F59E0B]/30 text-[#F59E0B]",
    label: "text-[#F59E0B]",
  },
  base: {
    chip: "bg-[#A78BFA]/15 border-[#8B5CF6]/30 text-[#A78BFA]",
    label: "text-[#A78BFA]",
  },
};

function NoteChip({
  note,
  tier,
}: {
  note: string;
  tier: "top" | "heart" | "base";
}) {
  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${NOTE_COLORS[tier].chip}`}
    >
      {note}
    </span>
  );
}

// ─── Pyramid Row ──────────────────────────────────────────────────────────────

function PyramidRow({
  tier,
  label,
  icon,
  notes,
  index,
  shouldReduceMotion,
}: {
  tier: "top" | "heart" | "base";
  label: string;
  icon: string;
  notes: string[];
  index: number;
  shouldReduceMotion: boolean | null;
}) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
        delayChildren:   shouldReduceMotion ? 0 : index * 0.15,
      },
    },
  };

  const chipVariants = {
    hidden:   { opacity: 0, y: shouldReduceMotion ? 0 : 12, scale: 0.9 },
    visible:  { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 340, damping: 24 } },
  };

  if (notes.length === 0) return null;

  // Pyramid widths: top widest constraint is visual so we invert order
  const widthClasses = { top: "w-full", heart: "w-[84%]", base: "w-[66%]" } as const;

  return (
    <motion.div
      className={`flex flex-col items-center ${widthClasses[tier]}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {/* Tier label */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span>{icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${NOTE_COLORS[tier].label}`}>
          {label} Notes
        </span>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {notes.map((note) => (
          <motion.div key={note} variants={chipVariants}>
            <NoteChip note={note} tier={tier} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Radar / Bar ──────────────────────────────────────────────────────────────

const METRIC_LABELS = [
  "Very Weak",
  "Weak",
  "Moderate",
  "Strong",
  "Eternal / Enormous",
];

function RadarBar({
  label,
  value,
  valueClass,
  barClass,
  shouldReduceMotion,
}: {
  label: string;
  value: number; // 1–5
  valueClass: string;
  barClass: string;
  shouldReduceMotion: boolean | null;
}) {
  const pct = ((value - 1) / 4) * 100; // map 1–5 → 0–100%

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">
          {label}
        </span>
        <span className={`text-xs font-bold ${valueClass}`}>
          {value.toFixed(1)} / 5 &nbsp;
          <span className="text-[10px] font-normal text-[var(--text-muted)]">
            ({METRIC_LABELS[Math.round(value) - 1]})
          </span>
        </span>
      </div>

      {/* Track */}
      <div className="w-full h-3 rounded-full overflow-hidden bg-[var(--border-color)]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: "-40px" }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 24, delay: 0.1 }
          }
          className={`h-full rounded-full ${barClass}`}
        />
      </div>
    </div>
  );
}

// ─── Scent Profile ────────────────────────────────────────────────────────────

export function ScentProfile({
  top_notes,
  heart_notes,
  base_notes,
  avgLongevity,
  avgSillage,
  reviewCount,
  description,
  perfumer,
  accords,
}: ScentProfileProps) {
  const shouldReduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  // Detect whether description needs a Read More toggle (>220 characters is a good proxy)
  const isLong = (description?.length ?? 0) > 220;

  return (
    <div className="space-y-10">

      {/* ── Encyclopedia Header — Description, Perfumer, Accords ───── */}
      {(description || perfumer || accords.length > 0) && (
        <section className="rounded-2xl p-6 bg-[var(--bg-glass)] backdrop-blur-[10px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)] space-y-5">

          {/* Description */}
          {description && (
            <div>
              <p
                className={`text-sm leading-relaxed text-[var(--text-secondary)] transition-all duration-300 ${
                  !expanded && isLong ? "line-clamp-3" : ""
                }`}
              >
                {description}
              </p>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2 text-xs font-semibold text-[var(--accent)] hover:underline focus-visible:outline-none"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* Perfumer credit */}
          {perfumer && (
            <p className="text-xs italic text-[var(--text-muted)]">
              Created by{" "}
              <span className="not-italic font-semibold text-[var(--text-secondary)]">
                {perfumer}
              </span>
            </p>
          )}

          {/* Accords */}
          {accords.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] mb-2.5">
                Main Accords
              </p>
              <div className="flex flex-wrap gap-2">
                {accords.map((accord) => (
                  <motion.span
                    key={accord}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                    className="px-3 py-1 rounded-full text-xs font-semibold cursor-default select-none
                      bg-white/10 dark:bg-white/5
                      border border-white/20 dark:border-white/10
                      text-[var(--text-secondary)]
                      backdrop-blur-sm
                      hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/40
                      hover:text-[var(--accent)]
                      hover:shadow-[0_0_10px_var(--accent-glow,rgba(139,92,246,0.3))]
                      transition-all duration-200"
                  >
                    {accord}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Note Pyramid ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Scent Pyramid
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[var(--accent)]">
            {top_notes.length + heart_notes.length + base_notes.length} notes
          </span>
        </div>

        {/* Pyramid: top → widest, base → narrowest */}
        <div className="flex flex-col items-center gap-6">
          <PyramidRow
            tier="top"   label="Top"   icon="🍃"
            notes={top_notes}   index={0} shouldReduceMotion={shouldReduceMotion}
          />

          {/* Divider */}
          {top_notes.length > 0 && (heart_notes.length > 0 || base_notes.length > 0) && (
            <div className="w-px h-5 bg-gradient-to-b from-[var(--border-color)] to-transparent" />
          )}

          <PyramidRow
            tier="heart" label="Heart" icon="🌸"
            notes={heart_notes} index={1} shouldReduceMotion={shouldReduceMotion}
          />

          {heart_notes.length > 0 && base_notes.length > 0 && (
            <div className="w-px h-5 bg-gradient-to-b from-[var(--border-color)] to-transparent" />
          )}

          <PyramidRow
            tier="base"  label="Base"  icon="🪵"
            notes={base_notes}  index={2} shouldReduceMotion={shouldReduceMotion}
          />
        </div>
      </section>

      {/* ── Performance Radar ─────────────────────────────────── */}
      <section className="rounded-2xl p-6 bg-[var(--bg-glass)] backdrop-blur-[10px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Performance
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            Based on {reviewCount} review{reviewCount !== 1 ? "s" : ""}
          </span>
        </div>

        {reviewCount === 0 ? (
          <p className="text-sm text-center py-4 text-[var(--text-muted)]">
            No reviews yet — be the first!
          </p>
        ) : (
          <div className="space-y-5">
            <RadarBar
              label="Longevity"
              value={avgLongevity}
              valueClass="text-[#F59E0B]"
              barClass="bg-[linear-gradient(90deg,rgba(245,158,11,0.5),#F59E0B)] shadow-[0_0_8px_rgba(245,158,11,0.35)]"
              shouldReduceMotion={shouldReduceMotion}
            />
            <RadarBar
              label="Sillage (Projection)"
              value={avgSillage}
              valueClass="text-[#A78BFA]"
              barClass="bg-[linear-gradient(90deg,rgba(167,139,250,0.5),#A78BFA)] shadow-[0_0_8px_rgba(167,139,250,0.35)]"
              shouldReduceMotion={shouldReduceMotion}
            />
          </div>
        )}
      </section>
    </div>
  );
}
