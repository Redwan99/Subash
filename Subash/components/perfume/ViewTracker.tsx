"use client";

import { useEffect } from "react";
import { trackPerfumeView } from "@/lib/actions/tracking";

export default function ViewTracker({ perfumeId }: { perfumeId: string }) {
  useEffect(() => {
    if (!perfumeId) return;
    // Fire-and-forget: increment popularity on mount
    trackPerfumeView(perfumeId);
  }, [perfumeId]);

  return null;
}
