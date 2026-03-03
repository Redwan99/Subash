"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Heart } from "lucide-react";
import { toggleWardrobeItem, type WardrobeListType } from "@/lib/actions/wardrobe";

type ActionType = Extract<WardrobeListType, "HAVE" | "HAD" | "WANT">;

const BUTTONS: Array<{ key: ActionType; label: string; icon: typeof CheckCircle2 }> = [
  { key: "HAVE", label: "I have it", icon: CheckCircle2 },
  { key: "HAD", label: "I had it", icon: Clock },
  { key: "WANT", label: "I want it", icon: Heart },
];

export function WardrobeActionBar({
  perfumeId,
  initialStatus,
}: {
  perfumeId: string;
  initialStatus?: string;
}) {
  const [status, setStatus] = useState<string | null>(initialStatus ?? null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (next: ActionType) => {
    const previous = status;
    const optimistic = previous === next ? null : next;
    setStatus(optimistic);

    startTransition(async () => {
      const result = await toggleWardrobeItem(perfumeId, next);
      if (!result.success) {
        setStatus(previous);
        return;
      }
      setStatus(result.status);
    });
  };

  const getClassName = (key: ActionType) => {
    if (status !== key) {
      return "border border-transparent text-gray-400 hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-white/5";
    }

    return "bg-brand-500/10 text-brand-500 border-brand-500/50 border shadow-[0_0_14px_rgba(16,185,129,0.25)]";
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-black/40 backdrop-blur-2xl border border-[var(--bg-glass-border)] rounded-2xl shadow-xl">
      <div className="flex flex-1 items-center gap-1">
        {BUTTONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleToggle(key)}
            disabled={isPending}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors group disabled:opacity-60 ${getClassName(key)}`}
          >
            <Icon className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
