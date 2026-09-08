import { NextRacePanel } from "@/components/NextRacePanel";
import { TimingBoard } from "@/components/TimingBoard";
import { WeekendResults } from "@/components/WeekendResults";
import { LastRaceCard } from "@/components/WeekendStrip";
import { LastYearStrip } from "@/components/LastYearStrip";
import {
  fetchCalendar,
  fetchLastYearAtCircuit,
  fetchQualifying,
  isCurrentWeekend,
  nextOrCurrentRace,
  resolveLastRace,
} from "@/lib/jolpica";
import { getTimingSnapshot } from "@/lib/session-snapshot";
import {
  fetchWeekendSessionResults,
  fromErgastQualifying,
  fromTimingSnapshot,
  isQualifyingSnapshot,
  meetingMatchesRace,
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
  const [initial, calendar] = await Promise.all([
    getTimingSnapshot(sessionKey),
    fetchCalendar(),
  ]);
  const featured = nextOrCurrentRace(calendar.races);
  const last = await resolveLastRace(calendar.races);
  const currentWeekend = Boolean(featured && isCurrentWeekend(featured));
  const lastCalendar = calendar.races.find((race) => race.round === last.round);
  const weekendRace = currentWeekend ? featured : lastCalendar;
  const attachOpenF1 = meetingMatchesRace(initial.meeting, weekendRace);
  const [lastYear, weekendResults, officialQuali] = await Promise.all([
    fetchLastYearAtCircuit(
      featured?.Circuit.circuitId ?? last.circuit?.circuitId,
      calendar.season,
    ),
    weekendRace
      ? fetchWeekendSessionResults({
          season: calendar.season,
          round: weekendRace.round,
          openF1Sessions: attachOpenF1 ? initial.meetingSessions : [],
          timingQualifying:
            attachOpenF1 && isQualifyingSnapshot(initial)
              ? fromTimingSnapshot(initial)
              : undefined,
        })
      : null,
    weekendRace ? fetchQualifying(weekendRace.round) : Promise.resolve([]),
  ]);
  const weekend =
    weekendResults == null
      ? null
      : {
          ...weekendResults,
          qualifying: officialQuali.length
            ? fromErgastQualifying(officialQuali)
            : weekendResults.qualifying,
        };

  return (
    <>
      {featured ? (
        <NextRacePanel race={featured} currentWeekend={currentWeekend} />
      ) : null}
      {currentWeekend && weekend ? <WeekendResults {...weekend} /> : null}
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
          initial.meeting
            ? {
                name: initial.meeting.name,
                location: initial.meeting.location,
                country: initial.meeting.country,
              }
            : currentWeekend && featured
              ? {
                  name: featured.raceName,
                  location: featured.Circuit.Location.locality,
                  country: featured.Circuit.Location.country,
                }
              : lastCalendar
                ? {
                    name: lastCalendar.raceName,
                    location: lastCalendar.Circuit.Location.locality,
                    country: lastCalendar.Circuit.Location.country,
                  }
                : undefined
        }
      />
      <LastRaceCard last={last}>
        {!currentWeekend && weekend ? (
          <WeekendResults {...weekend} embedded />
        ) : null}
      </LastRaceCard>
    </>
  );
}
