"use client";
import React, { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { searchEncyclopedia } from "@/lib/actions/encyclopedia";
import Image from "next/image";
import Link from "next/link";
import {
  Filter, Loader2, Heart, Sparkles, Coffee, ShieldCheck, Eye,
  Sun, Cloud, Snowflake, Droplets, CloudRain, CloudFog,
  Sunrise, SunMedium, Sunset, Moon,
  User, Users, ChevronDown, Search, X, SlidersHorizontal,
  TrendingUp, ArrowDownAZ, Clock, Award,
  Flame, TreePine, Citrus as CitrusIcon, Candy, Gem, Cherry, Wind,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFeatureToggles } from "@/components/providers/FeatureToggleProvider";
import { userSubmitPerfume } from "@/lib/actions/admin";

const POPULAR_ACCORDS: { value: string; label: string; icon: LucideIcon; color: string }[] = [
  { value: "Vanilla", label: "Vanilla", icon: Candy, color: "#F59E0B" },
  { value: "Woody", label: "Woody", icon: TreePine, color: "#92400E" },
  { value: "Fresh Spicy", label: "Fresh Spicy", icon: Flame, color: "#EF4444" },
  { value: "Citrus", label: "Citrus", icon: CitrusIcon, color: "#FBBF24" },
  { value: "Sweet", label: "Sweet", icon: Cherry, color: "#EC4899" },
  { value: "Amber", label: "Amber", icon: Gem, color: "#D97706" },
  { value: "Fruity", label: "Fruity", icon: Sparkles, color: "#F472B6" },
  { value: "Powdery", label: "Powdery", icon: Wind, color: "#A78BFA" },
];

const MOODS: { value: string; label: string; icon: LucideIcon; color: string }[] = [
  { value: "romantic", label: "Romantic", icon: Heart, color: "#F43F5E" },
  { value: "fresh", label: "Fresh", icon: Sparkles, color: "#22D3EE" },
  { value: "cozy", label: "Cozy", icon: Coffee, color: "#D97706" },
  { value: "confident", label: "Confident", icon: ShieldCheck, color: "#8B5CF6" },
  { value: "mysterious", label: "Mysterious", icon: Eye, color: "#6366F1" },
];

const WEATHER_OPTIONS: { value: string; label: string; icon: LucideIcon; color: string }[] = [
  { value: "HOT", label: "Hot", icon: Sun, color: "#F59E0B" },
  { value: "COLD", label: "Cold", icon: Snowflake, color: "#60A5FA" },
  { value: "MILD", label: "Mild", icon: Cloud, color: "#94A3B8" },
  { value: "HUMID", label: "Humid", icon: Droplets, color: "#38BDF8" },
  { value: "RAINY", label: "Rainy", icon: CloudRain, color: "#6366F1" },
  { value: "DRY", label: "Dry", icon: CloudFog, color: "#A3A3A3" },
];

const TIME_OPTIONS: { value: string; label: string; icon: LucideIcon; color: string }[] = [
  { value: "MORNING", label: "Morning", icon: Sunrise, color: "#FBBF24" },
  { value: "DAY", label: "Day", icon: SunMedium, color: "#F59E0B" },
  { value: "EVENING", label: "Evening", icon: Sunset, color: "#F97316" },
  { value: "NIGHT", label: "Night", icon: Moon, color: "#818CF8" },
];

const GENDERS: { value: string; label: string; icon: LucideIcon; color: string }[] = [
  { value: "men", label: "Masculine", icon: User, color: "#60A5FA" },
  { value: "women", label: "Feminine", icon: User, color: "#F472B6" },
  { value: "unisex", label: "Unisex", icon: Users, color: "#A78BFA" },
];

const SORT_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "newest", label: "Newest Releases", icon: Clock },
  { value: "a-z", label: "Alphabetical (A–Z)", icon: ArrowDownAZ },
  { value: "most-reviewed", label: "Most Reviewed", icon: Award },
];

