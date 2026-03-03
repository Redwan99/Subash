"use client";
// components/perfume/AddToWardrobeButton.tsx
// Phase 15 — "I own this" button for perfume pages.
// Upserts a WardrobeItem(shelf=HAVE) and increments reputationScore invisibly.

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, Check, ChevronDown } from "lucide-react";
import { addToWardrobe } from "@/lib/actions/reviews";

type Shelf = "HAVE" | "HAD" | "WANT" | "SIGNATURE";

const SHELF_LABELS: Record<Shelf, string> = {
    HAVE: "I own this",
    HAD: "I've owned this",
    WANT: "Wish list",
    SIGNATURE: "My signature",
};

const SHELF_COLORS: Record<Shelf, string> = {
    HAVE: "text-[#10B981]",
    HAD: "text-[#60A5FA]",
    WANT: "text-[#F59E0B]",
    SIGNATURE: "text-[var(--accent)]",
};

export function AddToWardrobeButton({
    perfumeId,
    initialShelf,
}: {
    perfumeId: string;
    initialShelf?: string | null;
}) {
    const [shelf, setShelf] = useState<Shelf | null>((initialShelf as Shelf) ?? null);
    const [open, setOpen] = useState(false);
    const [isPending, start] = useTransition();

    const handleSelect = (s: Shelf) => {
        setOpen(false);
        start(async () => {
            const result = await addToWardrobe(perfumeId, s);
            if (result.success) setShelf(s);
        });
    };

    return (
        <div className="relative">
            {/* Main button */}
            <motion.button
                onClick={() => setOpen((v) => !v)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={isPending}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border
          ${shelf
                        ? "bg-[rgba(139,92,246,0.12)] border-[rgba(139,92,246,0.3)] text-[var(--accent)]"
                        : "bg-[var(--bg-glass)] border-[var(--bg-glass-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[rgba(139,92,246,0.25)]"
                    }`}
            >
                {shelf
                    ? <Check size={14} className="shrink-0" />
                    : <BookMarked size={14} className="shrink-0" />
                }
                <span className={shelf ? SHELF_COLORS[shelf] : ""}>
                    {shelf ? SHELF_LABELS[shelf] : "Add to Wardrobe"}
                </span>
                <ChevronDown
                    size={12}
                    className={`ml-auto transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="absolute top-full mt-1.5 left-0 z-50 w-44 rounded-2xl glass border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)] overflow-hidden py-1"
                    >
                        {(Object.keys(SHELF_LABELS) as Shelf[]).map((s) => (
                            <button
                                key={s}
                                onClick={() => handleSelect(s)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[rgba(139,92,246,0.08)]
                  ${shelf === s ? `font-semibold ${SHELF_COLORS[s]}` : "text-[var(--text-secondary)]"}`}
                            >
                                {SHELF_LABELS[s]}
                                {shelf === s && <Check size={11} className="inline ml-2 shrink-0" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop to close */}
            {open && (
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            )}
        </div>
    );
}
