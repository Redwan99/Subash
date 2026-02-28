"use client";
// components/layout/RightSidebar.tsx
// Live activity feed: reviews + fragram posts from /api/sidebar.
// Trending This Week from real DB data.

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Activity, Star, Camera, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { LeaderboardWidget } from "@/components/ui/LeaderboardWidget";

// Types
interface ActivityItem {
  id: string;
  type: string;
  user: string;
  action: string;
  subject: string;
  detail: string;
  time: string;
  href: string;
}

interface TrendingPerfume {
  id: string;
  slug: string;
  name: string;
  brand: string;
}

interface SidebarData {
  activity: ActivityItem[];
  trendingPerfumes: TrendingPerfume[];
}

// Icon + color per type
function itemMeta(type: string) {
  if (type === "fragram") return { icon: Camera, bg: "bg-[#34D399]/10", text: "text-[#34D399]" };
  if (type === "deal") return { icon: Zap, bg: "bg-[#60A5FA]/10", text: "text-[#60A5FA]" };
  return { icon: Star, bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]" };
}

// Activity Card
function ActivityCard({ item, index, shouldReduceMotion }: { item: ActivityItem; index: number; shouldReduceMotion: boolean | null }) {
  const { icon: Icon, bg, text } = itemMeta(item.type);
  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 340, damping: 28, delay: 0.15 + index * 0.08 }
      }
    >
      <Link href={item.href} prefetch={false}>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { y: -2 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="group p-3 rounded-xl cursor-pointer bg-[var(--bg-glass)] backdrop-blur-[8px] border border-[var(--border-color)] transition-all hover:border-[rgba(139,92,246,0.25)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-start gap-2.5">
            <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${bg}`}>
              <Icon size={13} className={text} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-snug text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{item.user}</span>{" "}
                {item.action}{" "}
                <span className="font-medium text-[var(--accent)]">{item.subject}</span>
              </p>
              <p className="text-[11px] mt-0.5 truncate text-[var(--text-muted)]">{item.detail}</p>
            </div>
            <span className="text-[10px] shrink-0 mt-0.5 text-[var(--text-muted)]">{item.time}</span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Right Sidebar — fetches live data from /api/sidebar
export function RightSidebar() {
  const shouldReduceMotion = useReducedMotion();
  const [data, setData] = useState<SidebarData | null>(null);

  useEffect(() => {
    fetch("/api/sidebar")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const activity = data?.activity ?? [];
  const trending = data?.trendingPerfumes ?? [];

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 30, delay: 0.1 }
      }
      className="fixed right-0 hidden lg:flex flex-col z-40 overflow-y-auto top-[var(--topnav-height,60px)] h-[calc(100vh-var(--topnav-height,60px))] w-[var(--sidebar-right-width)] bg-[var(--bg-glass)] backdrop-blur-[var(--blur-backdrop)] border-l border-[var(--bg-glass-border)] shadow-[var(--shadow-glass)] [scrollbar-width:none]"
      aria-label="Live community activity"
    >
      <div className="pt-6">
        <LeaderboardWidget />
      </div>

      {/* Header */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[var(--accent)]" />
          <h2 className="text-xs font-bold tracking-widest uppercase text-[var(--text-secondary)]">Live Activity</h2>
          <motion.div
            animate={shouldReduceMotion ? {} : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full ml-auto bg-[#34D399]"
          />
        </div>
      </div>

      <div className="mx-4 h-px bg-[linear-gradient(90deg,transparent,var(--border-color),transparent)]" />

      {/* Activity Feed */}
      <div className="flex-1 px-3 py-3 space-y-2">
        {!data ? (
          <div className="space-y-2 py-4">
            {[0.9, 0.7, 0.8].map((w, i) => (
              <div key={i} className="flex items-center gap-2.5 px-1">
                <div className="w-7 h-7 rounded-lg skeleton shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-2 rounded-full" style={{ width: `${w * 100}%` }} />
                  <div className="skeleton h-1.5 rounded-full w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-[11px] text-center py-6 text-[var(--text-muted)]">No recent activity yet</p>
        ) : (
          activity.map((item, i) => (
            <ActivityCard key={item.id} item={item} index={i} shouldReduceMotion={shouldReduceMotion} />
          ))
        )}
      </div>

      {/* Footer: Trending */}
      <div className="px-4 py-4 border-t border-[linear-gradient(90deg,transparent,var(--border-color),transparent)]">
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-2 text-[var(--text-muted)]">Trending This Week</p>
        <div className="space-y-1.5">
          {trending.length > 0
            ? trending.map(({ id, slug, name, brand }, i) => (
              <Link key={id} href={`/perfume/${slug}`} prefetch={false}>
                <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="text-[10px] font-bold w-4 text-right text-[var(--accent)]">{i + 1}</span>
                  <div className="min-w-0">
                    <span className="text-xs truncate block text-[var(--text-secondary)]">{name}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{brand}</span>
                  </div>
                </div>
              </Link>
            ))
            : ["—", "—", "—"].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-bold w-4 text-right text-[var(--accent)]">{i + 1}</span>
                <span className="text-xs text-[var(--text-muted)]">Loading…</span>
              </div>
            ))}
        </div>
      </div>
    </motion.aside>
  );
}