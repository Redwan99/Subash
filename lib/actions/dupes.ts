"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function suggestDupe(targetId: string, dupeId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to suggest a clone." };
    }

    if (targetId === dupeId) {
      return { success: false, error: "A perfume cannot be a clone of itself." };
    }

    const existing = await prisma.perfumeDupe.findUnique({
      where: {
        targetPerfumeId_dupePerfumeId: {
          targetPerfumeId: targetId,
          dupePerfumeId: dupeId
        }
      }
    });

    if (existing) {
      return { success: false, error: "This clone has already been suggested." };
    }

    await prisma.perfumeDupe.create({
      data: {
        targetPerfumeId: targetId,
        dupePerfumeId: dupeId,
        userId: session.user.id,
        votes: 1
      }
    });

    const target = await prisma.perfume.findUnique({ where: { id: targetId }, select: { slug: true } });
    if (target) {
      revalidatePath(`/perfume/${target.slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error("suggestDupe error:", error);
    return { success: false, error: "Failed to suggest clone." };
  }
}

export async function voteDupe(dupeLinkId: string, value: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to vote." };
    }

    // simplistic: just directly apply the vote. 
    // Usually you'd track who voted, but instruction just says "Increments or decrements the votes integer".
    const voteIncrement = value > 0 ? 1 : -1;

    const dupe = await prisma.perfumeDupe.update({
      where: { id: dupeLinkId },
      data: {
        votes: { increment: voteIncrement }
      },
      include: { targetPerfume: { select: { slug: true } } }
    });

    revalidatePath(`/perfume/${dupe.targetPerfume.slug}`);

    return { success: true, newVotes: dupe.votes };
  } catch (error) {
    console.error("voteDupe error:", error);
    return { success: false, error: "Failed to submit vote." };
  }
}
