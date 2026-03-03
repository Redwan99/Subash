"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type WardrobeListType = "HAVE" | "HAD" | "WANT" | "SIGNATURE";

export async function toggleWardrobeItem(
  perfumeId: string,
  listType: WardrobeListType
): Promise<{ success: boolean; status: WardrobeListType | null; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, status: null, error: "You must be signed in." };
  }

  const userId = session.user.id;

  try {
    const existing = await prisma.wardrobeItem.findUnique({
      where: { userId_perfumeId: { userId, perfumeId } },
      select: { id: true, shelf: true },
    });

    let nextStatus: WardrobeListType | null = listType;

    if (existing) {
      if (existing.shelf === listType) {
        await prisma.wardrobeItem.delete({ where: { id: existing.id } });
        nextStatus = null;
      } else {
        await prisma.wardrobeItem.update({
          where: { id: existing.id },
          data: { shelf: listType },
        });
      }
    } else {
      await prisma.wardrobeItem.create({
        data: { userId, perfumeId, shelf: listType },
      });
    }

    const perfume = await prisma.perfume.findUnique({
      where: { id: perfumeId },
      select: { slug: true },
    });

    revalidatePath("/perfume/[slug]", "page");
    if (perfume?.slug) revalidatePath(`/perfume/${perfume.slug}`);
    revalidatePath("/profile");

    return { success: true, status: nextStatus };
  } catch (error) {
    console.error("[toggleWardrobeItem]", error);
    return { success: false, status: null, error: "Failed to update wardrobe." };
  }
}
