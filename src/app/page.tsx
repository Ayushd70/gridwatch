import { NextRacePanel } from "@/components/NextRacePanel";
import { TimingBoard } from "@/components/TimingBoard";
import { WeekendStrip } from "@/components/WeekendStrip";
import {
  fetchCalendar,
  fetchLastResults,
  fetchLastYearAtCircuit,
  isCurrentWeekend,
  nextOrCurrentRace,
} from "@/lib/jolpica";
import { getTimingSnapshot } from "@/lib/session-snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  const query = await searchParams;
  const sessionKey = typeof query.session === "string" ? query.session : undefined;
  const [initial, last, calendar] = await Promise.all([
    getTimingSnapshot(sessionKey),
    fetchLastResults(),
    fetchCalendar(),
  ]);
  const featured = nextOrCurrentRace(calendar.races);
  const lastYear = await fetchLastYearAtCircuit(
    last.circuit?.circuitId ?? featured?.Circuit.circuitId,
    calendar.season,
  );
  const currentWeekend = Boolean(featured && isCurrentWeekend(featured));

  return (
    <>
      {featured ? (
        <NextRacePanel race={featured} currentWeekend={currentWeekend} />
      ) : null}
      <WeekendStrip
        last={last}
        lastYear={lastYear}
        currentSeason={calendar.season}
      />
      <TimingBoard initial={initial} sessionKey={sessionKey} />
    </>
  );
}
