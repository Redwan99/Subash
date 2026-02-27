"use client";
// app/dashboard/deals/DealActions.tsx
// Toggle active/inactive for a deal row.

import { useState, useTransition } from "react";
import { Loader2, Power } from "lucide-react";
import { toggleDealActive } from "@/lib/actions/deals";

export function DealActions({
  dealId,
  isActive,
}: {
  dealId: string;
  isActive: boolean;
}) {
  const [active, setActive] = useState(isActive);
  const [isPending, start]  = useTransition();

  const toggle = () => {
    start(async () => {
      const result = await toggleDealActive(dealId, !active);
      if (result.success) setActive((p) => !p);
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={active ? "Pause deal" : "Reactivate deal"}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
        active
          ? "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25 hover:bg-[#EF4444]/20"
          : "bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/25 hover:bg-[#34D399]/20"
      }`}
    >
      {isPending ? (
        <Loader2 size={11} className="animate-spin" />
      ) : (
        <Power size={11} />
      )}
      {active ? "Pause" : "Activate"}
    </button>
  );
}
