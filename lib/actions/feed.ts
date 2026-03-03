"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getFollowingFeed() {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const following = await prisma.follows.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) return [];

    const reviews = await prisma.review.findMany({
      where: { userId: { in: followingIds } },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, image: true, id: true } }, perfume: { select: { name: true, brand: true, slug: true, image_url: true, transparentImageUrl: true } } }
    });

    const fragramPosts = await prisma.fragramPost.findMany({
      where: { userId: { in: followingIds } },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, image: true, id: true } }, perfume: { select: { name: true, brand: true, slug: true } } }
    });

    const timeline = [
      ...reviews.map(r => ({ ...r, feedType: 'REVIEW' as const })),
      ...fragramPosts.map(f => ({ ...f, feedType: 'FRAGRAM' as const }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 30);

    return timeline;
  } catch (error) {
    console.error("Feed Error:", error);
    return [];
  }
}
