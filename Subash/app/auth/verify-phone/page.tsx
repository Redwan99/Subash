"use client";
// app/auth/verify-phone/page.tsx
// Step 2.2 — Firebase Phone OTP Verification
// Client Component: uses Firebase client SDK for reCAPTCHA + OTP flow.
// On success, calls the saveVerifiedPhone Server Action to update the DB.

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { saveVerifiedPhone } from "@/lib/actions/phone";
import Link from "next/link";

// ─── Steps ────────────────────────────────────────────────────────────────────
type Step = "phone" | "otp" | "success";

export default function VerifyPhonePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+880");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  // reCAPTCHA verifier reference (invisible)
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  // Redirect if already verified
  useEffect(() => {
    if (session?.user?.phoneVerified) router.replace("/");
  }, [session, router]);

  // Initialise invisible reCAPTCHA once the component mounts
  useEffect(() => {
    if (!recaptchaContainerRef.current || recaptchaVerifierRef.current) return;
    recaptchaVerifierRef.current = new RecaptchaVerifier(
      firebaseAuth,
      recaptchaContainerRef.current,
      { size: "invisible" }
    );
  }, []);

  // ─── Send OTP ─────────────────────────────────────────────────────────────
  async function handleSendOtp() {
    setError(null);
    if (!/^\+8801[3-9]\d{8}$/.test(phone)) {
      setError("Enter a valid Bangladeshi number, e.g. +8801XXXXXXXXX");
      return;
    }
    if (!recaptchaVerifierRef.current) {
      setError("reCAPTCHA not ready. Please reload the page.");
      return;
    }

    setPending(true);
    try {
      const result = await signInWithPhoneNumber(
        firebaseAuth,
        phone,
        recaptchaVerifierRef.current
      );
      setConfirmation(result);
      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("invalid-phone-number")) {
        setError("Invalid phone number format.");
      } else if (msg.includes("too-many-requests")) {
        setError("Too many requests. Please wait a few minutes and try again.");
      } else {
        setError("Failed to send OTP. Check your number and try again.");
      }
    } finally {
      setPending(false);
    }
  }

  // ─── Verify OTP ───────────────────────────────────────────────────────────
  async function handleVerifyOtp() {
    setError(null);
    if (!confirmation) {
      setError("Session expired. Please request a new OTP.");
      return;
    }
    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setPending(true);
    try {
      // 1. Verify OTP with Firebase (client-side)
      await confirmation.confirm(otp);

      // 2. Save to our DB via Server Action
      const result = await saveVerifiedPhone(phone);
      if (!result.success) {
        setError(result.error);
        return;
      }

      // 3. Force session refresh so phoneVerified flag updates in the JWT
      await update();
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("invalid-verification-code")) {
        setError("Incorrect code. Please try again.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]"
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-r-transparent animate-spin"
        />
      </main>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]"
    >
      {/* Invisible reCAPTCHA container */}
      <div ref={recaptchaContainerRef} />

      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-15 blur-3xl bg-[var(--accent)]"
        />
      </div>

      {/* Glass card */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-8 space-y-6 bg-[var(--bg-glass)] backdrop-blur-[var(--blur-glass)] border border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)]"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl mb-3">📱</div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {step === "success" ? "Phone Verified!" : "Verify Your Phone"}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {step === "phone" && "Required to unlock Seller & Decanter features"}
            {step === "otp" && `Enter the 6-digit code sent to ${phone}`}
            {step === "success" && "Your number has been verified successfully."}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="rounded-xl px-4 py-2.5 text-sm text-center bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#f87171]"
          >
            {error}
          </div>
        )}

        {/* ── Step: Phone entry ── */}
        {step === "phone" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]"
              >
                Bangladeshi Mobile Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] tracking-[0.05em]"
              />
              <p className="text-xs mt-1.5 text-[var(--text-muted)]">
                Format: +8801XXXXXXXXX (11 digits after +880)
              </p>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={pending}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)]"
            >
              {pending ? "Sending…" : "Send Verification Code"}
            </button>
          </div>
        )}

        {/* ── Step: OTP entry ── */}
        {step === "otp" && (
          <div className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-xl text-center text-2xl font-mono outline-none transition-all bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] tracking-[0.4em]"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={pending || otp.length !== 6}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)]"
            >
              {pending ? "Verifying…" : "Verify Code"}
            </button>
            <button
              onClick={() => { setStep("phone"); setOtp(""); setError(null); }}
              className="w-full text-xs text-center hover:underline text-[var(--text-muted)]"
              type="button"
            >
              ← Use a different number
            </button>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="space-y-4 text-center">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-[#22C55E]/15 border-2 border-[#22C55E]/40"
            >
              ✓
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--accent)] font-semibold">{phone}</span>
              {" "}is now linked to your account.
            </p>
            <Link
              href="/"
              className="inline-block w-full py-3 rounded-xl font-semibold text-sm text-center transition-all duration-200 hover:scale-[1.02] text-white bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)]"
            >
              Go to Home →
            </Link>
          </div>
        )}

        {/* Skip link */}
        {step !== "success" && (
          <p className="text-center text-xs text-[var(--text-muted)]">
            <Link href="/" className="hover:underline">
              Skip for now
            </Link>
            {" "}(you can verify later in Settings)
          </p>
        )}
      </div>
    </main>
  );
}
