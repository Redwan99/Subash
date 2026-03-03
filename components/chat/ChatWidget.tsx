"use client";
// components/chat/ChatWidget.tsx
// Phase 8 — Dual-mode floating widget
//   Tab A → "Nose AI"   : Scent Guru — queries Kaggle DB via askScentBot()
//   Tab B → "Support"   : FAQ + WhatsApp moderator escalation (unchanged)

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X, Send, ExternalLink, ChevronDown,
  Sparkles, Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn, parsePrismaArray } from "@/lib/utils";
import { type BotPerfume } from "@/lib/actions/bot";

// ─── Shared types ─────────────────────────────────────────────────────────────

type Role = "bot" | "user";

type Message = {
  role: Role;
  text: string;
  time: string;
  perfumes?: BotPerfume[]; // only on AI bot responses
};

function now() {
  return new Date().toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB A — NOSE AI
// ═══════════════════════════════════════════════════════════════════════════════

const AI_WELCOME: Message = {
  role: "bot",
  time: now(),
  text: "👋 Hi! I'm Subash AI — your elite fragrance expert and platform assistant. Ask me for recommendations (e.g., 'woody summer scent') or about platform rules (e.g., 'how to sell decants').",
};

const AI_CHIPS = [
  "Fresh citrus for summer 🍋",
  "Woody date-night for him 🌲",
  "How to sell decants? 💸",
  "Report a fake listing 🚩",
  "How are badges earned? 🏆",
  "Office-safe unisex 🏢",
];

const MODERATOR_WHATSAPP =
  "https://wa.me/8801700000000?text=Hi%20Subash%20team%2C%20I%20need%20help%20with";

function PerfumeCard({ p }: { p: BotPerfume }) {
  const accords = parsePrismaArray(p.accords);

  return (
    <Link
      href={`/perfume/${p.id}`}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all
        bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10
        hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/35
        hover:shadow-[0_0_10px_var(--accent-glow,rgba(232,67,147,0.25))]"
    >
      <div className="w-9 h-11 shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#E84393]/10 border border-[#E84393]/20">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-0.5" />
        ) : (
          <span className="text-base">🧴</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold leading-tight truncate text-[var(--text-primary)]">{p.name}</p>
        <p className="text-[10px] truncate text-[var(--accent)]">{p.brand}</p>
        {accords.length > 0 && (
          <p className="text-[9px] truncate text-[var(--text-muted)] mt-0.5">
            {accords.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
      {p.gender && (
        <span className="shrink-0 text-[8px] px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-white/20 text-[var(--text-muted)]">
          {p.gender.replace("for ", "").replace("women and men", "unisex")}
        </span>
      )}
    </Link>
  );
}

function SubashAIPanel() {
  const [messages, setMessages] = useState<Message[]>([AI_WELCOME]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendQuery = (text: string) => {
    if (!text.trim() || isPending) return;
    const query = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query, time: now() }]);
    startTransition(async () => {
      // Import renamed action
      const { askSubashBot } = await import("@/lib/actions/bot");
      const result = await askSubashBot(query);
      setMessages((prev) => [...prev, { role: "bot", text: result.text, time: now(), perfumes: result.perfumes }]);
    });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[88%]", msg.role === "user" ? "items-end" : "items-start")}>
              <div className={cn(
                "rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "rounded-tr-sm text-white bg-[linear-gradient(135deg,#E84393,#F783AC)]"
                  : "rounded-tl-sm text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-color)]"
              )}>
                {msg.text}
                <span className={cn("block text-[9px] mt-1", msg.role === "user" ? "text-white/60 text-right" : "text-[var(--text-muted)]")}>
                  {msg.time}
                </span>
              </div>
              {msg.perfumes && msg.perfumes.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.perfumes.map((p) => <PerfumeCard key={p.id} p={p} />)}
                </div>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex items-center gap-2 text-[var(--text-muted)] px-1">
            <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
            <span className="text-[10px]">Subash AI is thinking…</span>
          </div>
        )}

        {!isPending && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {AI_CHIPS.map((chip) => (
              <button key={chip} onClick={() => sendQuery(chip)}
                className="text-[10px] px-2.5 py-1.5 rounded-full font-medium text-[var(--accent)] bg-[#E84393]/10 border border-[#E84393]/25 hover:bg-[#E84393]/20 transition-colors">
                {chip}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Escalation Link */}
      <div className="px-3 py-2 border-t border-[var(--border-color)] bg-[rgba(37,211,102,0.03)]">
        <a href={MODERATOR_WHATSAPP} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-[10px] font-bold text-[#25D366] hover:bg-[#25D366]/10 transition-colors">
          <ExternalLink size={12} /> Talk to a Human Moderator (WhatsApp)
        </a>
      </div>

      <div className="flex items-center gap-2 px-3 py-3 border-t border-[var(--border-color)]">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuery(input); } }}
          placeholder="Ask me anything…" disabled={isPending}
          className="flex-1 bg-[var(--bg-surface)] px-3 py-2 rounded-xl text-xs outline-none border border-[var(--border-color)] focus:border-[#E84393]/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] disabled:opacity-50"
        />
        <button onClick={() => sendQuery(input)} disabled={!input.trim() || isPending}
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#E84393,#F783AC)]"
          aria-label="Send">
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}

export function ChatWidget({ featureToggles }: { featureToggles?: Record<string, boolean> }) {
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // If AI bot disabled globally, hide widget
  if (featureToggles?.ENABLE_AI_BOT === false) return null;

  return (
    <>
      {/* ── Floating trigger ─────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Subash AI"
        whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.93 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(
          "fixed z-50 bottom-20 right-4 md:bottom-6 md:right-6",
          "w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white",
          "bg-brand-500",
          "shadow-[0_8px_28px_rgba(232,67,147,0.55),0_0_0_1px_rgba(232,67,147,0.25)]"
        )}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close"
              initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}>
              <X size={20} strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span key="open"
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}>
              <Sparkles size={20} strokeWidth={2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.92, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.92, y: 18 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26 }}
            className={cn(
              "fixed z-50",
              "bottom-[calc(52px+1.25rem+3.5rem)] right-4",
              "md:bottom-[calc(52px+1.25rem+1.5rem)] md:right-6",
              "w-[calc(100vw-2rem)] max-w-[380px]",
              "rounded-2xl flex flex-col overflow-hidden",
              "bg-white/50 dark:bg-black/50 backdrop-blur-2xl",
              "border border-gray-200 dark:border-white/10",
              "shadow-[0_24px_64px_rgba(0,0,0,0.28),0_0_0_1px_rgba(255,255,255,0.08)]"
            )}
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="shrink-0 px-4 py-4 border-b border-gray-200 dark:border-white/10 bg-[rgba(232,67,147,0.07)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[linear-gradient(135deg,#E84393,#C2255C)] shadow-[0_0_10px_rgba(232,67,147,0.45)]">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#F783AC] to-[#E84393]">Subash AI</p>
                    <p className="text-[9px] text-[#F783AC] leading-none mt-1 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#F783AC] animate-pulse" />
                      Online • Fragrance Expert
                    </p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Minimize"
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <SubashAIPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
