"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Users, FlaskConical, MessageSquare, Wifi } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalPerfumes: number;
  totalReviews: number;
  onlineUsers?: number;
}

function getAnonSessionId() {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_hb_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_hb_sid", sid);
  }
  return sid;
}

export function PlatformStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [online, setOnline] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch sidebar stats once
  useEffect(() => {
    fetch("/api/sidebar")
      .then((r) => r.json())
      .then((d) => {
        if (d?.stats) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  // Heartbeat every 30s — use userId for authenticated users to deduplicate
  useEffect(() => {
    const sendHeartbeat = () => {
      const sid = session?.user?.id ? `user:${session.user.id}` : getAnonSessionId();
      if (!sid) return;
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid }),
      })
        .then((r) => r.json())
        .then((d) => { if (typeof d?.online === "number") setOnline(d.online); })
        .catch(() => {});
    };

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [session?.user?.id]);

  if (!stats) return null;

  const items = [
    { label: "Users", value: stats.totalUsers, icon: Users, color: "text-[#60A5FA]" },
    { label: "Perfumes", value: stats.totalPerfumes, icon: FlaskConical, color: "text-[#F783AC]" },
    { label: "Reviews", value: stats.totalReviews, icon: MessageSquare, color: "text-[#F59E0B]" },
    { label: "Online", value: online, icon: Wifi, color: "text-[#34D399]" },
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
