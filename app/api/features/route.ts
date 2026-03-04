import { NextResponse } from "next/server";
import { getFeatureMap } from "@/lib/features";

// Public endpoint — returns current feature toggles.
// Polled by the client-side FeatureToggleProvider for real-time updates.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const map = await getFeatureMap();
    return NextResponse.json(map, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    // If DB is unavailable, return defaults silently
    return NextResponse.json({}, { status: 200 });
  }
}
