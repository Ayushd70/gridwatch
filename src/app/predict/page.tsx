import type { Metadata } from "next";
import { PredictClient } from "@/components/PredictClient";
import { PageHeading } from "@/components/SiteChrome";
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

export const metadata: Metadata = { title: "Predict" };

export default async function PredictPage({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string | string[]; p2?: string | string[]; p3?: string | string[] }>;
}) {
  const query = await searchParams;
  const share = {
    p1: typeof query.p1 === "string" ? query.p1 : "",
    p2: typeof query.p2 === "string" ? query.p2 : "",
    p3: typeof query.p3 === "string" ? query.p3 : "",
  };
  const [calendar, standings, last] = await Promise.all([
    fetchCalendar(),
    fetchDriverStandings(),
    fetchLastResults(),
  ]);
  const target = nextUpcomingRace(calendar.races);
  if (!target) {
    return (
      <p className="text-muted">No upcoming race found in the current calendar.</p>
    );
  }

  const picks = listPicks(target.season, target.round);
  const lastPicks = listPicks(last.season, last.round);
  const scored = last.round === target.round ? scorePicks(picks, last.results) : null;

  const lastPodium = [1, 2, 3]
    .map((place) => last.results.find((row) => row.position === String(place))?.Driver.driverId)
    .filter((id): id is string => Boolean(id));

  return (
    <>
      <PageHeading
        kicker="Podium picks"
        title="Lock in a podium before lights out"
      >
        5 / 3 / 1 for exact P1–P3, plus a consolation point if you had them on the
        podium in the wrong slot.
      </PageHeading>
      <PredictClient
        initial={{
          race: target,
          raceKey: `${target.season}-${target.round}`,
          season: target.season,
          locked: raceDate(target).getTime() <= currentTime(),
          share,
          lastPodium: lastPodium.length === 3 ? (lastPodium as [string, string, string]) : null,
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
    </>
  );
}