// ── Collapsible filter section with accent header ─────────────────────────────
function FilterSection({
  title,
  icon: Icon,
  color = "var(--accent)",
  defaultOpen = false,
  count,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  color?: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--bg-glass-border)] last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 group"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} style={{ color }} className="shrink-0" />}
          <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color }}>
            {title}
          </span>
          {count !== undefined && count > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-[var(--text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[500px] pb-4 opacity-100" : "max-h-0 opacity-0"}`}
      >
        {children}
      </div>
    </div>
  );
}

// ── Chip-style toggle button ──────────────────────────────────────────────────
function FilterChip({
  label,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  icon?: LucideIcon;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-95 border ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--accent)] shadow-[0_0_12px_rgba(232,67,147,0.15)]"
          : "border-[var(--bg-glass-border)] bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5"
      }`}
    >
      {Icon && (
        <Icon
          size={13}
          style={active ? { color: "var(--accent)" } : color ? { color } : undefined}
          className={!active && !color ? "text-[var(--text-muted)]" : ""}
        />
      )}
      {label}
    </button>
  );
}

// ── Radio-style gender option ─────────────────────────────────────────────────
function GenderOption({
  label,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
        active
          ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]"
          : "bg-[var(--bg-glass)] border border-transparent text-[var(--text-secondary)] hover:bg-[var(--accent)]/5"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
          active ? "border-[var(--accent)]" : "border-[var(--border-color)]"
        }`}
      >
        {active && <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
      </div>
      <Icon size={14} style={{ color: active ? "var(--accent)" : color }} />
      <span>{label}</span>
    </button>
  );
}

