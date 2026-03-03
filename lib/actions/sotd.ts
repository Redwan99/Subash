"use server";
// lib/actions/sotd.ts
// Scent of the Day — auto-rotating daily random pick.
//
// Algorithm:
//   1. Derive a numeric seed from today's UTC date string (deterministic per day).
//   2. Use it to skip into the perfume table — one DB row fetch.
//   3. Cache the result for 24 h, keyed to the date so it auto-invalidates at midnight.
//   4. Persist the pick in PerfumeOfTheDay for history / admin view only.
//   No manual overrides can lock the widget — it always rotates.

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export type SOTDData = {
    id: string;
    date: Date;
    note: string | null;
    perfume: {
        id: string;
        slug: string;
        name: string;
        brand: string;
        image_url: string | null;
        transparentImageUrl?: string | null;
        description: string | null;
    };
};

/** Deterministic integer seed from a date string like "2026-03-01". */
function dateSeed(dateStr: string): number {
    return [...dateStr].reduce(
        (acc, ch) => Math.imul(acc, 31) + ch.charCodeAt(0),
        7
    ) >>> 0; // keep unsigned 32-bit
}

/** Returns today's UTC date as "YYYY-MM-DD". */
function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Fetch or create the Scent-of-the-Day pick.
 * The cache is keyed to the date string — each calendar day gets its own
 * independent cache entry that naturally expires after 24 hours.
 */
export async function getScentOfTheDay(): Promise<SOTDData | null> {
    try {
    const dateStr = todayUTC();

    return unstable_cache(
        async (): Promise<SOTDData | null> => {
            try {
            // ── 1. Use existing DB record if already picked today ──────────
            const today = new Date(`${dateStr}T00:00:00.000Z`);

            const existing = await prisma.perfumeOfTheDay.findUnique({
                where: { date: today },
                include: {
                    perfume: {
                        select: {
                            id: true, slug: true, name: true, brand: true,
                            image_url: true, transparentImageUrl: true, description: true,
                        },
                    },
                },
            });

            if (existing) return existing as unknown as SOTDData;

            // ── 2. Pick a perfume using a date-based seed ──────────────────
            const count = await prisma.perfume.count();
            if (count === 0) return null;

            const seed  = dateSeed(dateStr);
            const skip  = seed % count;

            const [winner] = await prisma.perfume.findMany({
                skip,
                take: 1,
                select: {
                    id: true, slug: true, name: true, brand: true,
                    image_url: true, transparentImageUrl: true, description: true,
                },
                orderBy: { id: "asc" }, // stable ordering required for skip to be deterministic
            });

            if (!winner) return null;

            // ── 3. Persist for history (ignore race conditions gracefully) ─
            try {
                const record = await prisma.perfumeOfTheDay.create({
                    data: { date: today, perfumeId: winner.id, note: null },
                    include: {
                        perfume: {
                            select: {
                                id: true, slug: true, name: true, brand: true,
                                image_url: true, transparentImageUrl: true, description: true,
                            },
                        },
                    },
                });
                return record as unknown as SOTDData;
            } catch {
                // Another request created the record concurrently — fetch it
                const race = await prisma.perfumeOfTheDay.findUnique({
                    where: { date: today },
                    include: {
                        perfume: {
                            select: {
                                id: true, slug: true, name: true, brand: true,
                                image_url: true, transparentImageUrl: true, description: true,
                            },
                        },
                    },
                });
                return race as unknown as SOTDData;
            }
            } catch (error) {
                console.warn("⚠️ Build Phase: DB unreachable for SOTD. Using fallback.", error);
                return null;
            }
        },
        // Date-keyed cache → auto-invalidates each new day
        ["scent-of-the-day", dateStr],
        { revalidate: 86400, tags: ["sotd"] }
    )();
    } catch (error) {
        console.warn("⚠️ Build Phase: SOTD cache wrapper failed. Using fallback.", error);
        return null;
    }
}

