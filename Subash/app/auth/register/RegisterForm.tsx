"use client";
// app/auth/register/RegisterForm.tsx
// Client Component — handles the registration form state, validation feedback,
// and the useFormState / useFormStatus hooks for progressive enhancement.

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerUser, type ActionResult } from "@/lib/actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BotShield } from "@/components/ui/BotShield";

// ─── Submit Button (reads pending state from nearest form) ─────────────────

function SubmitButton({ disabledOverride }: { disabledOverride: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabledOverride;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={cn(
        "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 border",
        isDisabled
          ? "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-color)]"
          : "bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)] text-white border-[var(--border-color)]"
      )}
    >
      {pending ? "Creating account…" : "Create Account"}
    </button>
  );
}

// ─── Field Error ───────────────────────────────────────────────────────────

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="text-xs mt-1 text-[#f87171]">
      {errors[0]}
    </p>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────

function Input({
  id,
  name,
  type,
  placeholder,
  errors,
}: {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  errors?: string[];
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]"
      >
        {placeholder}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className={cn(
          "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--accent)] bg-[var(--bg-surface)] text-[var(--text-primary)] border",
          errors?.length ? "border-[#f87171]/70" : "border-[var(--border-color)]"
        )}
      />
      <FieldError errors={errors} />
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter();
  const [turnstileToken, setTurnstileToken] = useState("");
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    registerUser,
    null
  );

  // Redirect to sign-in on success
  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => router.push("/auth/signin?registered=1"), 1500);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const fieldErrors =
    state && !state.success && "errors" in state && typeof state.errors === "object" && !("_form" in state.errors)
      ? (state.errors as Record<string, string[]>)
      : {};

  const formError =
    state && !state.success && "errors" in state && "_form" in state.errors
      ? (state.errors as { _form: string[] })._form
      : [];

  return (
    <form action={formAction} className="space-y-4">
      {/* Success banner */}
      {state?.success && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-center bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ade80]"
        >
          ✓ Account created! Redirecting to sign in…
        </div>
      )}

      {/* Form-level error */}
      {formError.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 text-sm text-center bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#f87171]"
        >
          {formError[0]}
        </div>
      )}

      <Input id="name" name="name" type="text" placeholder="Full Name" errors={fieldErrors.name} />
      <Input id="email" name="email" type="email" placeholder="Email Address" errors={fieldErrors.email} />
      <Input id="password" name="password" type="password" placeholder="Password (min. 8 characters)" errors={fieldErrors.password} />
      <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm Password" errors={fieldErrors.confirmPassword} />

      <BotShield onVerify={setTurnstileToken} />
      <input type="hidden" name="turnstileToken" value={turnstileToken} />

      <SubmitButton disabledOverride={!turnstileToken} />

      <p className="text-center text-xs text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="font-semibold hover:underline text-[var(--accent)]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
