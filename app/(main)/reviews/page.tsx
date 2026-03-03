import prisma from "@/lib/prisma";
import ReviewPosterCard from "@/components/reviews/ReviewPosterCard";
import { Sparkles, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

type ReviewCardItem = {
    id: string;
    title: string | null;
    text: string;
    imageUrl: string | null;
    overall_rating: number;
    createdAt: Date;
    user: { name: string | null; image: string | null };
    perfume: { name: string; brand: string; image_url: string | null };
};

async function getAllReviews() {
    try {
        return await prisma.review.findMany({
            where: { status: "APPROVED" },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
                id: true,
                title: true,
                text: true,
                imageUrl: true,
                overall_rating: true,
                createdAt: true,
                user: { select: { name: true, image: true } },
                perfume: { select: { name: true, brand: true, image_url: true } },
            },
        });
    } catch (error) {
        console.error("Error fetching global reviews:", error);
        return [] as ReviewCardItem[];
    }
}

export default async function ReviewsPage() {
    const reviews = await getAllReviews();

    return (
        <main className="min-h-screen pt-24 pb-20 px-4 md:px-8">
            {/* Editorial Header */}
            <section className="max-w-7xl mx-auto mb-12 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                        <MessageSquare size={18} />
                    </div>
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)]">Community Feed</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-[var(--text-primary)] mb-4">
                    Community Reviews
                </h1>
                <p className="text-[var(--text-muted)] text-lg max-w-2xl leading-relaxed">
                    The heart of Subash. Discover what Bangladesh is wearing, from timeless classics to the latest niche discoveries.
                </p>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent mt-12 mb-4" />
            </section>

            {/* Masonry Grid */}
            <section className="max-w-[1400px] mx-auto">
                {reviews.length > 0 ? (
                    <div className="columns-1 sm:columns-2 lg:columns-2 xl:columns-3 gap-6 space-y-6 contain-paint">
                        {reviews.map((review) => (
                            <ReviewPosterCard key={review.id} review={review} />
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center glass border border-white/5 rounded-3xl">
                        <div className="flex justify-center mb-4 opacity-20">
                            <Sparkles size={60} />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">No reviews yet</h3>
                        <p className="text-[var(--text-muted)] mt-2">Be the first to share your scent story!</p>
                    </div>
                )}
            </section>
        </main>
    );
}
