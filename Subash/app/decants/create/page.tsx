"use client";
// app/decants/create/page.tsx
// Phase 5 — Create Decant Listing form.
// Route is guarded by middleware: requires signed-in, phone verified, 50+ reviews.
// Uses react-hook-form + zod. SmartSearch-style perfume picker to get a perfumeId.

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Package,
  Hash,
  Link2,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createDecantListing } from "@/lib/actions/decant";
import { searchPerfumes, type PerfumeSearchResult } from "@/lib/actions/perfume";
import { cn } from "@/lib/utils";

// ─── Form schema ───────────────────────────────────────────────────────────────

const schema = z
  .object({
    perfumeId:       z.string().min(1, "Select a perfume"),
    batch_code:      z.string().min(1, "Required").max(30, "Max 30 chars"),
    price_5ml:       z.coerce.number().int().min(0).optional(),
    price_10ml:      z.coerce.number().int().min(0).optional(),
    proof_image_url: z.string().url("Must be a valid URL"),
  })
  .refine((d) => (d.price_5ml ?? 0) > 0 || (d.price_10ml ?? 0) > 0, {
    message: "At least one price (5ml or 10ml) is required",
    path: ["price_5ml"],
  });

type FormValues = z.infer<typeof schema>;

// ─── Perfume Picker ────────────────────────────────────────────────────────────

function PerfumePicker({
  value: _value,
  onChange,
  error,
}: {
  value: string;
  onChange: (id: string, name: string) => void;
  error?: string;
}) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<PerfumeSearchResult[]>([]);
  const [selected, setSel]    = useState<PerfumeSearchResult | null>(null);
  const [open,     setOpen]   = useState(false);
  const [isPending, start]    = useTransition();
  const containerRef          = useRef<HTMLDivElement>(null);
  const shouldReduceMotion    = useReducedMotion();

  // debounce
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const search = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(() => {
      start(async () => {
        const data = await searchPerfumes(q);
        setResults(data);
        setOpen(data.length > 0);
      });
    }, 280);
  }, []);

  // outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (r: PerfumeSearchResult) => {
    setSel(r);
    setQuery("");
    setResults([]);
    setOpen(false);
    onChange(r.id, r.name);
  };

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        // Selected state
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30"
        >
          {selected.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.image_url}
              alt={selected.name}
              className="w-8 h-10 object-contain rounded"
            />
          ) : (
            <span className="text-[22px]">🧴</span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
              {selected.name}
            </p>
            <p className="text-xs text-[var(--accent)]">{selected.brand}</p>
          </div>
          <button
            type="button"
            onClick={() => { setSel(null); onChange("", ""); }}
            className="text-xs underline text-[var(--text-muted)]"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border",
              error ? "border-[#EF4444]" : "border-[var(--border-color)]"
            )}
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin shrink-0 text-[var(--accent)]" />
            ) : (
              <Search size={14} className="shrink-0 text-[var(--text-muted)]" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder="Search perfume name or brand…"
              className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] caret-[var(--accent)]"
            />
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 26 }}
                className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-20 bg-[var(--bg-glass)] backdrop-blur-[16px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass),0_12px_30px_rgba(0,0,0,0.18)]"
              >
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => pick(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#8B5CF6]/10"
                  >
                    <div
                      className="shrink-0 w-7 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-[#8B5CF6]/10 border border-[#8B5CF6]/20"
                    >
                      {r.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt={r.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-sm">🧴</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
                        {r.name}
                      </p>
                      <p className="text-xs text-[var(--accent)]">{r.brand}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-[var(--accent)]" />}
        <label className="text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </label>
      </div>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      )}
      {error && (
        <p className="text-xs flex items-center gap-1 text-[#EF4444]">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CreateDecantPage() {
  const router            = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending,  start]      = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    setServerErr(null);
    start(async () => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });

      const res = await createDecantListing({ success: false }, fd);

      if (res.success) {
        setSubmitted(true);
        setTimeout(() => router.push("/decants"), 1600);
      } else {
        setServerErr(res.error ?? "Something went wrong. Please try again.");
      }
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle size={56} className="mx-auto mb-4 text-[#34D399]" />
          <h2 className="text-xl font-bold mb-1 text-[var(--text-primary)]">
            Listing Created!
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Redirecting to the marketplace…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-xl mx-auto px-4 md:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={18} className="text-[var(--accent)]" />
            <span
              className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]"
            >
              Verified Sellers
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1 text-[var(--text-primary)]">
            List a Decant
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Fill in the details below. Buyers will contact you directly via WhatsApp.
          </p>
        </div>

        {/* Card */}
        <motion.form
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 280, damping: 28 }
          }
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 p-6 rounded-2xl bg-[var(--bg-glass)] backdrop-blur-[12px] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]"
        >
          {/* Perfume */}
          <Field label="Perfume" error={errors.perfumeId?.message} icon={Package}>
            <PerfumePicker
              value=""
              onChange={(id) => setValue("perfumeId", id, { shouldValidate: true })}
              error={errors.perfumeId?.message}
            />
            <input type="hidden" {...register("perfumeId")} />
          </Field>

          {/* Batch Code */}
          <Field
            label="Batch Code"
            hint="e.g. B24Q3 — used for authenticity tracing"
            error={errors.batch_code?.message}
            icon={Hash}
          >
            <input
              {...register("batch_code")}
              placeholder="B24Q3"
              className={cn(
                "w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-[var(--bg-surface)] text-[var(--text-primary)] caret-[var(--accent)] border",
                errors.batch_code ? "border-[#EF4444]" : "border-[var(--border-color)]"
              )}
            />
          </Field>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Price — 5ml (BDT)"
              hint="Leave 0 if not offered"
              error={errors.price_5ml?.message}
              icon={DollarSign}
            >
              <input
                {...register("price_5ml")}
                type="number"
                min="0"
                placeholder="350"
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-[var(--bg-surface)] text-[var(--text-primary)] caret-[var(--accent)] border",
                  errors.price_5ml ? "border-[#EF4444]" : "border-[var(--border-color)]"
                )}
              />
            </Field>

            <Field
              label="Price — 10ml (BDT)"
              hint="Leave 0 if not offered"
              error={errors.price_10ml?.message}
              icon={DollarSign}
            >
              <input
                {...register("price_10ml")}
                type="number"
                min="0"
                placeholder="650"
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-[var(--bg-surface)] text-[var(--text-primary)] caret-[var(--accent)] border",
                  errors.price_10ml ? "border-[#EF4444]" : "border-[var(--border-color)]"
                )}
              />
            </Field>
          </div>

          {/* Proof Image URL */}
          <Field
            label="Proof Image URL"
            hint="Paste an Imgur, ImageBB, or Google Drive link"
            error={errors.proof_image_url?.message}
            icon={Link2}
          >
            <input
              {...register("proof_image_url")}
              type="url"
              placeholder="https://i.imgur.com/…"
              className={cn(
                "w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-[var(--bg-surface)] text-[var(--text-primary)] caret-[var(--accent)] border",
                errors.proof_image_url ? "border-[#EF4444]" : "border-[var(--border-color)]"
              )}
            />
          </Field>

          {/* Server error */}
          <AnimatePresence>
            {serverErr && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444]"
              >
                <AlertCircle size={14} />
                {serverErr}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isPending}
            whileHover={shouldReduceMotion || isPending ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion || isPending ? {} : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm",
              isPending
                ? "bg-[#8B5CF6]/40 text-[#8B5CF6]/70 opacity-80 cursor-not-allowed"
                : "bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] text-white shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
            )}
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Package size={15} />
                Publish Listing
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
