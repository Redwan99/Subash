"use server";
// lib/actions/fragram.ts
// Phase 7 — Fragram (SOTD feed) server actions

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

const FragramSchema = z.object({
  perfumeId: z.string().min(1, "Please select a perfume."),
  imageUrl: z.string().url("Please provide a valid image URL."),
  caption: z.string().max(200, "Caption must be 200 characters or less.").optional(),
});

export type FragramFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createFragramPost(
  _: FragramFormState,
  formData: FormData
): Promise<FragramFormState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "You must be signed in." };

  const raw = {
    perfumeId: formData.get("perfumeId"),
    imageUrl: formData.get("imageUrl"),
    caption: formData.get("caption"),
  };

  const parsed = FragramSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { perfumeId, imageUrl, caption } = parsed.data;

  await prisma.fragramPost.create({
    data: {
      userId: session.user.id,
      perfumeId,
      imageUrl,
      caption: caption?.trim() || null,
    },
  });

  revalidatePath("/fragram");
  return { success: true };
}

// ─── Like / Unlike a Fragram Post ────────────────────────────────────────────

export async function toggleFragramLike(
  postId: string
): Promise<{ liked: boolean; likeCount: number }> {
  const session = await auth();
  if (!session?.user?.id) return { liked: false, likeCount: 0 };

  const userId = session.user.id;

  const existing = await prisma.fragramLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    // Unlike
    await prisma.$transaction([
      prisma.fragramLike.delete({ where: { userId_postId: { userId, postId } } }),
      prisma.fragramPost.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
    ]);
  } else {
    // Like
    const post = await prisma.fragramPost.findUnique({
      where: { id: postId },
      select: { userId: true, perfume: { select: { name: true } } },
    });

    await prisma.$transaction([
      prisma.fragramLike.create({ data: { userId, postId } }),
      prisma.fragramPost.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
    ]);

    // Notify the post owner (skip self-notifications)
    if (post && post.userId !== userId) {
      const perfumeName = post.perfume?.name ?? "your post";
      const actorName   = session.user?.name ?? "Someone";
      await createNotification({
        userId:  post.userId,
        type:    "FRAGRAM_LIKE",
        message: `${actorName} liked your Fragram post featuring ${perfumeName}! ❤️`,
        link:    "/fragram",
      });
    }
  }

  const updated = await prisma.fragramPost.findUnique({
    where:  { id: postId },
    select: { likeCount: true },
  });

  revalidatePath("/fragram");
  return { liked: !existing, likeCount: updated?.likeCount ?? 0 };
}
