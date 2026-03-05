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
    size?: 'featured' | 'compact';
};

export default function ReviewPosterCard({ review, size = 'compact' }: ReviewCardProps) {
    const imageUrl =
        review.transparentImageUrl ||
        review.perfume?.transparentImageUrl ||
        review.imageUrl ||
        review.perfume?.image_url ||
        "/placeholder-perfume.jpg";
    const rating = review.overall_rating ?? 5;
    const isFeatured = size === 'featured';

    return (
        <Link 
            href={`/review/${review.id}`}
            className="flex flex-col h-full rounded-2xl overflow-hidden bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/8 transition-[transform,box-shadow] duration-300 active:scale-[0.98] group"
        >
            {/* Image */}
            <div className={`relative w-full bg-gray-100 dark:bg-black/50 overflow-hidden ${
                isFeatured ? 'aspect-[3/4] flex-1 min-h-0' : 'aspect-[4/3]'
            }`}>
                <Image 
                    src={imageUrl} 
                    alt={review.title || "Review Image"} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    sizes={isFeatured ? "(max-width: 768px) 100vw, 33vw" : "(max-width: 768px) 50vw, 25vw"}
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content */}
            <div className={`flex flex-col ${isFeatured ? 'p-4' : 'p-3'}`}>
                {/* Star Rating */}
                <div className="flex items-center gap-0.5 mb-1.5">
                    {[...Array(5)].map((_, i) => (
                        <Star 
                            key={i} 
                            className={`w-3 h-3 ${
                                i < rating 
                                    ? 'fill-amber-400 text-amber-400' 
                                    : 'fill-gray-200 text-gray-200 dark:fill-white/5 dark:text-white/5'
                            }`} 
                        />
                    ))}
                </div>

                {/* Perfume Name */}
                <h3 className={`font-bold text-gray-900 dark:text-white line-clamp-1 mb-1 ${
                    isFeatured ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                }`}>
                    {review.title || review.perfume?.name}
                </h3>

                {/* Review Quote */}
                <p className={`text-gray-600 dark:text-gray-300 italic leading-snug font-serif mb-3 ${
                    isFeatured ? 'text-xs sm:text-sm line-clamp-3' : 'text-[11px] sm:text-xs line-clamp-2'
                }`}>
                    &ldquo;{review.text}&rdquo;
                </p>

                {/* Footer */}
                <div className="flex items-center gap-2 border-t border-gray-100 dark:border-white/10 pt-2.5 mt-auto">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 relative shrink-0 border border-gray-200 dark:border-white/5">
                        <Image 
                            src={review.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user?.name || 'user'}`} 
                            alt={review.user?.name || "User"} 
                            fill 
                            className="object-cover" 
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">
                            {review.user?.name || "Anonymous"}
                        </p>
                        <p suppressHydrationWarning className="text-[9px] text-gray-500 dark:text-gray-500 truncate">
                            {review.createdAt ? formatDistanceToNow(new Date(review.createdAt)) + ' ago' : 'Recently'}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