const PAGE_SIZE = 40;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PerfumeCard = React.memo(function PerfumeCard({ perfume, isTrending }: { perfume: any; isTrending?: boolean }) {
  return (
    <Link href={`/perfume/${perfume.slug}`} className="flex flex-col bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:shadow-lg hover:shadow-[var(--accent)]/8 transition-[transform,border-color,box-shadow] duration-200 group will-change-[transform]">
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-gradient-to-b from-white/5 to-transparent p-3 sm:p-5 flex items-center justify-center">
        <Image src={perfume.transparentImageUrl || perfume.image_url} alt={perfume.name} fill className="object-contain p-4 drop-shadow-xl group-hover:scale-105 transition-transform duration-500 ease-out" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" loading="lazy" />
        {isTrending && (
          <span className="absolute top-2 left-2 flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 backdrop-blur-sm border border-amber-500/20 text-amber-400 uppercase tracking-wider">
            <TrendingUp size={9} /> Trending
          </span>
        )}
        {perfume.gender && (
          <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full capitalize border ${
            perfume.gender.toLowerCase() === 'men' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : perfume.gender.toLowerCase() === 'women' ? 'text-pink-400 bg-pink-500/10 border-pink-500/20' : 'text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20'
          }`}>
            {perfume.gender}
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-0.5 border-t border-[var(--bg-glass-border)]">
        <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base line-clamp-1 group-hover:text-[var(--accent)] transition-colors duration-200">{perfume.name}</h3>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-1">{perfume.brand}</p>
      </div>
    </Link>
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EncyclopediaMatrix({ initialData }: { initialData: any[] }) {
  const { isEnabled } = useFeatureToggles();

  // User submit perfume modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitName, setSubmitName] = useState("");
  const [submitBrand, setSubmitBrand] = useState("");
  const [submitGender, setSubmitGender] = useState("");
  const [submitDesc, setSubmitDesc] = useState("");
  const [submitPerfumer, setSubmitPerfumer] = useState("");
  const [submitYear, setSubmitYear] = useState("");
  const [submitTopNotes, setSubmitTopNotes] = useState("");
  const [submitHeartNotes, setSubmitHeartNotes] = useState("");
  const [submitBaseNotes, setSubmitBaseNotes] = useState("");
  const [submitAccords, setSubmitAccords] = useState("");
  const [submitPending, setSubmitPending] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleUserSubmit = async () => {
    setSubmitPending(true);
    setSubmitFeedback(null);
    const res = await userSubmitPerfume({
      name: submitName,
      brand: submitBrand,
      gender: submitGender || undefined,
      description: submitDesc || undefined,
      perfumer: submitPerfumer || undefined,
      releaseYear: submitYear ? parseInt(submitYear, 10) : null,
      topNotes: submitTopNotes ? JSON.stringify(submitTopNotes.split(",").map(s => s.trim()).filter(Boolean)) : "[]",
      heartNotes: submitHeartNotes ? JSON.stringify(submitHeartNotes.split(",").map(s => s.trim()).filter(Boolean)) : "[]",
      baseNotes: submitBaseNotes ? JSON.stringify(submitBaseNotes.split(",").map(s => s.trim()).filter(Boolean)) : "[]",
      accords: submitAccords ? JSON.stringify(submitAccords.split(",").map(s => s.trim()).filter(Boolean)) : "[]",
    });
    setSubmitPending(false);
    if (res.success) {
      setSubmitFeedback({ ok: true, msg: "Perfume submitted for review! Our team will review and add it shortly." });
      setSubmitName(""); setSubmitBrand(""); setSubmitGender(""); setSubmitDesc("");
      setSubmitPerfumer(""); setSubmitYear(""); setSubmitTopNotes(""); setSubmitHeartNotes("");
      setSubmitBaseNotes(""); setSubmitAccords("");
      setTimeout(() => { setShowSubmitModal(false); setSubmitFeedback(null); }, 2500);
    } else {
      setSubmitFeedback({ ok: false, msg: res.error || "Failed to submit." });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>(initialData);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trendingResults, setTrendingResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Portal target for rendering filters in the left sidebar
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.getElementById("matrix-filter-portal");
    setPortalTarget(el);
  }, []);

  // Pagination
  const [hasMore, setHasMore] = useState(initialData.length >= PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filtersVersion = useRef(0);

  // Filters
  const [selectedAccords, setSelectedAccords] = useState<string[]>([]);
  const [sort, setSort] = useState("trending");
  const [gender, setGender] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [weatherTags, setWeatherTags] = useState<string[]>([]);
  const [timeTags, setTimeTags] = useState<string[]>([]);
  const [notesQuery, setNotesQuery] = useState("");
  const [debouncedNotes, setDebouncedNotes] = useState("");

  // Debounce notes input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNotes(notesQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [notesQuery]);

  const activeFilterCount = selectedAccords.length + (gender ? 1 : 0) + (mood ? 1 : 0) + weatherTags.length + timeTags.length + (debouncedNotes ? 1 : 0);

  const buildFilterParams = useCallback(() => ({
    accords: selectedAccords,
    sort,
    gender: gender || undefined,
    mood: mood || undefined,
    weatherTags: weatherTags.length > 0 ? weatherTags : undefined,
    timeTags: timeTags.length > 0 ? timeTags : undefined,
    notes: debouncedNotes || undefined,
    take: PAGE_SIZE,
  }), [selectedAccords, sort, gender, mood, weatherTags, timeTags, debouncedNotes]);

  const hasActiveFilters = selectedAccords.length > 0 || !!gender || !!mood || weatherTags.length > 0 || timeTags.length > 0 || !!debouncedNotes;

  // Fetch when filters change — resets results
  useEffect(() => {
    filtersVersion.current += 1;
    const version = filtersVersion.current;
    startTransition(() => {
      const mainPromise = searchEncyclopedia({ ...buildFilterParams(), skip: 0 });
      // Fetch trending for this filter set when sort isn't already trending and filters are active
      const needsTrending = sort !== "trending" && hasActiveFilters;
      const trendingPromise = needsTrending
        ? searchEncyclopedia({ ...buildFilterParams(), sort: "trending", skip: 0, take: 8 })
        : Promise.resolve([]);

      Promise.all([mainPromise, trendingPromise]).then(([data, trending]) => {
        if (filtersVersion.current !== version) return;
        setResults(data);
        setTrendingResults(trending);
        setHasMore(data.length >= PAGE_SIZE);
      });
    });
  }, [buildFilterParams, sort, hasActiveFilters]);

  // Infinite scroll — load more when sentinel is visible
  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isPending) {
          setIsLoadingMore(true);
          const version = filtersVersion.current;
          searchEncyclopedia({ ...buildFilterParams(), skip: results.length }).then(data => {
            if (filtersVersion.current !== version) return;
            setResults(prev => [...prev, ...data]);
            setHasMore(data.length >= PAGE_SIZE);
            setIsLoadingMore(false);
          }).catch(() => setIsLoadingMore(false));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isPending, results.length, buildFilterParams]);

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

  // Shared filter panel content
  const filterContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-3 border-b border-[var(--bg-glass-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/12 flex items-center justify-center">
            <Filter size={16} className="text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[var(--text-primary)]">Discovery Matrix</h2>
            {activeFilterCount > 0 && (
              <p className="text-[10px] text-[var(--text-muted)]">{activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</p>
            )}
          </div>
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
            <X size={10} /> Clear
          </button>
        )}
      </div>

      {/* Notes Search */}
      <FilterSection title="Search Notes" icon={Search} color="#60A5FA" defaultOpen={false} count={notesQuery.trim() ? 1 : 0}>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={notesQuery}
            onChange={(e) => setNotesQuery(e.target.value)}
            placeholder="e.g. bergamot, oud, vanilla..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--bg-glass-border)] focus:border-[var(--accent)] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition-colors"
          />
          {notesQuery && (
            <button onClick={() => setNotesQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={12} />
            </button>
          )}
        </div>
      </FilterSection>

      {/* Accords Filter */}
      <FilterSection title="Main Accords" icon={Sparkles} color="#E84393" defaultOpen={true} count={selectedAccords.length}>
        <div className="grid grid-cols-2 gap-1.5">
          {POPULAR_ACCORDS.map(accord => (
            <FilterChip
              key={accord.value}
              label={accord.label}
              icon={accord.icon}
              color={accord.color}
              active={selectedAccords.includes(accord.value)}
              onClick={() => toggleAccord(accord.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Gender Filter */}
      <FilterSection title="Gender" icon={Users} color="#A78BFA" defaultOpen={false} count={gender ? 1 : 0}>
        <div className="space-y-1.5">
          {GENDERS.map(g => (
            <GenderOption
              key={g.value}
              label={g.label}
              icon={g.icon}
              color={g.color}
              active={gender === g.value}
              onClick={() => setGender(gender === g.value ? null : g.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Mood Filter */}
      <FilterSection title="Mood" icon={Heart} color="#F43F5E" defaultOpen={false} count={mood ? 1 : 0}>
        <div className="grid grid-cols-2 gap-1.5">
          {MOODS.map(m => (
            <FilterChip
              key={m.value}
              label={m.label}
              icon={m.icon}
              color={m.color}
              active={mood === m.value}
              onClick={() => setMood(mood === m.value ? null : m.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Weather Filter */}
      <FilterSection title="Weather" icon={Cloud} color="#38BDF8" defaultOpen={false} count={weatherTags.length}>
        <div className="grid grid-cols-3 gap-1.5">
          {WEATHER_OPTIONS.map(w => (
            <button
              key={w.value}
              onClick={() => toggleWeather(w.value)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95 border ${
                weatherTags.includes(w.value)
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--bg-glass-border)] bg-[var(--bg-glass)] text-[var(--text-muted)] hover:border-[var(--accent)]/30"
              }`}
            >
              <w.icon size={18} style={{ color: weatherTags.includes(w.value) ? "var(--accent)" : w.color }} />
              {w.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Time Filter */}
      <FilterSection title="Time of Day" icon={Clock} color="#F59E0B" defaultOpen={false} count={timeTags.length}>
        <div className="grid grid-cols-2 gap-1.5">
          {TIME_OPTIONS.map(t => (
            <button
              key={t.value}
              onClick={() => toggleTime(t.value)}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-[11px] font-semibold transition-all active:scale-95 border ${
                timeTags.includes(t.value)
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-[var(--bg-glass-border)] bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30"
              }`}
            >
              <t.icon size={14} style={{ color: timeTags.includes(t.value) ? "var(--accent)" : t.color }} />
              {t.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Sort Order */}
      <FilterSection title="Sort By" icon={SlidersHorizontal} color="#A78BFA" defaultOpen={false}>
        <div className="space-y-1">
          {SORT_OPTIONS.map(opt => {
            const isActive = sort === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--accent)]/5"
                }`}
              >
                <opt.icon size={14} className={isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
                {opt.label}
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </>
  );

  return (
    <>
      {/* ── Desktop: Portal filter content into left sidebar ── */}
      {portalTarget && createPortal(filterContent, portalTarget)}

      {/* ── Mobile: Collapsible filter drawer ── */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--bg-glass)] backdrop-blur-md border border-[var(--bg-glass-border)] text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]/30 transition-all w-full sm:w-auto"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/12 flex items-center justify-center">
            <SlidersHorizontal size={14} className="text-[var(--accent)]" />
          </div>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-auto sm:ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={14} className={`ml-1 text-[var(--text-muted)] transition-transform duration-200 ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
        </button>
        {mobileFiltersOpen && (
          <div className="mt-3 p-5 rounded-2xl bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--bg-glass-border)] shadow-2xl">
            {filterContent}
          </div>
        )}
      </div>

      {/* ── Active filters bar ── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-2xl bg-[var(--bg-glass)] border border-[var(--bg-glass-border)]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mr-1">Active</span>
          {selectedAccords.map(a => {
            const acc = POPULAR_ACCORDS.find(x => x.value === a);
            return (
              <span key={a} className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                {acc?.icon && <acc.icon size={10} />}
                {a}
                <button onClick={() => toggleAccord(a)} className="hover:text-red-400 transition-colors"><X size={10} /></button>
              </span>
            );
          })}
          {gender && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
              <User size={10} />
              {gender}
              <button onClick={() => setGender(null)} className="hover:text-red-400 transition-colors"><X size={10} /></button>
            </span>
          )}
          {mood && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize">
              <Heart size={10} />
              {mood}
              <button onClick={() => setMood(null)} className="hover:text-red-400 transition-colors"><X size={10} /></button>
            </span>
          )}
          {weatherTags.map(t => {
            const w = WEATHER_OPTIONS.find(x => x.value === t);
            return (
              <span key={t} className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 capitalize">
                {w?.icon && <w.icon size={10} />}
                {t.toLowerCase()}
                <button onClick={() => toggleWeather(t)} className="hover:text-red-400 transition-colors"><X size={10} /></button>
              </span>
            );
          })}
          {timeTags.map(t => {
            const tm = TIME_OPTIONS.find(x => x.value === t);
            return (
              <span key={t} className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize">
                {tm?.icon && <tm.icon size={10} />}
                {t.toLowerCase()}
                <button onClick={() => toggleTime(t)} className="hover:text-red-400 transition-colors"><X size={10} /></button>
              </span>
            );
          })}
          {notesQuery.trim() && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Search size={10} />
              {notesQuery}
              <button onClick={() => setNotesQuery("")} className="hover:text-red-400 transition-colors"><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      {/* ── Suggest a Perfume button (feature-gated) ── */}
      {isEnabled("ENABLE_USER_PERFUME_SUBMIT") && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent)]/10 border border-[var(--accent)]/25 text-[var(--accent)] hover:bg-[var(--accent)]/15 transition-all"
          >
            <Plus size={15} />
            Suggest a Perfume
          </button>
        </div>
      )}

      {/* Submit Perfume Modal — portal-level z-index like WriteReviewModal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowSubmitModal(false); setSubmitFeedback(null); }}>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onClick={e => e.stopPropagation()}>
            <h3 className="text-[var(--text-primary)] font-bold text-lg mb-1">Suggest a Perfume</h3>
            <p className="text-[var(--text-muted)] text-sm mb-5">Know a fragrance that&apos;s missing? Submit details for admin review.</p>

            {submitFeedback && (
              <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium border ${
                submitFeedback.ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              }`}>{submitFeedback.msg}</div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Name *</label>
                  <input type="text" value={submitName} onChange={e => setSubmitName(e.target.value)} placeholder="Aventus"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Brand *</label>
                  <input type="text" value={submitBrand} onChange={e => setSubmitBrand(e.target.value)} placeholder="Creed"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/50" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Gender</label>
                  <select value={submitGender} onChange={e => setSubmitGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50 appearance-none cursor-pointer">
                    <option value="">Any</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Creator / Perfumer</label>
                  <input type="text" value={submitPerfumer} onChange={e => setSubmitPerfumer(e.target.value)} placeholder="Oliver Creed"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Release Year</label>
                  <input type="number" value={submitYear} onChange={e => setSubmitYear(e.target.value)} placeholder="2010" min="1900" max="2030"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Top Notes <span className="normal-case font-normal">(comma-separated)</span></label>
                <input type="text" value={submitTopNotes} onChange={e => setSubmitTopNotes(e.target.value)} placeholder="Bergamot, Pink Pepper, Blackcurrant"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/50" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Heart Notes <span className="normal-case font-normal">(comma-separated)</span></label>
                <input type="text" value={submitHeartNotes} onChange={e => setSubmitHeartNotes(e.target.value)} placeholder="Rose, Jasmine, Birch"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/50" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Base Notes <span className="normal-case font-normal">(comma-separated)</span></label>
                <input type="text" value={submitBaseNotes} onChange={e => setSubmitBaseNotes(e.target.value)} placeholder="Musk, Ambergris, Vanilla"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/50" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Accords <span className="normal-case font-normal">(comma-separated)</span></label>
                <input type="text" value={submitAccords} onChange={e => setSubmitAccords(e.target.value)} placeholder="Woody, Fresh, Citrus"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/50" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 block">Description <span className="normal-case font-normal">(optional)</span></label>
                <textarea value={submitDesc} onChange={e => setSubmitDesc(e.target.value)} rows={2} placeholder="What makes this fragrance special?"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]/50 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => { setShowSubmitModal(false); setSubmitFeedback(null); }} className="px-4 py-2 text-sm rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-glass)] transition-all">Cancel</button>
              <button onClick={handleUserSubmit} disabled={submitPending || !submitName.trim() || !submitBrand.trim()}
                className="px-5 py-2 text-sm rounded-xl font-semibold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/20 transition-all disabled:opacity-50">
                {submitPending ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-width results grid ── */}
      {isPending ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        </div>
      ) : results.length > 0 || trendingResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 w-full contain-paint">
          {(() => {
            const trendingIds = new Set(trendingResults.map((p: any) => p.id));
            const deduped = results.filter((p: any) => !trendingIds.has(p.id));
            return (
              <>
                {trendingResults.map((perfume: any) => (
                  <PerfumeCard key={perfume.id} perfume={perfume} isTrending />
                ))}
                {deduped.map((perfume: any) => (
                  <PerfumeCard key={perfume.id} perfume={perfume} />
                ))}
              </>
            );
          })()}
        </div>
      ) : (
        <div className="py-20 text-center w-full">
          <div className="inline-flex flex-col items-center gap-3">
            <Search size={32} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">No perfumes match your exact filters. Try removing some.</p>
          </div>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {!isPending && hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-10">
          {isLoadingMore && <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />}
        </div>
      )}
      {!isPending && !hasMore && results.length > 0 && (
        <p className="text-center text-xs text-[var(--text-muted)] py-8">
          All {results.length} perfumes loaded
        </p>
      )}
    </>
  );
}