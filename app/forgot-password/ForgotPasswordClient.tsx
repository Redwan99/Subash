"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { requestPasswordReset, resetPassword } from "@/lib/actions/auth";

function RequestResetForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
        <p className="text-sm tracking-wide text-[var(--text-muted)]">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {state?.success && (
        <div className="p-3 rounded-xl text-sm bg-green-500/10 border border-green-500/20 text-green-400">
          {state.message}
        </div>
      )}
      {state && !state.success && "errors" in state && "_form" in state.errors && (
        <div className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400">
          {(state.errors as { _form: string[] })._form[0]}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email address"
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-white dark:text-black font-semibold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          Send Reset Link
        </button>
      </form>
    </>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, null);

  return (
    <>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set New Password</h1>
        <p className="text-sm tracking-wide text-[var(--text-muted)]">
          Enter your new password below.
        </p>
      </div>

      {state?.success && (
        <div className="p-3 rounded-xl text-sm bg-green-500/10 border border-green-500/20 text-green-400">
          {state.message}{" "}
          <Link href="/login" className="underline font-semibold">Sign in →</Link>
        </div>
      )}
      {state && !state.success && "errors" in state && (
        <div className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400">
          {Object.values(state.errors).flat().join(" ")}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <input
          type="password"
          name="password"
          placeholder="New password (min 8 characters)"
          required
          minLength={8}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm new password"
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-white dark:text-black font-semibold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          Reset Password
        </button>
      </form>
    </>
  );
}

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-brand-500" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl bg-brand-400" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl p-8 space-y-8 bg-[var(--bg-glass)] backdrop-blur-[var(--blur-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-brand-500 mb-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        {token ? <ResetPasswordForm token={token} /> : <RequestResetForm />}
      </div>
    </main>
  );
}
