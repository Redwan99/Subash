export default function MainLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in-up">
      {/* Perfume bottle with mist animation */}
      <div className="relative w-24 h-32 flex items-center justify-center">
        {/* Pulsing glow ring behind the bottle */}
        <div className="absolute inset-0 m-auto w-20 h-20 rounded-full animate-[accentPulse_2.4s_ease-in-out_infinite] bg-[var(--accent)]/5" />
        <div className="absolute inset-0 m-auto w-28 h-28 rounded-full animate-[accentPulse_3s_ease-in-out_0.6s_infinite] bg-[var(--accent)]/3" />

        {/* SVG perfume bottle */}
        <svg
          viewBox="0 0 64 80"
          className="w-14 h-[70px] relative z-10 animate-float drop-shadow-[0_0_16px_var(--accent-glow)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cap */}
          <rect x="24" y="2" width="16" height="10" rx="3" fill="var(--accent)" opacity="0.7" />
          <rect x="26" y="0" width="12" height="6" rx="2" fill="var(--accent)" opacity="0.9" />
          {/* Neck */}
          <rect x="28" y="12" width="8" height="8" rx="1" fill="var(--accent)" opacity="0.3" />
          {/* Body */}
          <rect x="14" y="20" width="36" height="52" rx="8" fill="var(--accent)" opacity="0.12" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.35" />
          {/* Liquid fill */}
          <rect x="16" y="36" width="32" height="34" rx="6" fill="var(--accent)" opacity="0.18" />
          {/* Highlight streak */}
          <rect x="20" y="24" width="3" height="40" rx="1.5" fill="white" opacity="0.08" />
        </svg>

        {/* Rising mist particles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-end gap-2">
          <div className="w-1 h-5 rounded-full bg-[var(--accent)]/25 animate-[scentRise_2.2s_ease-in-out_infinite]" />
          <div className="w-1.5 h-7 rounded-full bg-[var(--accent)]/20 animate-[scentRise_2.2s_ease-in-out_0.3s_infinite]" />
          <div className="w-1 h-4 rounded-full bg-[var(--accent)]/30 animate-[scentRise_2.2s_ease-in-out_0.7s_infinite]" />
          <div className="w-0.5 h-6 rounded-full bg-[var(--accent)]/15 animate-[scentRise_2.2s_ease-in-out_1.1s_infinite]" />
        </div>

        {/* Sparkle dots */}
        <div className="absolute top-2 left-3 w-1 h-1 rounded-full bg-[var(--accent)]/40 animate-[fadeIn_1.5s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-6 right-2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]/30 animate-[fadeIn_2s_ease-in-out_0.5s_infinite_alternate]" />
        <div className="absolute bottom-6 left-1 w-1 h-1 rounded-full bg-[var(--accent)]/25 animate-[fadeIn_1.8s_ease-in-out_1s_infinite_alternate]" />
      </div>

      <p className="text-xs font-medium tracking-[0.25em] uppercase text-[var(--text-muted)] animate-pulse">
        Unveiling scents…
      </p>
    </div>
  );
}
