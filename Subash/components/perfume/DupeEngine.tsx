"use client";
// components/perfume/DupeEngine.tsx
// Phase 4.5 — Dupe / Clone Engine
//   · Lists community-voted clones with upvote / downvote
//   · "Community Match %" badge = upvotes / (upvotes + downvotes) * 100
//   · Search + add new clone (calls addDupeVote server action)

import { useState, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronUp, ChevronDown, Plus, Search, Loader2, CheckCircle } from "lucide-react";
import { castDupeVote, addDupeVote, searchPerfumes, type PerfumeSearchResult } from "@/lib/actions/perfume";
import { useSession } from "next-auth/react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DupeVoteData = {
  id: string;
  upvotes: number;
  downvotes: number;
  clone: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
  };
};

function matchPercent(up: number, down: number): number {
  const total = up + down;
  if (total === 0) return 0;
  return Math.round((up / total) * 100);
}

function matchClasses(pct: number): { text: string; bg: string; border: string } {
  if (pct >= 80) {
    return {
      text: "text-[#34D399]",
      bg: "bg-[#34D399]/15",
      border: "border-[#34D399]/40",
    };
  }
  if (pct >= 55) {
    return {
      text: "text-[#F59E0B]",
      bg: "bg-[#F59E0B]/15",
      border: "border-[#F59E0B]/40",
    };
  }
  return {
    text: "text-[#EF4444]",
    bg: "bg-[#EF4444]/15",
    border: "border-[#EF4444]/40",
  };
}

// ─── Dupe Card ────────────────────────────────────────────────────────────────

