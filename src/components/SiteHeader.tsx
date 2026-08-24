import Link from "next/link";

const links = [
  { href: "/", label: "Live timing" },
  { href: "/standings", label: "Standings" },
  { href: "/results", label: "Results" },
  { href: "/calendar", label: "Calendar" },
  { href: "/predict", label: "Predict" },
];

export function SiteHeader({ current }: { current: string }) {
  return (
    <header className="border-b border-white/8 bg-[#0c0d12]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight text-amber-400">
            GRIDWATCH
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-zinc-500 sm:inline">
            Unofficial fan timing
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active =
              current === link.href ||
              (link.href !== "/" && current.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 transition ${
                  active
                    ? "bg-amber-400/15 text-amber-300"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/8 px-4 py-6 text-center text-xs leading-5 text-zinc-500">
      Gridwatch is an unofficial fan project. Not affiliated with Formula One
      Group, the FIA, or any team. Live data via{" "}
      <a className="text-zinc-300 underline-offset-2 hover:underline" href="https://openf1.org">
        OpenF1
      </a>
      . Official standings via{" "}
      <a className="text-zinc-300 underline-offset-2 hover:underline" href="https://github.com/jolpica/jolpica-f1">
        Jolpica
      </a>
      .
    </footer>
  );
}
