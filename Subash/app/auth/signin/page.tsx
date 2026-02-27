// app/auth/signin/page.tsx
// Custom Sign-In page — Phase 2.1 + Manual Auth
// Glassmorphism design · Google + Facebook + Email/Password

import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CredentialsForm } from "./CredentialsForm";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your Subash account",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; registered?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // Already signed in — go home
  if (session) redirect(params.callbackUrl ?? "/");

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Error starting sign-in. Please try again.",
    OAuthCallback: "Error during OAuth callback. Please try again.",
    OAuthCreateAccount: "Could not create your account. Try a different method.",
    EmailCreateAccount: "Could not create your account. Try a different method.",
    Callback: "Sign-in callback error.",
    CredentialsSignin: "Invalid email or password.",
    Default: "An unexpected error occurred during sign-in.",
  };
  const errorMsg = params.error ? (errorMessages[params.error] ?? errorMessages.Default) : null;
  const registeredSuccess = params.registered === "1";

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]"
    >
      {/* Background decoration */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl bg-[var(--accent)]"
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl bg-[var(--accent-light)]"
        />
      </div>

      {/* Glass card */}
      <div
        className="relative w-full max-w-md rounded-2xl p-8 space-y-8 bg-[var(--bg-glass)] backdrop-blur-[var(--blur-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]"
      >
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <h1
            className="font-display text-4xl font-bold bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
          >
            সুবাশ
          </h1>
          <p
            className="text-sm font-medium tracking-wide uppercase text-[var(--text-muted)]"
          >
            Bangladesh&apos;s Fragrance Community
          </p>
        </div>

        {/* Registration success */}
        {registeredSuccess && (
          <div
            className="rounded-xl px-4 py-3 text-sm text-center bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ade80]"
          >
            ✓ Account created! Sign in below.
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            className="rounded-xl px-4 py-3 text-sm text-center bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#f87171]"
          >
            {errorMsg}
          </div>
        )}

        {/* Divider */}
        <div className="space-y-3">
          <p
            className="text-center text-xs font-medium uppercase tracking-widest mb-4 text-[var(--text-muted)]"
          >
            Continue with
          </p>

          {/* Google Sign-In */}
          <form
            action={async () => {
              "use server";
              await signIn("google", {
                redirectTo: params.callbackUrl ?? "/",
              });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            >
              {/* Google SVG icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Facebook Sign-In */}
          <form
            action={async () => {
              "use server";
              await signIn("facebook", {
                redirectTo: params.callbackUrl ?? "/",
              });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-[#1877F2] border border-[#1877F2] text-white shadow-[0_2px_8px_rgba(24,119,242,0.35)]"
            >
              {/* Facebook SVG icon */}
              <svg className="w-5 h-5 shrink-0 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
              Continue with Facebook
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
            or email
          </span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        {/* Email + Password Form */}
        <CredentialsForm callbackUrl={params.callbackUrl ?? "/"} />

        {/* Footer note */}
        <p
          className="text-xs text-center leading-relaxed text-[var(--text-muted)]"
        >
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