function DupeCard({
  dupe,
  originalPerfumeId,
  index,
}: {
  dupe: DupeVoteData;
  originalPerfumeId: string;
  index: number;
}) {
  const [votes, setVotes]     = useState({ up: dupe.upvotes, down: dupe.downvotes });
  const [isPending, start]    = useTransition();
  const [voted, setVoted]     = useState<"up" | "down" | null>(null);
  const shouldReduceMotion    = useReducedMotion();
  const { data: session }     = useSession();

  const pct = matchPercent(votes.up, votes.down);
  const badge = matchClasses(pct);

  const vote = (direction: "up" | "down") => {
    if (!session || voted || isPending) return;
    setVoted(direction);
    setVotes((v) => ({
      ...v,
      [direction === "up" ? "up" : "down"]:
        v[direction === "up" ? "up" : "down"] + 1,
    }));
    start(async () => {
      await castDupeVote(dupe.id, direction, originalPerfumeId);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 320, damping: 26, delay: index * 0.06 }
      }
      className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]"
    >
      {/* Bottle image */}
      <Link href={`/perfume/${dupe.clone.id}`} prefetch={false}>
        <div className="shrink-0 w-10 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-[#8B5CF6]/10 border border-[#8B5CF6]/15">
          {dupe.clone.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dupe.clone.image_url}
              alt={dupe.clone.name}
              className="w-full h-full object-contain p-0.5"
            />
          ) : (
            <span className="text-xl">🧴</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/perfume/${dupe.clone.id}`} prefetch={false}>
          <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
            {dupe.clone.name}
          </p>
          <p className="text-xs truncate text-[var(--accent)]">
            {dupe.clone.brand}
          </p>
        </Link>
      </div>

      {/* Match % badge */}
      <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
        {pct}% match
      </div>

      {/* Vote arrows */}
      <div className="shrink-0 flex flex-col items-center">
        <motion.button
          onClick={() => vote("up")}
          disabled={!session || !!voted || isPending}
          whileTap={shouldReduceMotion || !!voted ? {} : { scale: 0.82 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`p-1 rounded-lg transition-colors ${
            voted === "up"
              ? "text-[#34D399] bg-[#34D399]/15"
              : "text-[var(--text-muted)]"
          } ${!session || voted ? "cursor-not-allowed" : "cursor-pointer"}`}

          aria-label="Upvote"
        >
          <ChevronUp size={18} />
        </motion.button>

        <span className="text-[10px] font-bold text-[var(--text-muted)]">
          {votes.up - votes.down}
        </span>

        <motion.button
          onClick={() => vote("down")}
          disabled={!session || !!voted || isPending}
          whileTap={shouldReduceMotion || !!voted ? {} : { scale: 0.82 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`p-1 rounded-lg transition-colors ${
            voted === "down"
              ? "text-[#EF4444] bg-[#EF4444]/15"
              : "text-[var(--text-muted)]"
          } ${!session || voted ? "cursor-not-allowed" : "cursor-pointer"}`}

          aria-label="Downvote"
        >
          <ChevronDown size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Add Clone Search ─────────────────────────────────────────────────────────

function AddClonePanel({
  originalPerfumeId,
  onAdded,
}: {
  originalPerfumeId: string;
  onAdded: () => void;
}) {
  const [query,    setQuery]   = useState("");
  const [results,  setResults] = useState<PerfumeSearchResult[]>([]);
  const [isPending, start]     = useTransition();
  const [added,    setAdded]   = useState<string | null>(null);
  const [err,      setErr]     = useState<string | null>(null);
  const shouldReduceMotion     = useReducedMotion();

  const search = (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    start(async () => {
      const data = await searchPerfumes(q);
      setResults(data.filter((r) => r.id !== originalPerfumeId));
    });
  };

  const addDupe = async (clone: PerfumeSearchResult) => {
    setErr(null);
    start(async () => {
      const result = await addDupeVote(originalPerfumeId, clone.id);
      if (result.success) {
        setAdded(clone.name);
        setQuery("");
        setResults([]);
        onAdded();
      } else {
        setErr(result.error ?? "Failed to add clone.");
      }
    });
  };

  return (
    <div className="mt-5 pt-5 border-t border-[var(--border-color)]">
      <p className="text-xs font-bold uppercase tracking-widest mb-3 text-[var(--text-muted)]">
        Suggest a Clone
      </p>

      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
          {isPending ? (
            <Loader2 size={14} className="animate-spin shrink-0 text-[var(--accent)]" />
          ) : (
            <Search size={14} className="shrink-0 text-[var(--text-muted)]" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search for a clone / dupe…"
            className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] caret-[var(--accent)]"
          />
        </div>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 26 }}
              className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-20 bg-[var(--bg-glass)] backdrop-blur-[16px] border border-[var(--bg-glass-border)] shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
            >
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addDupe(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#8B5CF6]/10"
                >
                  <div className="shrink-0 w-7 h-9 rounded-lg flex items-center justify-center overflow-hidden bg-[#8B5CF6]/10 border border-[#8B5CF6]/15">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image_url} alt={r.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-sm">🧴</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
                      {r.name}
                    </p>
                    <p className="text-xs text-[var(--accent)]">{r.brand}</p>
                  </div>
                  <Plus size={14} className="ml-auto shrink-0 text-[var(--text-muted)]" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {added && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs mt-2 text-[#34D399]"
          >
            <CheckCircle size={12} /> &quot;{added}&quot; added as a clone suggestion!
          </motion.p>
        )}
        {err && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs mt-2 text-[#EF4444]"
          >
            {err}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dupe Engine ──────────────────────────────────────────────────────────────

export function DupeEngine({
  perfumeId,
  initialDupes,
}: {
  perfumeId: string;
  initialDupes: DupeVoteData[];
}) {
  const [dupes] = useState(initialDupes);
  const { data: session } = useSession();
  const [refresh, setRefresh] = useState(0);

  // When a clone is added we bump a counter; parent will re-fetch on next visit
  const handleAdded = () => setRefresh((r) => r + 1);

  return (
    <div className="rounded-2xl p-6 bg-[var(--bg-glass)] backdrop-blur-[10px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Reminds Me Of…
          </h2>
          <p className="text-xs mt-0.5 text-[var(--text-muted)]">
            Affordable alternatives voted by the community
          </p>
        </div>
        {dupes.length > 0 && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[var(--accent)]">
            {dupes.length} clone{dupes.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Clone list */}
      {dupes.length === 0 ? (
        <div className="rounded-xl p-6 text-center bg-[var(--border-color)] border border-dashed border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-muted)]">
            No dupes suggested yet. Be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {dupes.map((d, i) => (
            <DupeCard
              key={`${d.id}-${refresh}`}
              dupe={d}
              originalPerfumeId={perfumeId}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Add clone */}
      {session ? (
        <AddClonePanel
          originalPerfumeId={perfumeId}
          onAdded={handleAdded}
        />
      ) : (
        <p className="text-xs mt-4 text-center text-[var(--text-muted)]">
          <Link href="/auth/signin" className="underline text-[var(--accent)]">
            Sign in
          </Link>{" "}
          to suggest or vote on clones.
        </p>
      )}
    </div>
  );
}
