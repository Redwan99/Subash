import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
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
        const filename = randomBytes(16).toString("hex") + ".csv";
        const uploadDir = join(process.cwd(), "public", "uploads", "csv");
        await mkdir(uploadDir, { recursive: true });
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);
        const publicUrl = `/uploads/csv/${filename}`;
        return NextResponse.json({ success: true, url: publicUrl, filename });
    } catch (error) {
        console.error("CSV Upload error:", error);
        return NextResponse.json({ error: "Failed to upload CSV" }, { status: 500 });
    }
}
