import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 animate-fade-in-up">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none prose-a:text-brand-500">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create or modify your account, or interact with our platform.</p>
        <h3>2. How We Use Your Information</h3>
        <p>We use the information we collect to provide, maintain, and improve our services, as well as to communicate with you.</p>
        <h3>3. Data Security</h3>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>
      </div>
    </div>
  );
}