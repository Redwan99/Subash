// app/user/[id]/page.tsx
// Phase 6.3 — Individual User Profile Page
// Shows avatar, badge, bio, review history, and wardrobe shelves.
// Wardrobe add/remove only available to the profile owner.

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Edit, Trophy, Calendar, Sunrise, Sun, Sunset, Moon, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { WardrobePanel } from "@/components/wardrobe/WardrobePanel";
import { FollowButton } from "@/components/ui/FollowButton";
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

const timeDisplay = (tag: string | null) => {
  switch (tag) {
    case "morning":
    case "MORNING":
      return { label: "Morning", icon: <Sunrise className="w-4 h-4" /> };
    case "day":
    case "DAY":
      return { label: "Day", icon: <Sun className="w-4 h-4" /> };
    case "evening":
    case "EVENING":
      return { label: "Evening", icon: <Sunset className="w-4 h-4" /> };
    case "night":
    case "NIGHT":
      return { label: "Night", icon: <Moon className="w-4 h-4" /> };
    case "anytime":
    case "ANYTIME":
    case "all":
    case "BOTH":
      return { label: "Anytime", icon: <Clock className="w-4 h-4" /> };
    default:
      return null;
  }
};

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
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
        wearingStatus: {
          include: { perfume: { select: { id: true, name: true, brand: true, image_url: true, slug: true } } },
        },
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
        perfume: true,
      },
    }),
  ]);

  if (!user) return notFound();

  const grouped: Record<string, WardrobePerfume[]> = {
    HAVE: [], HAD: [], WANT: [], SIGNATURE: [],
  };
  for (const item of wardrobeItems) {
    const listType = item.shelf as string;
    if (!grouped[listType]) grouped[listType] = [];
    grouped[listType].push({
      id: item.perfume.id,
      name: item.perfume.name,
      brand: item.perfume.brand,
      image_url: item.perfume.image_url,
      slug: item.perfume.slug,
      shelf: listType,
    });
  }

  const wardrobeByType: Record<"HAVE" | "WANT" | "HAD", typeof wardrobeItems> = {
    HAVE: wardrobeItems.filter((item) => item.shelf === "HAVE"),
    WANT: wardrobeItems.filter((item) => item.shelf === "WANT"),
    HAD: wardrobeItems.filter((item) => item.shelf === "HAD"),
  };

  const badge = getBadge(user.review_count);
  const totalWardrobe = Object.values(grouped).reduce((s, a) => s + a.length, 0);
  const status = user.wearingStatus;
  
  const isFollowing = session?.user?.id 
    ? user.followers.some(f => f.followerId === session.user?.id)
    : false;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* ─── Currently Wearing Banner (if any) ─────────────── */}
        {status && (
          <div className="relative mb-4 overflow-hidden rounded-2xl p-4 md:p-5 bg-[linear-gradient(135deg,rgba(16,185,129,0.16)_0%,rgba(59,130,246,0.08)_50%,transparent_100%)] border border-emerald-400/40 shadow-[0_16px_45px_rgba(6,95,70,0.45)]">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(16,185,129,0.35)_0%,transparent_70%)]" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center overflow-hidden border border-emerald-300/60">
                {status.perfume?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={status.perfume.image_url}
                    alt={status.perfume.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">🧴</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                  Currently Wearing
                </p>
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {status.perfume?.name ?? status.customName ?? "Unknown scent"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-emerald-100/90">
                  {status.perfume?.brand && <span className="truncate">{status.perfume.brand}</span>}
                  {status.timeTag && (() => {
                    const info = timeDisplay(status.timeTag);
                    if (!info) return null;
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-300/60 text-[10px] font-semibold">
                        {info.icon}
                        <span>{info.label}</span>
                      </span>
                    );
                  })()}
                </div>
                {status.comment && (
                  <p className="mt-1 text-[11px] leading-relaxed text-emerald-50/90 line-clamp-2">
                    “{status.comment}”
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
                {!isOwner && session?.user?.id && (
                  <div className="shrink-0">
                    <FollowButton targetUserId={user.id} initialFollowing={isFollowing} />
                  </div>
                )}
              </div>
              {user.bio && (
                <p className="text-sm mt-2 text-[var(--text-secondary)]">{user.bio}</p>
              )}
              <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mt-3">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-[#3B82F6]" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">{user.followers.length}</span>
                  <span className="text-xs text-[var(--text-muted)]">followers</span>
                  <span className="text-xs text-[var(--border-color)] mx-1">•</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{user.following.length}</span>
                  <span className="text-xs text-[var(--text-muted)]">following</span>
                </div>
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
        <section className="rounded-2xl p-5 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)] space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">Fragrance Wardrobe</h2>
            <p className="text-xs text-[var(--text-muted)]">Your scent shelves at a glance.</p>
          </div>

          {([
            ["HAVE", "I Have It"],
            ["WANT", "I Want It"],
            ["HAD", "I Had It"],
          ] as const).map(([listType, title]) => (
            <div key={listType} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {title} ({wardrobeByType[listType].length})
              </h3>

              {wardrobeByType[listType].length === 0 ? (
                <div className="text-xs text-[var(--text-muted)]">No perfumes yet.</div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {wardrobeByType[listType].map((item) => {
                    const imageUrl = item.perfume.transparentImageUrl || item.perfume.image_url;
                    return (
                      <Link
                        key={item.id}
                        href={`/perfume/${item.perfume.slug}`}
                        className="w-20 h-20 shrink-0 bg-gray-50 dark:bg-white/5 rounded-xl p-2 hover:scale-110 transition-transform border border-gray-200 dark:border-white/10 backdrop-blur-lg flex items-center justify-center"
                      >
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={item.perfume.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-2xl">🧴</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </section>

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
