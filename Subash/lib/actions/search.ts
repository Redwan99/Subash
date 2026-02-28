"use server";

import prisma from "@/lib/prisma";

export async function incrementPerfumeSearch(perfumeId: string) {
    try {
        await prisma.perfume.update({
            where: { id: perfumeId },
            data: {
                searchCount: {
                    increment: 1,
                },
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Error incrementing search count:", error);
        return { success: false };
    }
}
