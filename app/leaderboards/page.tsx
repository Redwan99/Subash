// app/leaderboards/page.tsx
// Phase 5 / Phase 6 Gamification — Top Reviewers Leaderboard.
// Server component: queries top 50 users by review_count.

import prisma from "@/lib/prisma";
import Image from "next/image";
import { Trophy, Star, Award, Sprout, Crown, Gem } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

// Always render at request time — no DB connection available at build time.
export const dynamic = 'force-dynamic';

// --- Badge helper --------------------------------------------------------------

type BadgeTier = {
  icon: LucideIcon;
  label: string;
  gradientClass: string;
  shadowClass: string;
};

function getBadge(count: number): BadgeTier {
  if (count >= 150) {
    return {
      icon: Award,
      label: "VIP Nose",
      gradientClass: "bg-[linear-gradient(135deg,#E84393,#F783AC,#C2255C)]",
      shadowClass: "shadow-[0_0_12px_rgba(232,67,147,0.45)]",
    };
  }
  if (count >= 50) {
    return {
      icon: Trophy,
      label: "Collector",
      gradientClass: "bg-[linear-gradient(135deg,#8E9CB5,#C2CAD8,#6B7A8D)]",
      shadowClass: "shadow-[0_0_10px_rgba(142,156,181,0.35)]",
    };
  }
  if (count >= 11) {
    return {
      icon: Star,
      label: "Enthusiast",
      gradientClass: "bg-[linear-gradient(135deg,#A0684A,#C8875E,#7A4F38)]",
      shadowClass: "shadow-[0_0_10px_rgba(160,104,74,0.3)]",
    };
  }
  return {
    icon: Sprout,
    label: "Novice",
    gradientClass: "",
    shadowClass: "",
  };
}

// --- Row -----------------------------------------------------------------------

function LeaderRow({
  user,
  rank,
}: {
  user: { id: string; name: string | null; username: string | null; image: string | null; review_count: number; role: string };
  rank: number;
}) {
  const badge   = getBadge(user.review_count);
  const isTop3  = rank <= 3;

  const rankTextClass: Record<number, string> = {
    1: "text-[#E84393]",
    2: "text-[#A0A8B0]",
    3: "text-[#A0684A]",
  };
  const rankBorderClass: Record<number, string> = {
    1: "border-[#E84393]",
    2: "border-[#A0A8B0]",
    3: "border-[#A0684A]",
  };

  return (
    <Link href={`/user/${user.username ?? user.id}`} prefetch={false}>
      <div
        className={cn(
          "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all cursor-pointer hover:translate-x-[3px]",
          isTop3
            ? cn(
                "backdrop-blur-[8px] shadow-[var(--shadow-glass)]",
                rank === 1
                  ? "bg-[linear-gradient(90deg,rgba(232,67,147,0.10)_0%,transparent_80%)] border border-[#E84393]/30"
                  : rank === 2
                  ? "bg-[linear-gradient(90deg,rgba(232,67,147,0.05)_0%,transparent_80%)] border border-[#E84393]/15"
                  : "bg-[linear-gradient(90deg,rgba(232,67,147,0.04)_0%,transparent_80%)] border border-[#E84393]/15"
              )
            : "bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)]"
        )}
      >
        {/* Rank */}
        <div
          className={cn(
            "shrink-0 w-8 text-center font-bold",
            isTop3 ? "text-lg" : "text-sm",
            rankTextClass[rank] ?? "text-[var(--text-muted)]"
          )}
        >
          {rank <= 3 ? (
            <span className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black",
              rank === 1 && "bg-[#FFD700]/20 text-[#FFD700]",
              rank === 2 && "bg-[#C0C0C0]/20 text-[#A0A8B0]",
              rank === 3 && "bg-[#CD7F32]/20 text-[#CD7F32]",
            )}>{rank}</span>
          ) : `#${rank}`}
        </div>

        {/* Avatar */}
        <div
          className={cn(
            "shrink-0 w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm text-white border-2",
            user.image ? "bg-transparent" : "bg-[linear-gradient(135deg,#E84393,#C2255C)]",
            isTop3 ? (rankBorderClass[rank] ?? "border-[#E84393]") : "border-[var(--border-color)]"
          )}
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          ) : (
            (user.name ?? "U")
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
          )}
        </div>

        {/* Name + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-sm font-semibold truncate text-[var(--text-primary)]"
            >
              {user.name ?? "Anonymous"}
            </span>
            {user.username && (
              <span className="text-[11px] text-[var(--text-muted)] font-medium shrink-0">@{user.username}</span>
            )}
            {/* Badge label */}
            <span
              className={cn(
                "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full",
                badge.gradientClass
                  ? cn(
                      "[background-clip:text] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] border border-[#E84393]/20",
                      badge.gradientClass,
                      badge.shadowClass
                    )
                  : "text-[var(--text-muted)] border border-[var(--border-color)]"
              )}
            >
              <badge.icon className="w-3.5 h-3.5 inline mr-0.5" /> {badge.label}
            </span>
          </div>
          {/* Role chip */}
          {user.role !== "STANDARD" && (
            <span
              className="text-[10px] font-medium text-[var(--accent)]"
            >
              {user.role.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Review count */}
        <div className="shrink-0 flex items-center gap-1">
          <Star size={12} className="text-[var(--accent)]" />
          <span className="text-sm font-bold text-[var(--text-primary)]">
            {user.review_count}
          </span>
          <span className="text-xs hidden sm:block text-[var(--text-muted)]">
            reviews
          </span>
        </div>
      </div>
    </Link>
  );
}

