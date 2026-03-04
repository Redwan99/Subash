"use client";
// app/profile/edit/UsernameForm.tsx
// Client form to set / change a unique username with real-time availability check.

import { useState, useEffect, useCallback, useTransition } from "react";
import { AtSign, Loader2, CheckCircle, XCircle, Save } from "lucide-react";
import { updateUsername, checkUsernameAvailability } from "@/lib/actions/profile";

export function UsernameForm({ initialUsername }: { initialUsername: string }) {
  const [value, setValue] = useState(initialUsername);
  const [isPending, startTransition] = useTransition();
  const [availability, setAvailability] = useState<{
    status: "idle" | "checking" | "available" | "taken" | "invalid";
    message?: string;
  }>({ status: "idle" });
  const [result, setResult] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Debounced availability check
  const checkAvailability = useCallback(
    (username: string) => {
      if (!username || username.length < 3) {
        setAvailability({ status: "idle" });
        return;
      }
      if (username === initialUsername) {
        setAvailability({ status: "idle" });
        return;
      }
      setAvailability({ status: "checking" });

      const timer = setTimeout(async () => {
        const res = await checkUsernameAvailability(username);
        if (res.error) {
          setAvailability({ status: "invalid", message: res.error });
        } else if (res.available) {
          setAvailability({ status: "available", message: "Username is available!" });
        } else {
          setAvailability({ status: "taken", message: "Username is already taken." });
        }
      }, 500);

      return () => clearTimeout(timer);
    },
    [initialUsername]
  );

  useEffect(() => {
    const cleanup = checkAvailability(value);
    return cleanup;
  }, [value, checkAvailability]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || value.length < 3 || availability.status === "taken" || availability.status === "invalid") return;

    setResult(null);
    startTransition(async () => {
      const res = await updateUsername(value);
      if (res.error) {
        setResult({ type: "err", msg: res.error });
      } else {
        setResult({ type: "ok", msg: "Username updated!" });
        setTimeout(() => setResult(null), 3000);
      }
    });
  };

  const statusIcon =
    availability.status === "checking" ? <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" /> :
    availability.status === "available" ? <CheckCircle size={14} className="text-emerald-400" /> :
    availability.status === "taken" || availability.status === "invalid" ? <XCircle size={14} className="text-red-400" /> :
    null;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-5 bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--bg-glass-border)] space-y-3">
      <label
        htmlFor="username"
        className="text-xs font-bold uppercase tracking-widest mb-2 block text-[var(--text-muted)]"
      >
        Username
      </label>

      <div className="relative">
        <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          id="username"
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
            setValue(v);
            setResult(null);
          }}
          maxLength={24}
          placeholder="your.username"
          className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-[var(--bg-surface)] border outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] ${
            availability.status === "taken" || availability.status === "invalid"
              ? "border-[#EF4444]"
              : availability.status === "available"
              ? "border-emerald-500/50"
              : "border-[var(--border-color)] focus:border-[#E84393]/50"
          }`}
        />
        {statusIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {statusIcon}
          </div>
        )}
      </div>

      {/* Availability message */}
      {availability.message && (
        <p className={`text-xs ${
          availability.status === "available" ? "text-emerald-400" : "text-red-400"
        }`}>
          {availability.message}
        </p>
      )}

      {/* Hint */}
      <p className="text-[11px] text-[var(--text-muted)]">
        3–24 characters. Must start with a letter. Only letters, numbers, dots, and underscores allowed. This will be your unique handle.
      </p>

      {/* Result feedback */}
      {result && (
        <p className={`text-xs px-3 py-2 rounded-xl border ${
          result.type === "ok"
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
            : "text-red-400 bg-red-500/10 border-red-500/25"
        }`}>
          {result.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || value.length < 3 || availability.status === "taken" || availability.status === "invalid" || value === initialUsername}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#E84393,#F783AC)] shadow-[0_4px_14px_rgba(232,67,147,0.3)]"
      >
        {isPending ? (
          <><Loader2 size={14} className="animate-spin" /> Saving…</>
        ) : (
          <><Save size={14} /> {initialUsername ? "Update Username" : "Set Username"}</>
        )}
      </button>
    </form>
  );
}
