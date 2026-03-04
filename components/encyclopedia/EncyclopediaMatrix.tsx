"use client";
import { useState, useEffect, useTransition } from "react";
import { searchEncyclopedia } from "@/lib/actions/encyclopedia";
import Image from "next/image";
import Link from "next/link";
import {
  Filter, Loader2, Heart, Sparkles, Coffee, ShieldCheck, Eye,
  Sun, Cloud, Snowflake, Droplets, CloudRain, CloudFog,
  Sunrise, SunMedium, Sunset, Moon,
  User, Users, ChevronDown, ChevronUp, Search, X,
} from "lucide-react";

const POPULAR_ACCORDS = ["Vanilla", "Woody", "Fresh Spicy", "Citrus", "Sweet", "Amber", "Fruity", "Powdery"];

const MOODS = [
  { value: "romantic", label: "Romantic", icon: Heart },
  { value: "fresh", label: "Fresh", icon: Sparkles },
  { value: "cozy", label: "Cozy", icon: Coffee },
  { value: "confident", label: "Confident", icon: ShieldCheck },
  { value: "mysterious", label: "Mysterious", icon: Eye },
];

const WEATHER_OPTIONS = [
  { value: "HOT", label: "Hot", icon: Sun },
  { value: "COLD", label: "Cold", icon: Snowflake },
  { value: "MILD", label: "Mild", icon: Cloud },
  { value: "HUMID", label: "Humid", icon: Droplets },
  { value: "RAINY", label: "Rainy", icon: CloudRain },
  { value: "DRY", label: "Dry", icon: CloudFog },
];

const TIME_OPTIONS = [
  { value: "MORNING", label: "Morning", icon: Sunrise },
  { value: "DAY", label: "Day", icon: SunMedium },
  { value: "EVENING", label: "Evening", icon: Sunset },
  { value: "NIGHT", label: "Night", icon: Moon },
];

const GENDERS = [
  { value: "men", label: "Men", icon: User },
  { value: "women", label: "Women", icon: User },
  { value: "unisex", label: "Unisex", icon: Users },
];

