"use client";
// components/layout/ThemeToggle.tsx
// Pro Max animated Dark/Light mode toggle.
// Uses next-themes + Framer Motion spring physics.
// Respects prefers-reduced-motion per Pro Max UX guidelines.

import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="w-14 h-7 rounded-full bg-[var(--border-color)]" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-[var(--bg-surface)] rounded-full"
    >
      {compact ? (
        /* Compact icon-only mode (used in BottomNav / tight spaces) */
        <motion.div
          whileTap={shouldReduceMotion ? {} : { scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="p-2 rounded-full bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] text-[var(--text-secondary)]"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </motion.div>
      ) : (
        /* Full pill toggle */
        <div
          className={cn(
            "relative w-14 h-7 rounded-full p-0.5 transition-colors duration-300 border border-[var(--accent)]",
            isDark ? "bg-[#8B5CF6]/20" : "bg-[#8B5CF6]/15"
          )}
        >
          {/* Sliding knob */}
          <motion.div
            layout
            animate={{ x: isDark ? 28 : 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 500, damping: 30 }
            }
            className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-[var(--accent)]"
          >
            {isDark ? (
              <Moon size={12} color="#FFFFFF" />
            ) : (
              <Sun size={12} color="#FFFFFF" />
            )}
          </motion.div>

          {/* Background icons */}
          <div className="flex items-center justify-between px-1.5 h-full relative z-0">
            <Sun
              size={11}
              className={cn(
                "transition-colors duration-200",
                isDark ? "text-[var(--text-muted)]" : "text-transparent"
              )}
            />
            <Moon
              size={11}
              className={cn(
                "transition-colors duration-200",
                isDark ? "text-transparent" : "text-[var(--text-muted)]"
              )}
            />
          </div>
        </div>
      )}
    </button>
  );
}
