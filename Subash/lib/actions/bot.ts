"use server";
// lib/actions/bot.ts
// Nose AI — keyword-extraction engine powering the Scent Guru chat bot.
// No external LLM needed: pure Prisma + smart keyword matching on our Kaggle data.

import prisma from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BotPerfume = {
  id:        string;
  name:      string;
  brand:     string;
  image_url: string | null;
  gender:    string | null;
  accords:   string[];
};

export type BotResponse = {
  text:     string;
  perfumes: BotPerfume[];
};

// ─── Keyword dictionaries ─────────────────────────────────────────────────────

const ACCORD_KEYWORDS: Record<string, string[]> = {
  vanilla:    ["vanilla", "gourmand", "sweet", "dessert", "sugar", "caramel"],
  woody:      ["wood", "woody", "cedar", "sandalwood", "oakmoss", "timber"],
  citrus:     ["citrus", "lemon", "bergamot", "orange", "grapefruit", "lime", "zest", "fresh"],
  floral:     ["floral", "rose", "jasmine", "flower", "bloom", "peony", "lily", "iris"],
  musky:      ["musky", "musk", "skin", "clean", "soapy", "soft"],
  leather:    ["leather", "suede", "tobacco", "smoky", "smoke", "intense"],
  spicy:      ["spicy", "spice", "pepper", "clove", "cinnamon", "hot", "bold"],
  oriental:   ["oriental", "amber", "balsamic", "resinous", "incense", "warmth"],
  aquatic:    ["aquatic", "ocean", "sea", "marine", "water", "watery", "cool"],
  fruity:     ["fruity", "fruit", "apple", "peach", "berry", "tropical"],
  powdery:    ["powdery", "powder", "talc", "gentle", "delicate"],
  oud:        ["oud", "oud wood", "agarwood", "arabic", "rich", "dark"],
  green:      ["green", "grass", "herbal", "herb", "nature", "earthy", "vetiver"],
  patchouli:  ["patchouli", "damp", "mossy", "bohemian"],
};

// Map user vibe words → accord bucket (for natural language bridging)
const VIBE_MAP: Record<string, string[]> = {
  "date":      ["musky", "floral", "oriental", "vanilla"],
  "office":    ["citrus", "aquatic", "powdery", "green"],
  "rain":      ["aquatic", "green", "musky"],
  "summer":    ["citrus", "aquatic", "fruity"],
  "winter":    ["oriental", "spicy", "vanilla", "woody"],
  "gym":       ["aquatic", "citrus", "musky"],
  "night out": ["oriental", "leather", "oud", "spicy"],
  "casual":    ["citrus", "musky", "fruity", "green"],
  "luxury":    ["oud", "floral", "oriental", "vanilla"],
  "beach":     ["aquatic", "citrus", "fruity"],
  "romantic":  ["floral", "musky", "vanilla", "oriental"],
  "fresh":     ["citrus", "aquatic", "green"],
  "bold":      ["leather", "oud", "spicy", "oriental"],
  "subtle":    ["powdery", "musky", "citrus", "floral"],
  "morning":   ["citrus", "green", "aquatic"],
  "evening":   ["oriental", "floral", "musky", "oud"],
};

const GENDER_MAP: Record<string, string> = {
  "for men":        "for men",
  "men":            "for men",
  "man":            "for men",
  "him":            "for men",
  "his":            "for men",
  "male":           "for men",
  "masculine":      "for men",
  "for women":      "for women",
  "women":          "for women",
  "woman":          "for women",
  "her":            "for women",
  "female":         "for women",
  "feminine":       "for women",
  "ladies":         "for women",
  "lady":           "for women",
  "unisex":         "for women and men",
  "both":           "for women and men",
  "gender neutral": "for women and men",
  "neutral":        "for women and men",
};

// ─── Extraction helpers ───────────────────────────────────────────────────────

