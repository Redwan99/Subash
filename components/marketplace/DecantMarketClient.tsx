"use client";
// components/marketplace/DecantMarketClient.tsx
// Phase 5 — Client wrapper that owns the sort-toggle + empty state for DecantMarket.

import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Clock, TrendingDown, PlusCircle } from "lucide-react";
import Link from "next/link";
import { DecantCard, type DecantCardData } from "./DecantCard";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "price_5ml";

export function DecantMarketClient({ listings }: { listings: DecantCardData[] }) {
  const [sort, setSort]       = useState<SortKey>("newest");
  const shouldReduceMotion    = useReducedMotion();

  const sorted = useMemo(() => {
    if (sort === "newest") return [...listings];
    // Lowest price 5ml — listings without price_5ml float to bottom
    return [...listings].sort((a, b) => {
      if (a.price_5ml == null && b.price_5ml == null) return 0;
      if (a.price_5ml == null) return 1;
      if (b.price_5ml == null) return -1;
      return a.price_5ml - b.price_5ml;
    });
  }, [listings, sort]);

  return (
    <>
      {/* Sort Controls + CTA */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        {/* Toggle tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)]"
        >
          {(
            [
              { key: "newest",   icon: Clock,        label: "Newest" },
              { key: "price_5ml", icon: TrendingDown, label: "Lowest Price (5ml)" },
            ] as { key: SortKey; icon: typeof Clock; label: string }[]
          ).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                sort === key ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
              )}
            >
              {sort === key && (
                <motion.div
                  layoutId="decant-sort-pill"
                  className="absolute inset-0 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30"
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={13} className="relative" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        {/* Create listing CTA */}
        <Link href="/decants/create" prefetch={false}>
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] shadow-[0_4px_14px_rgba(139,92,246,0.25)]"
          >
            <PlusCircle size={14} />
            List a Decant
          </motion.div>
        </Link>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center bg-[var(--bg-glass)] border border-dashed border-[var(--border-color)]"
        >
          <span className="text-5xl">🧪</span>
          <p className="text-base font-semibold mt-4 text-[var(--text-secondary)]">
            No decant listings yet
          </p>
          <p className="text-sm mt-1 mb-6 text-[var(--text-muted)]">
            Be the first verified seller to list a decant.
          </p>
          <Link href="/decants/create">
            <span
              className="inline-block px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)]"
            >
              List Your First Decant
            </span>
          </Link>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {sorted.map((listing, i) => (
              <motion.div
                key={listing.id}
                layout
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 300, damping: 28, delay: i * 0.04 }
                }
              >
                <DecantCard listing={listing} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
