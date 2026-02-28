// app/user/[id]/page.tsx
// Phase 6.3 — Individual User Profile Page
// Shows avatar, badge, bio, review history, and wardrobe shelves.
// Wardrobe add/remove only available to the profile owner.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Edit, Trophy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { WardrobePanel } from "@/components/wardrobe/WardrobePanel";
import type { WardrobePerfume } from "@/types/wardrobe";
import type { Metadata } from "next";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  return {
    title: user?.name ? `${user.name}'s Profile` : "User Profile",
    description: "Fragrance profile on Subash community.",
  };
}

// ─── Badge helper ─────────────────────────────────────────────────────────────

function getBadge(count: number) {
  if (count >= 150) return { emoji: "🥇", label: "VIP Nose", color: "text-[#8B5CF6]" };
  if (count >= 50) return { emoji: "🥈", label: "Collector", color: "text-[#9CA3AF]" };
  if (count >= 11) return { emoji: "🥉", label: "Enthusiast", color: "text-[#A0684A]" };
  return { emoji: "🌱", label: "Novice", color: "text-[#34D399]" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isOwner = session?.user?.id === id;

  const [user, wardrobeItems] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        role: true,
        review_count: true,
        phoneVerified: true,
        createdAt: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            text: true,
            overall_rating: true,
            longevity_score: true,
            sillage_score: true,
            createdAt: true,
            upvote_count: true,
            perfume: {
              select: { id: true, name: true, brand: true, image_url: true, slug: true },
            },
          },
        },
      },
    }),
    prisma.wardrobeItem.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: {
        perfume: { select: { id: true, name: true, brand: true, image_url: true, slug: true } },
      },
    }),
  ]);

  if (!user) return notFound();

  const grouped: Record<string, WardrobePerfume[]> = {
    HAVE: [], HAD: [], WANT: [], SIGNATURE: [],
  };
  for (const item of wardrobeItems) {
    const shelf = item.shelf as string;
    if (!grouped[shelf]) grouped[shelf] = [];
    grouped[shelf].push({
      id: item.perfume.id,
      name: item.perfume.name,
      brand: item.perfume.brand,
      image_url: item.perfume.image_url,
      slug: item.perfume.slug,
      shelf,
    });
  }

  const badge = getBadge(user.review_count);
  const totalWardrobe = Object.values(grouped).reduce((s, a) => s + a.length, 0);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* ─── Profile Hero ──────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-[linear-gradient(135deg,rgba(139,92,246,0.10)_0%,rgba(109,40,217,0.04)_60%,transparent_100%)] border border-[#8B5CF6]/20">
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(139,92,246,0.18)_0%,transparent_70%)]" />

          <div className="relative flex items-start gap-5">
            <div className="shrink-0 w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-xl text-white bg-[linear-gradient(135deg,#8B5CF6,#6D28D9)] border-2 border-[#8B5CF6]/40">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name ?? "User"} className="w-full h-full object-cover" />
              ) : (
                (user.name ?? "U").slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[var(--text-primary)]">
                    {user.name ?? "Anonymous"}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-sm font-bold", badge.color)}>
                      {badge.emoji} {badge.label}
                    </span>
                    {user.role !== "STANDARD" && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[var(--accent)] border border-[#8B5CF6]/30">
                        {user.role.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <Link href="/profile/edit" className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] hover:border-[#8B5CF6]/35 transition-colors">
                    <Edit size={12} /> Edit Profile
                  </Link>
                )}
              </div>
              {user.bio && (
                <p className="text-sm mt-2 text-[var(--text-secondary)]">{user.bio}</p>
              )}
              <div className="flex items-center gap-5 mt-3">
                <div className="flex items-center gap-1.5">
                  <Star size={13} className="text-[#F59E0B]" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">{user.review_count}</span>
                  <span className="text-xs text-[var(--text-muted)]">reviews</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy size={13} className="text-[var(--accent)]" />
                  <span className="text-xs text-[var(--text-muted)]">{totalWardrobe} in wardrobe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[var(--text-muted)]" />
                  <span className="text-xs text-[var(--text-muted)]">
                    Joined {new Date(user.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Wardrobe ──────────────────────────────────────── */}
        <section>
          <WardrobePanel grouped={grouped} isOwner={isOwner} userId={id} />
        </section>

        {/* ─── Reviews ───────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)] flex items-center gap-2">
            <Star size={13} /> Recent Reviews {user.reviews.length > 0 && `(${user.review_count} total)`}
          </h2>
          {user.reviews.length === 0 ? (
            <div className="rounded-2xl p-10 text-center bg-[var(--bg-glass)] border border-dashed border-[var(--border-color)]">
              <p className="text-sm text-[var(--text-muted)]">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {user.reviews.map((r) => (
                <Link key={r.id} href={`/perfume/${r.perfume.slug}`} prefetch={false}>
                  <div className="rounded-2xl px-4 py-4 cursor-pointer transition-all bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] hover:border-[#8B5CF6]/30 hover:-translate-y-[1px]">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">{r.perfume.brand}</p>
                        <p className="text-sm font-semibold truncate text-[var(--text-primary)]">{r.perfume.name}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 mt-0.5">
                        <Star size={12} className="text-[#F59E0B]" />
                        <span className="text-sm font-bold text-[var(--text-primary)]">{r.overall_rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2 text-[var(--text-secondary)]">{r.text}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] text-[var(--text-muted)]">Longevity: {r.longevity_score}/5</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Sillage: {r.sillage_score}/5</span>
                      <span className="text-[10px] ml-auto text-[var(--text-muted)]">
                        {new Date(r.createdAt).toLocaleDateString("en-BD")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {user.review_count > 10 && (
                <p className="text-center text-xs py-2 text-[var(--text-muted)]">
                  Showing 10 of {user.review_count} reviews
                </p>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
