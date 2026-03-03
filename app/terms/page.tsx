// app/terms/page.tsx
// Phase 16 — Terms of Service

import { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service · Subash",
    description: "Read the Subash Terms of Service governing your use of our platform.",
};

const EFFECTIVE_DATE = "1 March 2026";
const COMPANY = "Subash";
const EMAIL = "legal@subash.app";

export default function TermsPage() {
    return (
        <main className="min-h-screen px-4 md:px-8 pt-24 pb-24">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-12 flex flex-col items-start gap-4">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                        <Shield size={13} /> Legal
                    </span>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-[var(--text-primary)] leading-tight">
                        Terms of Service
                    </h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Effective date: <strong className="text-[var(--text-secondary)]">{EFFECTIVE_DATE}</strong>
                    </p>
                    <div className="h-px w-full bg-[linear-gradient(90deg,var(--accent),transparent)]" />
                </div>

                {/* Body */}
                <div className="space-y-10 text-[var(--text-secondary)] text-[15px] leading-relaxed">

                    <Section title="1. Acceptance of Terms">
                        <p>
                            By accessing or using {COMPANY} (the &ldquo;Platform&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to all of these Terms, you may not use the Platform. These Terms constitute a legally binding agreement between you and {COMPANY}.
                        </p>
                    </Section>

                    <Section title="2. Description of Service">
                        <p>
                            {COMPANY} is a fragrance discovery and community platform that allows users to discover, review, and discuss perfumes. We reserve the right to modify, suspend, or discontinue any aspect of the Platform at any time without notice.
                        </p>
                    </Section>

                    <Section title="3. User Accounts">
                        <p>
                            To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information and keep your account information updated.
                        </p>
                        <p className="mt-3">
                            You must be at least 13 years of age to use the Platform. By creating an account, you represent and warrant that you meet this age requirement.
                        </p>
                    </Section>

                    <Section title="4. User-Generated Content">
                        <p>
                            By submitting reviews, posts, photographs, or any other content (&ldquo;User Content&rdquo;) to the Platform, you grant {COMPANY} a worldwide, non-exclusive, royalty-free, sublicensable, and transferable licence to use, reproduce, distribute, prepare derivative works of, display, and perform your User Content in connection with the Platform and {COMPANY}&apos;s business.
                        </p>
                        <p className="mt-3">
                            You retain all ownership rights in your User Content. You represent and warrant that you own or have the necessary rights to submit such content and that it does not infringe any third-party rights.
                        </p>
                    </Section>

                    {/* CRITICAL LEGAL CLAUSE */}
                    <Section title="5. Prohibited Conduct" critical>
                        <p>You agree that you will not, under any circumstances:</p>
                        <ul className="mt-4 space-y-3 list-none">
                            {[
                                "Scrape, mine, crawl, spider, extract, or otherwise collect data from the Platform by automated or manual means without explicit, written, contracted approval from the owners of Subash.",
                                "Use any automated system — including bots, scrapers, crawlers, or data extraction scripts — to access, query, or harvest content, user data, perfume data, or review data from the Platform.",
                                "Access or attempt to access the Platform's API endpoints for commercial purposes without a signed commercial licence agreement.",
                                "Reproduce, republish, redistribute, sell, rent, sublicence, or create derivative works from the Subash database, UI design, or any compiled dataset without explicit written permission.",
                                "Reverse-engineer, decompile, or attempt to extract the source code of any part of the Platform.",
                                "Use the Platform for any commercial purpose or for any public display (commercial or non-commercial) without prior written consent.",
                                "Circumvent, disable, or otherwise interfere with security-related features of the Platform.",
                                "Impersonate any person or entity or misrepresent your affiliation with any person or entity.",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-[#EF4444] opacity-70" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Callout color="red">
                            Any entity — individual, corporate, or institutional — wishing to use Subash data, scraped content, API endpoints, or database exports for commercial purposes <strong className="text-white">must enter into a written commercial contract</strong> with {COMPANY} prior to any such use. Violations will be pursued to the fullest extent of applicable law.
                        </Callout>
                    </Section>

                    <Section title="6. Intellectual Property">
                        <p>
                            The Platform, including its design, layout, graphics, software, and compiled fragrance database, is the exclusive property of {COMPANY} and is protected by copyright, trade dress, and other applicable intellectual property laws. Nothing in these Terms grants you any right to use the {COMPANY} name, logo, or brand features.
                        </p>
                    </Section>

                    <Section title="7. Disclaimers">
                        <p>
                            The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, either express or implied. {COMPANY} does not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components.
                        </p>
                    </Section>

                    <Section title="8. Limitation of Liability">
                        <p>
                            To the maximum extent permitted by law, {COMPANY} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Platform.
                        </p>
                    </Section>

                    <Section title="9. Governing Law">
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of Bangladesh, without regard to conflict of law principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Dhaka, Bangladesh.
                        </p>
                    </Section>

                    <Section title="10. Changes to Terms">
                        <p>
                            {COMPANY} reserves the right to modify these Terms at any time. We will notify you of changes by updating the effective date above. Your continued use of the Platform following any changes constitutes your acceptance of the revised Terms.
                        </p>
                    </Section>

                    <Section title="11. Contact">
                        <p>
                            Questions about these Terms should be directed to:{" "}
                            <a href={`mailto:${EMAIL}`} className="text-[var(--accent)] hover:underline underline-offset-4">
                                {EMAIL}
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

function Section({
    title,
    children,
    critical,
}: {
    title: string;
    children: React.ReactNode;
    critical?: boolean;
}) {
    return (
        <section>
            <h2
                className={`text-lg font-bold mb-4 ${critical
                        ? "text-[#EF4444]"
                        : "text-[var(--text-primary)]"
                    }`}
            >
                {title}
                {critical && (
                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#EF4444] border border-[#EF4444]/40 rounded-full px-2 py-0.5">
                        Critical
                    </span>
                )}
            </h2>
            {children}
        </section>
    );
}

function Callout({ children, color = "accent" }: { children: React.ReactNode; color?: "accent" | "red" }) {
    const colors =
        color === "red"
            ? "border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.06)]"
            : "border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.06)]";
    return (
        <div className={`mt-5 rounded-2xl border p-5 text-sm leading-relaxed ${colors}`}>
            {children}
        </div>
    );
}

function LegalFooter() {
    return (
        <div className="pt-10 border-t border-[var(--border-color)] flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
            <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors">Privacy Policy</Link>
            <Link href="/licensing" className="hover:text-[var(--accent)] transition-colors">Licensing & API</Link>
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">← Back to Subash</Link>
        </div>
    );
}
