"use client";
// components/shops/ShopsClient.tsx
// Phase 11 — Boutiques Directory: scrollable list + glassmorphism map placeholder

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Store, MapPin, Globe, CheckCircle, ShoppingBag,
    Map, Layers, Navigation, ZoomIn, Crosshair,
} from "lucide-react";

type Shop = {
    id: string; name: string; website: string | null; address: string | null;
    latitude: number | null; longitude: number | null;
    isVerified: boolean; description: string | null; imageUrl: string | null;
    _count: { deals: number };
};

// ── Shop Card ─────────────────────────────────────────────────────────────────
function ShopCard({ shop, index, selected, onSelect }: {
    shop: Shop; index: number; selected: boolean; onSelect: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            onClick={onSelect}
            className={`group relative rounded-2xl p-4 border cursor-pointer transition-all duration-200 ${selected
                    ? "bg-[rgba(139,92,246,0.12)] border-[rgba(139,92,246,0.4)] shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                    : "glass border-[var(--bg-glass-border)] hover:border-[rgba(139,92,246,0.25)]"
                }`}
        >
            {/* Verified badge */}
            {shop.isVerified && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.15)] text-[#10B981]">
                    <CheckCircle size={9} /> VERIFIED
                </span>
            )}

            <div className="flex items-start gap-3">
                {/* Icon / logo */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, hsl(${(index * 53) % 360}deg,70%,50%), hsl(${(index * 53 + 40) % 360}deg,70%,36%))` }}>
                    <Store size={16} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{shop.name}</h3>
                    {shop.address && (
                        <p className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                            <MapPin size={10} /> {shop.address}
                        </p>
                    )}
                    {shop._count.deals > 0 && (
                        <p className="text-[10px] text-[var(--accent)] mt-1 font-medium">
                            {shop._count.deals} active deal{shop._count.deals !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>
            </div>

            {shop.website && (
                <a href={shop.website} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold text-white bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] shadow-[0_2px_10px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_18px_rgba(139,92,246,0.5)] transition-all">
                    <Globe size={11} /> Visit Website
                </a>
            )}
        </motion.div>
    );
}

// ── Map Placeholder ────────────────────────────────────────────────────────────
function MapView({ selectedShop }: { selectedShop: Shop | null }) {
    return (
        <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden border border-[var(--bg-glass-border)] glass">
            {/* Grid background pattern */}
            <div className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)
          `,
                    backgroundSize: "40px 40px",
                }}
            />

            {/* Radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06)_0%,transparent_70%)]" />

            {/* Dot grid overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: "radial-gradient(circle, rgba(139,92,246,1) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
            />

            {/* Map UI chrome */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-[var(--bg-glass-border)]">
                    <Map size={13} className="text-[var(--accent)]" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">Map View</span>
                </div>
                <div className="flex gap-1.5">
                    {[ZoomIn, Layers, Crosshair].map((Icon, i) => (
                        <div key={i} className="w-8 h-8 rounded-full glass border border-[var(--bg-glass-border)] flex items-center justify-center">
                            <Icon size={13} className="text-[var(--text-muted)]" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Simulated map pins */}
            {[[28, 42], [55, 60], [70, 30], [40, 72], [80, 55]].map(([x, y], i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 300 }}
                    className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}>
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.6)] cursor-pointer hover:scale-125 transition-transform">
                        <MapPin size={12} className="text-white" />
                    </div>
                    <motion.div className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-30"
                        animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} />
                </motion.div>
            ))}

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full border border-[rgba(139,92,246,0.3)] border-dashed flex items-center justify-center mb-4 backdrop-blur-sm">
                    <Navigation size={22} className="text-[var(--accent)]" />
                </motion.div>

                <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
                    {selectedShop ? selectedShop.name : "Interactive Map"}
                </p>
                {selectedShop ? (
                    <p className="text-xs text-[var(--text-muted)] text-center px-8">{selectedShop.address ?? "Location on map"}</p>
                ) : (
                    <p className="text-xs text-[var(--text-muted)]">Select a boutique to locate it</p>
                )}

                {/* Loading shimmer bar */}
                <div className="mt-4 w-32 h-1.5 rounded-full bg-[rgba(139,92,246,0.15)] overflow-hidden">
                    <motion.div className="h-full bg-[var(--accent)] rounded-full"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
                </div>
                <p className="mt-2 text-[10px] text-[var(--text-muted)] opacity-60">Interactive Map Loading…</p>
            </div>

            {/* Bottom attribution */}
            <div className="absolute bottom-3 right-4 text-[9px] text-[var(--text-muted)] opacity-40">Map by Subash</div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ShopsClient({ shops }: { shops: Shop[] }) {
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

    const verified = shops.filter((s) => s.isVerified);
    const unverified = shops.filter((s) => !s.isVerified);

    return (
        <div className="min-h-screen px-4 md:px-6 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
                    <ShoppingBag size={17} className="text-[var(--accent)]" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[var(--text-primary)]">Boutiques</h1>
                    <p className="text-xs text-[var(--text-muted)]">
                        {shops.length} shops · {verified.length} verified
                    </p>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
                {/* ── Left: Scrollable shop list ── */}
                <div className="space-y-6">
                    {verified.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-3 flex items-center gap-1.5">
                                <CheckCircle size={11} /> Verified Boutiques
                            </p>
                            <div className="space-y-3">
                                {verified.map((s, i) => (
                                    <ShopCard key={s.id} shop={s} index={i}
                                        selected={selectedShop?.id === s.id}
                                        onSelect={() => setSelectedShop(selectedShop?.id === s.id ? null : s)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {unverified.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                                Other Retailers
                            </p>
                            <div className="space-y-3">
                                {unverified.map((s, i) => (
                                    <ShopCard key={s.id} shop={s} index={i + verified.length}
                                        selected={selectedShop?.id === s.id}
                                        onSelect={() => setSelectedShop(selectedShop?.id === s.id ? null : s)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {shops.length === 0 && (
                        <div className="flex flex-col items-center py-16 text-[var(--text-muted)] text-center">
                            <Store size={32} className="mb-3 opacity-30" />
                            <p className="font-semibold">No boutiques listed yet.</p>
                            <p className="text-sm mt-1">Verified retailers will appear here.</p>
                        </div>
                    )}
                </div>

                {/* ── Right: Map view ── */}
                <div className="sticky top-[72px]">
                    <AnimatePresence mode="wait">
                        <motion.div key={selectedShop?.id ?? "none"}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.2 }}>
                            <MapView selectedShop={selectedShop} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
