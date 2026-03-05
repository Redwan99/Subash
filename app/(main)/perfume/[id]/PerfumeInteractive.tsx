"use client";
// app/perfume/[id]/PerfumeInteractive.tsx
// Heavy client components are dynamically imported so they don't block the
// initial page render — ScentProfile (animations), DupeEngine, ReviewForm (sliders).

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";

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

export function PerfumeInteractive({
  perfumeId,
  description,
  perfumer,
  accords,
  top_notes,
  heart_notes,
  base_notes,
  initialDupes,
}: {
  perfumeId: string;
  description: string | null;
  perfumer: string | null;
  accords: string[];
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialDupes: any[];
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
        />
      </motion.div>
      <motion.div variants={item}>
        <DupeEngine targetPerfumeId={perfumeId} existingDupes={initialDupes} />
      </motion.div>
    </motion.div>
  );
}
