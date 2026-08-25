import type { Metadata } from "next";
import { PageHeading } from "@/components/SiteChrome";
import { formatChampionshipGap, teamSwatch } from "@/lib/format";
import {
  championshipGaps,
  constructorColor,
  fetchConstructorStandings,
  fetchDriverStandings,
} from "@/lib/jolpica";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Standings" };

export default async function StandingsPage() {
  const [drivers, constructors] = await Promise.all([
    fetchDriverStandings(),
    fetchConstructorStandings(),
  ]);

  const driverGaps = championshipGaps(drivers.standings.map((row) => row.points));
  const constructorGaps = championshipGaps(
    constructors.standings.map((row) => row.points),
  );
  const p2Gap = driverGaps[1]?.toLeader;
  const p2Label =
    p2Gap != null && p2Gap > 0
      ? `P2 is ${Number.isInteger(p2Gap) ? p2Gap : p2Gap.toFixed(1)} point${
          p2Gap === 1 ? "" : "s"
        } behind the lead.`
      : null;

  return (
    <>
      <PageHeading kicker="Official season tables · Jolpica" title={`${drivers.season} championship`}>
        After round {drivers.round}
        {p2Label ? <p className="mt-1">{p2Label}</p> : null}
      </PageHeading>

      <div className="grid gap-6 lg:grid-cols-2">
        <StandingsTable
          title="Drivers"
          rows={drivers.standings.map((row, index) => {
            const team = row.Constructors[0];
            const gaps = driverGaps[index] ?? { toLeader: 0, interval: 0 };
            return {
              key: row.Driver.driverId,
              position: row.position,
              name: `${row.Driver.givenName} ${row.Driver.familyName}`,
              sub: team?.name,
              color: constructorColor(team?.constructorId ?? ""),
              points: row.points,
              wins: row.wins,
              leader: formatChampionshipGap(gaps.toLeader, "leader"),
              interval: formatChampionshipGap(gaps.interval, "interval"),
            };
          })}
        />
        <StandingsTable
          title="Constructors"
          rows={constructors.standings.map((row, index) => {
            const gaps = constructorGaps[index] ?? { toLeader: 0, interval: 0 };
            return {
              key: row.Constructor.constructorId,
              position: row.position,
              name: row.Constructor.name,
              color: constructorColor(row.Constructor.constructorId),
              points: row.points,
              wins: row.wins,
              leader: formatChampionshipGap(gaps.toLeader, "leader"),
              interval: formatChampionshipGap(gaps.interval, "interval"),
            };
          })}
        />
      </div>
    </>
  );
}

function StandingsTable({
  title,
  rows,
}: {
  title: string;
  rows: {
    key: string;
    position: string;
    name: string;
    sub?: string;
    color: string;
    points: string;
    wins: string;
    leader: string;
    interval: string;
  }[];
}) {
  return (
    <section className="panel">
      <h2 className="border-b border-border px-4 py-3 font-display text-xl text-foreground">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium">P</th>
              <th className="px-4 py-2 text-left font-medium">
                {title === "Drivers" ? "Driver" : "Team"}
              </th>
              <th className="px-4 py-2 text-right font-medium">Pts</th>
              <th className="px-4 py-2 text-right font-medium">Leader</th>
              <th className="px-4 py-2 text-right font-medium">Int.</th>
              <th className="px-4 py-2 text-right font-medium">Wins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-border">
                <td className="px-4 py-2.5 font-mono text-muted">{row.position}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-1.5 rounded-full"
                      style={{ background: teamSwatch(row.color) }}
                    />
                    <span className="text-foreground">{row.name}</span>
                  </div>
                  {row.sub ? (
                    <div className="pl-3.5 text-xs text-subtle">{row.sub}</div>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">
                  {row.points}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-subtle">
                  {row.leader}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-subtle">
                  {row.interval}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-subtle">
                  {row.wins}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
