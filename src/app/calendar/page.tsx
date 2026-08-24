import Link from "next/link";
import { PageHeading } from "@/components/SiteChrome";
import { currentTime, fetchCalendar, nextOrCurrentRace, raceDate } from "@/lib/jolpica";
import { formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { season, races } = await fetchCalendar();
  const upcoming = nextOrCurrentRace(races);
  const now = currentTime();

  return (
    <>
      <PageHeading kicker="Season calendar · Jolpica" title={`${season} race weekends`} />
      <ul className="panel divide-y divide-border">
        {races.map((race) => {
          const start = raceDate(race);
          const isNext = upcoming?.round === race.round;
          const done = start.getTime() + 4 * 60 * 60 * 1000 < now;
          return (
            <li
              key={`${race.season}-${race.round}`}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 ${
                isNext ? "bg-[var(--leader)]" : ""
              }`}
            >
              <div>
                <p className="flex flex-wrap items-center gap-2 text-xs text-subtle">
                  <span>R{race.round}</span>
                  {isNext ? (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent">
                      Up next
                    </span>
                  ) : done ? (
                    <span>Done</span>
                  ) : null}
                  {race.Sprint ? <span>· sprint</span> : null}
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
                  {formatWhen(start.toISOString())}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
