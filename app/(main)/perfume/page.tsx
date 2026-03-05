// app/perfume/page.tsx
// Unified Perfumes page — Discovery Matrix with advanced filters.

import { Metadata } from "next";
import EncyclopediaMatrix from "@/components/encyclopedia/EncyclopediaMatrix";
import { searchEncyclopedia } from "@/lib/actions/encyclopedia";

export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Perfumes | Subash",
    description: "Discover your signature scent — filter by accord, mood, weather, time, gender, and notes.",
};

export default async function PerfumesPage() {
    const initialData = await searchEncyclopedia({ sort: "trending" });

    return (
        <div className="flex w-full animate-fade-in-up">
            {/* Left Sidebar: Discovery Matrix filter panel and platform stats */}
            <aside className="hidden lg:flex flex-col w-[var(--sidebar-width)] min-h-screen border-r border-[var(--bg-glass-border)] bg-[var(--bg-glass)] backdrop-blur-xl">
                <div className="p-4 space-y-6 pt-6">
                    {/* Platform Stats */}
                    {/* TODO: Import and render PlatformStats component here, or inline stats if available */}
                    {/* Discovery Matrix filter panel */}
                    <EncyclopediaMatrix initialData={initialData} sidebarOnly />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 px-4 md:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                        Fragrance Matrix
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Discover your signature scent using our advanced database filters.
                    </p>
                </div>
                {/* Only show results grid here, not filter panel */}
                {/* TODO: Refactor EncyclopediaMatrix to support sidebarOnly prop for filter panel separation */}
            </div>
        </div>
    );
}

