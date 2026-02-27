// app/profile/edit/page.tsx
// Phase 2 / 6.3 — Edit My Profile (name, bio, phone status).
// Server component wrapper → passes data to ProfileEditForm client component.

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProfileEditForm } from "./ProfileEditForm";
import Link from "next/link";
import { ArrowLeft, Phone, CheckCircle, XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile/edit");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, bio: true, phone: true, phoneVerified: true, email: true, image: true, role: true, review_count: true },
  });

  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-xl mx-auto px-4 md:px-6 py-8 space-y-6">

        {/* ─── Back ──────────────────────────────────────────────── */}
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={14} /> Back to Profile
        </Link>

        {/* ─── Avatar + Name display ─────────────────────────────── */}
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--bg-glass)] border border-[var(--bg-glass-border)]">
          <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg text-white bg-[linear-gradient(135deg,#8B5CF6,#6D28D9)]">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? "Avatar"} className="w-full h-full object-cover" />
            ) : (
              (user.name ?? "U").slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)]">{user.name ?? "Unnamed"}</p>
            <p className="text-xs text-[var(--text-muted)]">{user.email ?? "No email"}</p>
            <p className="text-[11px] font-medium mt-0.5 text-[var(--accent)]">
              {user.role.replace("_", " ")} · {user.review_count} reviews
            </p>
          </div>
        </div>

        {/* ─── Edit form ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
            Edit Info
          </h2>
          <ProfileEditForm
            initialName={user.name ?? ""}
            initialBio={user.bio ?? ""}
          />
        </section>

        {/* ─── Phone verification status ─────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">
            Phone Verification
          </h2>
          <div className="rounded-2xl p-5 bg-[var(--bg-glass)] border border-[var(--bg-glass-border)]">
            {user.phoneVerified && user.phone ? (
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="shrink-0 text-[#34D399]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Phone verified</p>
                  <p className="text-xs text-[var(--text-muted)]">{user.phone}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <XCircle size={18} className="shrink-0 text-[#EF4444] mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Phone not verified
                  </p>
                  <p className="text-xs mb-3 text-[var(--text-muted)]">
                    Verify your Bangladeshi phone number (+880) to unlock the Decant Marketplace.
                  </p>
                  <Link
                    href="/auth/verify-phone"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] shadow-[0_4px_12px_rgba(139,92,246,0.3)]"
                  >
                    <Phone size={13} /> Verify Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