// Collapsible filter section
function FilterSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        {title}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && children}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EncyclopediaMatrix({ initialData }: { initialData: any[] }) {
  const [results, setResults] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [selectedAccords, setSelectedAccords] = useState<string[]>([]);
  const [sort, setSort] = useState("trending");
  const [gender, setGender] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [weatherTags, setWeatherTags] = useState<string[]>([]);
  const [timeTags, setTimeTags] = useState<string[]>([]);
  const [notesQuery, setNotesQuery] = useState("");

  const activeFilterCount = selectedAccords.length + (gender ? 1 : 0) + (mood ? 1 : 0) + weatherTags.length + timeTags.length + (notesQuery.trim() ? 1 : 0);

  // Fetch logic
  useEffect(() => {
    startTransition(() => {
      searchEncyclopedia({
        accords: selectedAccords,
        sort,
        gender: gender || undefined,
        mood: mood || undefined,
        weatherTags: weatherTags.length > 0 ? weatherTags : undefined,
        timeTags: timeTags.length > 0 ? timeTags : undefined,
        notes: notesQuery.trim() || undefined,
      }).then(data => setResults(data));
    });
  }, [selectedAccords, sort, gender, mood, weatherTags, timeTags, notesQuery]);

  const toggleAccord = (accord: string) => {
    setSelectedAccords(prev => prev.includes(accord) ? prev.filter(a => a !== accord) : [...prev, accord]);
  };

  const toggleWeather = (tag: string) => {
    setWeatherTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleTime = (tag: string) => {
    setTimeTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const clearAll = () => {
    setSelectedAccords([]);
    setGender(null);
    setMood(null);
    setWeatherTags([]);
    setTimeTags([]);
    setNotesQuery("");
    setSort("trending");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* Left Filter Panel */}
      <div className="w-full lg:w-64 shrink-0 space-y-4">
        <div className="sticky top-24 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-xl max-h-[calc(100vh-120px)] overflow-y-auto [scrollbar-width:thin]">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-brand-500" />
              <h2 className="font-bold text-gray-900 dark:text-white">Discovery Matrix</h2>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-[10px] font-semibold text-red-500 hover:underline flex items-center gap-0.5">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* Notes Search */}
          <FilterSection title="Search Notes" defaultOpen={false}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={notesQuery}
                onChange={(e) => setNotesQuery(e.target.value)}
                placeholder="e.g. bergamot, oud, vanilla..."
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs bg-gray-100 dark:bg-white/5 border border-transparent focus:border-brand-500 text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
              />
            </div>
          </FilterSection>

          {/* Accords Filter */}
          <FilterSection title="Main Accords" defaultOpen={true}>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_ACCORDS.map(accord => (
                <button 
                  key={accord} 
                  onClick={() => toggleAccord(accord)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${selectedAccords.includes(accord) ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  {accord}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Gender Filter */}
          <FilterSection title="Gender" defaultOpen={false}>
            <div className="flex flex-col gap-1">
              {GENDERS.map(g => {
                const Icon = g.icon;
                return (
                  <button
                    key={g.value}
                    onClick={() => setGender(gender === g.value ? null : g.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${gender === g.value ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {g.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Mood Filter */}
          <FilterSection title="Mood" defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMood(mood === m.value ? null : m.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${mood === m.value ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Weather Filter */}
          <FilterSection title="Weather" defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {WEATHER_OPTIONS.map(w => {
                const Icon = w.icon;
                return (
                  <button
                    key={w.value}
                    onClick={() => toggleWeather(w.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${weatherTags.includes(w.value) ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {w.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Time Filter */}
          <FilterSection title="Time of Day" defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {TIME_OPTIONS.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => toggleTime(t.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${timeTags.includes(t.value) ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Sort Order */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sort By</h3>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-brand-500 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest Releases</option>
              <option value="a-z">Alphabetical (A&ndash;Z)</option>
              <option value="most-reviewed">Most Reviewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Right Results Grid */}
      <div className="flex-1">
        {/* Active filters summary */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">Active:</span>
            {selectedAccords.map(a => (
              <span key={a} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                {a}
                <button onClick={() => toggleAccord(a)}><X className="w-3 h-3" /></button>
              </span>
            ))}
            {gender && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 capitalize">
                {gender}
                <button onClick={() => setGender(null)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {mood && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 capitalize">
                {mood}
                <button onClick={() => setMood(null)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {weatherTags.map(t => (
              <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 capitalize">
                {t.toLowerCase()}
                <button onClick={() => toggleWeather(t)}><X className="w-3 h-3" /></button>
              </span>
            ))}
            {timeTags.map(t => (
              <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 capitalize">
                {t.toLowerCase()}
                <button onClick={() => toggleTime(t)}><X className="w-3 h-3" /></button>
              </span>
            ))}
            {notesQuery.trim() && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                Notes: {notesQuery}
                <button onClick={() => setNotesQuery("")}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {isPending ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6 w-full contain-paint">
            {results.map(perfume => (
              <Link key={perfume.id} href={`/perfume/${perfume.slug}`} className="flex flex-col bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 group gpu-accelerate">
                <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-gradient-to-b from-gray-50/50 to-transparent dark:from-white/5 dark:to-transparent p-3 sm:p-5 flex items-center justify-center">
                  <Image src={perfume.transparentImageUrl || perfume.image_url} alt={perfume.name} fill className="object-contain p-4 drop-shadow-xl group-hover:scale-110 transition-transform duration-700 ease-out" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw" />
                  {perfume.gender && (
                    <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${perfume.gender.toLowerCase() === 'men' ? 'text-blue-400 bg-blue-500/10' : perfume.gender.toLowerCase() === 'women' ? 'text-pink-400 bg-pink-500/10' : 'text-brand-400 bg-brand-500/10'}`}>
                      {perfume.gender}
                    </span>
                  )}
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