import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
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
    <div className="flex min-h-full flex-col">
      <SiteHeader current="/results" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Official results · Jolpica
        </p>
        <h1 className="font-display text-4xl text-zinc-50">
          {race?.raceName ?? "Results"}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {race
            ? `${race.circuit.circuitName} · ${formatWhen(`${race.date}T12:00:00Z`)}`
            : "Results are not published for this round yet."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {calendar.races.map((item) => {
            const done = raceDate(item).getTime() + 4 * 60 * 60 * 1000 < currentTime();
            if (!done && item.round !== last.round) return null;
            const active = item.round === round;
            return (
              <Link
                key={item.round}
                href={`/results?round=${item.round}`}
                className={`rounded-full px-3 py-1 text-xs ${
                  active
                    ? "bg-amber-400/15 text-amber-300"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-100"
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
      </main>
      <SiteFooter />
    </div>
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
    <section className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-[#12141b]">
      <h2 className="border-b border-white/8 px-4 py-3 font-display text-xl">{title}</h2>
      <table className="w-full text-sm">
        <thead className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          <tr>
            <th className="px-4 py-2 text-left font-medium">P</th>
            <th className="px-4 py-2 text-left font-medium">Driver</th>
            {kind === "race" ? (
              <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">Grid</th>
            ) : null}
            <th className="px-4 py-2 text-right font-medium">Time / status</th>
            <th className="px-4 py-2 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.Driver.driverId}-${row.position}`} className="border-t border-white/5">
              <td className="px-4 py-2 font-mono text-zinc-400">{row.positionText ?? row.position}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1.5 rounded-full"
                    style={{ background: teamSwatch(constructorColor(row.Constructor.constructorId)) }}
                  />
                  {row.Driver.givenName} {row.Driver.familyName}
                </div>
                <div className="pl-3.5 text-xs text-zinc-500">{row.Constructor.name}</div>
              </td>
              {kind === "race" ? (
                <td className="hidden px-4 py-2 text-right font-mono text-zinc-500 sm:table-cell">
                  {row.grid ?? "—"}
                </td>
              ) : null}
              <td className="px-4 py-2 text-right font-mono text-zinc-300">
                {row.Time?.time ?? row.status}
              </td>
              <td className="px-4 py-2 text-right font-mono">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function QualiTable({ rows }: { rows: QualifyingResult[] }) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-[#12141b]">
      <h2 className="border-b border-white/8 px-4 py-3 font-display text-xl">Qualifying</h2>
      <table className="w-full text-sm">
        <thead className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
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
            <tr key={row.Driver.driverId} className="border-t border-white/5">
              <td className="px-4 py-2 font-mono text-zinc-400">{row.position}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1.5 rounded-full"
                    style={{ background: teamSwatch(constructorColor(row.Constructor.constructorId)) }}
                  />
                  {row.Driver.givenName} {row.Driver.familyName}
                </div>
              </td>
              <td className="px-4 py-2 text-right font-mono text-zinc-300">{row.Q1 ?? "—"}</td>
              <td className="px-4 py-2 text-right font-mono text-zinc-300">{row.Q2 ?? "—"}</td>
              <td className="px-4 py-2 text-right font-mono text-zinc-100">{row.Q3 ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
