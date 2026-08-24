import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <LogoMark size={64} alt="Gridwatch" />
      <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-subtle">
        404
      </p>
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
