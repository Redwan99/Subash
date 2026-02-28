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

export async function askScentBot(userMessage: string): Promise<BotResponse> {
  const msg = userMessage.toLowerCase();

  // 0. Platform Support / FAQ interception
  if (
    msg.includes("sell") || msg.includes("decant") || msg.includes("verified seller") ||
    msg.includes("report") || msg.includes("fake") || msg.includes("moderator") ||
    msg.includes("support") || msg.includes("help") || msg.includes("badges")
  ) {
    let supportText = "I am Subash AI, an elite fragrance expert and platform assistant. ";
    if (msg.includes("decant") || msg.includes("sell")) {
      supportText += "To sell decants, you need a verified phone and 50+ reviews to become a Verified Seller. Then you can post a listing in the Decant Market.";
    } else if (msg.includes("report") || msg.includes("fake")) {
      supportText += "Safety is our priority. If you encounter a fake listing, please use the 'Report' button or escalate to a human moderator via the Support tab.";
    } else {
      supportText += "For platform guidelines or moderation issues, please check the Support tab FAQs or escalate to our human team.";
    }

    return { text: supportText, perfumes: [] };
  }

  // 1. Extract gender
  let genderFilter: string | undefined;
  if (msg.includes("unisex")) genderFilter = "unisex";
  else if (msg.includes("women") || msg.includes("girl") || msg.includes("her")) genderFilter = "women";
  else if (msg.includes("men") || msg.includes("boy") || msg.includes("him")) genderFilter = "for men";

  // 2. Extract accords & vibes
  const extractedAccords = new Set<string>();

  // Direct accords
  for (const accord of KNOWN_ACCORDS) {
    if (msg.includes(accord)) extractedAccords.add(accord);
  }

  // Vibes mapping
  for (const [vibe, mappedAccords] of Object.entries(VIBE_MAP)) {
    if (msg.includes(vibe)) {
      mappedAccords.forEach((a) => extractedAccords.add(a));
    }
  }

  // 3. Build Prisma query
  const whereClause: any = {};

  if (genderFilter) {
    // Exact or contains match on gender
    whereClause.gender = { contains: genderFilter, mode: "insensitive" };
  }

  if (extractedAccords.size > 0) {
    // Match perfumes that contain at least one (or ideally multiple) of these accords
    whereClause.accords = { hasSome: Array.from(extractedAccords) };
  }

  // If no filters were extracted, let's just do a random search or fallback
  if (!genderFilter && extractedAccords.size === 0) {
    // Attempt keyword search on name or brand as fallback
    const tokens = msg.split(" ").filter(t => t.length > 3);
    if (tokens.length > 0) {
      whereClause.OR = tokens.map(t => ({
        name: { contains: t, mode: "insensitive" }
      }));
    } else {
      // Complete fallback - trending/popular (using review count proxy or just latest)
      return {
        text: "I couldn't detect any specific notes or vibes. Try asking for something like 'a woody fragrance for men', 'a fresh scent for the office', or ask me about platform rules (e.g., 'how to sell decants').",
        perfumes: []
      };
    }
  }

  // Execute query
  const perfumes = await prisma.perfume.findMany({
    where: whereClause,
    take: 3,
    // Add some ranking if possible, or just orderBy latest
    orderBy: { release_year: "desc" },
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

  // 4. Generate friendly response text
  let replyText = "Here are some scents I found for you!";

  if (perfumes.length === 0) {
    replyText = "I couldn't find any perfumes matching exactly that profile! Try broadening your search.";
  } else {
    const accordNames = Array.from(extractedAccords).join(", ");
    if (accordNames && genderFilter) {
      replyText = `Found some great ${genderFilter} options with ${accordNames} notes.`;
    } else if (accordNames) {
      replyText = `I recommend these fragrances featuring ${accordNames} accords.`;
    } else if (genderFilter) {
      replyText = `Here are some highly-rated fragrances ${genderFilter}.`;
    }
  }

  return {
    text: replyText,
    perfumes
  };
}
