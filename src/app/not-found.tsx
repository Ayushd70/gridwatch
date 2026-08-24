import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-[11px] uppercase tracking-[0.2em] text-subtle">404</p>
      <h1 className="mt-2 font-display text-4xl text-foreground">Missing apex</h1>
      <p className="mt-2 text-sm text-muted">That page is not on the grid.</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
      >
        Back to timing
      </Link>
    </div>
  );
}
