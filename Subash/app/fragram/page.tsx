// app/fragram/page.tsx
// Phase 7 — Fragram (SOTD feed) — upgraded with like button + glassmorphism card footer

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { FragramUpload } from "./FragramUpload";
import { FragramLikeButton } from "./FragramLikeButton";

export const dynamic = 'force-dynamic';

type FragramPostCard = {
  id:        string;
  imageUrl:  string;
  caption:   string | null;
  likeCount: number;
  user:    { id: string; name: string | null; image: string | null };
  perfume: { id: string; name: string; brand: string } | null;
  likes:   { userId: string }[];
};

export default async function FragramPage() {
  const session  = await auth();
  const isAuthed = Boolean(session?.user?.id);
  const myId     = session?.user?.id ?? null;

  const posts: FragramPostCard[] = await prisma.fragramPost.findMany({
    orderBy: { createdAt: "desc" },
    take:    40,
    select: {
      id:        true,
      imageUrl:  true,
      caption:   true,
      likeCount: true,
      user:    { select: { id: true, name: true, image: true } },
      perfume: { select: { id: true, name: true, brand: true } },
      likes:   { select: { userId: true } },
    },
  });

  return (
    <main className="min-h-screen px-4 md:px-6 pt-20 md:pt-24 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
              Fragram
            </p>
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-[var(--text-primary)]">
              Scent of the Day Feed
            </h1>
          </div>
          <FragramUpload isAuthed={isAuthed} callbackUrl="/fragram" />
        </div>

        {posts.length === 0 && (
          <p className="text-center py-20 text-[var(--text-muted)] text-sm">
            No posts yet — be the first to share your Scent of the Day! 📸
          </p>
        )}

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {posts.map((post) => {
            const liked = myId ? post.likes.some((l) => l.userId === myId) : false;
            const initials = (post.user.name ?? "U").slice(0, 2).toUpperCase();

            return (
              <article
                key={post.id}
                className="break-inside-avoid mb-4 rounded-3xl overflow-hidden
                  bg-[var(--bg-glass)] border border-[var(--bg-glass-border)]
                  shadow-[var(--shadow-glass)] group"
              >
                {/* ── Hero image ─────────────────────────────────── */}
                <div className="relative w-full overflow-hidden bg-[var(--accent)]/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt={post.perfume?.name ?? "Scent of the Day"}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  {/* Glassmorphism bottom overlay */}
                  <div className="absolute bottom-0 inset-x-0 px-4 py-3
                    bg-gradient-to-t from-black/70 via-black/30 to-transparent
                    backdrop-blur-[2px]">
                    <div className="flex items-center justify-between gap-3">

                      {/* User avatar + name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[var(--accent)]/30 border border-white/20">
                          {post.user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.user.image}
                              alt={post.user.name ?? "User"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-white">{initials}</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-white truncate">
                          {post.user.name ?? "Anonymous"}
                        </span>
                      </div>

                      {/* Like button */}
                      {isAuthed ? (
                        <FragramLikeButton
                          postId={post.id}
                          likeCount={post.likeCount}
                          liked={liked}
                        />
                      ) : (
                        <span className="text-xs text-white/60">❤️ {post.likeCount}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Card footer ─────────────────────────────────── */}
                <div className="px-4 py-3 space-y-2">
                  {/* Perfume pill */}
                  {post.perfume && (
                    <Link
                      href={`/perfume/${post.perfume.id}`}
                      className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full
                        bg-[var(--accent)]/12 text-[var(--accent)]
                        border border-[var(--accent)]/25
                        hover:bg-[var(--accent)]/20 hover:shadow-[0_0_8px_var(--accent-glow)]
                        transition-all duration-200 font-semibold"
                    >
                      🧴 {post.perfume.name}
                      <span className="text-[var(--text-muted)] font-normal">· {post.perfume.brand}</span>
                    </Link>
                  )}

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                      {post.caption}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
