// app/api/reviews/route.ts
// Phase 13 — Live Reviews GET API (polled every 5 s by SWR)
// Returns the 20 most recent APPROVED reviews with user + perfume metadata.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cache for 5 seconds (matches SWR refreshInterval)
export const revalidate = 5;

export async function GET() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reviews = await (prisma as any).review.findMany({
            where: { status: "APPROVED" },
            take: 20,
            orderBy: [
                { user: { reputationScore: "desc" } }, // high-rep reviewers first
                { createdAt: "desc" },                  // then most recent
            ],
            select: {
                id: true,
                text: true,
                overall_rating: true,
                longevity_score: true,
                sillage_score: true,
                time_tags: true,
                weather_tags: true,
                upvote_count: true,
                createdAt: true,
                user: {
                    select: { id: true, name: true, image: true, reputationScore: true },
                },
                perfume: {
                    select: { id: true, name: true, brand: true, image_url: true, slug: true },
                },
            },
        });

        return NextResponse.json(reviews, {
            headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=10" },
        });
    } catch (error) {
        console.error("[/api/reviews] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}
