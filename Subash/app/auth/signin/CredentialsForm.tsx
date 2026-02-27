"use client";
// app/auth/signin/CredentialsForm.tsx
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email or password.");
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
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
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
            ? "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)]"
            : "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)] text-white border border-[var(--border-color)]"
        }
      >
        {pending ? "Signing in…" : "Sign in with Email"}
      </button>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <Link
          href="/auth/register"
          className="hover:underline text-[var(--accent)]"
        >
          Create account
        </Link>
        <span>·</span>
        <span>Forgot password? (coming soon)</span>
      </div>
    </form>
  );
}
