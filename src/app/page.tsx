import { NextRacePanel } from "@/components/NextRacePanel";
import { TimingBoard } from "@/components/TimingBoard";
import { WeekendResults } from "@/components/WeekendResults";
import { LastRaceCard } from "@/components/WeekendStrip";
import { LastYearStrip } from "@/components/LastYearStrip";
import {
  fetchCalendar,
  fetchLastResults,
  fetchLastYearAtCircuit,
  isCurrentWeekend,
  nextOrCurrentRace,
} from "@/lib/jolpica";
import { getTimingSnapshot } from "@/lib/session-snapshot";
import {
  fetchWeekendSessionResults,
  fromTimingSnapshot,
  isQualifyingSnapshot,
} from "@/lib/weekend-results";

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
  const [lastYear, weekendResults] = await Promise.all([
    fetchLastYearAtCircuit(
      featured?.Circuit.circuitId ?? last.circuit?.circuitId,
      calendar.season,
    ),
    featured
      ? fetchWeekendSessionResults({
          season: calendar.season,
          round: featured.round,
          openF1Sessions: initial.meetingSessions,
          timingQualifying: isQualifyingSnapshot(initial)
            ? fromTimingSnapshot(initial)
            : undefined,
        })
      : null,
  ]);
  const currentWeekend = Boolean(featured && isCurrentWeekend(featured));

  return (
    <>
      {featured ? (
        <NextRacePanel race={featured} currentWeekend={currentWeekend} />
      ) : null}
      {weekendResults ? <WeekendResults {...weekendResults} /> : null}
      {lastYear ? (
        <div className="mb-6">
          <LastYearStrip
            data={lastYear}
            currentSeason={calendar.season}
            variant="card"
          />
        </div>
      ) : null}
      <TimingBoard
        initial={initial}
        sessionKey={sessionKey}
        fallbackMeeting={
          featured
            ? {
                name: featured.raceName,
                location: featured.Circuit.Location.locality,
                country: featured.Circuit.Location.country,
              }
            : undefined
        }
      />
      <LastRaceCard last={last} />
    </>
  );
}
