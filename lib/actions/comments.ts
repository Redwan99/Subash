"use server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addReviewComment(reviewId: string, text: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "You must be signed in to comment." };
    }

    if (!text || text.trim().length < 2) {
        return { success: false, error: "Comment is too short." };
    }

    try {
        await prisma.comment.create({
            data: {
                text: text.trim(),
                reviewId,
                userId: session.user.id,
            },
        });

        revalidatePath(`/review/${reviewId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding comment:", error);
        return { success: false, error: "Failed to post comment. Please try again." };
    }
}
