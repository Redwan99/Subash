"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function submitBrandClaim(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("UNAUTHORIZED");
    }

    const brandName = formData.get("brandName") as string;
    const officialEmail = formData.get("officialEmail") as string;
    const message = formData.get("message") as string;

    if (!brandName || !officialEmail) {
        throw new Error("Missing required fields");
    }

    try {
        const claim = await prisma.brandClaim.create({
            data: {
                userId: session.user.id,
                brandName,
                officialEmail,
                message,
                status: "PENDING",
            },
        });

        return { success: true, claim };
    } catch (error) {
        console.error("Failed to submit claim:", error);
        return { success: false, error: "Failed to submit brand claim." };
    }
}
