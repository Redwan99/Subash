import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";

export const alt = "Subash Perfume Profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyPrisma = prisma as any;
  const perfume = await anyPrisma.perfume.findUnique({
    where: { slug: id },
    select: { name: true, brand: true, image_url: true },
  });

  if (!perfume) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#09090b",
            color: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
          }}
        >
          Perfume Not Found
        </div>
      ),
      { ...size }
    );
  }

  let imageUrl = perfume.image_url;
  if (imageUrl && !imageUrl.startsWith("http")) {
    imageUrl = `https://fimgs.net${imageUrl}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #09090b, #18181b)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          position: "relative",
          border: "2px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
          }}
        />

        <div style={{ position: "absolute", top: 40, left: 40, display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: "#a78bfa", letterSpacing: "-0.05em" }}>SUBASH</span>
        </div>

        {imageUrl && (
          <img
            src={imageUrl}
            alt={perfume.name}
            style={{ width: 250, height: 250, objectFit: "contain", marginBottom: 30 }}
          />
        )}

        <div style={{ fontSize: 64, fontWeight: 800, textAlign: "center", margin: "0 40px", color: "#ffffff", letterSpacing: "-0.02em" }}>
          {perfume.name}
        </div>

        <div style={{ fontSize: 36, color: "#a1a1aa", marginTop: 10, fontWeight: 500 }}>
          {perfume.brand}
        </div>

        <div
          style={{
            marginTop: 50,
            padding: "16px 32px",
            background: "rgba(139, 92, 246, 0.2)",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            borderRadius: 100,
            color: "#d8b4fe",
            fontSize: 24,
            fontWeight: 600,
            display: "flex",
          }}
        >
          Read Reviews on Subash
        </div>
      </div>
    ),
    { ...size }
  );
}
