// app/licensing/page.tsx
// Phase 16 — Licensing & API Access

import { Metadata } from "next";
import Link from "next/link";
import { FileKey, Mail, ExternalLink, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
    title: "Licensing & API Access · Subash",
    description:
        "Understand Subash's intellectual property rights and how to partner with us for commercial API access.",
};

const EFFECTIVE_DATE = "1 March 2026";
const COMPANY = "Subash";
const COMMERCIAL_EMAIL = "partnerships@subash.app";

export default function LicensingPage() {
    return (
        <main className="min-h-screen px-4 md:px-8 pt-24 pb-24">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-12 flex flex-col items-start gap-4">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                        <FileKey size={13} /> Licensing
                    </span>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-[var(--text-primary)] leading-tight">
                        Licensing & API Access
                    </h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Effective date:{" "}
                        <strong className="text-[var(--text-secondary)]">{EFFECTIVE_DATE}</strong>
                    </p>
                    <div className="h-px w-full bg-[linear-gradient(90deg,var(--accent),transparent)]" />
                </div>

                {/* Body */}
                <div className="space-y-10 text-[var(--text-secondary)] text-[15px] leading-relaxed">

                    <Section title="1. Proprietary Software & Design">
                        <p>
                            The {COMPANY} platform — including but not limited to its source code, compiled application, user interface design, visual design system, glassmorphism aesthetic, typography choices, interaction patterns, and all custom components — is the exclusive intellectual property of {COMPANY} and its founders.
                        </p>
                        <p className="mt-3">
                            The platform is protected under copyright law and applicable intellectual property regulations. No part of the platform may be reproduced, modified, distributed, or used to create derivative works without prior written authorisation.
                        </p>
                    </Section>

                    <Section title="2. The Subash Fragrance Database">
                        <p>
                            {COMPANY} has curated, structured, validated, and enriched a proprietary fragrance database comprising perfume records, accord taxonomies, community review data, creator profiles, and metadata associations. This compiled database constitutes a <strong className="text-[var(--text-primary)]">proprietary dataset</strong> — even where individual perfume data points may be publicly known — because the selection, arrangement, and enrichment of the data represents original creative and intellectual effort.
                        </p>
                        <p className="mt-3">
                            The database is <strong className="text-[var(--text-primary)]">not available</strong> for public download, export, or replication. Any attempt to reconstruct the database through scraping, API abuse, or manual extraction constitutes a violation of these terms and applicable intellectual property law.
                        </p>
                        <ProtectedBadge />
                    </Section>

                    <Section title="3. Community Content">
                        <p>
                            User-generated content (reviews, ratings, wardrobe collections, Fragram posts) is licensed by users to {COMPANY} under the terms described in our{" "}
                            <Link href="/terms" className="text-[var(--accent)] hover:underline underline-offset-4">
                                Terms of Service
                            </Link>
                            . Third parties may not reproduce, aggregate, or commercially exploit this community content without a signed licence agreement.
                        </p>
                    </Section>

                    <Section title="4. Permitted Personal Use">
                        <p>
                            Registered users of the Platform are granted a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform solely for their own personal, non-commercial fragrance discovery purposes. This licence does not extend to:
                        </p>
                        <ul className="mt-4 space-y-2.5 list-none">
                            {[
                                "Building competing services or products.",
                                "Aggregating content for resale or redistribution.",
                                "Training machine learning models on Subash data.",
                                "Any form of automated batch access, indexing, or mirroring.",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-2 shrink-0 w-1 h-1 rounded-full bg-[#EF4444] opacity-70" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section title="5. Open Source Acknowledgements">
                        <p>
                            {COMPANY} is built on top of open-source technologies including Next.js, Prisma, Tailwind CSS, Framer Motion, and others, each governed by their respective licences. Our proprietary rights apply to the original creative work built on top of these technologies, not to the underlying open-source components.
                        </p>
                    </Section>

                    {/* Commercial Partnership CTA */}
                    <section>
                        <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]">
                            6. Commercial Partnerships & API Access
                        </h2>
                        <p>
                            {COMPANY} is open to commercial partnerships, data licences, and API access agreements with qualifying entities, subject to a formal negotiation and signed commercial contract.
                        </p>
                        <p className="mt-3">Eligible partnership types include:</p>
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { label: "Fragrance Retailers", desc: "Embed Subash reviews and ratings in your product listings." },
                                { label: "Research Institutions", desc: "Licence anonymised review datasets for academic fragrance research." },
                                { label: "Fragrance Tech Platforms", desc: "Integrate Subash's database for scent discovery features." },
                                { label: "Media & Publishing", desc: "Syndicate curated Subash content under a content partnership." },
                            ].map(({ label, desc }) => (
                                <div
                                    key={label}
                                    className="rounded-2xl border border-[var(--bg-glass-border)] bg-[var(--bg-glass)] backdrop-blur-sm p-4"
                                >
                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-1">{label}</p>
                                    <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Glowing CTA */}
                        <div className="mt-8 rounded-3xl border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.05)] p-8 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck size={16} className="text-[var(--accent)]" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Commercial Enquiries</span>
                                </div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
                                    Interested in a Partnership?
                                </h3>
                                <p className="text-sm text-[var(--text-muted)] max-w-sm">
                                    Send us a brief description of your organisation and intended use case. Our team will respond within 3 business days.
                                </p>
                            </div>
                            <a
                                href={`mailto:${COMMERCIAL_EMAIL}?subject=Commercial%20Partnership%20Enquiry%20%E2%80%94%20${COMPANY}&body=Organisation%3A%0AIntended%20use%3A%0AData%20scope%20required%3A`}
                                className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-[linear-gradient(135deg,#8B5CF6,#A78BFA)] shadow-[0_4px_24px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_32px_rgba(139,92,246,0.6)] transition-all"
                            >
                                <Mail size={15} />
                                Contact for Licensing
                                <ExternalLink size={12} className="opacity-60" />
                            </a>
                        </div>
                    </section>

                    <Section title="7. Enforcement">
                        <p>
                            {COMPANY} actively monitors for violations of these licensing terms. Violations including but not limited to data scraping, API abuse, and database replication may result in:
                        </p>
                        <ul className="mt-4 space-y-2.5 list-none">
                            {[
                                "Immediate and permanent suspension of your account and all associated access.",
                                "Legal action under applicable copyright, database rights, and computer misuse laws.",
                                "Claims for damages including lost revenue attributable to the violation.",
                                "Injunctive relief to prevent further misuse.",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-2 shrink-0 w-1 h-1 rounded-full bg-[#EF4444] opacity-60" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section title="8. Contact">
                        <p>
                            For licensing enquiries:{" "}
                            <a href={`mailto:${COMMERCIAL_EMAIL}`} className="text-[var(--accent)] hover:underline underline-offset-4">
                                {COMMERCIAL_EMAIL}
                            </a>
                        </p>
                    </Section>

                    <LegalFooter />
                </div>
            </div>
        </main>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]">{title}</h2>
            {children}
        </section>
    );
}

function ProtectedBadge() {
    return (
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.06)] text-[#F59E0B] text-xs font-semibold">
            <ShieldCheck size={13} />
            Proprietary Database — All Rights Reserved
        </div>
    );
}

function LegalFooter() {
    return (
        <div className="pt-10 border-t border-[var(--border-color)] flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
            <Link href="/terms" className="hover:text-[var(--accent)] transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">← Back to Subash</Link>
        </div>
    );
}
