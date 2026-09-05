import type { Metadata } from "next";
import Link from "next/link";
import { LastYearStrip } from "@/components/LastYearStrip";
import { PageHeading } from "@/components/SiteChrome";
import { WeekendResults } from "@/components/WeekendResults";
import { formatWhen, teamSwatch } from "@/lib/format";
import {
  constructorColor,
  currentTime,
  fetchCalendar,
  fetchLastResults,
  fetchLastYearAtCircuit,
  fetchQualifying,
  fetchRaceResults,
  fetchSprint,
  nextOrCurrentRace,
  placesGained,
  raceDate,
  weekendSessions,
  type RaceResult,
} from "@/lib/jolpica";
import {
  fetchWeekendSessionResults,
  fromErgastQualifying,
} from "@/lib/weekend-results";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ round?: string | string[] }>;
}) {
  const query = await searchParams;
  const [calendar, last] = await Promise.all([fetchCalendar(), fetchLastResults()]);
  const now = currentTime();
  const featured = nextOrCurrentRace(calendar.races);
  const weekendStarted = (race: (typeof calendar.races)[number]) => {
    const first = weekendSessions(race)[0];
    return (first?.at.getTime() ?? raceDate(race).getTime()) <= now;
  };
  const raceFinished = (race: (typeof calendar.races)[number]) =>
    raceDate(race).getTime() + 4 * 60 * 60 * 1000 < now;
  const defaultRound =
    featured && weekendStarted(featured) && !raceFinished(featured)
      ? featured.round
      : last.round;
  const round = typeof query.round === "string" ? query.round : defaultRound;
  const calendarRace = calendar.races.find((item) => item.round === round);
  const [race, qualifying, sprint, weekend] = await Promise.all([
    fetchRaceResults(round),
    fetchQualifying(round),
    fetchSprint(round),
    fetchWeekendSessionResults({
      season: calendar.season,
      round,
    }),
  ]);
  const qualiRows = qualifying.length
    ? fromErgastQualifying(qualifying)
    : weekend.qualifying;
  const lastYear = await fetchLastYearAtCircuit(
    calendarRace?.Circuit.circuitId ?? race?.circuit.circuitId,
    calendar.season,
  );

  return (
    <>
      <PageHeading
        kicker="Official results · Jolpica"
        title={race?.raceName ?? calendarRace?.raceName ?? "Results"}
      >
        {race
          ? `${race.circuit.circuitName} · ${formatWhen(`${race.date}T12:00:00Z`)}`
          : calendarRace
            ? `${calendarRace.Circuit.circuitName} · ${calendarRace.Circuit.Location.locality}`
            : "Results are not published for this round yet."}
      </PageHeading>

      <div className="mb-2 flex flex-wrap gap-2">
        {calendar.races.map((item) => {
          const done = raceFinished(item);
          if (!weekendStarted(item) && item.round !== last.round) return null;
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

      {lastYear ? (
        <LastYearStrip data={lastYear} currentSeason={calendar.season} />
      ) : null}

      {race ? (
        <ResultTable title="Race" rows={race.results} showGrid />
      ) : null}
      {sprint.length > 0 ? (
        <ResultTable title="Sprint" rows={sprint} showGrid />
      ) : null}
      <div className="mt-6">
        <WeekendResults
          practices={weekend.practices}
          qualifying={qualiRows}
          sprintQualifying={weekend.sprintQualifying}
          sprint={sprint.length > 0 ? [] : weekend.sprint}
        />
      </div>
    </>
  );
}

function formatDelta(delta: number) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function ResultTable({
  title,
  rows,
  showGrid,
}: {
  title: string;
  rows: RaceResult[];
  showGrid?: boolean;
}) {
  const fastest = rows.find((row) => row.FastestLap?.rank === "1");
  const movers = rows
    .map((row) => ({ row, delta: placesGained(row) }))
    .filter((item): item is { row: RaceResult; delta: number } => item.delta != null);
  const best = movers.reduce<{ row: RaceResult; delta: number } | null>(
    (current, item) => {
      if (!current || item.delta > current.delta) return item;
      return current;
    },
    null,
  );
  const gainer =
    best && best.delta > 0
      ? `Biggest gainer · ${best.row.Driver.givenName} ${best.row.Driver.familyName} (${formatDelta(best.delta)})`
      : null;
  const fl =
    fastest?.FastestLap?.Time?.time
      ? `Fastest lap · ${fastest.Driver.familyName} · ${fastest.FastestLap.Time.time}`
      : null;

  return (
    <section className="panel mt-6">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-display text-xl text-foreground">{title}</h2>
        {gainer || fl ? (
          <p className="mt-1 text-xs text-muted">
            {[gainer, fl].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium">P</th>
              <th className="px-4 py-2 text-left font-medium">Driver</th>
              {showGrid ? (
                <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">
                  Grid
                </th>
              ) : null}
              {showGrid ? (
                <th className="px-4 py-2 text-right font-medium">+/-</th>
              ) : null}
              <th className="px-4 py-2 text-right font-medium">Time / status</th>
              <th className="px-4 py-2 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const delta = showGrid ? placesGained(row) : null;
              const isFastest = row.FastestLap?.rank === "1";
              return (
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
                      {isFastest ? (
                        <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          FL
                        </span>
                      ) : null}
                    </div>
                    <div className="pl-3.5 text-xs text-subtle">
                      {row.Constructor.name}
                    </div>
                  </td>
                  {showGrid ? (
                    <td className="hidden px-4 py-2.5 text-right font-mono text-subtle sm:table-cell">
                      {row.grid ?? "—"}
                    </td>
                  ) : null}
                  {showGrid ? (
                    <td
                      className={`px-4 py-2.5 text-right font-mono ${
                        delta != null && delta > 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-subtle"
                      }`}
                    >
                      {delta == null ? "—" : formatDelta(delta)}
                    </td>
                  ) : null}
                  <td className="px-4 py-2.5 text-right font-mono text-muted">
                    {row.Time?.time ?? row.status}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
