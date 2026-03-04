"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type FeedUser = {
  id: string;
  name: string | null;
  image: string | null;
  username?: string | null;
};

type FeedPerfume = {
  name: string;
  brand: string;
  slug: string;
  image_url?: string | null;
  transparentImageUrl?: string | null;
};

export type TimelineItem = {
  id: string;
  createdAt: Date;
  feedType: "REVIEW" | "FRAGRAM";
  user: FeedUser;
  perfume?: FeedPerfume | null;
  // Specific to Review
  text?: string;
  overall_rating?: number;
  // Specific to Fragram
  imageUrl?: string | null;
  caption?: string | null;
};

interface FollowingFeedProps {
  timeline: TimelineItem[];
}

export function FollowingFeed({ timeline }: FollowingFeedProps) {
  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
        <p className="text-gray-500 mb-4">Your feed is quiet. Discover new creators to follow!</p>
        <Link
          href="/encyclopedia"
          className="px-6 py-2 rounded-full font-bold bg-brand-500 text-white hover:bg-brand-400 transition-colors"
        >
          Explore Encyclopedia
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {timeline.map((item) => {
        const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

        if (item.feedType === "FRAGRAM") {
          return (
            <div key={`fragram-${item.id}`} className="flex flex-col gap-3 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111]">
              <div className="flex items-center gap-3">
                <Link href={`/user/${item.user.username ?? item.user.id}`} className="shrink-0">
                  {item.user.image ? (
                    <Image src={item.user.image} alt={item.user.name || "User"} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold">
                      {item.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </Link>
                <div className="flex flex-col">
                  <Link href={`/user/${item.user.username ?? item.user.id}`} className="text-sm font-bold hover:underline">
                    {item.user.name || "Anonymous"}
                  </Link>
                  <span className="text-xs text-gray-500">Posted a photo &middot; {timeAgo}</span>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                {item.caption}
                {item.perfume && (
                  <Link href={`/perfume/${item.perfume.slug}`} className="block mt-2 font-semibold text-brand-500 hover:underline">
                    Tagged: {item.perfume.brand} - {item.perfume.name}
                  </Link>
                )}
              </div>
              
              {item.imageUrl && (
                <div className="mt-2 relative w-full aspect-square rounded-xl overflow-hidden bg-black/10">
                  <Image src={item.imageUrl} alt="Fragram Post" fill className="object-cover" />
                </div>
              )}
            </div>
          );
        }

        if (item.feedType === "REVIEW") {
          return (
            <div key={`review-${item.id}`} className="flex flex-col gap-3 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111]">
               <div className="flex items-center gap-3">
                <Link href={`/user/${item.user.username ?? item.user.id}`} className="shrink-0">
                  {item.user.image ? (
                    <Image src={item.user.image} alt={item.user.name || "User"} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold">
                      {item.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </Link>
                <div className="flex flex-col">
                  <Link href={`/user/${item.user.username ?? item.user.id}`} className="text-sm font-bold hover:underline">
                    {item.user.name || "Anonymous"}
                  </Link>
                  <span className="text-xs text-gray-500">Reviewed a perfume &middot; {timeAgo}</span>
                </div>
              </div>

              {item.perfume && (
                <div className="mt-3 flex items-start gap-4">
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 relative">
                     {item.perfume.transparentImageUrl || item.perfume.image_url ? (
                       <Image 
                         src={item.perfume.transparentImageUrl || item.perfume.image_url!} 
                         alt={item.perfume.name}
                         fill
                         className="object-contain p-2"
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg></div>
                     )}
                  </div>
                  <div className="flex flex-col">
                    <Link href={`/perfume/${item.perfume.slug}`} className="font-bold hover:text-brand-500 transition-colors">
                      {item.perfume.name}
                    </Link>
                    <span className="text-xs text-gray-500">{item.perfume.brand}</span>
                    {item.overall_rating && (
                      <div className="mt-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                           <Star 
                             key={star} 
                             size={12} 
                             className={star <= item.overall_rating! ? "fill-brand-500 text-brand-500" : "fill-transparent text-gray-300 dark:text-gray-700"} 
                           />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.text && (
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  &quot;{item.text}&quot;
                </p>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}


