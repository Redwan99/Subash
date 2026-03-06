import { TrendingPerfumes } from "./TrendingPerfumes";
import { ScentOfTheDay } from "./ScentOfTheDay";
import { PlatformStats } from "./PlatformStats";

export async function LeftSidebar() {
  return (
    <aside className="fixed left-0 top-[var(--topnav-height,60px)] h-[calc(100vh-var(--topnav-height,60px))] w-[var(--sidebar-width)] hidden md:flex flex-col z-40 overflow-y-auto bg-[var(--bg-glass)] backdrop-blur-[var(--blur-backdrop)] border-r border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)] [scrollbar-width:none] [-ms-overflow-style:none]">
      <div className="p-4 space-y-6 flex-1 pt-6">
        {/* Scent of the Day */}
        <ScentOfTheDay />

        {/* Trending Section */}
        <TrendingPerfumes />
      </div>

      <div className="shrink-0 border-t border-black/10 dark:border-white/10 p-4 space-y-4">
        {/* Platform Stats */}
        <PlatformStats />
        <p className="text-center text-[10px] text-[var(--text-muted)]">
          Subash · সুবাশ
        </p>
      </div>
    </aside>
  );
}