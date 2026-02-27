// app/perfume/[id]/page.tsx
// Phase 4 — Perfume Profile Page

import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import dynamic from "next/dynamic";
import { DecantCard } from "@/components/marketplace/DecantCard";

// Lazy-load the heavy interactive client bundle (ScentProfile, DupeEngine, ReviewForm)
const PerfumeInteractive = dynamic(
  () => import("./PerfumeInteractive").then((m) => m.PerfumeInteractive),
  { loading: () => <div className="h-32 rounded-2xl animate-pulse bg-[var(--bg-glass)]" /> }
);

export default async function PerfumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Optimized select — only fetch columns actually rendered on this page.
  // Skips unused scalar fields: perfumer, scraped, createdAt, updatedAt.
  const perfume = await prisma.perfume.findUnique({
    where: { slug: id },
    select: {
      id:           true,
      name:         true,
      brand:        true,
      image_url:    true,
      release_year: true,
      description:  true,
      perfumer:     true,
      gender:       true,
      accords:      true,
      top_notes:    true,
      heart_notes:  true,
      base_notes:   true,
      decantListings: {
        where:   { status: "AVAILABLE" },
        orderBy: { createdAt: "desc" },
        select: {
          id:             true,
          price_5ml:      true,
          price_10ml:     true,
          batch_code:     true,
          proof_image_url:true,
          status:         true,
          createdAt:      true,
          seller:  { select: { id: true, name: true, image: true, phone: true } },
          perfume: { select: { id: true, name: true, brand: true } },
        },
      },
      reviews: {
        select: {
          overall_rating:  true,
          longevity_score: true,
          sillage_score:   true,
        },
      },
      dupeOriginal: {
        orderBy: { upvotes: "desc" },
        select: {
          id:        true,
          upvotes:   true,
          downvotes: true,
          clone: { select: { id: true, name: true, brand: true, image_url: true } },
        },
      },
    },
  });

  if (!perfume) return notFound();

  const reviewCount = perfume.reviews.length;
  const avgRating = reviewCount
    ? perfume.reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviewCount
    : 0;
  const avgLongevity = reviewCount
    ? perfume.reviews.reduce((sum, r) => sum + r.longevity_score, 0) / reviewCount
    : 1;
  const avgSillage = reviewCount
    ? perfume.reviews.reduce((sum, r) => sum + r.sillage_score, 0) / reviewCount
    : 1;

  const dupes = perfume.dupeOriginal.map((d) => ({
    id: d.id,
    upvotes: d.upvotes,
    downvotes: d.downvotes,
    clone: {
      id: d.clone.id,
      name: d.clone.name,
      brand: d.clone.brand,
      image_url: d.clone.image_url,
    },
  }));

  return (
    <main className="min-h-screen px-4 md:px-6 pt-20 md:pt-24 pb-20">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="rounded-3xl p-6 flex items-center justify-center bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
            {perfume.image_url ? (
              <Image
                src={perfume.image_url}
                alt={perfume.name}
                width={220}
                height={260}
                className="object-contain"
                priority
              />
            ) : (
              <span className="text-5xl">🧴</span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  {perfume.brand}
                </p>
                {perfume.gender && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-[var(--text-secondary)] backdrop-blur-sm">
                    {perfume.gender.replace("for ", "").replace("women and men", "Unisex").replace("women", "For Women").replace("men", "For Men")}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-semibold text-[var(--text-primary)]">
                {perfume.name}
              </h1>
              {perfume.release_year && (
                <p className="text-sm text-[var(--text-secondary)]">
                  Released in {perfume.release_year}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={avgRating >= i - 0.25 ? "currentColor" : "none"}
                    className={
                      avgRating >= i - 0.25
                        ? "text-[var(--accent)]"
                        : "text-[var(--border-color)]"
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {avgRating ? avgRating.toFixed(1) : "No ratings yet"}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {perfume.top_notes.slice(0, 3).map((note) => (
                <span
                  key={note}
                  className="text-xs px-2 py-1 rounded-full bg-[#8B5CF6]/15 text-[var(--accent)]"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Marketplace */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl p-6 space-y-4 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Verified Deals
              </h2>
              <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--border-color)] text-[var(--text-muted)]">
                Coming soon
              </span>
            </div>
            <div className="space-y-3">
              {["Shop A", "Shop B", "Shop C"].map((shop) => (
                <div
                  key={shop}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 bg-[#8B5CF6]/10 border border-dashed border-[#8B5CF6]/30"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {shop}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Verified seller • Contact soon
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[var(--accent)]">
                    ৳—
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Decant Listings
              </h2>
              <Link href="/decants" className="text-xs text-[var(--accent)]">
                Browse market →
              </Link>
            </div>
            {perfume.decantListings.length === 0 ? (
              <div className="rounded-2xl p-6 text-center bg-[var(--bg-glass)] border border-[var(--bg-glass-border)]">
                <p className="text-sm text-[var(--text-muted)]">
                  No decant listings yet. Be the first to list one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {perfume.decantListings.map((listing, index) => (
                  <DecantCard key={listing.id} listing={listing} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Interactive Scent Engine */}
        <section>
          <PerfumeInteractive
            perfumeId={perfume.id}            description={perfume.description ?? null}
            perfumer={perfume.perfumer ?? null}
            accords={perfume.accords}            top_notes={perfume.top_notes}
            heart_notes={perfume.heart_notes}
            base_notes={perfume.base_notes}
            avgLongevity={Math.max(1, avgLongevity)}
            avgSillage={Math.max(1, avgSillage)}
            reviewCount={reviewCount}
            initialDupes={dupes}
          />
        </section>
      </div>
    </main>
  );
}
