"use client";

import { useEffect, useState } from "react";
import { Users, FlaskConical, MessageSquare, Wifi } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalPerfumes: number;
  totalReviews: number;
  onlineUsers?: number;
}

export function PlatformStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/sidebar")
      .then((r) => r.json())
      .then((d) => {
        if (d?.stats) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const items = [
    { label: "Users", value: stats.totalUsers, icon: Users, color: "text-[#60A5FA]" },
    { label: "Perfumes", value: stats.totalPerfumes, icon: FlaskConical, color: "text-[#F783AC]" },
    { label: "Reviews", value: stats.totalReviews, icon: MessageSquare, color: "text-[#F59E0B]" },
    { label: "Online", value: stats.onlineUsers ?? 0, icon: Wifi, color: "text-[#34D399]" },
  ];

  return (
    <div>
      <div className="h-px w-full mb-4 bg-[linear-gradient(90deg,transparent,var(--border-color),transparent)]" />
      <p className="text-[10px] font-semibold tracking-widest uppercase mb-3 text-[var(--text-muted)]">
        Platform Stats
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)]"
          >
            <Icon size={14} className={color} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
