import { NextRacePanel } from "@/components/NextRacePanel";
import { TimingBoard } from "@/components/TimingBoard";
import { WeekendStrip } from "@/components/WeekendStrip";
import {
  fetchCalendar,
  fetchLastResults,
  fetchLastYearAtCircuit,
  nextUpcomingRace,
} from "@/lib/jolpica";
import { getTimingSnapshot } from "@/lib/session-snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export default async function HomePage() {
  const [initial, last, calendar] = await Promise.all([
    getTimingSnapshot(),
    fetchLastResults(),
    fetchCalendar(),
  ]);
  const upcoming = nextUpcomingRace(calendar.races);
  const lastYear = await fetchLastYearAtCircuit(
    last.circuit?.circuitId ?? upcoming?.Circuit.circuitId,
    calendar.season,
  );

  return (
    <>
      {upcoming ? <NextRacePanel race={upcoming} /> : null}
      <WeekendStrip
        last={last}
        lastYear={lastYear}
        currentSeason={calendar.season}
      />
      <TimingBoard initial={initial} />
    </>
  );
}
