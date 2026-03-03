"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getOmnibarResults } from "@/lib/actions/search";
import { useRouter } from "next/navigation";

interface PerfumeResult {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image_url: string | null;
  transparentImageUrl: string | null;
}

interface UserResult {
  id: string;
  name: string | null;
  image: string | null;
}

interface SearchResults {
  perfumes: PerfumeResult[];
  users: UserResult[];
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ perfumes: [], users: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search — 300 ms
  useEffect(() => {
    if (query.length < 2) {
      setResults({ perfumes: [], users: [] });
      setIsOpen(false);
      return;
    }

    setIsPending(true);
    const timer = setTimeout(async () => {
      const data = await getOmnibarResults(query);
      setResults(data);
      setIsOpen(true);
      setIsPending(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateToSearch = () => {
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/encyclopedia?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToSearch();
  };

  const hasResults = results.perfumes.length > 0 || results.users.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md hidden md:block z-50">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && hasResults && setIsOpen(true)}
          placeholder="Search perfumes, brands, users..."
          aria-label="Search perfumes, brands, and users"
          className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-brand-500/50 focus:bg-white dark:focus:bg-[#0a0a0a] rounded-full pl-10 pr-10 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-500"
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
        )}
      </form>

      {/* Dropdown */}
      {isOpen && hasResults && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">

          {/* Perfumes */}
          {results.perfumes.length > 0 && (
            <div className="p-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2">
                Fragrances
              </h4>
              {results.perfumes.map((perfume) => {
                const imgSrc = perfume.transparentImageUrl || perfume.image_url || "/placeholder-perfume.jpg";
                return (
                  <Link
                    key={perfume.id}
                    href={`/perfume/${perfume.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-10 h-10 relative bg-gray-100 dark:bg-white/5 rounded-lg p-1 flex-shrink-0">
                      <Image
                        src={imgSrc}
                        alt={perfume.name}
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                        {perfume.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{perfume.brand}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2">
                Community
              </h4>
              {results.users.map((user) => (
                <Link
                  key={user.id}
                  href={`/user/${user.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                >
                  <div className="w-8 h-8 relative rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-300 dark:border-white/20">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <UserIcon className="w-full h-full p-1.5 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">
                    {user.name || "Fraghead"}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={navigateToSearch}
              aria-label="View all search results"
              className="w-full text-center text-xs font-bold text-brand-500 py-2 hover:bg-brand-500/10 rounded-lg transition-colors"
            >
              View all results &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
