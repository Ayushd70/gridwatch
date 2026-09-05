import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/SiteChrome";
import { LocalTime } from "@/components/LocalTime";
import { WeekendTimetable } from "@/components/WeekendTimetable";
import {
  currentTime,
  fetchCalendar,
  isCurrentWeekend,
  nextOrCurrentRace,
  raceDate,
} from "@/lib/jolpica";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const { season, races } = await fetchCalendar();
  const upcoming = nextOrCurrentRace(races);
  const now = currentTime();

  return (
    <>
      <PageHeading kicker="Season calendar · Jolpica" title={`${season} race weekends`}>
        <a href="/calendar.ics" className="font-medium text-accent hover:underline">
          Add to calendar
        </a>
      </PageHeading>
      <ul className="panel divide-y divide-border">
        {races.map((race) => {
          const start = raceDate(race);
          const isFeatured = upcoming?.round === race.round;
          const thisWeekend = isFeatured && isCurrentWeekend(race, now);
          const done = start.getTime() + 4 * 60 * 60 * 1000 < now;
          const sprintWeekend = Boolean(race.Sprint || race.SprintQualifying);
          return (
            <li
              key={`${race.season}-${race.round}`}
              className={`px-4 py-3.5 ${isFeatured ? "bg-[var(--leader)]" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-subtle">
                    <span>R{race.round}</span>
                    {thisWeekend ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent">
                        This weekend
                      </span>
                    ) : isFeatured ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent">
                        Up next
                      </span>
                    ) : done ? (
                      <span>Done</span>
                    ) : null}
                    {sprintWeekend ? <span>· sprint</span> : null}
                  </p>
                  <p className="mt-0.5 font-display text-xl tracking-tight text-foreground">
                    {race.raceName}
                  </p>
                  <p className="text-sm text-muted">
                    {race.Circuit.circuitName} · {race.Circuit.Location.locality},{" "}
                    {race.Circuit.Location.country}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {done ? (
                    <Link
                      href={`/results?round=${race.round}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Results
                    </Link>
                  ) : null}
                  <p className="font-mono text-sm text-muted">
                    <LocalTime iso={start.toISOString()} />
                  </p>
                </div>
              </div>
              {isFeatured ? <WeekendTimetable race={race} now={now} /> : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
