// app/perfume/[id]/page.tsx
// Phase 4 — Perfume Profile Page

import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { Star, ShoppingCart, ExternalLink, Tag, Store } from "lucide-react";
import dynamic from "next/dynamic";
import { DecantCard, type DecantCardData } from "@/components/marketplace/DecantCard";
import { auth } from "@/auth";
import { checkWardrobeStatus } from "@/lib/actions/reviews";
import { AddToWardrobeButton } from "@/components/perfume/AddToWardrobeButton";

// Lazy-load the heavy interactive client bundle (ScentProfile, DupeEngine, ReviewForm)
const PerfumeInteractive = dynamic(
  () => import("./PerfumeInteractive").then((m) => m.PerfumeInteractive),
  { loading: () => <div className="h-32 rounded-2xl animate-pulse bg-[var(--bg-glass)]" /> }
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyPrisma = prisma as any;
  const perfume = await anyPrisma.perfume.findUnique({
    where: { slug: id },
    select: { name: true, brand: true, description: true },
  });

  if (!perfume) return { title: "Perfume Not Found | Subash" };

  const title = `${perfume.name} by ${perfume.brand} | Subash`;
  const description = perfume.description?.slice(0, 160) || `Read authentic reviews and discover ${perfume.name} by ${perfume.brand} on Subash.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    }
  };
}

export default async function PerfumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyPrisma = prisma as any;
  // Optimized select — only fetch columns actually rendered on this page.
  const perfume = await anyPrisma.perfume.findUnique({
    where: { slug: id },
    select: {
      id: true,
      name: true,
      brand: true,
      image_url: true,
      release_year: true,
      description: true,
      perfumer: true,
      gender: true,
      accords: true,
      top_notes: true,
      heart_notes: true,
      base_notes: true,
      decantListings: {
        where: { status: "AVAILABLE" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          price_5ml: true,
          price_10ml: true,
          batch_code: true,
          proof_image_url: true,
          status: true,
          createdAt: true,
          seller: { select: { id: true, name: true, image: true, phone: true } },
          perfume: { select: { id: true, name: true, brand: true } },
        },
      },
      reviews: {
        select: {
          overall_rating: true,
          longevity_score: true,
          sillage_score: true,
        },
      },
      dupeOriginal: {
        orderBy: { upvotes: "desc" },
        select: {
          id: true,
          upvotes: true,
          downvotes: true,
          clone: { select: { id: true, name: true, brand: true, image_url: true, slug: true } },
        },
      },
      deals: {
        where: { is_active: true },
        orderBy: { price: "asc" },
        select: {
          id: true,
          price: true,
          url: true,
          link: true,
          discountPercentage: true,
          is_featured: true,
          seller: { select: { name: true } },
          shop: { select: { id: true, name: true, website: true, isVerified: true } },
        },
      },
    },
  });

  if (!perfume) return notFound();

  // Telemetry track view
  trackEvent("view_perfume", { id: perfume.id, slug: perfume.slug });

  // Wardrobe status (null when not signed in)
  const session = await auth();
  const wardrobeStatus = session?.user?.id
    ? await checkWardrobeStatus(perfume.id)
    : { shelf: null };

  const reviewCount = perfume.reviews.length;
  const avgRating = reviewCount
    ? perfume.reviews.reduce((sum: number, r: { overall_rating: number }) => sum + r.overall_rating, 0) / reviewCount
    : 0;
  const avgLongevity = reviewCount
    ? perfume.reviews.reduce((sum: number, r: { longevity_score: number }) => sum + r.longevity_score, 0) / reviewCount
    : 1;
  const avgSillage = reviewCount
    ? perfume.reviews.reduce((sum: number, r: { sillage_score: number }) => sum + r.sillage_score, 0) / reviewCount
    : 1;

  const dupes = perfume.dupeOriginal.map((d: {
    id: string; upvotes: number; downvotes: number;
    clone: { id: string; name: string; brand: string; image_url: string | null; slug: string };
  }) => ({
    id: d.id, upvotes: d.upvotes, downvotes: d.downvotes,
    clone: { id: d.clone.id, name: d.clone.name, brand: d.clone.brand, image_url: d.clone.image_url, slug: d.clone.slug },
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

            <div className="flex items-center flex-wrap gap-3">
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
              {/* Wardrobe button — only if signed in */}
              {session?.user && (
                <AddToWardrobeButton
                  perfumeId={perfume.id}
                  initialShelf={wardrobeStatus.shelf}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(perfume.top_notes as string[]).slice(0, 3).map((note: string) => (
                <span
                  key={note}
                  className="text-xs px-2 py-1 rounded-full bg-[#8B5CF6]/15 text-[var(--accent)]"
                >
                  {note as string}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Marketplace */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verified Deals */}
          <div className="rounded-3xl p-6 space-y-4 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
            <div className="flex items-center gap-2 mb-1">
              <Store size={15} className="text-[#10B981]" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Verified Retailers</h2>
              <Link href="/shops" className="ml-auto text-[10px] text-[var(--accent)] hover:underline">All shops →</Link>
            </div>

            {perfume.deals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-[var(--bg-glass-border)]">
                <ShoppingCart size={24} className="text-[var(--text-muted)] mb-2 opacity-40" />
                <p className="text-sm text-[var(--text-muted)]">No verified deals yet.</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 opacity-70">Check back soon for retailer pricing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(perfume.deals as Array<{
                  id: string; price: number; url: string | null; link: string | null;
                  discountPercentage: number | null; is_featured: boolean;
                  seller: { name: string | null };
                  shop: { id: string; name: string; website: string | null; isVerified: boolean } | null;
                }>).map((deal) => {
                  const buyUrl = deal.url ?? deal.link ?? deal.shop?.website ?? "#";
                  const shopName = deal.shop?.name ?? deal.seller.name ?? "Seller";
                  return (
                    <a key={deal.id} href={buyUrl} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-2xl px-4 py-3 border transition-all duration-200 hover:shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.05)] border-[rgba(16,185,129,0.15)]">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-bold text-[var(--text-primary)]">{shopName}</p>
                          {deal.shop?.isVerified && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10B981]">✓ VERIFIED</span>
                          )}
                          {deal.is_featured && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#F59E0B]">★ FEATURED</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-[#10B981]">৳{deal.price.toLocaleString()}</span>
                          {deal.discountPercentage && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-[#F59E0B]">
                              <Tag size={10} /> {deal.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white bg-[linear-gradient(135deg,#10B981,#059669)] shadow-[0_2px_12px_rgba(16,185,129,0.3)] group-hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-all">
                        Buy <ExternalLink size={12} />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
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
                {(perfume.decantListings as DecantCardData[]).map((listing: DecantCardData, index: number) => (
                  <DecantCard key={listing.id} listing={listing} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Interactive Scent Engine */}
        <section>
          <PerfumeInteractive
            perfumeId={perfume.id} description={perfume.description ?? null}
            perfumer={perfume.perfumer ?? null}
            accords={perfume.accords} top_notes={perfume.top_notes}
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
