"use server";

import prisma from "@/lib/prisma";

export type BotPerfume = {
  id: string;
  name: string;
  brand: string;
  image_url: string | null;
  slug: string;
  accords: string[];
  gender: string | null;
};

export type BotResponse = {
  text: string;
  perfumes: BotPerfume[];
};

// A simple dictionary of well-known accords
const KNOWN_ACCORDS = [
  "woody", "vanilla", "citrus", "floral", "fruity", "sweet",
  "leather", "spicy", "aquatic", "fresh", "green", "powdery",
  "amber", "musk", "rose", "oud", "patchouli", "aromatic"
];

const VIBE_MAP: Record<string, string[]> = {
  date: ["sweet", "spicy", "vanilla", "amber", "leather"],
  office: ["fresh", "citrus", "floral", "powdery", "aquatic"],
  gym: ["fresh", "citrus", "aquatic", "green"],
  club: ["sweet", "spicy", "amber", "oud", "vanilla"],
  rain: ["aquatic", "green", "earthy", "woody"],
  summer: ["citrus", "fresh", "aquatic", "fruity"],
  winter: ["spicy", "amber", "woody", "sweet", "vanilla"]
};

export async function askSubashBot(userMessage: string): Promise<BotResponse> {
  const msg = userMessage.toLowerCase();

  // 0. Platform Support / FAQ interception
  // Subash AI Persona: "Elite fragrance expert and platform assistant"
  const isSupportQuery =
    msg.includes("sell") || msg.includes("decant") || msg.includes("verified seller") ||
    msg.includes("report") || msg.includes("fake") || msg.includes("moderator") ||
    msg.includes("support") || msg.includes("help") || msg.includes("badges") ||
    msg.includes("points") || msg.includes("reputation") || msg.includes("verify phone");

  if (isSupportQuery) {
    let supportText = "I am **Subash AI**, your elite fragrance expert and platform assistant. ";

    if (msg.includes("decant") || msg.includes("sell")) {
      supportText += "To sell decants and unlock the Marketplace, you must: \n1. **Verify your phone number** (Profile Settings).\n2. **Reach 50+ reviews** to earn the 'Verified Seller' status.\nThis ensures our community remains safe and authentic.";
    } else if (msg.includes("report") || msg.includes("fake")) {
      supportText += "Safety is our top priority. If you encounter a suspicious listing or a fake bottle, use the **'Report'** button on the product page or [contact a moderator directly via WhatsApp](https://wa.me/8801700000000).";
    } else if (msg.includes("badge") || msg.includes("point") || msg.includes("reputation")) {
      supportText += "You earn **Reputation Points** by writing reviews (+2) and adding perfumes to your 'HAVE' wardrobe (+1). Higher points unlock badges: **Novice → Enthusiast → Collector → VIP Nose**.";
    } else if (msg.includes("verify phone")) {
      supportText += "Go to your **Profile > Edit Profile** and tap 'Verify Phone'. We use Firebase OTP to ensure all sellers are real individuals in Bangladesh.";
    } else {
      supportText += "I can help with fragrance recommendations or platform rules. If you have a complex issue, you can always escalate to a human moderator via the Support tab or WhatsApp.";
    }

    // Even if it's support, if they mention scents, we can still try to find some
    const perfumes = await searchPerfumes(msg);
    return {
      text: supportText + (perfumes.length > 0 ? "\n\nBy the way, since you mentioned fragrances, here are some that might interest you:" : ""),
      perfumes
    };
  }

  // 1. Scent Recommendation Engine
  const perfumes = await searchPerfumes(msg);

  if (perfumes.length === 0) {
    return {
      text: "I couldn't find a perfect match in our encyclopedia for that specific description. Try asking for a vibe like 'fresh summer office' or a specific note like 'creamy vanilla'.",
      perfumes: []
    };
  }

  // 2. Generate persona-driven response
  const genderFilter = getGenderFilter(msg);
  const accords = getExtractedAccords(msg);

  let replyText = "As an expert in the field, I've selected these for you:";
  if (accords.length > 0) {
    replyText = `Excellent choice. For those ${accords.join(" & ")} notes you're looking for, these are world-class options:`;
  } else if (genderFilter) {
    replyText = `Here are some of the most distinguished ${genderFilter} fragrances in our collection:`;
  }

  return { text: replyText, perfumes };
}

async function searchPerfumes(msg: string): Promise<BotPerfume[]> {
  const genderFilter = getGenderFilter(msg);
  const extractedAccords = getExtractedAccords(msg);

  const whereClause: any = {};
  if (genderFilter) whereClause.gender = { contains: genderFilter, mode: "insensitive" };
  if (extractedAccords.length > 0) whereClause.accords = { hasSome: extractedAccords };

  // Fallback to keyword search if no structured filters found
  if (!genderFilter && extractedAccords.length === 0) {
    const tokens = msg.split(" ").filter(t => t.length > 3);
    if (tokens.length > 0) {
      whereClause.OR = tokens.map(t => ({
        OR: [
          { name: { contains: t, mode: "insensitive" } },
          { brand: { contains: t, mode: "insensitive" } }
        ]
      }));
    } else {
      return [];
    }
  }

  return await prisma.perfume.findMany({
    where: whereClause,
    take: 3,
    orderBy: { id: "desc" },
    select: {
      id: true,
      name: true,
      brand: true,
      image_url: true,
      slug: true,
      accords: true,
      gender: true,
    }
  });
}

function getGenderFilter(msg: string): string | undefined {
  if (msg.includes("unisex")) return "unisex";
  if (msg.includes("women") || msg.includes("girl") || msg.includes("lady")) return "women";
  if (msg.includes("men") || msg.includes("boy") || msg.includes("gentleman")) return "for men";
  return undefined;
}

function getExtractedAccords(msg: string): string[] {
  const found = new Set<string>();
  for (const accord of KNOWN_ACCORDS) {
    if (msg.includes(accord)) found.add(accord);
  }
  for (const [vibe, mappedAccords] of Object.entries(VIBE_MAP)) {
    if (msg.includes(vibe)) mappedAccords.forEach(a => found.add(a));
  }
  return Array.from(found);
}
