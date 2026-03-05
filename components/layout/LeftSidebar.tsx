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

        {/* Platform Stats */}
        <PlatformStats />
      </div>

      <p className="text-center text-[10px] py-4 shrink-0 text-[var(--text-muted)] border-t border-black/10 dark:border-white/10">
        Subash · সুবাশ
      </p>
    </aside>
  );
}