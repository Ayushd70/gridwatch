"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Live timing" },
  { href: "/standings", label: "Standings" },
  { href: "/results", label: "Results" },
  { href: "/calendar", label: "Calendar" },
  { href: "/predict", label: "Predict" },
];

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-[13px] font-bold tracking-wide text-accent-fg">
            GW
          </span>
          <span className="min-w-0">
            <span className="block font-display text-xl leading-none tracking-tight text-foreground sm:text-2xl">
              GRIDWATCH
            </span>
            <span className="mt-0.5 hidden text-[10px] uppercase tracking-[0.18em] text-subtle sm:block">
              Unofficial fan timing
            </span>
          </span>
        </Link>
        <nav className="order-last flex w-full min-w-0 items-center gap-1 overflow-x-auto text-sm sm:order-none sm:ml-auto sm:w-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1.5 transition ${
                  active ? "nav-active" : "text-muted hover:bg-chip hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto sm:ml-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
