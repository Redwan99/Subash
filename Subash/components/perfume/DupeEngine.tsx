"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronUp, ChevronDown, Search, Loader2 } from "lucide-react";
import { suggestDupe, voteDupe } from "@/lib/actions/dupes";

interface PerfumeSearchResult {
  id: string;
  name: string;
  brand: string;
  image_url?: string | null;
  transparentImageUrl?: string | null;
}

interface DupeItem {
  id: string;
  votes: number;
  dupePerfume: {
    slug: string;
    name: string;
    brand: string;
    image_url?: string | null;
    transparentImageUrl?: string | null;
  };
}

export function DupeEngine({ targetPerfumeId, existingDupes }: { targetPerfumeId: string; existingDupes: DupeItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PerfumeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    let isMounted = true;
    setIsSearching(true);
    
    // Using the existing search API
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          // Filter out the current perfume if it's in the results
          const filtered = data.perfumes?.filter((p: { id: string }) => p.id !== targetPerfumeId) || [];
          setSearchResults(filtered);
          setShowDropdown(true);
          setIsSearching(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsSearching(false);
      });
      
    return () => { isMounted = false; };
  }, [debouncedQuery, targetPerfumeId]);

  const handleVote = (id: string, val: number) => {
    startTransition(async () => {
      await voteDupe(id, val);
    });
  };

  const handleSuggest = (dupeId: string) => {
    startTransition(async () => {
      const res = await suggestDupe(targetPerfumeId, dupeId);
      if (res.success) {
        setQuery("");
        setShowDropdown(false);
        setSearchResults([]);
      } else {
        alert(res.error || "Something went wrong.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reminds Me Of...</h3>
          <p className="text-xs text-gray-500">Community suggested clones and alternatives</p>
        </div>
      </div>

      {/* The Suggester */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a clone or dupe..."
            className="w-full bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-gray-500"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-brand-500" />
          )}
        </div>
        
        {/* Dropdown Results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-14 left-0 w-full z-50 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
            {searchResults.map(p => (
              <button
                key={p.id}
                disabled={isPending}
                onClick={() => handleSuggest(p.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-100 dark:border-white/5 last:border-0"
              >
                <div className="w-10 h-10 relative bg-gray-100 dark:bg-black/50 rounded-lg p-1 shrink-0">
                  <Image src={p.transparentImageUrl || p.image_url || '/placeholder-perfume.jpg'} alt="" fill className="object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.brand}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The List of Existing Dupes */}
      <div className="space-y-2 mt-4">
        {existingDupes.length === 0 ? (
          <div className="text-center py-6 bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-sm text-gray-500">No dupes suggested yet. Be the first!</p>
          </div>
        ) : (
          [...existingDupes].sort((a,b) => b.votes - a.votes).map(dupe => (
            <div key={dupe.id} className="flex items-center gap-4 p-3 bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-white/10 transition-colors group">
              <div className="w-12 h-12 relative bg-gray-100 dark:bg-black/50 rounded-xl p-1 shrink-0">
                {/* Ensure next/image has a valid src by adding a fallback */}
                <Image src={dupe.dupePerfume.transparentImageUrl || dupe.dupePerfume.image_url || '/placeholder-perfume.jpg'} alt="" fill className="object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                  <Link href={`/perfume/${dupe.dupePerfume.slug}`}>{dupe.dupePerfume.name}</Link>
                </h4>
                <p className="text-xs text-gray-500 truncate">{dupe.dupePerfume.brand}</p>
              </div>
              <div className="flex flex-col items-center bg-gray-100 dark:bg-black/40 rounded-lg p-1 shrink-0">
                  <button aria-label="Upvote" onClick={() => handleVote(dupe.id, 1)} disabled={isPending} className="p-1 hover:text-brand-500 active:scale-90 transition-transform"><ChevronUp className="w-4 h-4" /></button>
                  <span className="text-xs font-bold text-brand-500 min-w-[1.5rem] text-center">{dupe.votes}</span>
                  <button aria-label="Downvote" onClick={() => handleVote(dupe.id, -1)} disabled={isPending} className="p-1 hover:text-red-500 active:scale-90 transition-transform"><ChevronDown className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
