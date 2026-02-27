"use client";
// app/perfume/[id]/PerfumeInteractive.tsx
// Heavy client components are dynamically imported so they don't block the
// initial page render — ScentProfile (animations), DupeEngine, ReviewForm (sliders).

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import type { DupeVoteData } from "@/components/perfume/DupeEngine";

const Skeleton = ({ h }: { h: string }) => (
  <div className={`${h} rounded-2xl animate-pulse bg-[var(--bg-glass)]`} />
);

const ScentProfile = dynamic(
  () => import("@/components/perfume/ScentProfile").then((m) => m.ScentProfile),
  { loading: () => <Skeleton h="h-56" /> }
);
const DupeEngine = dynamic(
  () => import("@/components/perfume/DupeEngine").then((m) => m.DupeEngine),
  { loading: () => <Skeleton h="h-40" /> }
);
const ReviewForm = dynamic(
  () => import("@/components/perfume/ReviewForm").then((m) => m.ReviewForm),
  { loading: () => <Skeleton h="h-48" /> }
);

export function PerfumeInteractive({
  perfumeId,
  description,
  perfumer,
  accords,
  top_notes,
  heart_notes,
  base_notes,
  avgLongevity,
  avgSillage,
  reviewCount,
  initialDupes,
}: {
  perfumeId: string;
  description: string | null;
  perfumer: string | null;
  accords: string[];
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  avgLongevity: number;
  avgSillage: number;
  reviewCount: number;
  initialDupes: DupeVoteData[];
}) {
  const shouldReduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 260, damping: 24 },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <ScentProfile
          description={description}
          perfumer={perfumer}
          accords={accords}
          top_notes={top_notes}
          heart_notes={heart_notes}
          base_notes={base_notes}
          avgLongevity={avgLongevity}
          avgSillage={avgSillage}
          reviewCount={reviewCount}
        />
      </motion.div>
      <motion.div variants={item}>
        <DupeEngine perfumeId={perfumeId} initialDupes={initialDupes} />
      </motion.div>
      <motion.div variants={item}>
        <ReviewForm perfumeId={perfumeId} />
      </motion.div>
    </motion.div>
  );
}
