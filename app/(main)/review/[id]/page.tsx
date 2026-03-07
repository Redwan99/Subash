import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Star, MessageCircle, Calendar, ArrowLeft, Droplets, Edit3 } from "lucide-react";
import { CommentSection } from "@/components/reviews/CommentSection";
import { auth } from "@/auth";

// Force dynamic since we have comments and user sessions
export const dynamic = "force-dynamic";

async function getFullReview(id: string) {
    try {
        const review = await prisma.review.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, image: true, bio: true } },
                perfume: { select: { id: true, slug: true, name: true, brand: true, image_url: true, description: true } },
                comments: {
                    include: { user: { select: { name: true, image: true } } },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        return review;
    } catch (error) {
        console.error("Error fetching review:", error);
        return null;
    }
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const review = await getFullReview(id);

    if (!review) notFound();

    const session = await auth();
    const isOwner = session?.user?.id === review.userId;

    const displayImage = review.imageUrl || review.perfume.image_url;

    return (
        <main className="min-h-screen pb-20 pt-20">
            {/* Hero Header */}
            <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={review.perfume.name}
                        fill
                        className="object-cover"
                        priority
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                        <Droplets className="w-14 h-14 text-slate-600" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-4 text-center">
                    <Link
                        href="/"
                        className="absolute top-8 left-8 p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors hidden md:flex"
                    >
                        <ArrowLeft size={20} />
                    </Link>

                    <div className="max-w-3xl">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Link href={`/perfume/${review.perfume.slug}`} className="px-3 py-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                                {review.perfume.brand}
                            </Link>
                            <span className="text-white/60 text-xs font-medium">•</span>
                            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Review Post</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight italic">
                            {review.title || `"${review.perfume.name}: A Fragrance Journey"`}
                        </h1>

                        <div className="flex items-center justify-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--accent)] bg-white/10 shrink-0">
                                    {review.user.image ? (
                                        <Image src={review.user.image} alt={review.user.name || "User"} fill sizes="40px" className="object-cover" />
                                    ) : (
                                        <span className="flex items-center justify-center h-full text-white text-sm">{review.user.name?.[0] || "U"}</span>
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">{review.user.name || "Anonymous"}</p>
                                    <p className="text-[10px] text-white/60">Top Reviewer</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-white/20" />
                            <div className="text-left">
                                <div className="flex items-center gap-1 text-[var(--accent)]">
                                    <Star size={14} className="fill-current" />
                                    <span className="text-sm font-bold text-white">{review.overall_rating.toFixed(1)}</span>
                                </div>
                                <p className="text-[10px] text-white/60 uppercase tracking-widest">Global Score</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Article Content */}
            <article className="max-w-3xl mx-auto px-6 pt-16">
                <div className="flex items-center justify-between mb-12 border-b border-[var(--border-color)] pb-6">
                    <div className="flex items-center gap-4 text-[var(--text-muted)] text-sm">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Calendar size={15} />
                            <span>{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                            <MessageCircle size={15} />
                            <span>{review.comments?.length || 0} comments</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isOwner && (
                            <Link
                                href={`/perfume/${review.perfume.slug}#edit-review`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                            >
                                <Edit3 size={13} />
                                <span className="text-xs font-bold">Edit Review</span>
                            </Link>
                        )}
                        <Link
                            href={`https://wa.me/?text=Check out this review of ${review.perfume.name} on Subash! ${process.env.NEXT_PUBLIC_SITE_URL || 'https://subash.com'}/review/${review.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full hover:bg-[var(--accent)]/10 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                        >
                            <span className="text-xs font-bold uppercase tracking-wider">Share</span>
                        </Link>
                    </div>
                </div>

                <div className="prose prose-invert prose-lg max-w-none">
                    <p className="text-xl md:text-2xl leading-relaxed font-serif text-[var(--text-primary)] whitespace-pre-wrap first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-[var(--accent)]">
                        {review.text}
                    </p>
                </div>

                {/* Perfume Context Card */}
                <div className="mt-20 p-6 rounded-3xl glass border border-[var(--bg-glass-border)] bg-gradient-to-br from-gray-50 dark:from-white/5 to-transparent">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="relative w-32 h-32 rounded-2xl bg-gray-100 dark:bg-black/20 overflow-hidden shrink-0 border border-gray-200 dark:border-white/10">
                            {review.perfume.image_url ? (
                                <Image src={review.perfume.image_url} alt={review.perfume.name} fill className="object-contain p-2" unoptimized />
                            ) : (
                                <Droplets className="w-10 h-10 text-[var(--text-muted)]" />
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">Featured Perfume</span>
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{review.perfume.name}</h2>
                            <p className="text-[var(--text-secondary)] font-medium mb-3">{review.perfume.brand}</p>
                            <p className="text-sm text-[var(--text-muted)] line-clamp-2 italic mb-4">
                                {review.perfume.description || "Discover the magic notes of this exquisite fragrance."}
                            </p>
                            <Link
                                href={`/perfume/${review.perfume.slug}`}
                                className="inline-flex h-10 items-center justify-center px-6 rounded-full bg-[var(--accent)] text-white text-xs font-bold shadow-[var(--shadow-accent)] hover:scale-105 transition-transform"
                            >
                                View Encyclopedia →
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent my-20" />

                {/* Comment Section */}
                <div className="mt-10">
                    <CommentSection
                        reviewId={review.id}
                        initialComments={review.comments || []}
                    />
                </div>
            </article>
        </main>
    );
}
