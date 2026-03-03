"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import { addReviewComment } from "@/lib/actions/comments";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface Comment {
    id: string;
    text: string;
    createdAt: Date | string;
    user: {
        name: string | null;
        image: string | null;
    };
}

export function CommentSection({
    reviewId,
    initialComments
}: {
    reviewId: string;
    initialComments: Comment[];
}) {
    const { data: session } = useSession();
    const [text, setText] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        setError(null);
        startTransition(async () => {
            const result = await addReviewComment(reviewId, text);
            if (result.success) {
                setText("");
            } else {
                setError(result.error || "Something went wrong");
            }
        });
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center gap-2 mb-6">
                <MessageSquare size={18} className="text-[var(--accent)]" />
                <h3 className="text-xl font-bold text-[var(--text-primary)] font-serif italic">Discussion</h3>
                <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full ml-1">
                    {initialComments.length}
                </span>
            </div>

            {session ? (
                <form onSubmit={handleSubmit} className="relative group">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Share your thoughts on this story..."
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-all min-h-[100px] resize-none"
                        disabled={isPending}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-3">
                        {error && <span className="text-[10px] text-red-400 font-medium">{error}</span>}
                        <button
                            type="submit"
                            disabled={isPending || !text.trim()}
                            className="h-10 w-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-[var(--shadow-accent)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                        >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-center">
                    <p className="text-sm text-[var(--text-muted)] mb-4">You must be signed in to join the conversation.</p>
                    <a href="/login" className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest hover:underline">
                        Sign In Now
                    </a>
                </div>
            )}

            <div className="space-y-8 mt-12">
                {initialComments.length === 0 ? (
                    <div className="py-10 text-center grayscale opacity-50">
                        <p className="text-sm text-[var(--text-muted)]">No comments yet. Start the conversation!</p>
                    </div>
                ) : (
                    initialComments.map((comment) => (
                        <div key={comment.id} className="group relative flex gap-4">
                            {/* Vertical Line */}
                            <div className="absolute left-4 top-10 bottom-0 w-px bg-gradient-to-b from-gray-200 dark:from-white/10 to-transparent" />

                            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10">
                                {comment.user.image ? (
                                    <Image src={comment.user.image} alt={comment.user.name || "User"} fill className="object-cover" />
                                ) : (
                                    <span className="flex items-center justify-center h-full text-[10px] font-bold text-[var(--text-primary)] uppercase">
                                        {comment.user.name?.[0] || "U"}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-bold text-[var(--text-primary)]">
                                        {comment.user.name || "Anonymous"}
                                    </p>
                                    <time className="text-[10px] text-[var(--text-muted)] opacity-60">
                                        {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </time>
                                </div>
                                <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap mt-2 p-4 rounded-2xl rounded-tl-none bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-colors group-hover:bg-gray-100 dark:group-hover:bg-white/10">
                                    {comment.text}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
