import { PredictClient } from "@/components/PredictClient";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  currentTime,
  fetchCalendar,
  fetchDriverStandings,
  fetchLastResults,
  formGuide,
  nextUpcomingRace,
  raceDate,
} from "@/lib/jolpica";
import { listPicks, scorePicks } from "@/lib/predictions";

export const dynamic = "force-dynamic";

export default async function PredictPage() {
  const [calendar, standings, last] = await Promise.all([
    fetchCalendar(),
    fetchDriverStandings(),
    fetchLastResults(),
  ]);
  const target = nextUpcomingRace(calendar.races);
  if (!target) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader current="/predict" />
        <main className="mx-auto max-w-6xl px-4 py-10 text-zinc-400">
          No upcoming race found in the current calendar.
        </main>
        <SiteFooter />
      </div>
    );
  }

  const picks = listPicks(target.season, target.round);
  const lastPicks = listPicks(last.season, last.round);
  const scored = last.round === target.round ? scorePicks(picks, last.results) : null;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader current="/predict" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <PredictClient
          initial={{
            race: target,
            locked: raceDate(target).getTime() <= currentTime(),
            drivers: standings.standings.map((row) => ({
              driverId: row.Driver.driverId,
              code: row.Driver.code,
              name: `${row.Driver.givenName} ${row.Driver.familyName}`,
              team: row.Constructors[0]?.name ?? "",
            })),
            picks,
            scored,
            lastScored: scorePicks(lastPicks, last.results),
            formGuide: formGuide(standings.standings, last.results),
            lastRace: { name: last.raceName, round: last.round, season: last.season },
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
