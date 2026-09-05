import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import type { RaceResult } from "@/lib/jolpica";

function driverName(row: RaceResult) {
  return `${row.Driver.givenName} ${row.Driver.familyName}`;
}

export function LastRaceCard({
  last,
}: {
  last: {
    round: string;
    raceName: string;
    date: string | null;
    results: RaceResult[];
  };
}) {
  const podium = last.results.slice(0, 3);

  return (
    <section className="panel mt-6 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
        Last race
      </p>
      <p className="mt-1 font-display text-lg tracking-tight text-foreground">
        {last.raceName}
      </p>
      <p className="text-xs text-muted">
        <LocalTime iso={last.date} kind="day" />
      </p>
      {podium.length > 0 ? (
        <ol className="mt-3 space-y-1 text-sm">
          {podium.map((row) => (
            <li key={row.Driver.driverId} className="flex gap-2">
              <span className="w-6 font-mono text-subtle">P{row.position}</span>
              <span className="text-foreground">{driverName(row)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted">Results not in yet.</p>
      )}
      <Link
        href={`/results?round=${last.round}`}
        className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
      >
        Full results
      </Link>
    </section>
  );
}
