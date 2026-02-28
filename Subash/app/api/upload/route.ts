import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import sharp from "sharp";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Generate random filename
        const filename = randomBytes(16).toString("hex") + ".webp";
        const uploadDir = join(process.cwd(), "public", "uploads", "fragram");

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        const filepath = join(uploadDir, filename);

        // Process image using sharp: resize to max 1080x1080 and convert to webp
        await sharp(buffer)
            .resize({ width: 1080, height: 1080, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(filepath);

        // Return the public URL
        const publicUrl = `/uploads/fragram/${filename}`;

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
}
