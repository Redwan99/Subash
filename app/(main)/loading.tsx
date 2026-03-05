export default function MainLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in-up">
      {/* Aromatic mist animation */}
      <div className="relative w-20 h-28">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20" />
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
          <div className="w-1 h-6 rounded-full bg-[var(--accent)]/30 animate-[scentRise_2s_ease-in-out_infinite]" />
          <div className="w-1 h-8 rounded-full bg-[var(--accent)]/20 animate-[scentRise_2s_ease-in-out_0.4s_infinite]" />
          <div className="w-1 h-5 rounded-full bg-[var(--accent)]/25 animate-[scentRise_2s_ease-in-out_0.8s_infinite]" />
        </div>
      </div>
      <p className="text-xs font-medium tracking-widest uppercase text-[var(--text-muted)] animate-pulse">
        Unveiling scents…
      </p>
    </div>
  );
}
