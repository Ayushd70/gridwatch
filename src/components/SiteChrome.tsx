import type { ReactNode } from "react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border px-4 py-6 text-center text-xs leading-5 text-subtle">
      Gridwatch is an unofficial fan project. Not affiliated with Formula One
      Group, the FIA, or any team. Live data via{" "}
      <a
        className="text-muted underline-offset-2 hover:text-foreground hover:underline"
        href="https://openf1.org"
      >
        OpenF1
      </a>
      . Official standings via{" "}
      <a
        className="text-muted underline-offset-2 hover:text-foreground hover:underline"
        href="https://github.com/jolpica/jolpica-f1"
      >
        Jolpica
      </a>
      .
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
