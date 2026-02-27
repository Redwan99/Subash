// app/wardrobe/page.tsx
// Phase 6.3 — Personal Wardrobe Page
// Auth-gated: redirects to sign-in if not logged in.
// Fetches the current user's wardrobe and renders WardrobePanel.

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { WardrobePanel } from "@/components/wardrobe/WardrobePanel";
import type { WardrobePerfume } from "@/types/wardrobe";
import type { Metadata } from "next";
import { Archive } from "lucide-react";

export const metadata: Metadata = {
  title: "My Wardrobe",
  description: "Your personal fragrance wardrobe — collection, wishlist, and signature scent.",
};

// ─── Data ──────────────────────────────────────────────────────────────────────

async function getWardrobe(userId: string): Promise<Record<string, WardrobePerfume[]>> {
  const items = await prisma.wardrobeItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      perfume: { select: { id: true, name: true, brand: true, image_url: true } },
    },
  });

  const grouped: Record<string, WardrobePerfume[]> = {
    HAVE:      [],
    HAD:       [],
    WANT:      [],
    SIGNATURE: [],
  };

  for (const item of items) {
    const shelf = item.shelf as string;
    if (!grouped[shelf]) grouped[shelf] = [];
    grouped[shelf].push({
      id:        item.perfume.id,
      name:      item.perfume.name,
      brand:     item.perfume.brand,
      image_url: item.perfume.image_url,
      shelf,
    });
  }

  return grouped;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function WardrobePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/wardrobe");
  }

  const userId  = session.user.id;
  const grouped = await getWardrobe(userId);
  const total   = Object.values(grouped).reduce((s, a) => s + a.length, 0);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">

        {/* ─── Hero ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl mb-8 px-6 py-8 bg-[linear-gradient(135deg,rgba(139,92,246,0.12)_0%,rgba(109,40,217,0.06)_60%,transparent_100%)] border border-[#8B5CF6]/25">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(139,92,246,0.2)_0%,transparent_70%)]" />
          <div className="relative flex items-center gap-3 mb-2">
            <Archive size={22} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Wardrobe</h1>
          </div>
          <p className="relative text-sm text-[var(--text-secondary)]">
            {total > 0
              ? `${total} fragrance${total !== 1 ? "s" : ""} across all shelves`
              : "Start building your fragrance collection."}
          </p>
        </div>

        {/* ─── Wardrobe Panel ──────────────────────────────────────── */}
        <WardrobePanel grouped={grouped} isOwner userId={userId} />

      </div>
    </div>
  );
}
