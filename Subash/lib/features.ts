import prisma from "@/lib/prisma";

export async function getFeatureMap() {
    const toggles = await prisma.featureToggle.findMany();
    const map: Record<string, boolean> = {
        ENABLE_AI_BOT: true,
        ENABLE_SHOPS: true,
        ENABLE_ENCYCLOPEDIA: true,
        ENABLE_CREATORS: true,
    };
    for (const t of toggles) {
        map[t.key] = t.isEnabled;
    }
    return map;
}
