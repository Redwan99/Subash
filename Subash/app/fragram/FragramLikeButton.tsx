"use client";
// app/fragram/FragramLikeButton.tsx
// Heart button for Fragram posts. Uses useOptimistic for instant UI feedback.

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFragramLike } from "@/lib/actions/fragram";

interface Props {
  postId:    string;
  likeCount: number;
  liked:     boolean; // whether the current user has already liked
}

export function FragramLikeButton({ postId, likeCount, liked }: Props) {
  const [, startTransition] = useTransition();

  const [optimistic, addOptimistic] = useOptimistic(
    { count: likeCount, liked },
    (state, _action: "toggle") => ({
      count: state.liked ? state.count - 1 : state.count + 1,
      liked: !state.liked,
    })
  );

  function handleClick() {
    startTransition(async () => {
      addOptimistic("toggle");
      await toggleFragramLike(postId);
    });
  }

  return (
    <button
      onClick={handleClick}
      aria-label={optimistic.liked ? "Unlike" : "Like"}
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
        optimistic.liked
          ? "bg-[#EF4444]/15 border-[#EF4444]/35 text-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.25)]"
          : "bg-white/5 dark:bg-white/5 border-white/15 text-[var(--text-muted)] hover:border-[#EF4444]/40 hover:text-[#EF4444]"
      }`}
    >
      <Heart
        size={13}
        fill={optimistic.liked ? "currentColor" : "none"}
        className="transition-transform duration-200 group-hover:scale-110"
      />
      <span>{optimistic.count}</span>
    </button>
  );
}
