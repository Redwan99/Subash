// app/perfume/[id]/page.tsx
// Phase 4 — Perfume Profile Page

import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

// ISR: refresh perfume pages every 60s
export const revalidate = 60;
import { notFound } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { ShoppingCart, ExternalLink, Tag, Store, Check, Star, Clock, Wind } from "lucide-react";
import NextDynamic from "next/dynamic";
import { DecantCard, type DecantCardData } from "@/components/marketplace/DecantCard";
import { auth } from "@/auth";
import { PerfumeHero } from "@/components/perfume/PerfumeHero";
import { WardrobeActionBar } from "@/components/perfume/WardrobeActionBar";
import { CommunityConsensus } from "@/components/perfume/CommunityConsensus";
import ViewTracker from "@/components/perfume/ViewTracker";
import { parsePrismaArray } from "@/lib/utils";
import { WriteReviewModal } from "@/components/perfume/WriteReviewModal";


// Lazy-load the heavy interactive client bundle (ScentProfile, DupeEngine, ReviewForm)
const PerfumeInteractive = NextDynamic(
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
      transparentImageUrl: true,
      slug: true,
      release_year: true,
      description: true,
      perfumer: true,
      gender: true,
      accords: true,
      top_notes: true,
      heart_notes: true,
      base_notes: true,
      source_url: true,
      country: true,
      rating_value: true,
      rating_count: true,
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
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          overall_rating: true,
          longevity_score: true,
          sillage_score: true,
          projection_score: true,
          intensity_score: true,
          text: true,
          createdAt: true,
          time_tags: true,
          weather_tags: true,
          genderLeaning: true,
          occasion: true,
          valueRating: true,
          blindBuySafe: true,
          userId: true,
          user: { select: { id: true, name: true, image: true, username: true } },
        },
      },
      dupesForThis: {
        orderBy: { votes: "desc" },
        select: {
          id: true,
          votes: true,
          dupePerfume: { select: { id: true, name: true, brand: true, image_url: true, slug: true } },
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

  const [shopsToggle, decantsToggle] = await Promise.all([
    prisma.featureToggle.findUnique({ where: { key: "ENABLE_SHOPS" } }).catch(() => null),
    prisma.featureToggle.findUnique({ where: { key: "ENABLE_DECANTS" } }).catch(() => null),
  ]);

  const isShopsEnabled = shopsToggle?.isEnabled ?? true;
  const isDecantsEnabled = decantsToggle?.isEnabled ?? true;

  // Telemetry track view
  trackEvent("view_perfume", { id: perfume.id, slug: perfume.slug });

  // Wardrobe status (null when not signed in)
  const session = await auth();
  const currentWardrobeStatus = session?.user?.id
    ? await prisma.wardrobeItem.findUnique({
        where: {
          userId_perfumeId: {
            userId: session.user.id,
            perfumeId: perfume.id,
          },
        },
        select: { shelf: true },
      })
    : null;

  // Check if user has already reviewed this perfume
  const userExistingReview = session?.user?.id
    ? perfume.reviews.find((r: { userId: string }) => r.userId === session.user!.id) ?? null
    : null;

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
  const avgProjection = reviewCount
    ? perfume.reviews.reduce((sum: number, r: { projection_score: number | null }) => sum + (r.projection_score ?? 0), 0) / perfume.reviews.filter((r: { projection_score: number | null }) => r.projection_score != null).length || 0
    : 0;
  const avgIntensity = reviewCount
    ? perfume.reviews.reduce((sum: number, r: { intensity_score: number | null }) => sum + (r.intensity_score ?? 0), 0) / perfume.reviews.filter((r: { intensity_score: number | null }) => r.intensity_score != null).length || 0
    : 0;

  // Compute actual rating distribution for CommunityConsensus
  const ratingCounts = { love: 0, like: 0, ok: 0, mixed: 0, dislike: 0 };
  // Aggregate weather/time/occasion from reviews
  const weatherCounts: Record<string, number> = {};
  const timeCounts: Record<string, number> = {};
  const occasionCounts: Record<string, number> = {};

  perfume.reviews.forEach((r: { overall_rating: number; weather_tags?: string; time_tags?: string; occasion?: string | null }) => {
    if (r.overall_rating >= 4.5) ratingCounts.love++;
    else if (r.overall_rating >= 3.5) ratingCounts.like++;
    else if (r.overall_rating >= 2.5) ratingCounts.ok++;
    else if (r.overall_rating >= 1.5) ratingCounts.mixed++;
    else ratingCounts.dislike++;

    // Aggregate weather tags
    try {
      const wTags = JSON.parse(r.weather_tags || "[]") as string[];
      for (const tag of wTags) {
        const key = tag.toLowerCase();
        weatherCounts[key] = (weatherCounts[key] || 0) + 1;
      }
    } catch { /* ignore */ }

    // Aggregate time tags
    try {
      const tTags = JSON.parse(r.time_tags || "[]") as string[];
      for (const tag of tTags) {
        const key = tag.toLowerCase();
        timeCounts[key] = (timeCounts[key] || 0) + 1;
      }
    } catch { /* ignore */ }

    // Aggregate occasion
    if (r.occasion) {
      occasionCounts[r.occasion] = (occasionCounts[r.occasion] || 0) + 1;
    }
  });

  // Derive active seasons from weather tags
  const seasonMap: Record<string, string[]> = {
    spring: ["mild", "humid"],
    summer: ["hot", "humid"],
    autumn: ["mild", "dry"],
    winter: ["cold", "dry"],
  };
  const activeSeasons = Object.entries(seasonMap)
    .filter(([, weatherKeys]) => weatherKeys.some(k => (weatherCounts[k] || 0) > 0))
    .map(([season]) => season);

  // Derive active times
  const activeTimes = Object.entries(timeCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  const dupes = perfume.dupesForThis.map((d: {
    id: string; votes: number;
    dupePerfume: { id: string; name: string; brand: string; image_url: string | null; slug: string };
  }) => ({
    id: d.id, votes: d.votes,
    dupePerfume: { id: d.dupePerfume.id, name: d.dupePerfume.name, brand: d.dupePerfume.brand, image_url: d.dupePerfume.image_url, slug: d.dupePerfume.slug },
  }));

  const accords = parsePrismaArray(perfume.accords);
  const topNotes = parsePrismaArray(perfume.top_notes);
  const heartNotes = parsePrismaArray(perfume.heart_notes);
  const baseNotes = parsePrismaArray(perfume.base_notes);

  return (
    <main className="min-h-screen pb-20">
      <div className="w-full space-y-10">
        <ViewTracker perfumeId={perfume.id} />
        <PerfumeHero
          perfume={{
            id: perfume.id,
            name: perfume.name,
            brand: perfume.brand,
            image_url: perfume.image_url,
            transparentImageUrl: perfume.transparentImageUrl,
            release_year: perfume.release_year,
            gender: perfume.gender,
            accords,
            top_notes: topNotes,
            country: perfume.country ?? null,
            source_url: perfume.source_url ?? null,
            rating_value: perfume.rating_value ?? null,
            rating_count: perfume.rating_count ?? null,
          }}
          avgRating={avgRating}
          reviewCount={reviewCount}
          avgLongevity={avgLongevity}
          avgSillage={avgSillage}
        />

        {!!session?.user?.id && (
          <WardrobeActionBar
            perfumeId={perfume.id}
            initialStatus={currentWardrobeStatus?.shelf}
          />
        )}

        {/* Community Consensus */}
        <CommunityConsensus
          reviewCount={reviewCount}
          avgRating={avgRating}
          ratingCounts={ratingCounts}
          avgLongevity={avgLongevity}
          avgSillage={avgSillage}
          avgProjection={avgProjection}
          avgIntensity={avgIntensity}
          activeSeasons={activeSeasons}
          activeTimes={activeTimes}
          occasionCounts={occasionCounts}
        />

        {/* Marketplace */}
        {(isShopsEnabled || isDecantsEnabled) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verified Deals */}
          {isShopsEnabled && (
          <div className="rounded-3xl p-6 space-y-4 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
            <div className="flex items-center gap-2 mb-1">
              <Store size={15} className="text-[#E84393]" />
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
                      className="group flex items-center justify-between rounded-2xl px-4 py-3 border transition-all duration-200 hover:shadow-[0_4px_20px_rgba(232,67,147,0.2)] hover:border-[rgba(232,67,147,0.4)] bg-[rgba(232,67,147,0.05)] border-[rgba(232,67,147,0.15)]">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-bold text-[var(--text-primary)]">{shopName}</p>
                          {deal.shop?.isVerified && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(232,67,147,0.15)] text-[#E84393] inline-flex items-center gap-0.5"><Check size={8} /> VERIFIED</span>
                          )}
                          {deal.is_featured && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#F59E0B] inline-flex items-center gap-0.5"><Star size={8} className="fill-current" /> FEATURED</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-[#E84393]">৳{deal.price.toLocaleString()}</span>
                          {deal.discountPercentage && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-[#F59E0B]">
                              <Tag size={10} /> {deal.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white bg-[linear-gradient(135deg,#E84393,#D6336C)] shadow-[0_2px_12px_rgba(232,67,147,0.3)] group-hover:shadow-[0_4px_20px_rgba(232,67,147,0.5)] transition-all">
                        Buy <ExternalLink size={12} />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {isDecantsEnabled && (
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
          )}
        </section>
        )}

        {/* Interactive Scent Engine */}
        <section>
          <PerfumeInteractive
            perfumeId={perfume.id} description={perfume.description ?? null}
            perfumer={perfume.perfumer ?? null}
            accords={accords} top_notes={topNotes}
            heart_notes={heartNotes}
            base_notes={baseNotes}
            initialDupes={dupes}
          />
        </section>

        {/* ── Write Review CTA ──────────────────────────────── */}
        <section className="flex items-center justify-between rounded-2xl border border-[var(--bg-glass-border)] bg-[var(--bg-glass)] backdrop-blur-xl px-5 py-4 shadow-[var(--shadow-glass)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {userExistingReview ? "Update your review?" : "Tried this fragrance?"}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {userExistingReview ? "Your opinion may have changed — update your review." : "Share your experience with the community."}
            </p>
          </div>
          <WriteReviewModal
            perfumeId={perfume.id}
            variant="cta"
            existingReview={userExistingReview ? {
              id: userExistingReview.id,
              text: userExistingReview.text,
              overall_rating: userExistingReview.overall_rating,
              longevity_score: userExistingReview.longevity_score,
              sillage_score: userExistingReview.sillage_score,
              projection_score: userExistingReview.projection_score ?? null,
              intensity_score: userExistingReview.intensity_score ?? null,
              time_tags: userExistingReview.time_tags ?? "[]",
              weather_tags: userExistingReview.weather_tags ?? "[]",
              genderLeaning: userExistingReview.genderLeaning ?? null,
              occasion: userExistingReview.occasion ?? null,
              valueRating: userExistingReview.valueRating ?? null,
              blindBuySafe: userExistingReview.blindBuySafe ?? null,
            } : undefined}
          />
        </section>

        {/* ── User Reviews ─────────────────────────────────────── */}
        {reviewCount > 0 && (
          <section className="rounded-3xl border border-[var(--bg-glass-border)] bg-[var(--bg-glass)] backdrop-blur-xl p-6 shadow-[var(--shadow-glass)]">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-5 text-[var(--text-muted)] flex items-center gap-2">
              <Star size={13} className="text-[var(--accent)]" /> Community Reviews ({reviewCount})
            </h2>
            <div className="space-y-3">
              {perfume.reviews.map((r: {
                id: string; overall_rating: number; longevity_score: number; sillage_score: number;
                text: string; createdAt: Date;
                user: { id: string; name: string | null; image: string | null; username: string | null };
              }) => (
                <Link
                  key={r.id}
                  href={`/review/${r.id}`}
                  className="block rounded-2xl px-4 py-4 transition-all bg-[var(--bg-surface)] border border-[var(--bg-glass-border)] hover:border-[rgba(232,67,147,0.25)]"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {r.user.image ? (
                        <Image src={r.user.image} alt="" width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[linear-gradient(135deg,#E84393,#C2255C)] flex items-center justify-center text-[8px] font-black text-white">
                          {(r.user.name ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {r.user.name ?? "Anonymous"}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <Star size={12} className="text-[#F59E0B] fill-current" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">{r.overall_rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)] mb-2">{r.text}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <Clock size={10} className="text-[#60A5FA]" /> Longevity: {r.longevity_score}/10
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <Wind size={10} className="text-[#F783AC]" /> Sillage: {r.sillage_score}/10
                    </span>
                    <span className="text-[10px] ml-auto text-[var(--text-muted)]">
                      {new Date(r.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