function extractAccords(msg: string): string[] {
  const lower = msg.toLowerCase();
  const matched = new Set<string>();

  // Direct accord name hits
  for (const [accord, keywords] of Object.entries(ACCORD_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.add(accord);
    }
  }

  // Vibe → accord bridging
  for (const [vibe, accords] of Object.entries(VIBE_MAP)) {
    if (lower.includes(vibe)) {
      accords.forEach((a) => matched.add(a));
    }
  }

  return Array.from(matched);
}

function extractGender(msg: string): string | null {
  const lower = msg.toLowerCase();
  for (const [kw, gender] of Object.entries(GENDER_MAP)) {
    if (lower.includes(kw)) return gender;
  }
  return null;
}

function extractSearchTerms(msg: string): string[] {
  // Strip common stop-words and return meaningful tokens (length ≥ 4)
  const STOP = new Set([
    "a","an","the","is","it","in","on","for","me","my","i","want","need","find",
    "looking","something","like","that","this","with","any","give","suggest",
    "recommend","scent","fragrance","perfume","cologne","smell","wear","smells",
  ]);
  return msg
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP.has(t));
}

// ─── Friendly response generator ──────────────────────────────────────────────

function buildResponse(
  count: number,
  accords: string[],
  gender: string | null,
  vibes: string[]
): string {
  if (count === 0) {
    return "I searched our entire Kaggle database but couldn't find an exact match for that request. Try describing the mood, season, or a specific note (e.g. 'woody date-night' or 'citrus summer'). 🕵️";
  }

  const parts: string[] = [];
  if (gender)        parts.push(gender === "for women and men" ? "a unisex" : gender.replace("for ", "a "));
  if (vibes.length)  parts.push(vibes.slice(0, 2).join(" & ") + "-inspired");
  if (accords.length) parts.push(accords.slice(0, 3).join(", ") + " scent");

  const desc = parts.length ? parts.join(" ") : "fragrance";
  const plural = count === 1 ? "this" : `these ${count}`;

  return `✨ Based on your vibe, I picked ${plural} ${desc} from our database. Tap any card to explore the full profile!`;
}

// ─── Main server action ───────────────────────────────────────────────────────

export async function askScentBot(userMessage: string): Promise<BotResponse> {
  const accords  = extractAccords(userMessage);
  const gender   = extractGender(userMessage);
  const terms    = extractSearchTerms(userMessage);
  const vibes    = Object.keys(VIBE_MAP).filter((v) =>
    userMessage.toLowerCase().includes(v)
  );

  // Build OR clauses
  const orClauses: object[] = [];

  if (accords.length > 0) {
    orClauses.push({ accords: { hasSome: accords } });
  }

  // Full-text fallback: match meaningful words against name / brand / description
  for (const term of terms.slice(0, 4)) {
    orClauses.push({ name:        { contains: term, mode: "insensitive" as const } });
    orClauses.push({ brand:       { contains: term, mode: "insensitive" as const } });
    orClauses.push({ description: { contains: term, mode: "insensitive" as const } });
  }

  if (orClauses.length === 0) {
    // Pure fallback — return newest releases
    const fallback = await prisma.perfume.findMany({
      select: { id: true, name: true, brand: true, image_url: true, gender: true, accords: true },
      orderBy: [{ release_year: "desc" }, { name: "asc" }],
      take: 3,
    });
    return { text: "Here are some popular recent releases to get you started! 🌟", perfumes: fallback };
  }

  const where: Record<string, unknown> = { OR: orClauses };
  if (gender) where.gender = { contains: gender.replace("for ", ""), mode: "insensitive" };

  const perfumes = await prisma.perfume.findMany({
    where,
    select: { id: true, name: true, brand: true, image_url: true, gender: true, accords: true },
    take: 3,
    orderBy: { name: "asc" },
  });

  return {
    text:     buildResponse(perfumes.length, accords, gender, vibes),
    perfumes,
  };
}
