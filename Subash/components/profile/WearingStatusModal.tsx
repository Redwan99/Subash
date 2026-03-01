"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Droplet, Search, X, SunMedium, MoonStar, Clock3, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { searchPerfumes, type PerfumeSearchResult } from "@/lib/actions/perfume";
import { setWearingStatus, clearWearingStatus } from "@/lib/actions/status";

type TimeTag = "day" | "night" | "all";

export function WearingStatusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PerfumeSearchResult[]>([]);
  const [selectedPerfume, setSelectedPerfume] = useState<PerfumeSearchResult | null>(null);
  const [customName, setCustomName] = useState("");
  const [timeTag, setTimeTag] = useState<TimeTag>("all");
  const [comment, setComment] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const shouldReduceMotion = useReducedMotion();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-status-modal", handleOpen);
    return () => window.removeEventListener("open-status-modal", handleOpen);
  }, []);

  // Basic debounce for search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    let active = true;
    setIsSearching(true);

    const id = setTimeout(async () => {
      try {
        const data = await searchPerfumes(q);
        if (!active) return;
        setSearchResults(data);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 220);

    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [searchQuery]);

  function handleSave() {
    const payload = {
      perfumeId: selectedPerfume?.id,
      customName: customName.trim() || undefined,
      timeTag,
      comment: comment.trim() || undefined,
    };

    startSaving(async () => {
      await setWearingStatus(payload);
      setIsOpen(false);
    });
  }

  function handleClear() {
    startSaving(async () => {
      await clearWearingStatus();
      setSelectedPerfume(null);
      setCustomName("");
      setComment("");
      setTimeTag("all");
      setIsOpen(false);
    });
  }

  const disabledSave = isSaving || (!selectedPerfume && !customName.trim());

  const modal =
    mounted &&
    createPortal(
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                aria-label="Close currently wearing modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Form */}
              <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/10">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Currently Wearing
                  </p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    Share what you have on today
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Find a perfume
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        <Search size={14} />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, brand or notes…"
                        className="w-full pl-8 pr-8 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--bg-glass-border)] outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] focus:border-[var(--accent)]/50"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--text-muted)]" />
                      )}
                    </div>
                    {searchResults.length > 0 && (
                      <div className="mt-2 rounded-2xl border border-[var(--bg-glass-border)] bg-black/30 backdrop-blur-lg max-h-48 overflow-y-auto divide-y divide-white/5">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPerfume(p);
                              setCustomName("");
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                              selectedPerfume?.id === p.id
                                ? "bg-[var(--accent)]/15"
                                : "hover:bg-white/10"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center text-xs font-semibold text-[var(--accent)]">
                              {p.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                p.brand[0]?.toUpperCase() ?? "🧴"
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">
                                {p.brand}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wardrobe accordion placeholder */}
                  <div className="rounded-2xl border border-dashed border-[var(--bg-glass-border)] px-4 py-3 text-xs text-[var(--text-muted)]">
                    <div className="font-semibold mb-1 text-[var(--text-secondary)]">
                      Show my wardrobe
                    </div>
                    <p>Coming soon — quickly pick from your own shelves.</p>
                  </div>

                  {/* Custom name divider */}
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
                    <span>It&apos;s not in the database</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
                  </div>

                  {/* Custom name input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Enter name of perfume
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="If you can&apos;t find it above…"
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--bg-glass-border)] outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] focus:border-[var(--accent)]/50"
                    />
                  </div>

                  {/* Time tag toggles */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Time of day
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "day" as TimeTag, label: "Day", icon: <SunMedium size={14} /> },
                        { key: "night" as TimeTag, label: "Night", icon: <MoonStar size={14} /> },
                        { key: "all" as TimeTag, label: "All day", icon: <Clock3 size={14} /> },
                      ].map(({ key, label, icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTimeTag(key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                            timeTag === key
                              ? "bg-emerald-500/15 border-emerald-400/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                              : "bg-black/20 border-[var(--bg-glass-border)] text-[var(--text-muted)] hover:border-emerald-500/40"
                          }`}
                        >
                          {icon}
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Optional comment
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="How does it make you feel today?"
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--bg-glass-border)] outline-none resize-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] focus:border-[var(--accent)]/50"
                    />
                  </div>

                  {/* Save */}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={disabledSave}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      disabledSave
                        ? "bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed"
                        : "bg-[linear-gradient(135deg,#10B981,#34D399)] text-gray-900 shadow-[0_10px_30px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_36px_rgba(16,185,129,0.45)]"
                    }`}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{isSaving ? "Saving…" : "Save status"}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Preview */}
              <div className="w-full md:w-80 bg-white/5 p-6 md:p-8 flex flex-col items-center justify-center text-center">
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-400/50 text-red-200 bg-red-500/10 hover:bg-red-500/20 transition-colors mb-4"
                >
                  <X size={14} />
                  Nothing right now
                </button>

                <div className="w-full rounded-2xl p-4 bg-black/40 border border-white/10 shadow-[0_18px_55px_rgba(0,0,0,0.6)] flex flex-col gap-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Preview
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.35)_0%,transparent_70%)] flex items-center justify-center overflow-hidden border border-emerald-400/40 text-3xl">
                      {selectedPerfume?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedPerfume.image_url}
                          alt={selectedPerfume.name}
                          className="w-full h-full object-cover"
                        />
                      ) : selectedPerfume ? (
                        "🧴"
                      ) : (
                        <span className="text-4xl opacity-60">🩶</span>
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {selectedPerfume?.name || customName || "Nothing selected"}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {selectedPerfume?.brand || (!selectedPerfume && !customName ? "This will show on your profile" : "Custom entry")}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-200 border border-emerald-400/40">
                        {timeTag === "day" && <SunMedium size={11} />}
                        {timeTag === "night" && <MoonStar size={11} />}
                        {timeTag === "all" && <Clock3 size={11} />}
                        <span className="capitalize">{timeTag}</span>
                      </div>
                    </div>
                  </div>

                  {comment && (
                    <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                      “{comment}”
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-white/10 text-emerald-400 transition-colors"
        title="Currently Wearing"
      >
        <Droplet className="w-5 h-5" />
      </button>
      {modal}
    </>
  );
}
