// app/auth/register/page.tsx
// Registration page — Server Component shell + Client Component form

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "./RegisterForm";
import Link from "next/link";

export const metadata = {
  title: "Create Account",
  description: "Join Subash — Bangladesh's Fragrance Community",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]"
    >
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-[var(--accent)]"
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl bg-[var(--accent-light)]"
        />
      </div>

      {/* Glass card */}
      <div
        className="relative w-full max-w-md rounded-2xl p-8 space-y-6 bg-[var(--bg-glass)] backdrop-blur-[var(--blur-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <Link
            href="/"
            className="font-display text-3xl font-bold block bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
          >
            সুবাশ
          </Link>
          <h1
            className="text-xl font-semibold text-[var(--text-primary)]"
          >
            Create your account
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Join Bangladesh&apos;s fragrance community
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
            or continue with email
          </span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        {/* Registration form (client) */}
        <RegisterForm />

        {/* Social sign-in link */}
        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-xs hover:underline text-[var(--text-muted)]"
          >
            Prefer Google or Facebook?{" "}
            <span className="text-[var(--accent)]">Sign in with social</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
