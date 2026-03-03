import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/perfumes/[id]/process-image
// Simulates a background-removal pipeline and stores a transparent image URL.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: perfumeId } = await params;

  try {
    const perfume = await prisma.perfume.findUnique({
      where: { id: perfumeId },
      select: { id: true, image_url: true, transparentImageUrl: true },
    });

    if (!perfume) {
      return NextResponse.json({ error: "Perfume not found" }, { status: 404 });
    }

    if (perfume.transparentImageUrl) {
      return NextResponse.json({
        status: "already_processed",
        transparentImageUrl: perfume.transparentImageUrl,
      });
    }

    if (!perfume.image_url) {
      return NextResponse.json({ error: "Perfume has no source image" }, { status: 400 });
    }

    // Placeholder: In production, call a real background removal service (e.g., rembg microservice).
    // For now, we simulate latency and mirror the existing image URL into the transparent slot.
    await new Promise((resolve) => setTimeout(resolve, 800));

    const updated = await prisma.perfume.update({
      where: { id: perfumeId },
      data: { transparentImageUrl: perfume.image_url },
      select: { id: true, transparentImageUrl: true },
    });

    return NextResponse.json({
      status: "processed",
      transparentImageUrl: updated.transparentImageUrl,
    });
  } catch (error) {
    console.error("process-image error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
