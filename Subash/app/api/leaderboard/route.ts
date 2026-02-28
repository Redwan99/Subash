import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getCachedLeaderboard = unstable_cache(
    async (timeframe: string) => {
        const now = new Date();
        let startDate = new Date();

        if (timeframe === "today") {
            startDate.setHours(0, 0, 0, 0);
        } else if (timeframe === "week") {
            startDate.setDate(now.getDate() - 7);
        } else if (timeframe === "month") {
            startDate.setMonth(now.getMonth() - 1);
        } else {
            startDate.setDate(now.getDate() - 7);
        }

        // 1. Top 10 Perfumes by Review Count
        const perfumeGroups = await prisma.review.groupBy({
            by: ["perfumeId"],
            where: {
                createdAt: { gte: startDate },
                status: "APPROVED"
            },
            _count: { perfumeId: true },
            orderBy: { _count: { perfumeId: "desc" } },
            take: 10,
        });

        const perfumeIds = perfumeGroups.map((g) => g.perfumeId);
        const perfumesData = await prisma.perfume.findMany({
            where: { id: { in: perfumeIds } },
            select: { id: true, slug: true, name: true, brand: true, image_url: true },
        });

        const topPerfumes = perfumeGroups.map((g) => {
            const p = perfumesData.find((perf) => perf.id === g.perfumeId);
            return {
                id: g.perfumeId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                reviewCount: (g._count as any).perfumeId || 0,
                name: p?.name || "Unknown",
                brand: p?.brand || "Unknown",
                slug: p?.slug || "",
                image_url: p?.image_url || null,
            };
        });

        // 2. Top 50 Users by Review Count
        const userGroups = await prisma.review.groupBy({
            by: ["userId"],
            where: {
                createdAt: { gte: startDate },
                status: "APPROVED"
            },
            _count: { userId: true },
            orderBy: { _count: { userId: "desc" } },
            take: 50,
        });

        const userIds = userGroups.map((g) => g.userId);
        const usersData = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, image: true },
        });

        const topUsers = userGroups.map((g) => {
            const u = usersData.find((usr) => usr.id === g.userId);
            return {
                id: g.userId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                reviewCount: (g._count as any).userId || 0,
                name: u?.name || "Anonymous",
                image: u?.image || null,
            };
        });

        return { topPerfumes, topUsers };
    },
    ['leaderboard-cache'],
    { revalidate: 3600 }
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const timeframe = searchParams.get("timeframe") || "week";

        const { topPerfumes, topUsers } = await getCachedLeaderboard(timeframe);

        return NextResponse.json({
            topPerfumes,
            topUsers,
        });
    } catch (error) {
        console.error("[/api/leaderboard]", error);
        return NextResponse.json({ topPerfumes: [], topUsers: [] }, { status: 500 });
    }
}
