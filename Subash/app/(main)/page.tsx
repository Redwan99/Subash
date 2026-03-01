import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { truncate } from "@/lib/utils";
import { getTrendingPerfumes } from "@/lib/actions/search";
import { ClimateSection } from "@/components/ClimateSection";
import { LiveReviewFeed } from "@/components/feed/LiveReviewFeed";
import { SmartSearch } from "@/components/ui/SmartSearch";
import ReviewPosterCard from "@/components/reviews/ReviewPosterCard";
import { Sparkles } from "lucide-react";

// Data is cached via unstable_cache; page rendered dynamically (no DB at build time)
export const dynamic = 'force-dynamic';

type PerfumeCard = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image_url: string | null;
  transparentImageUrl?: string | null;
};

/** Convert OWM data into universal climate tags that match Review.weather_tags */
function computeClimateTags(
  temp: number,
  humidity: number,
  condition: string
): string[] {
  const tags: string[] = [];
  if (temp > 28) tags.push("HOT");
  else if (temp < 15) tags.push("COLD");
  else tags.push("MILD");
  if (humidity > 70) tags.push("HUMID");
  else if (humidity < 40) tags.push("DRY");
  if (["Rain", "Drizzle", "Thunderstorm"].includes(condition)) tags.push("RAINY");
  return tags;
}

function pickWeatherTheme(tags: string[]): string {
  if (tags.includes("RAINY")) return "theme-petrichor";
  if (tags.includes("COLD")) return "theme-frost";
  if (tags.includes("HOT") && tags.includes("HUMID")) return "theme-vetiver";
  if (tags.includes("HOT") && tags.includes("DRY")) return "theme-bergamot";
  if (tags.includes("HOT")) return "theme-neroli";
  return "theme-rose";
}
async function getWeather(city: string) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", city);
  url.searchParams.set("units", "metric");
  url.searchParams.set("appid", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    main?: { temp?: number; humidity?: number };
    weather?: { main?: string }[];
    name?: string;
  };

  if (!data.main?.temp || !data.main?.humidity) return null;
  return {
    temp: data.main.temp,
    humidity: data.main.humidity,
    condition: data.weather?.[0]?.main ?? "Clear",
    city: data.name ?? city,
  };
}

// ── Cached DB fetchers (independent per-function TTLs) ────────────────────
// unstable_cache deduplicates across simultaneous renders and survives
// across ISR re-validation cycles without blocking the initial response.

const getTrending = unstable_cache(
  async () => getTrendingPerfumes(12, 7),
  ["homepage-trending"],
  { revalidate: 120, tags: ["trending"] }
);

const getLatestReviews = unstable_cache(
  async () =>
    (prisma as any).review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, text: true, title: true, imageUrl: true, overall_rating: true,
        createdAt: true,
        user: { select: { name: true, image: true } },
        perfume: { select: { name: true, brand: true, image_url: true } },
      },
    }),
  ["homepage-reviews-grid"],
  { revalidate: 300, tags: ["reviews"] }
);


async function getClimatePicks(climateTags: string[]) {
  // Parallel: run groupBy and a fallback prefetch together — if groupBy
  // returns results we discard the fallback; if not, it's already ready.
  const [grouped, fallback] = await Promise.all([
    prisma.review.groupBy({
      by: ["perfumeId"],
      where: { weather_tags: { hasSome: climateTags } },
      _avg: { overall_rating: true },
      _count: { id: true },
      orderBy: [{ _avg: { overall_rating: "desc" } }, { _count: { id: "desc" } }],
      take: 12,
    }),
    prisma.perfume.findMany({
      select: { id: true, slug: true, name: true, brand: true, image_url: true },
      orderBy: [{ release_year: "desc" }, { name: "asc" }],
      take: 12,
    }),
  ]);

  if (!grouped.length) {
    return (fallback as PerfumeCard[]).map((p) => ({ ...p, rating: 0, reviewCount: 0 }));
  }

  const ids = grouped.map((g) => g.perfumeId);
  const perfumes = (await prisma.perfume.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true, name: true, brand: true, image_url: true },
  })) as PerfumeCard[];

  const byId = new Map(perfumes.map((p) => [p.id, p]));
  return grouped
    .map((g) => {
      const perfume = byId.get(g.perfumeId);
      if (!perfume) return null;
      return { ...perfume, rating: g._avg?.overall_rating ?? 0, reviewCount: g._count?.id ?? 0 };
    })
    .filter(Boolean) as Array<{
      id: string; slug: string; name: string; brand: string;
      image_url: string | null; rating: number; reviewCount: number;
    }>;
}

