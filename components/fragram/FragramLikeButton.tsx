"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { likeFragramPost } from "@/lib/actions/fragram";

export function FragramLikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    if (liked || isPending) return;
    setLiked(true);
    setLikes((prev) => prev + 1);

    startTransition(async () => {
      const result = await likeFragramPost(postId);
      if (!result.success) {
        // Revert optimistic update
        setLiked(false);
        setLikes((prev) => prev - 1);
      }
    });
  };

  return (
    <button
      onClick={handleLike}
      disabled={liked || isPending}
      className={`flex items-center gap-1.5 transition-colors ${liked ? "text-brand-400" : "text-white hover:text-brand-400"}`}
    >
      <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
      <span className="text-xs font-bold">{likes}</span>
    </button>
  );
}
