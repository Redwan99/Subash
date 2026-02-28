// app/privacy/page.tsx
// Phase 16 — Privacy Policy

import { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy · Subash",
    description: "Learn how Subash collects, uses, and protects your personal data.",
};

const EFFECTIVE_DATE = "1 March 2026";
const EMAIL = "privacy@subash.app";
const COMPANY = "Subash";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen px-4 md:px-8 pt-24 pb-24">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-12 flex flex-col items-start gap-4">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                        <Lock size={13} /> Privacy
                    </span>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-[var(--text-primary)] leading-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        Effective date: <strong className="text-[var(--text-secondary)]">{EFFECTIVE_DATE}</strong>
                    </p>
                    <div className="h-px w-full bg-[linear-gradient(90deg,var(--accent),transparent)]" />
                </div>

                {/* Body */}
                <div className="space-y-10 text-[var(--text-secondary)] text-[15px] leading-relaxed">

                    <Section title="1. Introduction">
                        <p>
                            {COMPANY} (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, and share information when you use our platform at subash.app.
                        </p>
                    </Section>

                    <Section title="2. Information We Collect">
                        <p>We collect the following categories of information:</p>
                        <div className="mt-4 space-y-4">
                            <InfoCard label="Account Information">
                                Your name, email address, and profile photograph, collected when you register via email or a third-party OAuth provider (Google, GitHub).
                            </InfoCard>
                            <InfoCard label="Authentication Data">
                                We use NextAuth.js for session management. OAuth tokens are managed securely and are never stored in plain text. Passwords for email/password accounts are hashed with bcrypt before storage.
                            </InfoCard>
                            <InfoCard label="User-Generated Content">
                                Reviews, fragrance ratings, wardrobe collections, Fragram posts, and any other content you voluntarily submit to the Platform.
                            </InfoCard>
                            <InfoCard label="Usage Data">
                                Page views, search queries, and feature interactions collected automatically to improve the Platform. This data is anonymised and aggregated.
                            </InfoCard>
                            <InfoCard label="Device & Technical Data">
                                Browser type, operating system, IP address, and referral URLs, collected automatically for security and debugging purposes.
                            </InfoCard>
                        </div>
                    </Section>

                    <Section title="3. How We Use Your Information">
                        <p>We use the information we collect to:</p>
                        <ul className="mt-4 space-y-2.5 list-none">
                            {[
                                "Provide, operate, and maintain the Platform.",
                                "Authenticate your identity and manage your session.",
                                "Display your public profile, reviews, and community contributions.",
                                "Send transactional emails (e.g., email verification, newsletter confirmation).",
                                "Analyse usage patterns to improve the Platform's features and performance.",
                                "Detect, investigate, and prevent fraudulent activity and abuse.",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-2 shrink-0 w-1 h-1 rounded-full bg-[var(--accent)]" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section title="4. Cookie Usage">
                        <p>
                            We use cookies and similar tracking technologies solely for the purpose of session management. Specifically:
                        </p>
                        <div className="mt-4 space-y-3">
                            <InfoCard label="Session Cookies">
                                Used by NextAuth.js to maintain your authenticated session. These are strictly necessary and expire when you close your browser or sign out.
                            </InfoCard>
                            <InfoCard label="CSRF Tokens">
                                Short-lived tokens used to protect against cross-site request forgery attacks on form submissions.
                            </InfoCard>
                        </div>
                        <p className="mt-4">
                            We do <strong className="text-[var(--text-primary)]">not</strong> use advertising cookies, tracking pixels, or third-party analytics trackers such as Google Analytics.
                        </p>
                    </Section>

                    <Section title="5. How We Share Your Information">
                        <p>
                            We do <strong className="text-[var(--text-primary)]">not sell, rent, or lease</strong> your personal data to third-party data brokers, advertisers, or marketing companies under any circumstances.
                        </p>
                        <p className="mt-3">
                            We may share information only in the following limited circumstances:
                        </p>
                        <ul className="mt-4 space-y-2.5 list-none">
                            {[
                                "With service providers who assist in operating the Platform (e.g., email delivery via Resend), bound by strict data processing agreements.",
                                "When required by applicable law, court order, or governmental authority.",
                                "In connection with a merger, acquisition, or asset sale, where you will be notified in advance.",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-2 shrink-0 w-1 h-1 rounded-full bg-[var(--accent)]" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section title="6. Data Retention">
                        <p>
                            We retain your personal data for as long as your account is active or as needed to provide the Platform. If you delete your account, we will permanently delete your personal information within 30 days, except where retention is required by law.
                        </p>
                    </Section>

                    <Section title="7. Data Security">
                        <p>
                            We implement industry-standard security measures, including TLS/SSL encryption for data in transit, bcrypt hashing for passwords, and role-based access controls. However, no method of transmission over the internet is 100% secure. We cannot guarantee the absolute security of your data.
                        </p>
                    </Section>

                    <Section title="8. Your Rights">
                        <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
                        <ul className="mt-4 space-y-2.5 list-none">
                            {[
                                "Right to access — request a copy of the data we hold about you.",
                                "Right to rectification — request correction of inaccurate data.",
                                "Right to erasure — request deletion of your personal data.",
                                "Right to restriction — request that we limit the processing of your data.",
                                "Right to data portability — receive your data in a structured, machine-readable format.",
                                "Right to object — object to our processing of your personal data.",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-2 shrink-0 w-1 h-1 rounded-full bg-[var(--accent)]" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4">
                            To exercise any of these rights, contact us at{" "}
                            <a href={`mailto:${EMAIL}`} className="text-[var(--accent)] hover:underline underline-offset-4">
                                {EMAIL}
                            </a>.
                        </p>
                    </Section>

                    <Section title="9. Children's Privacy">
                        <p>
                            The Platform is not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal information, we will delete it promptly.
                        </p>
                    </Section>

                    <Section title="10. Changes to This Policy">
                        <p>
                            We may update this Privacy Policy from time to time. When we do, we will revise the effective date at the top of this page. We encourage you to review this Policy periodically.
                        </p>
                    </Section>

                    <Section title="11. Contact">
                        <p>
                            For privacy-related inquiries, contact our team at:{" "}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]">{title}</h2>
            {children}
        </section>
    );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[var(--bg-glass-border)] bg-[var(--bg-glass)] backdrop-blur-sm px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-1">{label}</p>
            <p className="text-sm">{children}</p>
        </div>
    );
}

function LegalFooter() {
    return (
        <div className="pt-10 border-t border-[var(--border-color)] flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
            <Link href="/terms" className="hover:text-[var(--accent)] transition-colors">Terms of Service</Link>
            <Link href="/licensing" className="hover:text-[var(--accent)] transition-colors">Licensing & API</Link>
            <Link href="/" className="hover:text-[var(--accent)] transition-colors">← Back to Subash</Link>
        </div>
    );
}
