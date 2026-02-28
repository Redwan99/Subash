"use client";
// components/perfume/ClimatePerfumeSlider.tsx
// Animated product-slider for Climate-matched perfume picks.
// Floating bottle images (transparent bg, bottom shadow), drag to swipe,
// auto-advance, keyboard nav, progress bar, and a peek-preview of neighbors.

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface SliderPerfume {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image_url: string | null;
}

// How long (ms) each slide stays before auto-advancing
const AUTO_INTERVAL = 3800;
// Minimum drag distance to trigger a slide change
const DRAG_THRESHOLD = 50;

// Easing for slide transitions
const SLIDE_SPRING = { type: "spring", stiffness: 280, damping: 32, mass: 0.9 } as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FloatingBottle({
  src,
  name,
  active,
  reduced,
}: {
  src: string | null;
  name: string;
  active: boolean;
  reduced: boolean | null;
}) {
  return (
    <motion.div
      className="relative flex items-end justify-center"
      style={{ height: active ? 230 : 175 }}
      animate={
        active && !reduced
          ? { y: [0, -12, 0] }
          : { y: 0 }
      }
      transition={
        active && !reduced
          ? { y: { duration: 3.8, repeat: Infinity, ease: "easeInOut" } }
          : { duration: 0.4 }
      }
    >
      {src ? (
        // In light mode: white bg + mix-blend-multiply removes JPEG white areas.
        // In dark mode: bg is transparent (dark:bg-transparent), blend resets to
        // normal — bottle renders naturally against the dark card.
        <div
          className="mix-blend-multiply dark:mix-blend-normal bg-white dark:bg-transparent"
          style={{
            display: "inline-flex",
            alignItems: "flex-end",
            justifyContent: "center",
            borderRadius: 12,
            filter: active
              ? "drop-shadow(0 20px 28px rgba(0,0,0,0.20)) drop-shadow(0 4px 8px rgba(0,0,0,0.14))"
              : "drop-shadow(0 8px 12px rgba(0,0,0,0.10))",
          }}
        >
          <Image
            src={src}
            alt={name}
            width={active ? 180 : 110}
            height={active ? 220 : 150}
            className="object-contain select-none pointer-events-none"
            style={{ width: "auto", height: active ? 220 : 150, maxWidth: active ? 180 : 110 }}
            unoptimized
            draggable={false}
            priority={active}
          />
        </div>
      ) : (
        <span className="text-7xl select-none" style={{ fontSize: active ? 80 : 52 }}>🧴</span>
      )}
      {/* Elliptical ground shadow */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
        animate={
          active && !reduced
            ? { scaleX: [1, 0.78, 1], opacity: [0.18, 0.08, 0.18] }
            : { scaleX: 1, opacity: 0.10 }
        }
        transition={active && !reduced ? { duration: 3.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
        style={{
          width: active ? 90 : 60,
          height: active ? 18 : 12,
          background: "radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ClimatePerfumeSlider({ picks }: { picks: SliderPerfume[] }) {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  // Drag tracking
  const dragX = useMotionValue(0);
  const dragStartX = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = picks.length;

  const go = useCallback(
    (delta: 1 | -1) => {
      setDirection(delta);
      setCurrent((c) => (c + delta + total) % total);
    },
    [total]
  );

  // Auto-advance
  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!paused) {
      intervalRef.current = setInterval(() => go(1), AUTO_INTERVAL);
    }
  }, [go, paused]);

  useEffect(() => {
    resetInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [resetInterval, current, paused]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  if (!total) return null;

  // Progress bar value (0→1)
  const progressPercent = ((current + 1) / total) * 100;

  // Indexes of peek cards
  const prevIdx = (current - 1 + total) % total;
  const nextIdx = (current + 1) % total;

  // Slide variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.88,
      rotateY: dir > 0 ? 18 : -18,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.88,
      rotateY: dir > 0 ? -18 : 18,
    }),
  };

  // For background accent color animation
  const accentColors = [
    "rgba(139,92,246,0.10)",
    "rgba(109,40,217,0.10)",
    "rgba(167,139,250,0.10)",
    "rgba(192,132,252,0.10)",
    "rgba(99,211,155,0.08)",
    "rgba(96,165,250,0.08)",
  ];
  const bgAccent = accentColors[current % accentColors.length];

  return (
    <div
      className="relative w-full select-none overflow-hidden"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Ambient glow that shifts per slide */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ background: `radial-gradient(ellipse at 50% 80%, ${bgAccent}, transparent 70%)` }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* ── Peek / side thumbnails ─── */}
      <div className="relative flex items-end justify-center gap-0" style={{ minHeight: "clamp(230px, 36vw, 300px)" }}>

        {/* Prev peek */}
        <motion.div
          key={`prev-${prevIdx}`}
          className="absolute left-0 flex-shrink-0 cursor-pointer z-10 hidden sm:flex"
          style={{ width: 80, opacity: 0.4 }}
          whileHover={{ opacity: 0.65, x: 6 }}
          onClick={() => go(-1)}
          aria-label="Previous perfume"
        >
          <div className="flex flex-col items-center gap-1">
            <FloatingBottle src={picks[prevIdx].image_url} name={picks[prevIdx].name} active={false} reduced={reduced} />
          </div>
        </motion.div>

        {/* ── Main slide ──────────────── */}
        <div className="flex-1 flex items-center justify-center relative" style={{ minWidth: 0 }}>
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={current}
              custom={direction}
              variants={reduced ? {} : variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduced ? { duration: 0 } : SLIDE_SPRING}
              drag={reduced ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragStart={(_, info) => {
                dragStartX.current = info.point.x;
              }}
              onDragEnd={(_, info) => {
                const delta = info.offset.x;
                if (Math.abs(delta) > DRAG_THRESHOLD) {
                  go(delta < 0 ? 1 : -1);
                }
                dragX.set(0);
              }}
              className="flex flex-col items-center gap-4 cursor-grab active:cursor-grabbing"
              style={{ width: "100%" }}
            >
              <Link
                href={`/perfume/${picks[current].slug}`}
                className="flex flex-col items-center gap-4"
                draggable={false}
              >
                <FloatingBottle
                  src={picks[current].image_url}
                  name={picks[current].name}
                  active
                  reduced={reduced}
                />
                <div className="text-center px-4 pb-1">
                  <motion.p
                    key={`name-${current}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.38 }}
                    className="text-sm font-bold leading-snug text-[var(--text-primary)]"
                  >
                    {picks[current].name}
                  </motion.p>
                  <motion.p
                    key={`brand-${current}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.38 }}
                    className="text-[12px] mt-0.5 font-medium text-[var(--accent)]"
                  >
                    {picks[current].brand}
                  </motion.p>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Next peek */}
        <motion.div
          key={`next-${nextIdx}`}
          className="absolute right-0 flex-shrink-0 cursor-pointer z-10 hidden sm:flex"
          style={{ width: 80, opacity: 0.4 }}
          whileHover={{ opacity: 0.65, x: -6 }}
          onClick={() => go(1)}
          aria-label="Next perfume"
        >
          <div className="flex flex-col items-center gap-1">
            <FloatingBottle src={picks[nextIdx].image_url} name={picks[nextIdx].name} active={false} reduced={reduced} />
          </div>
        </motion.div>
      </div>

      {/* ── Navigation Arrows ──── */}
      <motion.button
        onClick={() => go(-1)}
        whileHover={{ scale: 1.1, x: -2 }}
        whileTap={{ scale: 0.92 }}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.12)] text-[var(--accent)] shadow-md"
        aria-label="Previous"
      >
        <ChevronLeft size={16} />
      </motion.button>
      <motion.button
        onClick={() => go(1)}
        whileHover={{ scale: 1.1, x: 2 }}
        whileTap={{ scale: 0.92 }}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.12)] text-[var(--accent)] shadow-md"
        aria-label="Next"
      >
        <ChevronRight size={16} />
      </motion.button>

      {/* ── Dot Indicators ─────── */}
      <div className="flex items-center justify-center gap-1.5 pt-3">
        {picks.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => {
              setDirection(i > current ? 1 : -1);
              setCurrent(i);
            }}
            animate={{
              width: i === current ? 20 : 6,
              opacity: i === current ? 1 : 0.35,
              backgroundColor: i === current ? "var(--accent)" : "rgba(139,92,246,0.4)",
            }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="h-1.5 rounded-full cursor-pointer"
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Thin progress bar ─── */}
      <div className="mt-2 mx-2 h-px bg-[rgba(139,92,246,0.08)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[var(--accent)] rounded-full origin-left"
          animate={{ scaleX: progressPercent / 100 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ transformOrigin: "left" }}
        />
      </div>

      {/* ── Counter ─────────────── */}
      <p className="text-center text-[10px] mt-1.5 text-[var(--text-muted)]">
        {current + 1} <span className="opacity-40">/</span> {total}
      </p>
    </div>
  );
}
