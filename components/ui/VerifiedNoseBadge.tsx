// components/ui/VerifiedNoseBadge.tsx
// Phase 15 — Trust badge for high-reputation reviewers.
// Renders invisibly: just a subtle diamond glyph. No score numbers shown.

import { REPUTATION_TIERS } from "@/lib/constants";
import { Gem, Dot } from "lucide-react";

type Tier = "VERIFIED_NOSE" | "COLLECTOR" | null;

export function getReputationTier(score: number): Tier {
    if (score >= REPUTATION_TIERS.VERIFIED_NOSE) return "VERIFIED_NOSE";
    if (score >= REPUTATION_TIERS.COLLECTOR) return "COLLECTOR";
    return null;
}

const BADGE_CONFIG = {
    VERIFIED_NOSE: {
        icon: <Gem size={11} />,
        title: "Verified Nose — trusted fragrance expert",
        className: "text-[#F59E0B] drop-shadow-[0_0_6px_rgba(245,158,11,0.60)]",
    },
    COLLECTOR: {
        icon: <Dot size={14} />,
        title: "Collector",
        className: "text-[var(--accent)] opacity-70",
    },
} as const;

export function VerifiedNoseBadge({ score }: { score: number }) {
    const tier = getReputationTier(score);
    if (!tier) return null;

    const { icon, title, className } = BADGE_CONFIG[tier];

    return (
        <span
            title={title}
            aria-label={title}
            className={`inline-flex items-center text-[11px] select-none cursor-default ${className}`}
        >
            {icon}
        </span>
    );
}
