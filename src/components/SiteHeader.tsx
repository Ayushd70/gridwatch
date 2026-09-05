"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLockup } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { visiblePageLinks } from "@/lib/nav";

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Link href="/" className="min-w-0">
          <BrandLockup priority />
        </Link>
        <nav className="order-last w-full min-w-0 sm:order-none sm:ml-auto sm:w-auto">
          <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full bg-chip p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visiblePageLinks().map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] transition ${
                    active
                      ? "bg-white font-medium text-zinc-950 shadow-sm ring-1 ring-black/10 dark:bg-white/12 dark:text-zinc-50 dark:ring-white/10"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="ml-auto sm:ml-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
