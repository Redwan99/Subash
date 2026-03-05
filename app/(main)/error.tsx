"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MainLayout]", error);
  }, [error]);

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle size={40} className="text-red-400" />
      <h2 className="text-xl font-bold text-[var(--text-primary)]">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md text-center">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
