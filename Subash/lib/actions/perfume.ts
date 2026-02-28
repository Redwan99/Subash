"use server";
// lib/actions/perfume.ts
// Server actions for the Perfume Encyclopedia (Infinite Scroll) and Reviews

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import { verifyTurnstile } from "@/lib/turnstile";

export async function getPerfumesPage(page: number, filters: { brand?: string; gender?: string; accord?: string }) {
  const PAGE_SIZE = 60;
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};
  if (filters.brand) where.brand = filters.brand;
  if (filters.gender) where.gender = filters.gender;
  if (filters.accord) where.accords = { has: filters.accord };

  const perfumes = await prisma.perfume.findMany({
    where,
    select: {
      id: true, slug: true, name: true, brand: true,
      image_url: true, gender: true, accords: true,
      release_year: true, perfumer: true,
    },
    orderBy: [{ brand: "asc" }, { name: "asc" }],
    take: PAGE_SIZE,
    skip,
  });

  return perfumes;
}
// ─── Search ───────────────────────────────────────────────────────────────────

export type PerfumeSearchResult = {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
  slug: string;
};

export async function searchPerfumes(query: string): Promise<PerfumeSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  return prisma.perfume.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { top_notes: { hasSome: [q] } },
        { heart_notes: { hasSome: [q] } },
        { base_notes: { hasSome: [q] } },
      ],
    },
    select: { id: true, name: true, brand: true, image_url: true, slug: true },
    take: 8,
    orderBy: { name: "asc" },
  });
}

// ─── Submit Review ────────────────────────────────────────────────────────────

const ReviewSchema = z.object({
  perfumeId: z.string().min(1),
  text: z.string().min(10, "Review must be at least 10 characters"),
  overall_rating: z.number().min(1).max(5),
  longevity_score: z.number().int().min(1).max(5),
  sillage_score: z.number().int().min(1).max(5),
  time_tags: z.array(z.enum(["DAY", "NIGHT", "BOTH"])),
  weather_tags: z.array(z.enum(["HOT", "MILD", "COLD", "HUMID", "DRY", "RAINY"])),
  turnstileToken: z.string().min(1, "Please complete the security check"),
});

export type ReviewFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitReview(
  input: z.infer<typeof ReviewSchema>
): Promise<ReviewFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to leave a review." };
  }

  const parsed = ReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { perfumeId, text, overall_rating, longevity_score, sillage_score, time_tags, weather_tags, turnstileToken } =
    parsed.data;

  const isHuman = await verifyTurnstile(turnstileToken);
  if (!isHuman) {
    return { success: false, error: "Bot detected. Security check failed." };
  }

  try {
    await prisma.$transaction([
      prisma.review.create({
        data: {
          userId: session.user.id,
          perfumeId,
          text,
          overall_rating,
          longevity_score,
          sillage_score,
          time_tags: time_tags as ("DAY" | "NIGHT" | "BOTH")[],
          weather_tags: weather_tags,
        },
      }),
      // Increment review_count on the User row
      prisma.user.update({
        where: { id: session.user.id },
        data: { review_count: { increment: 1 } },
      }),
    ]);

    revalidatePath(`/perfume/${perfumeId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("Unique constraint")) {
      return { success: false, error: "You have already reviewed this fragrance." };
    }
    return { success: false, error: "Failed to submit review. Please try again." };
  }
}

// ─── Add Dupe / Clone ─────────────────────────────────────────────────────────

export async function addDupeVote(
  originalPerfumeId: string,
  clonePerfumeId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Sign in required." };

  if (originalPerfumeId === clonePerfumeId)
    return { success: false, error: "A perfume cannot be a dupe of itself." };

  try {
    await prisma.dupeVote.upsert({
      where: { originalPerfumeId_clonePerfumeId: { originalPerfumeId, clonePerfumeId } },
      update: {},           // already exists — don't duplicate
      create: {
        originalPerfumeId,
        clonePerfumeId,
        submittedBy: session.user.id,
        upvotes: 1,
        downvotes: 0,
      },
    });

    revalidatePath(`/perfume/${originalPerfumeId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to add clone. Please try again." };
  }
}

// ─── Vote on existing Dupe ────────────────────────────────────────────────────

export async function castDupeVote(
  dupeVoteId: string,
  direction: "up" | "down",
  perfumeId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Sign in required." };

  try {
    const dupe = await prisma.dupeVote.findUnique({
      where: { id: dupeVoteId },
      select: { submittedBy: true, original: { select: { name: true } } },
    });

    await prisma.dupeVote.update({
      where: { id: dupeVoteId },
      data:
        direction === "up"
          ? { upvotes: { increment: 1 } }
          : { downvotes: { increment: 1 } },
    });

    // Notify the dupe submitter on upvote (skip self-notification)
    if (direction === "up" && dupe && dupe.submittedBy !== session.user.id) {
      const actorName = session.user?.name ?? "Someone";
      const perfumeName = dupe.original?.name ?? "a perfume";
      await createNotification({
        userId: dupe.submittedBy,
        type: "DUPE_VOTE",
        message: `${actorName} agreed with your dupe suggestion for ${perfumeName}! 👍`,
        link: `/perfume/${perfumeId}`,
      });
    }

    revalidatePath(`/perfume/${perfumeId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Vote failed. Please try again." };
  }
}

// ─── Upvote a Review ──────────────────────────────────────────────────

export async function upvoteReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Sign in required." };

  try {
    // Upsert the upvote record (prevents double-voting)
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true, perfume: { select: { name: true, id: true } } },
    });

    if (!review) return { success: false, error: "Review not found." };
    if (review.userId === session.user.id)
      return { success: false, error: "You cannot upvote your own review." };

    await prisma.$transaction([
      prisma.reviewUpvote.create({
        data: { userId: session.user.id, reviewId },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { upvote_count: { increment: 1 } },
      }),
    ]);

    // Notify the review author
    const actorName = session.user?.name ?? "Someone";
    const perfumeName = review.perfume?.name ?? "a fragrance";
    await createNotification({
      userId: review.userId,
      type: "REVIEW_UPVOTE",
      message: `${actorName} found your review of ${perfumeName} helpful! ⭐`,
      link: `/perfume/${review.perfume?.id ?? ""}`,
    });

    revalidatePath(`/perfume/${review.perfume?.id ?? ""}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) {
      return { success: false, error: "You have already upvoted this review." };
    }
    return { success: false, error: "Upvote failed. Please try again." };
  }
}
