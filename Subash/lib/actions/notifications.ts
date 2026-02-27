"use server";
// lib/actions/notifications.ts
// Server actions for the Notification system.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** Mark a single notification as read. */
export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data:  { read: true },
  });

  revalidatePath("/"); // Let LayoutShell refresh
  return { success: true };
}

/** Mark ALL of the current user's notifications as read. */
export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data:  { read: true },
  });

  revalidatePath("/");
  return { success: true };
}

// ─── Internal helper (not exported to the client) ─────────────────────────────
// Shared by perfume.ts and fragram.ts to DRY up notification creation.

export async function createNotification({
  userId,
  type,
  message,
  link,
}: {
  userId: string;
  type:   string;
  message: string;
  link?:  string;
}): Promise<void> {
  // Don't notify yourself (no self-notifications)
  await prisma.notification.create({
    data: { userId, type, message, link },
  });
}
