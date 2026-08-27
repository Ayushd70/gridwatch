import { fetchCalendar, weekendSessions, type Race } from "@/lib/jolpica";

export const dynamic = "force-dynamic";

function icsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function icsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function durationMs(label: string) {
  if (label === "Race") return 2 * 60 * 60 * 1000;
  if (label === "Sprint") return 60 * 60 * 1000;
  return 60 * 60 * 1000;
}

function eventsForRace(race: Race) {
  return weekendSessions(race).flatMap((session) => {
    const start = session.at;
    if (Number.isNaN(start.getTime())) return [];
    const end = new Date(start.getTime() + durationMs(session.label));
    const uid = `gridwatch-${race.season}-r${race.round}-${session.label.replace(/\s+/g, "-").toLowerCase()}@gridwatch.ayushd70.dev`;
    const summary = `${race.raceName} · ${session.label}`;
    const location = `${race.Circuit.circuitName}, ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`;
    return [
      [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${icsDate(new Date())}`,
        `DTSTART:${icsDate(start)}`,
        `DTEND:${icsDate(end)}`,
        `SUMMARY:${icsText(summary)}`,
        `LOCATION:${icsText(location)}`,
        "END:VEVENT",
      ].join("\r\n"),
    ];
  });
}

export async function GET() {
  const { season, races } = await fetchCalendar();
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gridwatch//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Gridwatch ${season}`,
    ...races.flatMap(eventsForRace),
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="gridwatch-${season}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
