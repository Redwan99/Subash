"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBellClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch notifications on mount + poll every 45 s
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotes = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        const data = (await res.json()) as { notifications: NotificationItem[]; unreadCount: number };
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        // silent
      }
    };

    fetchNotes();
    const id = setInterval(fetchNotes, 45_000);
    return () => clearInterval(id);
  }, [session?.user?.id]);

  if (!session?.user?.id) return null;

  function handleNotificationClick(n: NotificationItem) {
    startTransition(async () => {
      if (!n.read) {
        await markNotificationRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setOpen(false);
      if (n.link) router.push(n.link);
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    });
  }

  const ICON_FOR_TYPE: Record<string, string> = {
    REVIEW_UPVOTE: "⭐",
    DUPE_VOTE: "👍",
    FRAGRAM_LIKE: "❤️",
    REVIEW_REPLY: "💬",
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <Bell size={18} strokeWidth={1.75} />

        {/* Unread dot */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold leading-none bg-[#EF4444] text-white shadow-[0_0_6px_rgba(239,68,68,0.6)]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="absolute right-0 mt-2 w-[320px] sm:w-[360px] rounded-xl border border-[var(--border-color)] bg-[var(--surface-1)] shadow-lg z-[60] overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/70 backdrop-blur">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-[10px] font-semibold text-[var(--accent)] hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-xs text-[var(--text-muted)] text-center">
                No notifications yet. Start reviewing and engaging to see activity here.
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border-subtle)]">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full flex items-start gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-[var(--surface-2)] ${n.read ? "opacity-70" : "bg-[var(--surface-2)]/60"}`}
                  >
                    <div className="mt-0.5 text-base">
                      {ICON_FOR_TYPE[n.type] ?? "🔔"}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="font-semibold text-[11px] leading-tight text-[var(--text-primary)]">
                        {n.title}
                      </div>
                      <div className="text-[11px] leading-snug text-[var(--text-muted)] line-clamp-2">
                        {n.body}
                      </div>
                      <div className="text-[10px] text-[var(--text-disabled)] mt-0.5">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
