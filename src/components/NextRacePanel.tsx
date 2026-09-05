import Link from "next/link";
import { RaceCountdown } from "@/components/RaceCountdown";
import { LocalTime } from "@/components/LocalTime";
import { WeekendTimetable } from "@/components/WeekendTimetable";
import { currentTime, raceDate, weekendSessions, type Race } from "@/lib/jolpica";

export function NextRacePanel({
  race,
  currentWeekend = false,
}: {
  race: Race;
  currentWeekend?: boolean;
}) {
  const start = raceDate(race);
  const now = currentTime();
  const sessions = weekendSessions(race);
  const sprintWeekend = Boolean(race.Sprint || race.SprintQualifying);

  return (
    <section className="panel mb-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            Round {race.round} · {currentWeekend ? "This weekend" : "Next race"}
            {sprintWeekend ? " · sprint" : null}
          </p>
          <h2 className="mt-1 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            {race.raceName}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {race.Circuit.circuitName} · {race.Circuit.Location.locality},{" "}
            {race.Circuit.Location.country}
          </p>
          <p className="mt-1 text-sm text-foreground">
            Lights out <LocalTime iso={start.toISOString()} />
          </p>

          {sessions.length > 0 ? <WeekendTimetable race={race} now={now} /> : null}

          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/calendar" className="text-accent hover:underline">
              Season calendar
            </Link>
          </div>
        </div>

        <div className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 sm:w-auto sm:px-5">
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-subtle">
            Time until race
          </p>
          <RaceCountdown targetIso={start.toISOString()} serverNow={now} />
        </div>
      </div>
    </section>
  );
}
