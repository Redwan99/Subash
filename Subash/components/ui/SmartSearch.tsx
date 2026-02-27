"use client";
// components/ui/SmartSearch.tsx
// Phase 4.1 — Smart Autocomplete Search
// Replaces the static SearchBar in TopNavbar.
// Uses the searchPerfumes server action with debounce + transition.

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { searchPerfumes, type PerfumeSearchResult } from "@/lib/actions/perfume";
import { cn } from "@/lib/utils";

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Result Row ───────────────────────────────────────────────────────────────

function ResultRow({
  result,
  onSelect,
  shouldReduceMotion,
}: {
  result: PerfumeSearchResult;
  onSelect: () => void;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <motion.button
      whileHover={shouldReduceMotion ? {} : { x: 3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors hover:bg-[#8B5CF6]/10"
    >
      {/* Bottle thumbnail */}
      <div
        className="shrink-0 w-8 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-[#8B5CF6]/10 border border-[#8B5CF6]/20"
      >
        {result.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.image_url}
            alt={result.name}
            className="w-full h-full object-contain p-0.5"
          />
        ) : (
          <span className="text-lg">🧴</span>
        )}
      </div>

      {/* Name + brand */}
      <div className="min-w-0">
        <p
          className="text-sm font-semibold truncate text-[var(--text-primary)]"
        >
          {result.name}
        </p>
        <p className="text-xs truncate text-[var(--accent)]">
          {result.brand}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Smart Search ─────────────────────────────────────────────────────────────

type SmartSearchProps = {
  onSelectResult?: (result: PerfumeSearchResult) => void;
  placeholder?: string;
  autoNavigate?: boolean;
};

export function SmartSearch({
  onSelectResult,
  placeholder = "Search perfumes, brands, notes…",
  autoNavigate = true,
}: SmartSearchProps) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<PerfumeSearchResult[]>([]);
  const [open, setOpen]         = useState(false);
  const [focused, setFocused]   = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef                = useRef<HTMLInputElement>(null);
  const containerRef            = useRef<HTMLDivElement>(null);
  const router                  = useRouter();
  const shouldReduceMotion      = useReducedMotion();
  const debounced               = useDebounce(query, 280);

  // Fire search when debounced query changes
  useEffect(() => {
    if (debounced.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const data = await searchPerfumes(debounced);
      setResults(data);
      setOpen(data.length > 0);
    });
  }, [debounced]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const navigate = (result: PerfumeSearchResult) => {
    setOpen(false);
    setQuery("");
    if (onSelectResult) {
      onSelectResult(result);
      return;
    }
    if (autoNavigate) router.push(`/perfume/${result.id}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Input pill ──────────────────────────────────────── */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                boxShadow: focused
                  ? "0 0 0 2px rgba(139,92,246,0.40), 0 4px 24px rgba(0,0,0,0.15)"
                  : "0 0 0 1px var(--border-color)",
              }
        }
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 rounded-full px-3 py-2 bg-[var(--bg-glass)] backdrop-blur-[12px] border border-[var(--border-color)]"
      >
        {isPending ? (
          <Loader2
            size={15}
            className="animate-spin shrink-0 text-[var(--accent)]"
          />
        ) : (
          <Search
            size={15}
            className={cn(
              "shrink-0 transition-colors duration-200",
              focused ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
            )}
          />
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { clear(); setFocused(false); }
            if (e.key === "Enter" && results[0]) navigate(results[0]);
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none min-w-0 text-[var(--text-primary)] caret-[var(--accent)]"
          aria-label="Search perfumes"
          aria-autocomplete="list"
        />

        <AnimatePresence>
          {query.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.12 }}
              onClick={clear}
              className="shrink-0 p-1 rounded-full bg-[var(--border-color)] text-[var(--text-muted)]"
              aria-label="Clear search"
            >
              <X size={11} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Results dropdown ─────────────────────────────────── */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 26 }
            }
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 bg-[var(--bg-glass)] backdrop-blur-[20px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass),0_16px_40px_rgba(0,0,0,0.20)]"
            role="listbox"
          >
            <div className="py-1.5">
              {results.map((r) => (
                <ResultRow
                  key={r.id}
                  result={r}
                  onSelect={() => navigate(r)}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ))}
            </div>

            {/* Footer hint */}
            <div
              className="px-4 py-2 border-t border-[var(--border-color)] flex items-center justify-between"
            >
              <span className="text-[10px] text-[var(--text-muted)]">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                ↵ to open first
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