export default async function HomePage() {
  const city = process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "Dhaka";

  // ⚡ Fan out: weather + trending + reviews all start at the same time.
  // climatePicks depends on weather tags — it starts after weather resolves,
  // but by then trending and reviews are already in flight.
  const [weather, trending, latestReviews] = await Promise.all([
    getWeather(city),
    getTrending(),
    getLatestReviews(),
  ]);

  // Trending can contain nulls if a perfume was deleted between stats fetch and hydration; guard them out.
  const trendingPerfumes = trending.filter(
    (p): p is NonNullable<(typeof trending)[number]> => Boolean(p)
  );

  const climateTags = weather
    ? computeClimateTags(weather.temp, weather.humidity, weather.condition)
    : ["MILD"];
  const initialTheme = pickWeatherTheme(climateTags);
  const climatePicks = await getClimatePicks(climateTags);

  return (
    <main className="min-h-screen px-4 md:px-6 pt-20 md:pt-24 pb-20">

      {/* ── Hero Search Section ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto text-center pt-8 pb-16 md:pt-16 md:pb-20">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Discover Your Signature Scent.
        </h1>
        <p className="text-base md:text-lg text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
          Search Bangladesh&apos;s largest fragrance encyclopedia and community.
        </p>
        <div className="max-w-2xl mx-auto shadow-2xl shadow-[var(--accent)]/10 rounded-full">
          <SmartSearch
            id="hero-search"
            className="h-14 md:h-16 px-6 text-base md:text-lg"
          />
        </div>
      </section>

      {/* Weather Picks — live geolocation via ClimateSection client component */}
      <section className="max-w-6xl mx-auto">
        <div className="rounded-3xl p-6 md:p-8 glass">
          <ClimateSection
            initialWeather={weather ? {
              temp: weather.temp,
              humidity: weather.humidity,
              condition: weather.condition,
              city: weather.city,
              country: "",
            } : null}
            initialTags={climateTags}
            initialTheme={initialTheme}
            initialPicks={climatePicks}
          />
        </div>
      </section>

      {/* Latest Community Reviews Grid — Masonry Layout */}
      <section className="max-w-7xl mx-auto mt-16 md:mt-24 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-[var(--accent)]" />
              <span className="text-xs font-bold tracking-widest uppercase text-[var(--accent)]">Editorial</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[var(--text-primary)]">
              Latest Community Reviews
            </h2>
            <p className="text-[var(--text-muted)] mt-2">
              Deep dives and fragrance stories from our top reviewers.
            </p>
          </div>
          <Link href="/perfume" className="text-sm font-semibold text-[var(--accent)] hover:underline">
            Write a Review →
          </Link>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-2 xl:columns-3 gap-6 space-y-6">
          {latestReviews.map((review: any) => (
            <ReviewPosterCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      {/* Trending + Latest Reviews Feed */}
      <section className="w-full mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-[var(--text-primary)]">
              Trending This Week
            </h2>
            <Link href="/leaderboards" className="text-xs text-[var(--accent)]">
              View Leaderboards →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 w-full">
            {trendingPerfumes.map((p, index) => {
              const weekly = (p as any).weeklySearchCount ?? 0;
              const hasTraffic = weekly > 0;

              const imageSrc = p.transparentImageUrl || p.image_url || "/placeholder-perfume.jpg";

              return (
                <Link
                  key={p.id}
                  href={`/perfume/${p.slug}`}
                  className="flex flex-col bg-white/5 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 group"
                >
                  <div className="relative w-full aspect-square sm:aspect-[4/5] bg-gradient-to-b from-gray-50/50 to-transparent dark:from-white/5 dark:to-transparent p-3 sm:p-5 flex items-center justify-center">
                    <Image
                      src={imageSrc}
                      alt={p.name}
                      fill
                      className="object-contain p-4 drop-shadow-xl group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
                      <span className="text-[10px] sm:text-xs font-medium text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-md truncate">
                        🔥 Trending · #{index + 1}
                      </span>
                      {hasTraffic && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {weekly} searches
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* Live Feed — SWR polls /api/reviews every 5 s */}
          <LiveReviewFeed initialReviews={latestReviews} />
        </div>
      </section>
    </main>
  );
}
