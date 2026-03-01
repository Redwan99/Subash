"use server";

import prisma from "@/lib/prisma";

export async function trackPerfumeView(perfumeId: string) {
  if (!perfumeId) return;
  try {
    await prisma.perfume.update({
      where: { id: perfumeId },
      data: { searchCount: { increment: 1 } },
    });
  } catch (error) {
    console.error("Failed to track view", error);
  }
}
