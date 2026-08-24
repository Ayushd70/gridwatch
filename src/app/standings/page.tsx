import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  constructorColor,
  fetchConstructorStandings,
  fetchDriverStandings,
} from "@/lib/jolpica";
import { teamSwatch } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const [drivers, constructors] = await Promise.all([
    fetchDriverStandings(),
    fetchConstructorStandings(),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader current="/standings" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Official season tables · Jolpica
        </p>
        <h1 className="font-display text-4xl text-zinc-50">
          {drivers.season} championship
        </h1>
        <p className="mt-1 text-sm text-zinc-400">After round {drivers.round}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#12141b]">
            <h2 className="border-b border-white/8 px-4 py-3 font-display text-xl">
              Drivers
            </h2>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">P</th>
                  <th className="px-4 py-2 text-left font-medium">Driver</th>
                  <th className="px-4 py-2 text-right font-medium">Pts</th>
                  <th className="px-4 py-2 text-right font-medium">Wins</th>
                </tr>
              </thead>
              <tbody>
                {drivers.standings.map((row) => {
                  const team = row.Constructors[0];
                  return (
                    <tr key={row.Driver.driverId} className="border-t border-white/5">
                      <td className="px-4 py-2 font-mono text-zinc-400">{row.position}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-1.5 rounded-full"
                            style={{
                              background: teamSwatch(
                                constructorColor(team?.constructorId ?? ""),
                              ),
                            }}
                          />
                          <span>
                            {row.Driver.givenName} {row.Driver.familyName}
                          </span>
                        </div>
                        <div className="pl-3.5 text-xs text-zinc-500">{team?.name}</div>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{row.points}</td>
                      <td className="px-4 py-2 text-right font-mono text-zinc-500">
                        {row.wins}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#12141b]">
            <h2 className="border-b border-white/8 px-4 py-3 font-display text-xl">
              Constructors
            </h2>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">P</th>
                  <th className="px-4 py-2 text-left font-medium">Team</th>
                  <th className="px-4 py-2 text-right font-medium">Pts</th>
                  <th className="px-4 py-2 text-right font-medium">Wins</th>
                </tr>
              </thead>
              <tbody>
                {constructors.standings.map((row) => (
                  <tr key={row.Constructor.constructorId} className="border-t border-white/5">
                    <td className="px-4 py-2 font-mono text-zinc-400">{row.position}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-1.5 rounded-full"
                          style={{
                            background: teamSwatch(
                              constructorColor(row.Constructor.constructorId),
                            ),
                          }}
                        />
                        {row.Constructor.name}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{row.points}</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-500">
                      {row.wins}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
