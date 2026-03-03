"use client";

import { useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/lib/actions/social";
import { motion } from "framer-motion";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
}

export function FollowButton({ targetUserId, initialFollowing }: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const result = await toggleFollow(targetUserId);
        if (!result.success) {
          console.error("Failed to follow user");
        } else {
          console.log(result.isFollowing ? "Followed!" : "Unfollowed");
        }
      } catch {
        console.error("Something went wrong");
      }
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleToggle}
      disabled={isPending}
      className={`relative py-1.5 px-4 text-xs font-bold rounded-full overflow-hidden transition-all flex items-center justify-center gap-1.5 isolate ${
        initialFollowing
          ? "bg-gray-100 dark:bg-white/10 text-[var(--text-primary)] border border-gray-200 dark:border-white/20 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
          : "bg-brand-500 hover:bg-brand-400 text-white font-bold border border-transparent"
      } disabled:opacity-50`}
    >
      {initialFollowing ? (
        <>
          <span className="flex items-center gap-1.5 group-hover:hidden">
            <UserCheck size={14} />
            Following
          </span>
        </>
      ) : (
        <>
          <UserPlus size={14} />
          Follow
        </>
      )}
    </motion.button>
  );
}
