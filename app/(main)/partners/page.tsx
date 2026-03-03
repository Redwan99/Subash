import { PartnerFormClient } from "./PartnerFormClient";

export const metadata = {
    title: "Subash Partners | Claim Your Brand",
    description: "Take control of your brand on the world's fastest-growing fragrance platform. Highlight verified deals, respond to reviews, and access analytics.",
};

export default function PartnersPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[rgba(139,92,246,0.15)] rounded-full blur-[100px] pointer-events-none" />

                <div className="flex-1 space-y-6 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#A78BFA] text-sm font-semibold mb-4">
                        <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                        B2B Platform Now Open
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[var(--text-primary)] leading-tight">
                        Take Control of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] to-[#38BDF8]">Your Brand</span>
                    </h1>
                    <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl leading-relaxed">
                        Join the world&apos;s fastest-growing fragrance platform. Highlight verified deals, directly respond to community reviews, and access powerful market analytics.
                    </p>
                </div>

                {/* Claim Form Card */}
                <div className="flex-1 w-full max-w-md z-10">
                    <div className="p-8 rounded-3xl glass border border-[var(--border-color)] shadow-[0_24px_64px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.4)] relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 dark:from-[rgba(255,255,255,0.03)] to-transparent rounded-3xl pointer-events-none" />
                        <h2 className="text-2xl font-bold mb-2">Claim Your Brand</h2>
                        <p className="text-sm text-[var(--text-muted)] mb-8">
                            Verify your official representation to unlock Subash Partner tools.
                        </p>

                        <PartnerFormClient />
                    </div>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-20 px-6 max-w-7xl mx-auto border-t border-[var(--border-color)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[rgba(255,255,255,0.02)] border border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(56,189,248,0.1)] text-[#38BDF8] flex items-center justify-center font-bold text-2xl mb-4">🏆</div>
                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Brand Highlight</h3>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">Stand out with verified badges. Pin your flagship scents to the top of category pages and drive organic interest.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[rgba(255,255,255,0.02)] border border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(167,139,250,0.1)] text-[#A78BFA] flex items-center justify-center font-bold text-2xl mb-4">🗣️</div>
                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Community Engagement</h3>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">Respond authentically to consumer reviews. Build lasting loyalty by directly addressing the community.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[rgba(255,255,255,0.02)] border border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(52,211,153,0.1)] text-[#34D399] flex items-center justify-center font-bold text-2xl mb-4">📊</div>
                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Market Analytics</h3>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">Access real-time telemetry on demographics, trending seasons, and comparative clone analysis.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
