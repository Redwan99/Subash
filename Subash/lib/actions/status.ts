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
