// app/perfume/page.tsx
// Unified Perfumes page — Discovery Matrix with advanced filters.

import { Metadata } from "next";
import EncyclopediaMatrix from "@/components/encyclopedia/EncyclopediaMatrix";
import { searchEncyclopedia } from "@/lib/actions/encyclopedia";
import { getTrendingPerfumes } from "@/lib/actions/search";

export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Perfumes | Subash",
    description: "Discover your signature scent — filter by accord, mood, weather, time, gender, and notes.",
};

export default async function PerfumesPage() {
    let initialData: Awaited<ReturnType<typeof searchEncyclopedia>> = [];
    let monthlyTrending: { id: string; slug: string; name: string; brand: string; image_url: string | null; transparentImageUrl: string | null; weeklySearchCount: number }[] = [];
    try {
        [initialData, monthlyTrending] = await Promise.all([
            searchEncyclopedia({ sort: "trending", take: 40 }),
            getTrendingPerfumes(12, 30),
        ]);
    } catch (e) {
        console.error("[PerfumesPage] Failed to load initial data", e);
    }

    return (
        <div className="w-full animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                    Fragrance Matrix
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Discover your signature scent using our advanced database filters.
                </p>
            </div>

            <EncyclopediaMatrix initialData={initialData} monthlyTrending={monthlyTrending} />
        </div>
    );
}

