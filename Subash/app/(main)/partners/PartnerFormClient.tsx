"use client";

import { useState, useTransition } from "react";
import { submitBrandClaim } from "@/lib/actions/b2b";
import { Loader2, CheckCircle2 } from "lucide-react";

export function PartnerFormClient() {
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            try {
                const res = await submitBrandClaim(formData);
                if (res.error) {
                    setError(res.error);
                } else {
                    setSuccess(true);
                }
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred.");
            }
        });
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                    <CheckCircle2 size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Claim Submitted</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Our partnership team will review your application and reach out within 2-3 business days.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form action={onSubmit} className="space-y-4">
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Brand Name *
                </label>
                <input
                    type="text"
                    name="brandName"
                    required
                    placeholder="e.g. Creed"
                    className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-white focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Official Email *
                </label>
                <input
                    type="email"
                    name="officialEmail"
                    required
                    placeholder="contact@brand.com"
                    className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-white focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Message to our Team
                </label>
                <textarea
                    name="message"
                    rows={3}
                    placeholder="How can we help your brand grow?"
                    className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-white focus:outline-none focus:border-[#8B5CF6] transition-colors resize-none"
                />
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)]"
            >
                {isPending && <Loader2 size={18} className="animate-spin" />}
                Submit Claim Request
            </button>

            <p className="text-[10px] text-center text-[var(--text-muted)] mt-4">
                By submitting, you agree to Subash's Partner Terms of Service.
            </p>
        </form>
    );
}
