// app/(main)/encyclopedia/page.tsx
// Redirects to the unified /perfume page, preserving query params.

import { redirect } from "next/navigation";

export default async function EncyclopediaRedirect({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q } = await searchParams;
    redirect(q ? `/perfume?q=${encodeURIComponent(q)}` : "/perfume");
}
