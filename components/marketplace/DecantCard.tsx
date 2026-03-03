"use client";
// components/marketplace/DecantCard.tsx
// Phase 4 — Decant Marketplace
// Displays a single peer-to-peer decant offer. Action button opens WhatsApp.

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, ShieldCheck, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";


// ─── Types ────────────────────────────────────────────────────────────────────

export type DecantCardData = {
  id: string;
  price_5ml: number | null;
  price_10ml: number | null;
  batch_code: string;
  proof_image_url: string;
  status: string;
  createdAt: Date | string;
  seller: {
    id: string;
    name: string | null;
    image: string | null;
    phone: string | null;
  };
  perfume: {
    id: string;
    name: string;
    brand: string;
  };
};

// ─── WhatsApp URL Builder ─────────────────────────────────────────────────────

function buildWhatsAppUrl(phone: string | null, perfumeName: string): string {
  if (!phone) return "#";

  // Normalize: strip leading 0 and ensure +880 prefix
  const normalized = phone.startsWith("+")
    ? phone
    : phone.startsWith("880")
    ? `+${phone}`
    : phone.startsWith("0")
    ? `+880${phone.slice(1)}`
    : `+880${phone}`;

  const message = encodeURIComponent(
    `Hi! I saw your decant listing on Subash for ${perfumeName}. I am interested in buying.`
  );

  return `https://wa.me/${normalized.replace(/\D/g, "")}?text=${message}`;
}

// ─── Price Badge ──────────────────────────────────────────────────────────────

function PriceBadge({ label, price }: { label: string; price: number | null }) {
  if (price == null) return null;
  return (
    <div
      className="flex flex-col items-center px-3 py-2 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20"
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </span>
      <span className="text-base font-bold mt-0.5 text-[var(--accent)]">
        ৳{price.toLocaleString()}
      </span>
    </div>
  );
}

// ─── Decant Card ──────────────────────────────────────────────────────────────

export function DecantCard({
  listing,
  index = 0,
}: {
  listing: DecantCardData;
  index?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const { seller, perfume } = listing;

  const isAvailable = listing.status === "AVAILABLE";
  const whatsappUrl = buildWhatsAppUrl(seller.phone, perfume.name);

  const initials = (seller.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 320, damping: 26, delay: index * 0.07 }
      }
      whileHover={shouldReduceMotion ? {} : { y: -3 }}
      className={cn(
        "rounded-2xl overflow-hidden bg-[var(--bg-glass)] backdrop-blur-[12px] shadow-[var(--shadow-glass)] transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.16)]",
        isAvailable
          ? "border border-[var(--bg-glass-border)] hover:border-[#8B5CF6]/30"
          : "border border-[#EF4444]/20 hover:border-[#EF4444]/35"
      )}
    >
      {/* ── Proof image ──────────────────────────────────────── */}
      <div
        className="relative w-full h-32 overflow-hidden bg-[#8B5CF6]/10"
      >
        {listing.proof_image_url ? (
          <Image
            src={listing.proof_image_url}
            alt={`Proof image for ${perfume.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-[var(--text-muted)]" />
          </div>
        )}

        {/* Status badge */}
        <div
          className={cn(
            "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-[8px]",
            isAvailable
              ? "bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/35"
              : "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/35"
          )}
        >
          {listing.status}
        </div>

        {/* Batch code badge */}
        <div
          className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(0,0,0,0.55)] backdrop-blur-[8px]"
        >
          <ShieldCheck size={10} className="text-[#34D399]" />
          <span className="text-[10px] font-mono font-semibold text-[#E5E7EB]">
            Batch: {listing.batch_code}
          </span>
        </div>
      </div>

      {/* ── Card body ────────────────────────────────────────── */}
      <div className="p-4">
        {/* Seller row */}
        <div className="flex items-center gap-2.5 mb-3">
          {/* Avatar */}
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border-2 border-[#8B5CF6]/35",
              seller.image
                ? "bg-transparent"
                : "bg-[linear-gradient(135deg,#8B5CF6,#6D28D9)] text-white"
            )}
          >
            {seller.image ? (
              <Image
                src={seller.image}
                alt={seller.name ?? "Seller"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
              {seller.name ?? "Anonymous"}
            </p>
            <div className="flex items-center gap-1">
              <User size={9} className="text-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)]">
                Verified Decanter
              </span>
            </div>
          </div>
        </div>

        {/* Price row */}
        {(listing.price_5ml != null || listing.price_10ml != null) && (
          <div className="flex gap-2 mb-3">
            <PriceBadge label="5 ml" price={listing.price_5ml} />
            <PriceBadge label="10 ml" price={listing.price_10ml} />
          </div>
        )}

        {/* WhatsApp CTA */}
        {isAvailable ? (
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[linear-gradient(135deg,#25D366_0%,#1DA851_100%)] shadow-[0_4px_14px_rgba(37,211,102,0.30)]"
            aria-label={`Message ${seller.name ?? "seller"} on WhatsApp about ${perfume.name}`}
          >
            <MessageCircle size={16} />
            Message on WhatsApp
          </motion.a>
        ) : (
          <div
            className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold bg-[var(--border-color)] text-[var(--text-muted)]"
          >
            {listing.status === "SOLD" ? "Sold Out" : "Paused"}
          </div>
        )}
      </div>
    </motion.div>
  );
}
