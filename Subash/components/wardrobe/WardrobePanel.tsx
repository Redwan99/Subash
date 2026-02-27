"use client";
// components/wardrobe/WardrobePanel.tsx
// Phase 5 — Client component: 4 shelf tabs + add-to-wardrobe modal (owner only).

import { useState, useTransition, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  CheckCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { upsertWardrobeItem, removeWardrobeItem } from "@/lib/actions/decant";
import { searchPerfumes, type PerfumeSearchResult } from "@/lib/actions/perfume";
import type { WardrobePerfume, WardrobeShelf as WardrobeShelfType } from "@/types/wardrobe";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Shelf = WardrobeShelfType;

const SHELVES: { key: Shelf; label: string; emoji: string; desc: string }[] = [
  { key: "HAVE",      label: "Have",      emoji: "✅", desc: "Owns it" },
  { key: "HAD",       label: "Had",       emoji: "📦", desc: "Owned before" },
  { key: "WANT",      label: "Want",      emoji: "💛", desc: "On the wish list" },
  { key: "SIGNATURE", label: "Signature", emoji: "✍️", desc: "Go-to scent" },
];

// ─── Bottle card ───────────────────────────────────────────────────────────────

function BottleCard({
  perfume,
  isOwner,
  onRemove,
}: {
  perfume: WardrobePerfume;
  isOwner: boolean;
  onRemove: (id: string) => void;
}) {
  const [isPending, start] = useTransition();
  const shouldReduceMotion = useReducedMotion();

  const handleRemove = () => {
    start(async () => {
      await removeWardrobeItem(perfume.id);
      onRemove(perfume.id);
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 }}
      className="relative group"
    >
      <Link href={`/perfume/${perfume.id}`} prefetch={false}>
        <div className="rounded-2xl overflow-hidden p-3 text-center bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)] transition-all hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {/* Bottle image */}
          <div className="w-full h-24 flex items-center justify-center rounded-xl mb-2 overflow-hidden bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
            {perfume.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={perfume.image_url}
                alt={perfume.name}
                className="h-full object-contain p-1"
              />
            ) : (
              <span className="text-[32px]">🧴</span>
            )}
          </div>

          {/* Name */}
          <p className="text-xs font-semibold truncate leading-tight text-[var(--text-primary)]">
            {perfume.name}
          </p>
          <p className="text-[10px] truncate mt-0.5 text-[var(--accent)]">
            {perfume.brand}
          </p>
        </div>
      </Link>

      {/* Remove button — owner only, appears on hover */}
      {isOwner && (
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-[#EF4444]/85 backdrop-blur-[4px] text-white"
          aria-label="Remove from wardrobe"
        >
          {isPending ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Trash2 size={11} />
          )}
        </button>
      )}
    </motion.div>
  );
}

// ─── Add to Wardrobe Modal ─────────────────────────────────────────────────────

function AddModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (perfume: WardrobePerfume, shelf: Shelf) => void;
}) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<PerfumeSearchResult[]>([]);
  const [selected, setSel]      = useState<PerfumeSearchResult | null>(null);
  const [shelf,    setShelf]    = useState<Shelf>("HAVE");
  const [isPending, start]      = useTransition();
  const [done,     setDone]     = useState(false);
  const shouldReduceMotion      = useReducedMotion();
  const timerRef                = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(() => {
      start(async () => {
        const data = await searchPerfumes(q);
        setResults(data);
      });
    }, 280);
  }, []);

  const handleAdd = () => {
    if (!selected) return;
    start(async () => {
      await upsertWardrobeItem(selected.id, shelf);
      setDone(true);
      onAdded({ ...selected, shelf }, shelf);
      setTimeout(onClose, 900);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.6)] backdrop-blur-[4px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.94, y: shouldReduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-md rounded-2xl p-6 bg-[var(--bg-glass)] backdrop-blur-[20px] border border-[var(--bg-glass-border)] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Add to Wardrobe
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)]"
            aria-label="Close modal"
          >
            <X size={14} />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <CheckCircle size={40} className="mx-auto mb-2 text-[#34D399]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Added!</p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]">
                Search Perfume
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2 bg-[var(--bg-surface)] border border-[var(--border-color)]">
                {isPending ? (
                  <Loader2 size={14} className="animate-spin shrink-0 text-[var(--accent)]" />
                ) : (
                  <Search size={14} className="shrink-0 text-[var(--text-muted)]" />
                )}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => search(e.target.value)}
                  placeholder="Sauvage, Oud Wood…"
                  className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] caret-[var(--accent)]"
                  autoFocus
                />
              </div>

              {/* Results */}
              {results.length > 0 && !selected && (
                <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setSel(r); setQuery(""); setResults([]); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[#8B5CF6]/10"
                    >
                      <div className="shrink-0 w-6 h-8 rounded overflow-hidden flex items-center justify-center bg-[#8B5CF6]/10">
                        {r.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image_url} alt={r.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs">🧴</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm truncate font-medium text-[var(--text-primary)]">{r.name}</p>
                        <p className="text-xs text-[var(--accent)]">{r.brand}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected pill */}
              {selected && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25">
                  <span className="text-sm font-semibold flex-1 truncate text-[var(--text-primary)]">
                    {selected.name}
                  </span>
                  <button onClick={() => setSel(null)} className="shrink-0 text-[var(--text-muted)]" aria-label="Clear selection">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Shelf selector */}
            <div className="mb-5">
              <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]">
                Shelf
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {SHELVES.map(({ key, label, emoji }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setShelf(key)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2 rounded-xl text-center transition-colors",
                      shelf === key
                        ? "bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 text-[var(--text-primary)]"
                        : "bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)]"
                    )}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="text-[10px] font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add button */}
            <button
              onClick={handleAdd}
              disabled={!selected || isPending}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm",
                !selected || isPending
                  ? "bg-[#8B5CF6]/30 text-[#8B5CF6]/60 cursor-not-allowed"
                  : "bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] text-white shadow-[0_4px_14px_rgba(139,92,246,0.25)] cursor-pointer"
              )}
            >
              {isPending ? (
                <><Loader2 size={14} className="animate-spin" /> Saving…</>
              ) : (
                <><Plus size={14} /> Add to Wardrobe</>
              )}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Wardrobe Panel (main export) ─────────────────────────────────────────────

export function WardrobePanel({
  grouped,
  isOwner,
  userId: _userId,
}: {
  grouped: Record<string, WardrobePerfume[]>;
  isOwner: boolean;
  userId: string;
}) {
  const [activeShelf, setActiveShelf] = useState<Shelf>("HAVE");
  const [items, setItems]             = useState(grouped);
  const [showModal, setShowModal]     = useState(false);
  const shouldReduceMotion            = useReducedMotion();

  const handleRemove = (shelfKey: string, perfumeId: string) => {
    setItems((prev) => ({
      ...prev,
      [shelfKey]: prev[shelfKey].filter((p) => p.id !== perfumeId),
    }));
  };

  const handleAdded = (perfume: WardrobePerfume, shelf: Shelf) => {
    setItems((prev) => {
      // Remove from any shelf it was on (upsert semantics)
      const cleaned: Record<string, WardrobePerfume[]> = {} as Record<string, WardrobePerfume[]>;
      for (const k of Object.keys(prev)) {
        cleaned[k] = prev[k].filter((p) => p.id !== perfume.id);
      }
      cleaned[shelf] = [perfume, ...(cleaned[shelf] ?? [])];
      return cleaned;
    });
    setActiveShelf(shelf);
  };

  const currentItems = items[activeShelf] ?? [];

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Wardrobe 🧴
          </h2>
          <p className="text-xs mt-0.5 text-[var(--text-muted)]">
            {Object.values(items).reduce((s, a) => s + a.length, 0)} fragrance
            {Object.values(items).reduce((s, a) => s + a.length, 0) !== 1 ? "s" : ""}
          </p>
        </div>

        {isOwner && (
          <motion.button
            onClick={() => setShowModal(true)}
            whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] shadow-[0_4px_12px_rgba(139,92,246,0.25)]"
          >
            <Plus size={14} /> Add Perfume
          </motion.button>
        )}
      </div>

      {/* Shelf tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5 overflow-x-auto bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)]"
      >
        {SHELVES.map(({ key, label, emoji }) => {
          const count   = items[key]?.length ?? 0;
          const isActive = activeShelf === key;
          return (
            <button
              key={key}
              onClick={() => setActiveShelf(key)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium flex-1 whitespace-nowrap justify-center min-w-0 transition-colors",
                isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="wardrobe-tab-pill"
                  className="absolute inset-0 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30"
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{emoji}</span>
              <span className="relative hidden sm:inline">{label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "relative text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    isActive
                      ? "bg-[#8B5CF6]/25 text-[var(--accent)]"
                      : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeShelf}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
        >
          {currentItems.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center bg-[var(--bg-glass)] border border-dashed border-[var(--border-color)]"
            >
              <p className="text-sm mb-1 text-[var(--text-secondary)]">
                Nothing on this shelf yet.
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs underline mt-1 text-[var(--accent)]"
                >
                  Add a perfume
                </button>
              )}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              <AnimatePresence>
                {currentItems.map((p) => (
                  <BottleCard
                    key={p.id}
                    perfume={p}
                    isOwner={isOwner}
                    onRemove={(id) => handleRemove(activeShelf, id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AddModal
            onClose={() => setShowModal(false)}
            onAdded={handleAdded}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
