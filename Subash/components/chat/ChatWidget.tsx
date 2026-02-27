"use client";
// components/chat/ChatWidget.tsx
// Phase 8 — Dual-mode floating widget
//   Tab A → "Nose AI"   : Scent Guru — queries Kaggle DB via askScentBot()
//   Tab B → "Support"   : FAQ + WhatsApp moderator escalation (unchanged)

import { useState, useRef, useEffect, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  MessageCircle, X, Send, ExternalLink, ChevronDown,
  Sparkles, Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { askScentBot, type BotPerfume } from "@/lib/actions/bot";

// ─── Shared types ─────────────────────────────────────────────────────────────

type Role = "bot" | "user";

type Message = {
  role:     Role;
  text:     string;
  time:     string;
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
  text: "✨ I'm Nose AI — describe a vibe, occasion, or note and I'll match you to real fragrances from our database. Try: \"woody date-night scent for men\" or \"fresh citrus summer\".",
};

const AI_CHIPS = [
  "Fresh citrus for summer 🍋",
  "Woody date-night for him 🌲",
  "Sweet gourmand for her 🍮",
  "Bold oud & leather 🏺",
  "Office-safe unisex 🏢",
  "Rainy-day aquatic 🌧️",
];

function PerfumeCard({ p }: { p: BotPerfume }) {
  return (
    <Link
      href={`/perfume/${p.id}`}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all
        bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10
        hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/35
        hover:shadow-[0_0_10px_var(--accent-glow,rgba(139,92,246,0.25))]"
    >
      <div className="w-9 h-11 shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
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
        {p.accords.length > 0 && (
          <p className="text-[9px] truncate text-[var(--text-muted)] mt-0.5">
            {p.accords.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
      {p.gender && (
        <span className="shrink-0 text-[8px] px-1.5 py-0.5 rounded-full border border-white/20 text-[var(--text-muted)]">
          {p.gender.replace("for ", "").replace("women and men", "unisex")}
        </span>
      )}
    </Link>
  );
}

function NoseAITab() {
  const [messages, setMessages]      = useState<Message[]>([AI_WELCOME]);
  const [input, setInput]            = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef                    = useRef<HTMLDivElement>(null);
  const shouldReduceMotion           = useReducedMotion();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendQuery = (text: string) => {
    if (!text.trim() || isPending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: text.trim(), time: now() }]);
    startTransition(async () => {
      const result = await askScentBot(text.trim());
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
                "rounded-2xl px-3 py-2 text-xs leading-relaxed",
                msg.role === "user"
                  ? "rounded-tr-sm text-white bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)]"
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
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
            <span className="text-[10px]">Nose AI is searching…</span>
          </div>
        )}

        {!isPending && messages[messages.length - 1]?.role === "bot" && (
          <div className="flex flex-wrap gap-1.5">
            {AI_CHIPS.map((chip) => (
              <button key={chip} onClick={() => sendQuery(chip)}
                className="text-[10px] px-2.5 py-1 rounded-full font-medium text-[var(--accent)] bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 hover:bg-[#8B5CF6]/20 transition-colors">
                {chip}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-3 py-3 border-t border-[var(--border-color)]">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuery(input); } }}
          placeholder="Describe a vibe or note…" disabled={isPending}
          className="flex-1 bg-[var(--bg-surface)] px-3 py-2 rounded-xl text-xs outline-none border border-[var(--border-color)] focus:border-[#8B5CF6]/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)] disabled:opacity-50"
        />
        <button onClick={() => sendQuery(input)} disabled={!input.trim() || isPending}
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)]"
          aria-label="Ask Nose AI">
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB B — SUPPORT (FAQ)
// ═══════════════════════════════════════════════════════════════════════════════

const FAQ_CHIPS = [
  "How do I verify my phone?",
  "How to post a decant?",
  "What is Fragram?",
  "How are badges earned?",
  "Is this app free?",
  "How to report a fake listing?",
];

const FAQ_ANSWERS: Record<string, string> = {
  "How do I verify my phone?":
    "Go to Profile → Edit Profile → tap 'Verify Now'. Enter your Bangladeshi number (+880). You'll receive a Firebase OTP. Once verified your phone number is saved to your profile.",
  "How to post a decant?":
    "You need: (1) phone verified, (2) 50+ reviews. Once unlocked, go to Decant Market → 'Create Listing'. Fill in the perfume, batch code, proof photo URL, and pricing per ml.",
  "What is Fragram?":
    "Fragram is our Instagram-style Scent of the Day feed. Share a photo of today's bottle, tag the perfume from our database, and add a caption. Scroll /fragram to see what the community is wearing.",
  "How are badges earned?":
    "Badges are automatic based on review count: 🌱 Novice (0–10), 🥉 Enthusiast (11–49), 🥈 Collector (50–149), 🥇 VIP Nose (150+). Keep reviewing to level up!",
  "Is this app free?":
    "Yes! Subash is free for all community members. Creating decant listings is free too — we just require phone verification and review milestones to maintain community trust.",
  "How to report a fake listing?":
    "Tap the listing and use the 'Report' option, or click 'Talk to Moderator' below to message our team directly on WhatsApp. We review and remove fake listings within 24 hours.",
};

const FAQ_WELCOME: Message = {
  role: "bot",
  time: now(),
  text: "👋 Hi! I'm the Subash support bot. Pick a question below or type your own.",
};

const MODERATOR_WHATSAPP =
  "https://wa.me/8801700000000?text=Hi%20Subash%20team%2C%20I%20need%20help%20with";

function SupportTab() {
  const [messages, setMessages] = useState<Message[]>([FAQ_WELCOME]);
  const [input, setInput]       = useState("");
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const addMsg = (msg: Message) => setMessages((prev) => [...prev, msg]);

  const handleFAQ = (q: string) => {
    addMsg({ role: "user", text: q, time: now() });
    setTimeout(() => {
      addMsg({ role: "bot", text: FAQ_ANSWERS[q] ?? "I don't have a specific answer. Click 'Talk to Moderator' below.", time: now() });
    }, 380);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    addMsg({ role: "user", text, time: now() });
    setTimeout(() => {
      addMsg({ role: "bot", text: "I couldn't find an exact answer. Our moderators can help — click 'Talk to Moderator' below for WhatsApp support. 💬", time: now() });
    }, 450);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
              msg.role === "user"
                ? "rounded-tr-sm text-white bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)]"
                : "rounded-tl-sm text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-color)]"
            )}>
              {msg.text}
              <span className={cn("block text-[9px] mt-1", msg.role === "user" ? "text-white/60 text-right" : "text-[var(--text-muted)]")}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {messages[messages.length - 1]?.role === "bot" && (
          <div className="flex flex-wrap gap-1.5">
            {FAQ_CHIPS.map((q) => (
              <button key={q} onClick={() => handleFAQ(q)}
                className="text-[10px] px-2.5 py-1 rounded-full font-medium text-[var(--accent)] bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 hover:bg-[#8B5CF6]/20 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-2 pt-1">
        <a href={MODERATOR_WHATSAPP} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/25 hover:bg-[#25D366]/15 transition-colors">
          <ExternalLink size={12} /> Talk to Moderator on WhatsApp
        </a>
      </div>

      <div className="flex items-center gap-2 px-3 py-3 border-t border-[var(--border-color)]">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a question…"
          className="flex-1 bg-[var(--bg-surface)] px-3 py-2 rounded-xl text-xs outline-none border border-[var(--border-color)] focus:border-[#8B5CF6]/50 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] caret-[var(--accent)]"
        />
        <button onClick={handleSend} disabled={!input.trim()}
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)]"
          aria-label="Send">
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN WIDGET SHELL
// ═══════════════════════════════════════════════════════════════════════════════

type Tab = "ai" | "support";

export function ChatWidget() {
  const [open, setOpen]    = useState(false);
  const [tab, setTab]      = useState<Tab>("ai");
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {/* ── Floating trigger ─────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Nose AI"
        whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
        whileTap={shouldReduceMotion  ? {} : { scale: 0.93 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(
          "fixed z-[150] bottom-20 right-4 md:bottom-6 md:right-6",
          "w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white",
          "bg-[linear-gradient(135deg,#8B5CF6_0%,#A78BFA_50%,#6D28D9_100%)]",
          "shadow-[0_8px_28px_rgba(139,92,246,0.55),0_0_0_1px_rgba(139,92,246,0.25)]"
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
            exit={{   opacity: 0, scale: shouldReduceMotion ? 1 : 0.92, y: 18 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 26 }}
            className={cn(
              "fixed z-[149]",
              "bottom-[calc(52px+1.25rem+3.5rem)] right-4",
              "md:bottom-[calc(52px+1.25rem+1.5rem)] md:right-6",
              "w-[calc(100vw-2rem)] max-w-[380px]",
              "rounded-2xl flex flex-col overflow-hidden",
              "bg-white/50 dark:bg-black/50 backdrop-blur-2xl",
              "border border-white/30 dark:border-white/10",
              "shadow-[0_24px_64px_rgba(0,0,0,0.28),0_0_0_1px_rgba(255,255,255,0.08)]"
            )}
            style={{ height: "480px" }}
          >
            {/* Header */}
            <div className="shrink-0 px-4 py-3.5 border-b border-white/20 dark:border-white/10 bg-[rgba(139,92,246,0.07)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[linear-gradient(135deg,#8B5CF6,#6D28D9)] shadow-[0_0_10px_rgba(139,92,246,0.45)]">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">Nose AI</p>
                    <p className="text-[9px] text-[#34D399] leading-none">● Powered by Subash Kaggle DB</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Minimize"
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 mt-3 p-1 rounded-xl bg-white/20 dark:bg-white/5">
                {(["ai", "support"] as Tab[]).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200",
                      tab === t
                        ? "bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] text-white shadow-[0_2px_8px_rgba(139,92,246,0.4)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    )}>
                    {t === "ai"
                      ? <><Sparkles size={10} />&nbsp;Scent Guru</>
                      : <><MessageCircle size={10} />&nbsp;Support</>
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : (tab === "ai" ? -12 : 12) }}
                animate={{ opacity: 1, x: 0 }}
                exit={{   opacity: 0, x: shouldReduceMotion ? 0 : (tab === "ai" ? -12 : 12) }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex flex-col flex-1 overflow-hidden"
              >
                {tab === "ai" ? <NoseAITab /> : <SupportTab />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
