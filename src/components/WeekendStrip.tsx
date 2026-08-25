import Link from "next/link";
import { LastYearStrip } from "@/components/LastYearStrip";
import { formatDay } from "@/lib/format";
import type { LastYearAtCircuit, RaceResult } from "@/lib/jolpica";

function driverName(row: RaceResult) {
  return `${row.Driver.givenName} ${row.Driver.familyName}`;
}

export function WeekendStrip({
  last,
  lastYear,
  currentSeason,
}: {
  last: {
    round: string;
    raceName: string;
    date: string | null;
    results: RaceResult[];
  };
  lastYear: LastYearAtCircuit | null;
  currentSeason: string;
}) {
  const podium = last.results.slice(0, 3);

  return (
    <div className="mb-6 grid gap-3 md:grid-cols-2">
      <section className="panel p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
          Last race
        </p>
        <p className="mt-1 font-display text-lg tracking-tight text-foreground">
          {last.raceName}
        </p>
        <p className="text-xs text-muted">{formatDay(last.date)}</p>
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
          href="/results"
          className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
        >
          Full results
        </Link>
      </section>

      {lastYear ? (
        <LastYearStrip
          data={lastYear}
          currentSeason={currentSeason}
          variant="card"
        />
      ) : null}
    </div>
  );
}
