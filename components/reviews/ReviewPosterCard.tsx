import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Adjust types based on your exact Prisma schema
type ReviewCardProps = {
    review: {
        id?: string;
        title?: string | null;
        text?: string;
        overall_rating?: number;
        createdAt?: string | Date;
        transparentImageUrl?: string | null;
        imageUrl?: string | null;
        perfume?: {
            id?: string;
            slug?: string;
            name?: string;
            brand?: string;
            image_url?: string | null;
            transparentImageUrl?: string | null;
        } | null;
        user?: {
            id?: string;
            name?: string | null;
            image?: string | null;
        } | null;
    };
};

export default function ReviewPosterCard({ review }: ReviewCardProps) {
    const imageUrl =
        review.transparentImageUrl ||
        review.perfume?.transparentImageUrl ||
        review.imageUrl ||
        review.perfume?.image_url ||
        "/placeholder-perfume.jpg";
    const rating = review.overall_rating || 5;

    return (
        <Link 
            href={`/review/${review.id}`}
            className="block break-inside-avoid gpu-accelerate mb-6 rounded-[2rem] overflow-hidden bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 active:scale-[0.97] group"
        >
            {/* Top Image Header - Fixed Aspect Ratio for Verticality */}
            <div className="relative w-full aspect-square sm:aspect-[4/5] bg-gray-100 dark:bg-black/50 overflow-hidden">
                <Image 
                    src={imageUrl} 
                    alt={review.title || "Review Image"} 
                    fill 
                    className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
        
                {/* Subtle Gradient Overlay for contrast if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Compact Content Body */}
            <div className="p-5 sm:p-6 flex flex-col">
        
                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                        <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                i < rating 
                                    ? 'fill-amber-400 text-amber-400' 
                                    : 'fill-gray-200 text-gray-200 dark:fill-white/5 dark:text-white/5'
                            }`} 
                        />
                    ))}
                </div>

                {/* Perfume Name / Title */}
                <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-2 line-clamp-1">
                    {review.title || review.perfume?.name}
                </h3>

                {/* The Review Quote (Editorial Style) */}
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base line-clamp-4 italic leading-relaxed mb-6 font-serif relative">
                    &ldquo;{review.text}&rdquo;
                </p>

                {/* Footer: User Profile (Compact) */}
                <div className="flex items-center gap-3 border-t border-gray-100 dark:border-white/10 pt-4 mt-auto">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 relative shrink-0 border border-gray-200 dark:border-white/5">
                        <Image 
                            src={review.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user?.name || 'user'}`} 
                            alt={review.user?.name || "User"} 
                            fill 
                            className="object-cover" 
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {review.user?.name || "Anonymous"}
                        </p>
                        <p suppressHydrationWarning className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 truncate">
                            {review.createdAt ? formatDistanceToNow(new Date(review.createdAt)) + ' ago' : 'Recently'}
                        </p>
                    </div>
                </div>

            </div>
        </Link>
    );
}
