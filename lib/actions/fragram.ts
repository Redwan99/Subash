
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFragramPosts() {
  return await prisma.fragramPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { name: true, image: true },
      },
      perfume: {
        select: { name: true, brand: true, slug: true },
      },
    },
  });
}

export async function likeFragramPost(postId: string) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Must be logged in to like" };
    }

    const post = await prisma.fragramPost.update({
      where: { id: postId },
      data: {
        likes: { increment: 1 },
      },
    });
    
    if (session.user.id !== post.userId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: "FRAGRAM_LIKE",
          message: `${session.user.name || "Someone"} liked your Fragram post.`,
          link: "/fragram",
        },
      });
    }
    
    revalidatePath("/fragram");
    return { success: true };
  } catch (error) {
    console.error("Failed to like post:", error);
    return { success: false, error: "Failed to like post" };
  }
}

import fs from "fs/promises";
import path from "path";

export async function createFragramPost(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    const caption = formData.get("caption") as string | null;
    const perfumeId = formData.get("perfumeId") as string | null;
    // Fallback logic for user ID in case of missing auth setup in the snippet
    // Normally you extract this from next-auth session
    const { auth } = await import("@/auth");
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Must be logged in");
    }
    
    if (!file) {
      throw new Error("Must provide image");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`;
    
    // local file save because we are on CasaOS
    const uploadDir = path.join(process.cwd(), "public", "uploads", "fragram");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);
    
    const imageUrl = `/uploads/fragram/${filename}`;

    await prisma.fragramPost.create({
      data: {
        imageUrl,
        caption,
        perfumeId,
        userId,
      },
    });

    revalidatePath("/fragram");
    return { success: true };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

