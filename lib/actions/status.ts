"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type WearingStatusInput = {
  perfumeId?: string;
  customName?: string;
  timeTag: string;
  comment?: string;
};

export async function setWearingStatus(data: WearingStatusInput) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const { perfumeId, customName, timeTag, comment } = data;

  await prisma.wearingStatus.upsert({
    where: { userId },
    create: {
      userId,
      perfumeId: perfumeId ?? null,
      customName: customName ?? null,
      timeTag,
      comment: comment ?? null,
    },
    update: {
      perfumeId: perfumeId ?? null,
      customName: customName ?? null,
      timeTag,
      comment: comment ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
}

export async function clearWearingStatus() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  try {
    await prisma.wearingStatus.delete({ where: { userId } });
  } catch {
    // ignore if no existing status
  }

  revalidatePath("/");
  revalidatePath("/profile");
}

// ─── Fetch wardrobe items for the Wearing Status quick-pick ─────────────────

export type WardrobeQuickPickItem = {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
};

export async function getMyWardrobePerfumes(): Promise<WardrobeQuickPickItem[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const items = await prisma.wardrobeItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      perfume: {
        select: { id: true, name: true, brand: true, image_url: true },
      },
    },
  });

  // Deduplicate by perfume id (user may have same perfume on multiple shelves)
  const seen = new Set<string>();
  const result: WardrobeQuickPickItem[] = [];
  for (const item of items) {
    if (!seen.has(item.perfume.id)) {
      seen.add(item.perfume.id);
      result.push({
        id: item.perfume.id,
        name: item.perfume.name,
        brand: item.perfume.brand,
        image_url: item.perfume.image_url,
      });
    }
  }
  return result;
}
