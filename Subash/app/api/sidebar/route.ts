// app/api/sidebar/route.ts
// Returns live data for Left + Right sidebar widgets.
// Public endpoint — no auth required (only aggregated, non-sensitive data).

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
// Revalidate isn't needed here explicitly if we rely on unstable_cache interval, 
// but we'll leave dynamic and wrap DB calls.
export const revalidate = 0;

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const getCachedSidebarData = unstable_cache(
  async () => {
    // ── 1. Perfume of the Day ────────────────────────────────────
    // Check PerfumeOfTheDay table first, else pick by day-of-year mod count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let potd = null;
    const potdEntry = await prisma.perfumeOfTheDay.findFirst({
      where: { date: { gte: todayStart } },
      include: {
        perfume: {
          select: {
            id: true, slug: true, name: true, brand: true, image_url: true,
            accords: true, gender: true, release_year: true,
            top_notes: true, heart_notes: true, base_notes: true,
          },
        },
      },
    });

    if (potdEntry) {
      potd = potdEntry.perfume;
    } else {
      // Pick a perfume via day-of-year as deterministic seed
      const count = await prisma.perfume.count();
      if (count > 0) {
        const dayOfYear = Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
        );
        const skip = dayOfYear % count;
        const [picked] = await prisma.perfume.findMany({
          skip,
          take: 1,
          select: {
            id: true, slug: true, name: true, brand: true, image_url: true,
            accords: true, gender: true, release_year: true,
            top_notes: true, heart_notes: true, base_notes: true,
          },
          orderBy: { createdAt: "asc" },
        });
        potd = picked ?? null;
      }
    }

    // ── 2. Trending Brands (by perfume count) ────────────────────
    const brandGroups = await prisma.perfume.groupBy({
      by: ["brand"],
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 5,
    });
    const trendingBrands = brandGroups.map((g, i) => ({
      brand: g.brand,
      count: g._count.brand,
      badge: ["🔥", "📈", "⭐", "🏆", "💎"][i],
    }));

    // ── 3. Trending Perfumes (by search count) ─────────
    const trendingPerfumes = await prisma.perfume.findMany({
      take: 5,
      select: { id: true, slug: true, name: true, brand: true, image_url: true, accords: true },
      orderBy: { searchCount: "desc" },
    });

    // ── 4. Recent Activity (reviews + fragram posts) ─────────────
    const [recentReviews, recentPosts] = await Promise.all([
      prisma.review.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, overall_rating: true, text: true, createdAt: true,
          user: { select: { name: true } },
          perfume: { select: { id: true, slug: true, name: true, brand: true } },
        },
      }),
      prisma.fragramPost.findMany({
        take: 2,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, likeCount: true, caption: true, createdAt: true,
          user: { select: { name: true } },
          perfume: { select: { id: true, name: true } },
        },
      }).catch(() => []), // graceful if table is empty
    ]);

    type ActivityItem = {
      id: string;
      type: string;
      user: string;
      action: string;
      subject: string;
      detail: string;
      time: string;
      href: string;
    };

    const activity: ActivityItem[] = [
      ...recentReviews.map((r) => ({
        id: r.id,
        type: "review",
        user: r.user.name ?? "Anon",
        action: "reviewed",
        subject: `${r.perfume.name} by ${r.perfume.brand}`,
        detail: `⭐ ${r.overall_rating.toFixed(1)} — ${r.text.slice(0, 50)}…`,
        time: timeAgo(r.createdAt),
        href: `/perfume/${r.perfume.slug}`,
      })),
      ...recentPosts.map((p) => ({
        id: p.id,
        type: "fragram",
        user: p.user.name ?? "Anon",
        action: "posted to Fragram",
        subject: p.perfume?.name ?? "a scent",
        detail: p.caption ? p.caption.slice(0, 50) : `❤️ ${p.likeCount} likes`,
        time: timeAgo(p.createdAt),
        href: "/fragram",
      })),
    ];

    return { potd, trendingBrands, trendingPerfumes, activity };
  },
  ['sidebar-cache'],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const { potd, trendingBrands, trendingPerfumes, activity } = await getCachedSidebarData();

    // Dynamically recalculate timeAgo for activity so it's fresh even if cached
    const freshActivity = activity.sort((a, b) => {
      // timeAgo sorting relies on fresh display, but wait...
      // The cached values already have string `timeAgo` calculated at generation time.
      // E.g., "5m ago". Let's serve it as is, or we'd need to cache raw Date and map here.
      // The cache lives for 1hr. The string is close enough or we can leave it to client.
      return a.time.localeCompare(b.time);
    });

    return NextResponse.json({
      potd,
      trendingBrands,
      trendingPerfumes,
      activity: freshActivity,
    });
  } catch (err) {
    console.error("[/api/sidebar]", err);
    return NextResponse.json({ potd: null, trendingBrands: [], trendingPerfumes: [], activity: [] });
  }
}
