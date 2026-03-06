"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame, Users, Star } from "lucide-react";
import { FollowingFeed, type TimelineItem } from "@/components/social/FollowingFeed";

type TrendingPerfumeItem = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  weeklySearchCount?: number;
  transparentImageUrl?: string | null;
  image_url?: string | null;
};

export function HomeFeedSection({
  trendingPerfumes,
  followingFeed,
  hasUser,
}: {
  trendingPerfumes: TrendingPerfumeItem[];
  followingFeed: TimelineItem[];
  hasUser: boolean;
}) {
  const [tab, setTab] = useState<"TRENDING" | "FOLLOWING">("TRENDING");

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-display font-semibold text-[var(--text-primary)]">
          Activity &amp; Trending
        </h2>
        {tab === "TRENDING" && (
          <Link href="/leaderboards" className="text-xs text-[var(--accent)] font-semibold hover:underline">
            View Leaderboards &rarr;
          </Link>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-6 border-b border-gray-200 dark:border-white/10 mb-6">
        <button
          onClick={() => setTab("TRENDING")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            tab === "TRENDING"
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4" /> Global Trending
        </button>
        {hasUser && (
          <button
            onClick={() => setTab("FOLLOWING")}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === "FOLLOWING"
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> Following
          </button>
        )}
      </div>

      {/* Content */}
      {tab === "TRENDING" ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-5 w-full">
          {trendingPerfumes.map((p) => {
            const weekly = p.weeklySearchCount ?? 0;
            const hasTraffic = weekly > 0;
            const imageSrc = p.transparentImageUrl || p.image_url || "/placeholder-perfume.jpg";

            return (
              <Link
                key={p.id}
                href={`/perfume/${p.slug}`}
                className="flex flex-col gpu-accelerate bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 group"
              >
                <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-gradient-to-b from-gray-50/50 to-transparent dark:from-white/5 dark:to-transparent p-3 sm:p-5 flex items-center justify-center">
                  <Image
                    src={imageSrc}
                    alt={p.name}
                    fill
                    className="object-contain p-4 drop-shadow-xl group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                <div className="p-3 sm:p-4 flex flex-col gap-0.5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-transparent">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-1 group-hover:text-brand-500 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                    {p.brand}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-xs font-medium text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-md truncate flex items-center gap-1">
                      {hasTraffic ? (
                        <><Flame className="w-3 h-3" /> Trending</>
                      ) : (
                        <><Star className="w-3 h-3" /> Classic</>
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <FollowingFeed timeline={followingFeed} />
      )}
    </div>
  );
}