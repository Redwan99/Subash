import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <h1 className="text-6xl font-bold text-[var(--accent)]">404</h1>
      <h2 className="text-xl font-bold text-[var(--text-primary)]">Page Not Found</h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
