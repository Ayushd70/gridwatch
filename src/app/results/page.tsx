import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/SiteChrome";
import { formatWhen } from "@/lib/format";
import {
  constructorColor,
  currentTime,
  fetchCalendar,
  fetchLastResults,
  fetchQualifying,
  fetchRaceResults,
  fetchSprint,
  raceDate,
  type QualifyingResult,
  type RaceResult,
} from "@/lib/jolpica";
import { teamSwatch } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string | string[] }>;
}) {
  const query = await searchParams;
  const [calendar, last] = await Promise.all([fetchCalendar(), fetchLastResults()]);
  const round = typeof query.round === "string" ? query.round : last.round;
  const [race, qualifying, sprint] = await Promise.all([
    fetchRaceResults(round),
    fetchQualifying(round),
    fetchSprint(round),
  ]);

  return (
    <>
      <PageHeading kicker="Official results · Jolpica" title={race?.raceName ?? "Results"}>
        {race
          ? `${race.circuit.circuitName} · ${formatWhen(`${race.date}T12:00:00Z`)}`
          : "Results are not published for this round yet."}
      </PageHeading>

      <div className="mb-2 flex flex-wrap gap-2">
        {calendar.races.map((item) => {
          const done = raceDate(item).getTime() + 4 * 60 * 60 * 1000 < currentTime();
          if (!done && item.round !== last.round) return null;
          const active = item.round === round;
          return (
            <Link
              key={item.round}
              href={`/results?round=${item.round}`}
              className={`rounded-full px-3 py-1 text-xs transition ${
                active
                  ? "bg-foreground font-medium text-background dark:bg-accent/15 dark:text-accent"
                  : "bg-chip text-muted hover:text-foreground"
              }`}
            >
              R{item.round} {item.Circuit.Location.country}
            </Link>
          );
        })}
      </div>

      {race ? <ResultTable title="Race" rows={race.results} kind="race" /> : null}
      {sprint.length > 0 ? <ResultTable title="Sprint" rows={sprint} kind="sprint" /> : null}
      {qualifying.length > 0 ? <QualiTable rows={qualifying} /> : null}
    </>
  );
}

function ResultTable({
  title,
  rows,
  kind,
}: {
  title: string;
  rows: RaceResult[];
  kind: "race" | "sprint";
}) {
  return (
    <section className="panel mt-6">
      <h2 className="border-b border-border px-4 py-3 font-display text-xl text-foreground">
        {title}
      </h2>
      <table className="w-full text-sm">
        <thead className="text-[11px] uppercase tracking-[0.14em] text-subtle">
          <tr>
            <th className="px-4 py-2 text-left font-medium">P</th>
            <th className="px-4 py-2 text-left font-medium">Driver</th>
            {kind === "race" ? (
              <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">
                Grid
              </th>
            ) : null}
            <th className="px-4 py-2 text-right font-medium">Time / status</th>
            <th className="px-4 py-2 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.Driver.driverId}-${row.position}`}
              className="border-t border-border"
            >
              <td className="px-4 py-2.5 font-mono text-muted">
                {row.positionText ?? row.position}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1.5 rounded-full"
                    style={{
                      background: teamSwatch(
                        constructorColor(row.Constructor.constructorId),
                      ),
                    }}
                  />
                  <span className="text-foreground">
                    {row.Driver.givenName} {row.Driver.familyName}
                  </span>
                </div>
                <div className="pl-3.5 text-xs text-subtle">
                  {row.Constructor.name}
                </div>
              </td>
              {kind === "race" ? (
                <td className="hidden px-4 py-2.5 text-right font-mono text-subtle sm:table-cell">
                  {row.grid ?? "—"}
                </td>
              ) : null}
              <td className="px-4 py-2.5 text-right font-mono text-muted">
                {row.Time?.time ?? row.status}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-foreground">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function QualiTable({ rows }: { rows: QualifyingResult[] }) {
  return (
    <section className="panel mt-6">
      <h2 className="border-b border-border px-4 py-3 font-display text-xl text-foreground">
        Qualifying
      </h2>
      <table className="w-full text-sm">
        <thead className="text-[11px] uppercase tracking-[0.14em] text-subtle">
          <tr>
            <th className="px-4 py-2 text-left font-medium">P</th>
            <th className="px-4 py-2 text-left font-medium">Driver</th>
            <th className="px-4 py-2 text-right font-medium">Q1</th>
            <th className="px-4 py-2 text-right font-medium">Q2</th>
            <th className="px-4 py-2 text-right font-medium">Q3</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.Driver.driverId} className="border-t border-border">
              <td className="px-4 py-2.5 font-mono text-muted">{row.position}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1.5 rounded-full"
                    style={{
                      background: teamSwatch(
                        constructorColor(row.Constructor.constructorId),
                      ),
                    }}
                  />
                  <span className="text-foreground">
                    {row.Driver.givenName} {row.Driver.familyName}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-muted">
                {row.Q1 ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-muted">
                {row.Q2 ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-foreground">
                {row.Q3 ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
