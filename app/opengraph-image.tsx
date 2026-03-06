import { ImageResponse } from "next/og";

export const alt = "Subash — Bangladesh's Fragrance Community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #1e1024 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          position: "relative",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 40%, rgba(232, 67, 147, 0.2) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "linear-gradient(135deg, #D6336C, #E84393, #F783AC)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "white",
              fontFamily: "Georgia, serif",
            }}
          >
            S
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: 12,
            background: "linear-gradient(135deg, #D6336C, #E84393, #F783AC)",
            backgroundClip: "text",
            color: "transparent",
            display: "flex",
          }}
        >
          SUBASH
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            marginTop: 16,
            fontWeight: 500,
            letterSpacing: 4,
            display: "flex",
          }}
        >
          BANGLADESH&apos;S FRAGRANCE COMMUNITY
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 80,
            height: 3,
            background: "linear-gradient(90deg, #D6336C, #F783AC)",
            borderRadius: 2,
            marginTop: 32,
            display: "flex",
          }}
        />

        {/* Bottom text */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "#71717a",
            fontWeight: 500,
            display: "flex",
          }}
        >
          Discover · Review · Find Authentic Perfumes
        </div>
      </div>
    ),
    { ...size }
  );
}
