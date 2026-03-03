"use client";
// app/dashboard/deals/DealForm.tsx
// Create new deal listing form.

import { useState, useTransition } from "react";
import { Loader2, CheckCircle, Tag } from "lucide-react";
import { createDeal } from "@/lib/actions/deals";

type Perfume = { id: string; name: string; brand: string };

export function DealForm({
  perfumes,
  sellerId,
}: {
  perfumes: Perfume[];
  sellerId: string;
}) {
  const [perfumeId, setPerfumeId] = useState("");
  const [price, setPrice]         = useState("");
  const [link, setLink]           = useState("");
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isPending, start]        = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!perfumeId || !price) { setError("Select a perfume and enter a price."); return; }
    const priceInt = parseInt(price, 10);
    if (isNaN(priceInt) || priceInt < 1) { setError("Price must be a positive number."); return; }

    start(async () => {
      const result = await createDeal({ perfumeId, sellerId, price: priceInt, link: link.trim() || undefined });
      if (result.success) {
        setDone(true);
        setPerfumeId(""); setPrice(""); setLink("");
        setTimeout(() => setDone(false), 3000);
      } else {
        setError(result.error ?? "Failed to create deal.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Perfume selector */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]">
            Perfume *
          </label>
          <select
            aria-label="Select perfume"
            value={perfumeId}
            onChange={(e) => setPerfumeId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] outline-none focus:border-[#8B5CF6]/50 text-[var(--text-primary)]"
          >
            <option value="">— select perfume —</option>
            {perfumes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand} · {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]">
            Price (BDT ৳) *
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 2500"
            min={1}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] outline-none focus:border-[#8B5CF6]/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Shop link */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]">
          Shop Link (optional)
        </label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://your-shop.com/product"
          className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] outline-none focus:border-[#8B5CF6]/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      {error && <p className="text-xs text-[#EF4444]">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !perfumeId || !price}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] shadow-[0_4px_14px_rgba(139,92,246,0.3)]"
      >
        {done ? (
          <><CheckCircle size={14} /> Listed!</>
        ) : isPending ? (
          <><Loader2 size={14} className="animate-spin" /> Creating…</>
        ) : (
          <><Tag size={14} /> List Deal</>
        )}
      </button>
    </form>
  );
}
