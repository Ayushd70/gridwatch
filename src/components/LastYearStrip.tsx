import { formatDay } from "@/lib/format";
import type { LastYearAtCircuit } from "@/lib/jolpica";

function driverName(data: LastYearAtCircuit["podium"][number]["Driver"]) {
  return `${data.givenName} ${data.familyName}`;
}

export function LastYearStrip({
  data,
  currentSeason,
  variant = "banner",
}: {
  data: LastYearAtCircuit;
  currentSeason: string;
  variant?: "card" | "banner";
}) {
  const regsNote =
    data.season !== currentSeason
      ? `${data.season} result at this circuit. Sporting regs may differ from ${currentSeason}.`
      : null;

  const heading = (
    <>
      <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
        Last year at this circuit
      </p>
      <p className="mt-1 font-display text-lg tracking-tight text-foreground">
        {data.raceName}
      </p>
      <p className="text-xs text-muted">
        {data.circuit.circuitName} · {formatDay(data.date)}
      </p>
    </>
  );

  const podium = (
    <ol
      className={
        variant === "banner"
          ? "flex flex-wrap gap-x-5 gap-y-1 text-sm"
          : "mt-3 space-y-1 text-sm"
      }
    >
      {data.podium.map((row) => (
        <li key={row.Driver.driverId} className="flex gap-2">
          <span className="w-6 font-mono text-subtle">P{row.position}</span>
          <span className="text-foreground">{driverName(row.Driver)}</span>
        </li>
      ))}
      {data.pole ? (
        <li className="flex gap-2 text-muted">
          <span className="font-mono text-subtle">Pole</span>
          <span>{driverName(data.pole.Driver)}</span>
        </li>
      ) : null}
    </ol>
  );

  if (variant === "card") {
    return (
      <section className="panel p-4">
        {heading}
        {podium}
        {regsNote ? <p className="mt-2 text-xs text-subtle">{regsNote}</p> : null}
      </section>
    );
  }

  return (
    <section className="panel mt-6 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>{heading}</div>
        {podium}
      </div>
      {regsNote ? <p className="mt-2 text-xs text-subtle">{regsNote}</p> : null}
    </section>
  );
}
