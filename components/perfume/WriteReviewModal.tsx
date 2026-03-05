"use client";

// components/perfume/WriteReviewModal.tsx
// Lightweight wrapper for cases where we may want
// a standalone modal trigger separate from ScentProfile.

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { PenSquare, X, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ReviewForm = dynamic(
  () => import("./ReviewForm").then((m) => m.ReviewForm),
  { ssr: false }
);

export function WriteReviewModal({ perfumeId, variant, icon: Icon, label }: { perfumeId: string; variant?: 'cta' | 'default'; icon?: LucideIcon; label?: string }) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const isCta = variant === 'cta';
  const ButtonIcon = Icon || PenSquare;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={isCta
          ? "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[linear-gradient(135deg,#E84393,#D6336C)] shadow-[0_2px_12px_rgba(232,67,147,0.3)] hover:shadow-[0_4px_20px_rgba(232,67,147,0.5)] transition-all"
          : "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border border-[var(--border-color)] bg-[var(--bg-surface)]/80 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/10 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
        }
      >
        <ButtonIcon size={14} />
        {isCta ? (label || 'Write a Review') : (
          <>
            <span className="hidden sm:inline">{label || 'Write a review'}</span>
            <span className="sm:hidden">{label || 'Review'}</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/40 backdrop-blur-sm px-4 pt-[5vh] sm:pt-[8vh] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--bg-elevated)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]"
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--bg-glass-border)] bg-[var(--bg-glass)]/80 backdrop-blur-sm">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Quick Review
                  </span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {"Share your impression"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--bg-glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                  aria-label="Close review"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-52px)]">
                <ReviewForm
                  perfumeId={perfumeId}
                  onSubmitted={() => setOpen(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
