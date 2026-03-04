"use server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

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

        // Notify the review author about the comment
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            select: {
                userId: true,
                perfume: { select: { name: true, id: true } },
            },
        });

        if (review && review.userId !== session.user.id) {
            const actorName = session.user?.name ?? "Someone";
            const perfumeName = review.perfume?.name ?? "a fragrance";
            await createNotification({
                userId: review.userId,
                type: "COMMENT",
                message: `${actorName} commented on your review of ${perfumeName}. "${text.trim().slice(0, 60)}${text.trim().length > 60 ? "…" : ""}"`,
                link: `/review/${reviewId}`,
                actorId: session.user.id,
            });
        }

        revalidatePath(`/review/${reviewId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding comment:", error);
        return { success: false, error: "Failed to post comment. Please try again." };
    }
}
