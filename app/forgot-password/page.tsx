import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Forgot Password",
  description: "Reset your Subash password",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      {/* Background decoration */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-brand-500" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl bg-brand-400" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl p-8 space-y-8 bg-[var(--bg-glass)] backdrop-blur-[var(--blur-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-brand-500 mb-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <p className="text-sm tracking-wide text-[var(--text-muted)]">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email address"
              required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-white dark:text-black font-semibold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all active:scale-[0.98]"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </main>
  );
}