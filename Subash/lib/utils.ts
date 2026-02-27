// lib/utils.ts
// Shared utility helpers used throughout the Subash codebase

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names safely.
 * Usage: cn("px-4 py-2", isActive && "bg-accent text-black", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price in Bangladeshi Taka (BDT).
 * formatTaka(2500) → "৳2,500"
 */
export function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

/**
 * Convert a raw notes string (pipe-separated from CSV) to an array.
 * "Bergamot|Lemon|Pepper" → ["Bergamot", "Lemon", "Pepper"]
 */
export function parseNotes(raw: string): string[] {
  if (!raw) return [];
  return raw.split("|").map((n) => n.trim()).filter(Boolean);
}

/**
 * Calculate the "Community Match %" for a DupeVote record.
 * match(450, 50) → "90%"
 */
export function calcMatchScore(upvotes: number, downvotes: number): number {
  const total = upvotes + downvotes;
  if (total === 0) return 0;
  return Math.round((upvotes / total) * 100);
}

/**
 * Convert a perfume name + brand into a URL slug.
 * slugify("Dior", "Sauvage") → "dior-sauvage"
 */
export function slugify(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Truncate long strings for preview cards.
 * truncate("A very long review text...", 80) → "A very long review text…"
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

/**
 * Returns a user-facing badge label for review_count.
 */
export function getReviewerBadge(count: number): {
  label: string;
  color: string;
} {
  if (count >= 200) return { label: "VIP",         color: "text-accent-gradient" };
  if (count >= 50)  return { label: "Enthusiast",  color: "text-blue-400"      };
  if (count >= 10)  return { label: "Reviewer",    color: "text-green-400"     };
  return                    { label: "Novice",      color: "text-gray-400"      };
}
