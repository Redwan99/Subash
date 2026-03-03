"use client";
// components/layout/NewsletterFooter.tsx
// Phase 12 — Newsletter subscription footer with glassmorphism design

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { sendNewsletterConfirmation } from "@/lib/actions/email";

export function NewsletterFooter() {
    const [email, setEmail] = useState("");
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, start] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email."); return; }
        setError(null);
        start(async () => {
            const result = await sendNewsletterConfirmation(email.trim());
            if (result.success) {
                setDone(true);
            } else {
                setError("Something went wrong. Please try again.");
            }
        });
    };

    return (
        <footer className="mt-16">
            {/* Soft gradient separator instead of hard border */}
            <div className="h-px mx-6 bg-[linear-gradient(90deg,transparent,var(--border-color),transparent)] mb-12" />
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
                {/* Newsletter section */}
                <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 glass border border-[var(--bg-glass-border)] mb-10">
                    {/* Ambient glow */}
                    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[var(--accent)] opacity-[0.06] blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#F59E0B] opacity-[0.04] blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        {/* Left text */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <Sparkles size={14} className="text-[#F59E0B]" />
                                <span className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">For Fragrance Lovers</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-2">
                                Stay in the Scent Loop
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] max-w-md">
                                New drops, exclusive reviews, and the finest fragrance news from Bangladesh and beyond — delivered to your inbox.
                            </p>
                        </div>

                        {/* Right form */}
                        <div className="w-full md:w-auto md:min-w-[360px]">
                            <AnimatePresence mode="wait">
                                {done ? (
                                    <motion.div
                                        key="done"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)]"
                                    >
                                        <CheckCircle size={20} className="text-[#10B981] shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-[#10B981]">You&apos;re subscribed!</p>
                                            <p className="text-xs text-[var(--text-muted)]">Check your inbox for a confirmation.</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-2"
                                    >
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="your@email.com"
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-[var(--bg-glass)] border border-[var(--bg-glass-border)] text-[var(--text-primary)] outline-none focus:border-[rgba(139,92,246,0.5)] placeholder:text-[var(--text-muted)] transition-colors"
                                                />
                                            </div>
                                            <motion.button
                                                type="submit"
                                                disabled={isPending}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] shadow-[0_4px_14px_rgba(139,92,246,0.35)] disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] transition-all"
                                            >
                                                {isPending ? (
                                                    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                                ) : (
                                                    <>Subscribe <ArrowRight size={13} /></>
                                                )}
                                            </motion.button>
                                        </div>
                                        {error && <p className="text-xs text-[#EF4444] pl-1">{error}</p>}
                                        <p className="text-[10px] text-[var(--text-muted)] pl-1">No spam. Unsubscribe anytime.</p>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-base bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] bg-clip-text text-transparent">সুবাশ</span>
                        <span>© {new Date().getFullYear()} Subash. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {[
                            { href: "/perfume", label: "Encyclopedia" },
                            { href: "/creators", label: "Creators" },
                            { href: "/shops", label: "Boutiques" },
                            { href: "/fragram", label: "Fragram" },
                        ].map(({ href, label }) => (
                            <a key={href} href={href} className="hover:text-[var(--text-primary)] transition-colors">{label}</a>
                        ))}
                    </div>
                </div>

                {/* Legal links — ultra-subtle */}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-[var(--text-muted)] opacity-50">
                    <a href="/terms" className="hover:opacity-100 hover:text-[var(--accent)] transition-all">Terms</a>
                    <span aria-hidden>·</span>
                    <a href="/privacy" className="hover:opacity-100 hover:text-[var(--accent)] transition-all">Privacy</a>
                    <span aria-hidden>·</span>
                    <a href="/licensing" className="hover:opacity-100 hover:text-[var(--accent)] transition-all">Licensing</a>
                </div>
            </div>
        </footer>
    );
}
