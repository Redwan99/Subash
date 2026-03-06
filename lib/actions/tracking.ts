"use server";

import prisma from "@/lib/prisma";

export async function trackPerfumeView(perfumeId: string) {
  if (!perfumeId) return;
  try {
    // Increment the aggregate counter on the Perfume itself
    await prisma.perfume.update({
      where: { id: perfumeId },
      data: { searchCount: { increment: 1 } },
    });

    // Also record a daily aggregate row so perfume visits are reflected
    // in the rolling-window trending data (used by homepage & sidebar).
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
  } catch (error) {
    console.error("Failed to track view", error);
  }
}
