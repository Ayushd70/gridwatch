import Link from "next/link";
import { RaceCountdown } from "@/components/RaceCountdown";
import { formatSessionWhen, formatWhen } from "@/lib/format";
import {
  currentTime,
  raceDate,
  weekendSessions,
  type Race,
} from "@/lib/jolpica";

export function NextRacePanel({ race }: { race: Race }) {
  const start = raceDate(race);
  const sessions = weekendSessions(race);
  const now = currentTime();
  const nextSession =
    sessions.find((session) => session.at.getTime() > now) ?? sessions.at(-1);

  return (
    <section className="panel mb-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            Round {race.round} · Next race
          </p>
          <h2 className="mt-1 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            {race.raceName}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {race.Circuit.circuitName} · {race.Circuit.Location.locality},{" "}
            {race.Circuit.Location.country}
          </p>
          <p className="mt-1 text-sm text-foreground">
            Lights out {formatWhen(start.toISOString())}
          </p>

          {sessions.length > 0 ? (
            <ol className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
              {sessions.map((session) => {
                const active = session.label === nextSession?.label;
                return (
                  <li
                    key={`${session.label}-${session.at.toISOString()}`}
                    className={`flex items-baseline justify-between gap-3 rounded-lg px-2 py-1 ${
                      active ? "bg-[var(--leader)]" : ""
                    }`}
                  >
                    <span
                      className={active ? "text-foreground" : "text-muted"}
                    >
                      {session.label}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-subtle">
                      {formatSessionWhen(session.at)}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/calendar" className="text-accent hover:underline">
              Season calendar
            </Link>
            <Link href="/predict" className="text-accent hover:underline">
              Podium pick
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
