"use server";
// lib/actions/search.ts
// Dedicated search-related server actions.
// incrementSearchCount — fires when a user picks a perfume from the autocomplete
// dropdown, powering the Trending Perfumes sidebar widget.

import prisma from "@/lib/prisma";

/**
 * Increment the searchCount of a perfume.
 * Called from SmartSearch once the user clicks/selects a result.
 * Runs fire-and-forget on the client with `.catch(console.error)`.
 */
export async function incrementSearchCount(perfumeId: string) {
  try {
    // Increment the aggregate counter on the Perfume itself
    await prisma.perfume.update({
      where: { id: perfumeId },
      data: { searchCount: { increment: 1 } },
    });

    // Also record a daily aggregate row so we can build
    // 7‑day and other rolling-window trends.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await prisma.perfumeSearchStat.upsert({
      where: {
        perfumeId_date: {
          perfumeId,
          date: today,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        perfumeId,
        date: today,
        count: 1,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("[search] incrementSearchCount failed:", error);
    return { success: false };
  }
}

/**
 * Fetch the top N trending perfumes ordered by search clicks within
 * the last `days` days. Falls back to all‑time `searchCount` if the
 * stats table is empty (e.g. right after deploy).
 * Used by the TrendingPerfumes sidebar widget and homepage grid.
 */
export async function getTrendingPerfumes(take = 5, days = 7) {
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // include today + previous (days - 1) days
  windowStart.setUTCDate(windowStart.getUTCDate() - (days - 1));
  const delegate = (prisma as any).perfumeSearchStat as
    | { groupBy?: (args: any) => Promise<any[]> }
    | undefined;

  let stats: Array<{ perfumeId: string; _sum: { count: number | null } }> = [];

  if (delegate?.groupBy) {
    stats = await delegate.groupBy({
      by: ["perfumeId"],
      where: { date: { gte: windowStart } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take,
    });
  }

  if (stats.length === 0) {
    const fallback = await prisma.perfume.findMany({
      orderBy: { searchCount: "desc" },
      take,
      select: {
        id: true,
        slug: true,
        name: true,
        brand: true,
        image_url: true,
        searchCount: true,
      },
    });

    return fallback.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      image_url: p.image_url,
      weeklySearchCount: p.searchCount,
    }));
  }

  const ids = stats.map((s) => s.perfumeId);
  const perfumes = await prisma.perfume.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      name: true,
      brand: true,
      image_url: true,
    },
  });

  const byId = new Map(perfumes.map((p) => [p.id, p]));

  return stats
    .map((s) => {
      const perfume = byId.get(s.perfumeId);
      if (!perfume) return null;
      const heat = s._sum.count ?? 0;
      return {
        ...perfume,
        weeklySearchCount: heat,
      };
    })
    .filter((p): p is {
      id: string;
      slug: string;
      name: string;
      brand: string;
      image_url: string | null;
      weeklySearchCount: number;
    } => p !== null);
}
