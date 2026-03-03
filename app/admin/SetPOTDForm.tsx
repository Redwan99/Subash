"use client";
// app/admin/SetPOTDForm.tsx
// Client component: select a perfume and set it as POTD.

import { useState, useTransition } from "react";
import { Sparkles, Loader2, CheckCircle } from "lucide-react";
import { setPerfumeOfTheDay } from "@/lib/actions/admin";

type Perfume = { id: string; name: string; brand: string };

export function SetPOTDForm({ perfumes }: { perfumes: Perfume[] }) {
  const [perfumeId, setPerfumeId] = useState("");
  const [note, setNote]           = useState("");
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isPending, start]        = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfumeId) { setError("Please select a perfume."); return; }
    setError(null);
    start(async () => {
      const result = await setPerfumeOfTheDay(perfumeId, note.trim() || undefined);
      if (result.success) {
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      } else {
        setError(result.error ?? "Failed to set POTD.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-5 bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] space-y-4">
      {/* Perfume selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]">
          Select Perfume
        </label>
        <select
          aria-label="Select perfume"
          value={perfumeId}
          onChange={(e) => setPerfumeId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] outline-none focus:border-[#8B5CF6]/50 text-[var(--text-primary)]"
        >
          <option value="">— choose perfume —</option>
          {perfumes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} · {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Editorial note */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]">
          Editorial Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. 'A perfect beast mode for monsoon season'"
          maxLength={160}
          className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] outline-none focus:border-[#8B5CF6]/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[#EF4444]">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || !perfumeId}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] shadow-[0_4px_14px_rgba(139,92,246,0.3)]"
      >
        {done ? (
          <><CheckCircle size={14} /> Set!</>
        ) : isPending ? (
          <><Loader2 size={14} className="animate-spin" /> Setting…</>
        ) : (
          <><Sparkles size={14} /> Set as Today&apos;s POTD</>
        )}
      </button>
    </form>
  );
}
