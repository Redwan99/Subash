import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 animate-fade-in-up">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none prose-a:text-brand-500">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and using Subash, you accept and agree to be bound by the terms and provision of this agreement.</p>
        <h3>2. User Accounts</h3>
        <p>To access certain features of the platform, you must register for an account. You agree to provide accurate information and keep it updated.</p>
        <h3>3. Community Guidelines</h3>
        <p>Users must maintain a respectful environment. Harassment, spam, and fraudulent reviews are strictly prohibited and will result in account termination.</p>
      </div>
    </div>
  );
}