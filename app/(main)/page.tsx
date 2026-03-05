import Link from "next/link";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { getCachedTrendingPerfumes } from "@/lib/actions/search";
import { getFollowingFeed } from "@/lib/actions/feed";
import { auth } from "@/auth";
import { HomeFeedSection } from "@/components/home/HomeFeedSection";
import { ClimateSection } from "@/components/ClimateSection";
import { LiveReviewFeed, type LiveReview } from "@/components/feed/LiveReviewFeed";
import { SmartSearch } from "@/components/ui/SmartSearch";
import ReviewPosterCard from "@/components/reviews/ReviewPosterCard";
import { NewsletterFooter } from "@/components/layout/NewsletterFooter";
import { Sparkles } from "lucide-react";

// ISR: revalidate cached payloads every 60 seconds for homepage freshness
export const revalidate = 60;

type PerfumeCard = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image_url: string | null;
  transparentImageUrl?: string | null;
};

type LatestReview = {
  id: string;
  text: string;
  title: string | null;
  imageUrl: string | null;
  overall_rating: number;
  longevity_score: number;
  sillage_score: number;
  time_tags: string;
  weather_tags: string;
  upvote_count: number;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null; reputationScore: number };
  perfume: { id: string; slug: string; name: string; brand: string; image_url: string | null };
};

type TrendingPerfumeCard = PerfumeCard & { weeklySearchCount?: number };

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

const getLatestReviews = unstable_cache(
  async () =>
    {
      try {
        return await prisma.review.findMany({
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true, text: true, title: true, imageUrl: true, overall_rating: true,
            longevity_score: true,
            sillage_score: true,
            time_tags: true,
            weather_tags: true,
            upvote_count: true,
            createdAt: true,
            user: { select: { id: true, name: true, image: true, reputationScore: true } },
            perfume: { select: { id: true, slug: true, name: true, brand: true, image_url: true } },
          },
        });
      } catch (error) {
        console.warn("[homepage] latest reviews fallback to empty (DB unavailable)", error);
        return [] as LatestReview[];
      }
    },
  ["homepage-reviews-grid"],
  { revalidate: 300, tags: ["reviews"] }
);


// Map climate tags to fragrance accords that suit the weather
const CLIMATE_ACCORD_MAP: Record<string, string[]> = {
  HOT: ["citrus", "aquatic", "fresh", "ozonic", "green", "aromatic"],
  COLD: ["amber", "vanilla", "woody", "warm spicy", "oud", "balsamic", "tobacco"],
  MILD: ["floral", "rose", "powdery", "musk", "violet", "lavender"],
  HUMID: ["aquatic", "fresh", "ozonic", "citrus", "marine"],
  DRY: ["woody", "leather", "aromatic", "earthy", "vetiver"],
  RAINY: ["petrichor", "earthy", "green", "woody", "musk", "moss"],
};

