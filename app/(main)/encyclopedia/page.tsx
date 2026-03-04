// app/(main)/encyclopedia/page.tsx
// Redirects to the unified /perfume page.

import { redirect } from "next/navigation";

export default function EncyclopediaRedirect() {
    redirect("/perfume");
}
