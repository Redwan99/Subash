export default function PerfumeLoading() {
  return (
    <div className="w-full animate-fade-in-up">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-10 w-64 rounded-lg skeleton" />
        <div className="h-5 w-96 mt-2 rounded-lg skeleton" />
      </div>

      {/* Aromatic bottle grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-[var(--bg-glass-border)] bg-[var(--bg-glass)] overflow-hidden"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="relative aspect-[3/4] flex items-center justify-center p-6">
              {/* Bottle silhouette */}
              <div className="relative w-12 h-20">
                <div className="absolute bottom-0 w-full h-14 rounded-lg skeleton" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-5 rounded-t-md skeleton" />
                {/* Rising mist wisps */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
                  <div className="w-0.5 h-3 rounded-full bg-[var(--accent)]/20 animate-[scentRise_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 120}ms` }} />
                  <div className="w-0.5 h-4 rounded-full bg-[var(--accent)]/15 animate-[scentRise_2s_ease-in-out_0.5s_infinite]" style={{ animationDelay: `${i * 120 + 200}ms` }} />
                  <div className="w-0.5 h-2.5 rounded-full bg-[var(--accent)]/20 animate-[scentRise_2s_ease-in-out_1s_infinite]" style={{ animationDelay: `${i * 120 + 400}ms` }} />
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 border-t border-[var(--bg-glass-border)] space-y-2">
              <div className="h-4 w-3/4 rounded skeleton" />
              <div className="h-3 w-1/2 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
