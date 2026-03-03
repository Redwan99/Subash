"use client";
import { useState, useEffect, useTransition } from "react";
import { searchEncyclopedia } from "@/lib/actions/encyclopedia";
import Image from "next/image";
import Link from "next/link";
import { Filter, Loader2 } from "lucide-react";

const POPULAR_ACCORDS = ["Vanilla", "Woody", "Fresh Spicy", "Citrus", "Sweet", "Amber", "Fruity", "Powdery"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EncyclopediaMatrix({ initialData }: { initialData: any[] }) {
  const [results, setResults] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [selectedAccords, setSelectedAccords] = useState<string[]>([]);
  const [sort, setSort] = useState("trending");

  // Fetch logic
  useEffect(() => {
    startTransition(() => {
      searchEncyclopedia({ accords: selectedAccords, sort }).then(data => setResults(data));
    });
  }, [selectedAccords, sort]);

  const toggleAccord = (accord: string) => {
    setSelectedAccords(prev => prev.includes(accord) ? prev.filter(a => a !== accord) : [...prev, accord]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Left Filter Panel */}
      <div className="w-full lg:w-64 shrink-0 space-y-8">
        <div className="sticky top-24 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-white/10 pb-4">
            <Filter className="w-5 h-5 text-brand-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">Discovery Matrix</h2>
          </div>

          {/* Accords Filter */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Accords</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ACCORDS.map(accord => (
                <button 
                  key={accord} 
                  onClick={() => toggleAccord(accord)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${selectedAccords.includes(accord) ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  {accord}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sort By</h3>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-brand-500 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest Releases</option>
              <option value="a-z">Alphabetical (A&ndash;Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Right Results Grid */}
      <div className="flex-1">
        {isPending ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 w-full contain-paint">
            {results.map(perfume => (
              <Link key={perfume.id} href={`/perfume/${perfume.slug}`} className="flex flex-col bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 group gpu-accelerate">
                <div className="relative w-full aspect-square sm:aspect-[4/5] bg-gradient-to-b from-gray-50/50 to-transparent dark:from-white/5 dark:to-transparent p-3 sm:p-5 flex items-center justify-center">
                  <Image src={perfume.transparentImageUrl || perfume.image_url} alt={perfume.name} fill className="object-contain p-4 drop-shadow-xl group-hover:scale-110 transition-transform duration-700 ease-out" sizes="(max-width: 640px) 50vw, 25vw" />
                </div>
                <div className="p-3 sm:p-4 flex flex-col gap-0.5 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-transparent">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-1 group-hover:text-brand-500 transition-colors">{perfume.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{perfume.brand}</p>
                </div>
              </Link>
            ))}
            {results.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-500">No perfumes match your exact filters. Try removing some.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}