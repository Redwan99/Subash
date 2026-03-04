import prisma from "@/lib/prisma";

const FEATURE_DEFAULTS: Record<string, boolean> = {
    ENABLE_AI_BOT: true,
    ENABLE_SHOPS: true,
    ENABLE_ENCYCLOPEDIA: true,
    ENABLE_CREATORS: true,
    ENABLE_DECANTS: true,
    ENABLE_LEADERBOARDS: true,
    ENABLE_FRAGRAM: true,
    ENABLE_WARDROBE: true,
    MAINTENANCE_MODE: false,
};

export async function getFeatureMap(): Promise<Record<string, boolean>> {
    const map = { ...FEATURE_DEFAULTS };
    try {
        const toggles = await prisma.featureToggle.findMany();
        for (const t of toggles) {
            map[t.key] = t.isEnabled;
        }
    } catch {
        // DB unavailable (e.g. during Docker build-time pre-rendering).
        // Safe to return defaults — real values are fetched at runtime.
    }
    return map;
}
