"use server";
// lib/actions/reviews.ts
// Phase 15 — Reputation Engine
//  · calculateReputation  — score = (reviews × 2) + (HAVE wardrobe items × 1)
//  · addToWardrobe        — upsert WardrobeItem(shelf=HAVE) + recalc reputation
//  · getReputationBadge   — pure util: threshold → badge tier

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── Reputation Thresholds ─────────────────────────────────────────────────────
// Points: +2 per review written, +1 per "HAVE" wardrobe item
// (Now located in @/lib/constants to avoid 'use server' object export errors)

// ── Core Calculator ───────────────────────────────────────────────────────────
export async function calculateReputation(userId: string): Promise<number> {
    const [reviews, haveItems] = await Promise.all([
        prisma.review.count({ where: { userId } }),
        prisma.wardrobeItem.count({ where: { userId, shelf: "HAVE" } }),
    ]);
    return reviews * 2 + haveItems;
}

// ── Sync to DB ────────────────────────────────────────────────────────────────
async function syncReputation(userId: string) {
    const score = await calculateReputation(userId);
    await prisma.user.update({
        where: { id: userId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { reputationScore: score } as any,
    });
    return score;
}

// ── Add / Update Wardrobe Shelf ───────────────────────────────────────────────
/**
 * "I own this" — upserts a WardrobeItem with shelf = "HAVE".
 * Recalculates + persists reputationScore (+1 per HAVE item).
 */
export async function addToWardrobe(
    perfumeId: string,
    shelf: "HAVE" | "HAD" | "WANT" | "SIGNATURE" = "HAVE"
): Promise<{ success: boolean; error?: string; reputationScore?: number }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "You must be signed in." };
    }
    const userId = session.user.id;

    try {
        await prisma.wardrobeItem.upsert({
            where: { userId_perfumeId: { userId, perfumeId } },
            update: { shelf },
            create: { userId, perfumeId, shelf },
        });

        const reputationScore = await syncReputation(userId);

        // Revalidate the perfume page so "In Wardrobe" state updates server-side
        const p = await prisma.perfume.findUnique({
            where: { id: perfumeId },
            select: { slug: true },
        });
        if (p) revalidatePath(`/perfume/${p.slug}`);

        return { success: true, reputationScore };
    } catch (err) {
        console.error("[addToWardrobe]", err);
        return { success: false, error: "Failed to update wardrobe." };
    }
}

// ── Check if current user owns a perfume ────────────────────────────────────
export async function checkWardrobeStatus(
    perfumeId: string
): Promise<{ shelf: string | null }> {
    const session = await auth();
    if (!session?.user?.id) return { shelf: null };

    const item = await prisma.wardrobeItem.findUnique({
        where: { userId_perfumeId: { userId: session.user.id, perfumeId } },
        select: { shelf: true },
    });
    return { shelf: item?.shelf ?? null };
}
