"use client";
// app/login/CredentialsForm.tsx
// Client Component — email/password sign-in form
// Uses signIn("credentials") from next-auth/react (client-side call)

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  callbackUrl?: string;
}

export function CredentialsForm({ callbackUrl = "/" }: Props) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      email: identifier,
      password,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email/username or password.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div
          className="rounded-xl px-4 py-2.5 text-sm text-center bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#f87171]"
        >
          {error}
        </div>
      )}

      <input
        type="text"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Email or Username"
        required
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)]"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)]"
      />

      <button
        type="submit"
        disabled={pending}
        className={
          pending
            ? "w-full py-3 px-4 rounded-xl text-sm transition-all duration-200 opacity-60 cursor-not-allowed bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)]"
            : "w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-white dark:text-black font-semibold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all active:scale-[0.98]"
        }
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <Link
          href="/register"
          className="hover:underline text-[var(--accent)]"
        >
          Create account
        </Link>
        <span>·</span>
        <Link href="/forgot-password" className="hover:underline text-[var(--accent)]">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
