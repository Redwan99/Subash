"use server";
// lib/actions/admin.ts
// SuperAdmin server actions: set POTD, moderate content.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Set Perfume of the Day ────────────────────────────────────────────────────

export async function setPerfumeOfTheDay(
  perfumeId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };
  if (session.user.role !== "SUPER_ADMIN") return { success: false, error: "Unauthorized." };

  if (!perfumeId) return { success: false, error: "Perfume ID is required." };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.perfumeOfTheDay.upsert({
      where: { date: today },
      create: { perfumeId, note: note ?? null, date: today },
      update: { perfumeId, note: note ?? null },
    });

    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true };
  } catch {
    return { success: false, error: "Database error. Please try again." };
  }
}

// ─── Update User Role ──────────────────────────────────────────────────────────

export async function updateUserRole(
  targetUserId: string,
  role: "SUPER_ADMIN" | "MODERATOR" | "SELLER" | "DECANTER" | "STANDARD"
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };
  if (session.user.role !== "SUPER_ADMIN") return { success: false, error: "Unauthorized." };

  try {
    await prisma.user.update({ where: { id: targetUserId }, data: { role } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Database error." };
  }
}

// ─── Cancel Decant Listing ─────────────────────────────────────────────────────

export async function cancelDecantListing(
  listingId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };
  if (session.user.role !== "SUPER_ADMIN") return { success: false, error: "Unauthorized." };

  try {
    await prisma.decantListing.update({
      where: { id: listingId },
      data: { status: "CANCELLED" },
    });
    revalidatePath("/admin");
    revalidatePath("/decants");
    return { success: true };
  } catch {
    return { success: false, error: "Database error." };
  }
}