async function getClimatePicks(climateTags: string[]) {
  const TARGET = 12;
  try {
    // 1) Exact matches: reviews with matching weather tags
    const climateWhere = climateTags.length
      ? { OR: climateTags.map((tag) => ({ weather_tags: { contains: `"${tag}"` } })) }
      : undefined;

    const [grouped, accordPerfumes, fallback] = await Promise.all([
      // Reviews with exact weather tag match
      climateWhere
        ? prisma.review.groupBy({
            by: ["perfumeId"],
            where: climateWhere,
            _avg: { overall_rating: true },
            _count: { id: true },
            orderBy: [{ _avg: { overall_rating: "desc" } }, { _count: { id: "desc" } }],
            take: TARGET,
          })
        : Promise.resolve([]),
      // 2) Accord-based: perfumes with climate-appropriate accords
      (async () => {
        const accords = climateTags.flatMap((t) => CLIMATE_ACCORD_MAP[t] ?? []);
        if (!accords.length) return [];
        return prisma.perfume.findMany({
          where: { OR: accords.map((a) => ({ accords: { contains: a } })) },
          select: { id: true, slug: true, name: true, brand: true, image_url: true },
          orderBy: { searchCount: "desc" },
          take: TARGET,
        }) as Promise<PerfumeCard[]>;
      })(),
      // 3) Trending fallback
      prisma.perfume.findMany({
        select: { id: true, slug: true, name: true, brand: true, image_url: true },
        orderBy: { searchCount: "desc" },
        take: TARGET,
      }) as Promise<PerfumeCard[]>,
    ]);

    const seen = new Set<string>();
    const results: Array<{ id: string; slug: string; name: string; brand: string; image_url: string | null; rating: number; reviewCount: number }> = [];

    // Add exact weather-tag matches first
    if (grouped.length) {
      const ids = grouped.map((g) => g.perfumeId);
      const perfumes = (await prisma.perfume.findMany({
        where: { id: { in: ids } },
        select: { id: true, slug: true, name: true, brand: true, image_url: true },
      })) as PerfumeCard[];
      const byId = new Map(perfumes.map((p) => [p.id, p]));
      for (const g of grouped) {
        const p = byId.get(g.perfumeId);
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          results.push({ ...p, rating: g._avg?.overall_rating ?? 0, reviewCount: g._count?.id ?? 0 });
        }
      }
    }

    // Fill with accord-based matches
    for (const p of accordPerfumes) {
      if (results.length >= TARGET) break;
      if (!seen.has(p.id)) {
        seen.add(p.id);
        results.push({ ...p, rating: 0, reviewCount: 0 });
      }
    }

    // Fill remaining with trending
    for (const p of fallback) {
      if (results.length >= TARGET) break;
      if (!seen.has(p.id)) {
        seen.add(p.id);
        results.push({ ...p, rating: 0, reviewCount: 0 });
      }
    }

    return results;
  } catch (error) {
    console.warn("[homepage] climate picks fallback to empty (DB unavailable)", error);
    return [];
  }
}

export default async function HomePage() {
  const city = process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "Dhaka";

  // Fan out: weather + trending + reviews all start at the same time.
  // Each fetch is individually guarded — a single failure cannot crash the page.

  const [weather, trending, latestReviews, session, followingFeed] = await Promise.all([
      getWeather(city).catch(() => null),
      getCachedTrendingPerfumes(12, 7).catch(() => [] as TrendingPerfumeCard[]),
      getLatestReviews().catch(() => [] as LatestReview[]),
      auth().catch(() => null),
      getFollowingFeed().catch(() => []),
  ]);

  // Trending can contain nulls if a perfume was deleted between stats fetch and hydration; guard them out.
  const trendingPerfumes = (trending ?? []).filter(Boolean) as TrendingPerfumeCard[];

  const climateTags = weather
    ? computeClimateTags(weather.temp, weather.humidity, weather.condition)
    : ["MILD"];
  const initialTheme = pickWeatherTheme(climateTags);

  let climatePicks: Awaited<ReturnType<typeof getClimatePicks>> = [];
  try {
    climatePicks = await getClimatePicks(climateTags);
  } catch (e) {
    console.warn("[homepage] climate picks failed", e);
  }

  const feedInitialReviews: LiveReview[] = (latestReviews ?? []).map((review) => ({
    ...review,
    createdAt:
      typeof review.createdAt === "string"
        ? review.createdAt
        : review.createdAt instanceof Date
        ? review.createdAt.toISOString()
        : new Date().toISOString(),
  }));

  return (
    <main className="min-h-screen pt-10 md:pt-16 pb-20">

      {/* ── Hero Search Section ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto text-center pt-4 pb-10 md:pt-12 md:pb-20">
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
      <section className="max-w-7xl mx-auto mt-12 md:mt-24">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(0,1fr)] gap-4 contain-paint">
          {latestReviews.map((review, i) => {
            // Bento pattern: positions 0,3 are featured (tall or wide)
            const isFeatured = i === 0 || i === 3;
            return (
              <div
                key={review.id}
                className={isFeatured ? 'sm:row-span-2' : ''}
              >
                <ReviewPosterCard review={review} size={isFeatured ? 'featured' : 'compact'} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Trending + Latest Reviews Feed */}
      <section className="w-full mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <HomeFeedSection trendingPerfumes={trendingPerfumes} followingFeed={followingFeed} hasUser={!!session?.user?.id} />

        <div className="space-y-4">
          {/* Live Feed — SWR polls /api/reviews every 5 s */}
          <LiveReviewFeed initialReviews={feedInitialReviews} />
        </div>
      </section>

      {/* Newsletter Footer — homepage only */}
      <NewsletterFooter />
    </main>
  );
}

