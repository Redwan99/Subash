// lib/constants.ts
// Shared constants for the application

// ── Reputation Thresholds ─────────────────────────────────────────────────────
// Points: +2 per review written, +1 per "HAVE" wardrobe item
export const REPUTATION_TIERS = {
    VERIFIED_NOSE: 20,   // ✦  subtle gold diamond in review cards
    COLLECTOR: 10,   // small dot indicator
} as const;
