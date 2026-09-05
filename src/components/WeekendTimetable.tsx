import { formatIstWeekday, formatSessionWhen, istDayKey } from "@/lib/format";
import { currentTime, weekendSessions, type Race } from "@/lib/jolpica";

export function WeekendTimetable({
  race,
  now = currentTime(),
}: {
  race: Race;
  now?: number;
}) {
  const sessions = weekendSessions(race);
  const durationMs = (label: string) =>
    label === "Race" ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000;
  const live = sessions.find((session) => {
    const start = session.at.getTime();
    return now >= start && now < start + durationMs(session.label);
  });
  const next =
    live ??
    sessions.find((session) => session.at.getTime() > now) ??
    sessions.at(-1);
  const days = new Map<string, typeof sessions>();
  for (const session of sessions) {
    const key = istDayKey(session.at);
    const list = days.get(key) ?? [];
    list.push(session);
    days.set(key, list);
  }

  if (sessions.length === 0) return null;

  return (
    <ol className="mt-4 space-y-3">
      {[...days.values()].map((day) => {
        const first = day[0];
        return (
          <li key={istDayKey(first.at)}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">
              {formatIstWeekday(first.at)}
            </p>
            <ol className="mt-1.5 space-y-1">
              {day.map((session) => {
                const active = session.label === next?.label;
                const done = session.at.getTime() + durationMs(session.label) < now;
                return (
                  <li
                    key={`${session.label}-${session.at.toISOString()}`}
                    className={`flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm ${
                      active ? "bg-[var(--leader)]" : ""
                    }`}
                  >
                    <span
                      className={
                        active
                          ? "font-medium text-foreground"
                          : done
                            ? "text-subtle"
                            : "text-muted"
                      }
                    >
                      {session.label}
                      {active ? (
                        <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-accent">
                          {live?.label === session.label ? "Live" : "Next"}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-subtle">
                      {formatSessionWhen(session.at)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}
