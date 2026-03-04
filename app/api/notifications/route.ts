// app/api/notifications/route.ts
// Returns the 20 latest notifications for the authenticated user.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const raw = await prisma.notification.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take:    20,
    select: {
      id:        true,
      type:      true,
      message:   true,
      link:      true,
      isRead:    true,
      createdAt: true,
    },
  });

  // Map the single `message` field into title + body for the bell component
  const notifications = raw.map((n) => {
    // Try to split on first period/exclamation for a natural title+body separation
    const msg = n.message;
    const splitIdx = msg.search(/[.!]\s/);
    const title = splitIdx > 0 ? msg.slice(0, splitIdx + 1) : msg;
    const body  = splitIdx > 0 ? msg.slice(splitIdx + 2).trim() : "";
    return {
      id:        n.id,
      type:      n.type,
      title,
      body,
      link:      n.link,
      isRead:    n.isRead,
      createdAt: n.createdAt,
    };
  });

  const unreadCount = raw.filter((n) => !n.isRead).length;

  return NextResponse.json(
    { notifications, unreadCount },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