// --- Page ----------------------------------------------------------------------

export default async function LeaderboardsPage() {
  const users = await prisma.user.findMany({
    orderBy: { review_count: "desc" },
    take: 50,
    select: {
      id:           true,
      name:         true,
      username:     true,
      image:        true,
      review_count: true,
      role:         true,
    },
  });

  const tiers: { label: string; icon: LucideIcon; min: number; gradientClass: string }[] = [
    { label: "VIP Nose",    icon: Crown,  min: 150, gradientClass: "bg-[linear-gradient(135deg,#E84393,#F783AC)]" },
    { label: "Collector",   icon: Gem,    min: 50,  gradientClass: "bg-[linear-gradient(135deg,#8E9CB5,#C2CAD8)]" },
    { label: "Enthusiast",  icon: Star,   min: 11,  gradientClass: "bg-[linear-gradient(135deg,#A0684A,#C8875E)]" },
    { label: "Novice",      icon: Sprout, min: 0,   gradientClass: "" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-2xl mb-8 px-6 py-8 bg-[linear-gradient(135deg,rgba(232,67,147,0.12)_0%,rgba(194,37,92,0.06)_60%,transparent_100%)] border border-[#E84393]/25"
        >
          <div
            className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(232,67,147,0.2)_0%,transparent_70%)]"
          />
          <div className="relative flex items-center gap-3 mb-3">
            <Trophy size={24} className="text-[var(--accent)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Leaderboard
            </h1>
          </div>
          <p className="text-sm max-w-sm text-[var(--text-secondary)]">
            The most prolific reviewers in Bangladesh&apos;s fragrance community.
          </p>

          {/* Tier legend */}
          <div className="flex flex-wrap gap-3 mt-5">
            {tiers.map((t) => (
              <div
                key={t.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[rgba(0,0,0,0.15)] border border-[var(--border-color)] text-[var(--text-muted)]"
              >
                <t.icon size={14} />
                <span
                  className={cn(
                    t.gradientClass
                      ? "[background-clip:text] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
                      : "",
                    t.gradientClass
                  )}
                >
                  {t.label}
                </span>
                <span className="text-[var(--text-muted)]">
                  ({t.min}+)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* List */}
        {users.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center bg-[var(--bg-glass)] border border-dashed border-[var(--border-color)]"
          >
            <p className="text-sm text-[var(--text-muted)]">
              No reviews yet. Be the first!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user, i) => (
              <LeaderRow key={user.id} user={user} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: "Leaderboard — Subash",
  description: "Top fragrance reviewers in the Subash community.",
};
