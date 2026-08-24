import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/Logo";

const pageLinks = [
  { href: "/", label: "Live timing" },
  { href: "/standings", label: "Standings" },
  { href: "/results", label: "Results" },
  { href: "/calendar", label: "Calendar" },
  { href: "/predict", label: "Predict" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLockup compact />
          <p className="mt-3 max-w-xs text-xs leading-5 text-subtle">
            Fan timing board for race weekends. Positions, gaps, the
            championship, and a simple podium pick. Not F1, not the FIA, not a
            team.
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            Pages
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {pageLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            Data
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <a
                className="text-muted hover:text-foreground"
                href="https://openf1.org"
              >
                OpenF1
              </a>
            </li>
            <li>
              <a
                className="text-muted hover:text-foreground"
                href="https://github.com/jolpica/jolpica-f1"
              >
                Jolpica
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            Project
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <a
                className="text-muted hover:text-foreground"
                href="https://github.com/Ayushd70/gridwatch"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                className="text-muted hover:text-foreground"
                href="https://ayushd70.dev"
              >
                ayushd70.dev
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-[11px] leading-5 text-subtle">
        Gridwatch is unofficial. Not affiliated with Formula One Group, the FIA,
        or any constructor. Live timing via OpenF1. Classified results via
        Jolpica.
      </p>
    </footer>
  );
}

export function PageHeading({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-subtle">{kicker}</p>
      <h1 className="mt-1 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      {children ? (
        <div className="mt-2 max-w-2xl text-sm text-muted">{children}</div>
      ) : null}
    </header>
  );
}
