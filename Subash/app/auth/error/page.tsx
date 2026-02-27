// app/auth/error/page.tsx
// Auth error page — displayed when NextAuth encounters an OAuth error.

import Link from "next/link";

export const metadata = { title: "Auth Error" };

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]"
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center space-y-6 bg-[var(--bg-glass)] backdrop-blur-[var(--blur-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]"
      >
        <div className="text-5xl">⚠️</div>
        <h1
          className="font-display text-2xl font-bold text-[var(--text-primary)]"
        >
          Authentication Error
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {params.error === "AccessDenied"
            ? "You do not have permission to sign in."
            : params.error === "Configuration"
              ? "There is a server configuration problem."
              : "An error occurred during sign-in. Please try again."}
        </p>
        {params.error && (
          <p
            className="text-xs font-mono px-3 py-2 rounded-lg bg-[#EF4444]/10 text-[#f87171]"
          >
            {params.error}
          </p>
        )}
        <Link
          href="/auth/signin"
          className="inline-block px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] text-white bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)]"
        >
          Try Again
        </Link>
      </div>
    </main>
  );
}
