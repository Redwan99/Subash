// app/profile/page.tsx
// "My Profile" — route used by BottomNav.
// If signed in: redirects to /user/[id]. If not: redirects to sign in.

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfileRedirectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/profile");
  }

  redirect(`/user/${session.user.id}`);
}
