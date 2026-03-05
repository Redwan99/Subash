"use client";

// components/perfume/WriteReviewModal.tsx
// Floating review modal — portals to document.body to escape all stacking contexts.

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { PenSquare, X, Star, Sparkles } from "lucide-react";

const ReviewForm = dynamic(
  () => import("./ReviewForm").then((m) => m.ReviewForm),
  { ssr: false }
);

export function WriteReviewModal({ perfumeId, variant }: { perfumeId: string; variant?: 'cta' | 'default' }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we only portal after client mount
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const isCta = variant === 'cta';
  const ButtonIcon = isCta ? Star : PenSquare;

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ isolation: 'isolate' }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal panel */}
          <motion.div
            className="relative w-[94vw] max-w-3xl max-h-[88vh] flex flex-col rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]"
            style={{
              background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-base) 100%)',
            }}
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {/* Accent gradient bar */}
            <div className="h-[3px] w-full bg-[linear-gradient(90deg,#E84393,#D6336C,#F783AC,#E84393)] shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#E84393,#D6336C)] shadow-[0_4px_16px_rgba(232,67,147,0.3)]">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                    Write a Review
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Share your honest impression
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-all"
                aria-label="Close review"
              >
                <X size={16} />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mx-4 shrink-0" />

            {/* Form body — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              <ReviewForm
                perfumeId={perfumeId}
                onSubmitted={() => setOpen(false)}
                embedded
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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
        {isCta ? 'Write a Review' : (
          <>
            <span className="hidden sm:inline">Write a review</span>
            <span className="sm:hidden">Review</span>
          </>
        )}
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
