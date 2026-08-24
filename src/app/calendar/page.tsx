import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { currentTime, fetchCalendar, nextOrCurrentRace, raceDate } from "@/lib/jolpica";
import { formatWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { season, races } = await fetchCalendar();
  const upcoming = nextOrCurrentRace(races);
  const now = currentTime();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader current="/calendar" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Season calendar · Jolpica
        </p>
        <h1 className="font-display text-4xl text-zinc-50">{season} race weekends</h1>
        <ul className="mt-6 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-[#12141b]">
          {races.map((race) => {
            const start = raceDate(race);
            const isNext = upcoming?.round === race.round;
            const done = start.getTime() + 4 * 60 * 60 * 1000 < now;
            return (
              <li
                key={`${race.season}-${race.round}`}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                  isNext ? "bg-amber-400/8" : ""
                }`}
              >
                <div>
                  <p className="text-xs text-zinc-500">
                    R{race.round}
                    {isNext ? " · next" : done ? " · done" : ""}
                    {race.Sprint ? " · sprint" : ""}
                  </p>
                  <p className="text-lg text-zinc-100">{race.raceName}</p>
                  <p className="text-sm text-zinc-500">
                    {race.Circuit.circuitName} · {race.Circuit.Location.locality},{" "}
                    {race.Circuit.Location.country}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {done ? (
                    <Link
                      href={`/results?round=${race.round}`}
                      className="text-sm text-amber-300 hover:underline"
                    >
                      Results
                    </Link>
                  ) : null}
                  <p className="font-mono text-sm text-zinc-300">
                    {formatWhen(start.toISOString())}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
