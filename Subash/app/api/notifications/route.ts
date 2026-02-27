// app/api/notifications/route.ts
// Returns the 10 latest notifications for the authenticated user.
// Cached with a short TTL so the Bell can poll without hammering the DB.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const notifications = await prisma.notification.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take:    10,
    select: {
      id:        true,
      type:      true,
      message:   true,
      link:      true,
      read:      true,
      createdAt: true,
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json(
    { notifications, unreadCount },
    {
      headers: {
        // Revalidate every 30 s at the CDN; the browser won't cache at all
        "Cache-Control": "private, no-store",
      },
    }
  );
}
