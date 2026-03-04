
"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export async function toggleFollow(targetUserId: string) {
  const session = await auth();
  const currentUserId = session?.user?.id;

  if (!currentUserId) {
    throw new Error("Must be logged in to follow users");
  }

  if (currentUserId === targetUserId) {
    throw new Error("Cannot follow yourself");
  }

  const existingFollow = await prisma.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
  });

  if (existingFollow) {
    // Unfollow
    await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });
    revalidatePath("/user/[id]");
    return { success: true, isFollowing: false };
  } else {
    // Follow
    await prisma.follows.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    // Send a notification
    await createNotification({
      userId: targetUserId,
      type: "FOLLOW",
      message: `${session.user?.name || "Someone"} started following you.`,
      link: `/user/${session.user?.username ?? currentUserId}`,
      actorId: currentUserId,
    });

    revalidatePath("/user/[id]");
    return { success: true, isFollowing: true };
  }
}

export async function getUnreadNotifications() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { count: 0, notifications: [] };
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, count: unreadCount };
}

export async function markNotificationsAsRead() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { success: false };

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { success: true };
}

