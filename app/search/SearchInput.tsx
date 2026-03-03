"use client";
// app/search/SearchInput.tsx
// Controlled search input that pushes new ?q= params to the URL.

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

export function SearchInput({ initialQuery }: { initialQuery: string }) {
  const [value, setValue]  = useState(initialQuery);
  const [isPending, start] = useTransition();
  const router             = useRouter();
  const timerRef           = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = useCallback(
    (q: string) => {
      setValue(q);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        start(() => {
          const params = new URLSearchParams();
          if (q.trim()) params.set("q", q.trim());
          router.replace(`/search${params.size ? `?${params}` : ""}`);
        });
      }, 340);
    },
    [router]
  );

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] focus-within:border-[#8B5CF6]/50 transition-colors">
      {isPending ? (
        <Loader2 size={16} className="shrink-0 animate-spin text-[var(--accent)]" />
      ) : (
        <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
      )}
      <input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by name, brand, or note…"
        autoFocus
        className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)]"
      />
      {value && (
        <button
          onClick={() => handleChange("")}
          className="shrink-0 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
