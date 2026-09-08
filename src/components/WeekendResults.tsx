import { teamSwatch } from "@/lib/format";
import {
  hasClassificationTimes,
  type ClassifiedDriver,
} from "@/lib/weekend-results";

function hasQualiSplits(rows: ClassifiedDriver[]) {
  return rows.some((row) => row.q1 || row.q2 || row.q3);
}

export function WeekendResults({
  practices,
  qualifying,
  sprintQualifying = [],
  sprint = [],
  embedded = false,
}: {
  practices: { code: string; label: string; rows: ClassifiedDriver[] }[];
  qualifying: ClassifiedDriver[];
  sprintQualifying?: ClassifiedDriver[];
  sprint?: ClassifiedDriver[];
  embedded?: boolean;
}) {
  const practiceCards = practices.filter((item) => item.rows.length > 0);
  const qualiRows = hasClassificationTimes(qualifying) ? qualifying : [];
  const sprintQualiRows = hasClassificationTimes(sprintQualifying)
    ? sprintQualifying
    : [];
  const sprintRows = hasClassificationTimes(sprint) ? sprint : [];
  if (
    practiceCards.length === 0 &&
    qualiRows.length === 0 &&
    sprintQualiRows.length === 0 &&
    sprintRows.length === 0
  ) {
    return null;
  }

  return (
    <div className={embedded ? "space-y-3" : "mb-6 space-y-3"}>
      {practiceCards.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {practiceCards.map((session) => (
            <section
              key={session.code}
              className={embedded ? "rounded-xl bg-surface-2 p-3" : "panel p-4"}
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
                {session.label}
              </p>
              <p className="mt-1 text-xs text-muted">Top 3</p>
              <ol className="mt-3 space-y-1.5 text-sm">
                {session.rows.slice(0, 3).map((row) => (
                  <li key={`${session.code}-${row.position}-${row.name}`} className="flex gap-2">
                    <span className="w-6 font-mono text-subtle">P{row.position}</span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{row.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {row.time ?? "—"}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : null}

      {sprintQualiRows.length > 0 ? (
        <ClassificationTable
          title="Sprint Qualifying"
          rows={sprintQualiRows}
          embedded={embedded}
        />
      ) : null}
      {sprintRows.length > 0 ? (
        <ClassificationTable title="Sprint" rows={sprintRows} embedded={embedded} />
      ) : null}
      {qualiRows.length > 0 ? (
        <ClassificationTable title="Qualifying" rows={qualiRows} embedded={embedded} />
      ) : null}
    </div>
  );
}

export function ClassificationTable({
  title,
  rows,
  embedded = false,
}: {
  title: string;
  rows: ClassifiedDriver[];
  embedded?: boolean;
}) {
  const splits = hasQualiSplits(rows);
  return (
    <section
      className={embedded ? "overflow-hidden rounded-xl border border-border" : "panel"}
    >
      <h2 className="border-b border-border px-4 py-3 font-display text-xl text-foreground">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium">P</th>
              <th className="px-4 py-2 text-left font-medium">Driver</th>
              {splits ? (
                <>
                  <th className="px-4 py-2 text-right font-medium">Q1</th>
                  <th className="px-4 py-2 text-right font-medium">Q2</th>
                  <th className="px-4 py-2 text-right font-medium">Q3</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-2 text-right font-medium">Time</th>
                  <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">
                    Gap
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.position}-${row.name}`} className="border-t border-border">
                <td className="px-4 py-2.5 font-mono text-muted">{row.position}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-1.5 rounded-full"
                      style={{ background: teamSwatch(row.teamColor) }}
                    />
                    <span className="text-foreground">{row.name}</span>
                  </div>
                  {row.teamName ? (
                    <div className="pl-3.5 text-xs text-subtle">{row.teamName}</div>
                  ) : null}
                </td>
                {splits ? (
                  <>
                    <td className="px-4 py-2.5 text-right font-mono text-muted">
                      {row.q1 ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted">
                      {row.q2 ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">
                      {row.q3 ?? "—"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-right font-mono text-foreground">
                      {row.time ?? "—"}
                    </td>
                    <td className="hidden px-4 py-2.5 text-right font-mono text-muted sm:table-cell">
                      {row.gap ?? "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
