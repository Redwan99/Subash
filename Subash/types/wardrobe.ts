// types/wardrobe.ts
// Shared Wardrobe types — extracted to avoid circular imports between
// app/user/[id]/page.tsx and components/wardrobe/WardrobePanel.tsx.

export type WardrobePerfume = {
  id:        string;
  name:      string;
  brand:     string;
  image_url: string | null;
  shelf:     string;
};

export type WardrobeShelf = "HAVE" | "HAD" | "WANT" | "SIGNATURE";
