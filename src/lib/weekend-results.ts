import { formatGap, formatLapTime } from "@/lib/format";
import { constructorColor, type QualifyingResult, type Race } from "@/lib/jolpica";
import type { OpenF1Driver, OpenF1SessionResult } from "../../server/openf1";
import type { MeetingSession, TimingSnapshot } from "../../shared/timing";

const ALPHA = "https://api.jolpi.ca/f1/alpha";
const SESSION_CODES = ["FP1", "FP2", "FP3", "SQ", "S", "Q"] as const;

export type ClassifiedDriver = {
  position: string;
  name: string;
  teamName: string;
  teamColor: string;
  time: string | null;
  gap: string | null;
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
};

export type WeekendSessionResults = {
  practices: { code: string; label: string; rows: ClassifiedDriver[] }[];
  qualifying: ClassifiedDriver[];
  sprintQualifying: ClassifiedDriver[];
  sprint: ClassifiedDriver[];
};

type AlphaScheduleEvent = {
  round: { id: string; number: number; name: string };
  schedule: { code: string; title?: string; results_url?: string }[];
};

type AlphaResultRow = {
  position: number | string;
  position_text?: string;
  time?: string | null;
  car_number?: number;
  is_classified?: boolean;
  driver: {
    abbreviation?: string;
    given_name: string;
    family_name: string;
  };
  team: { name: string; primary_color?: string };
  components?: Record<string, unknown>;
};

const LABELS: Record<string, string> = {
  FP1: "FP1",
  FP2: "FP2",
  FP3: "FP3",
  Q: "Qualifying",
  SQ: "Sprint Qualifying",
  S: "Sprint",
};

async function alphaSoft<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const response = await fetch(`${ALPHA}${path}`, {
      next: { revalidate },
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function teamColor(hex: string | undefined, teamName: string) {
  if (hex) return hex.replace("#", "");
  return constructorColor(teamName.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
}

function componentTime(components: Record<string, unknown> | undefined, key: string) {
  const value = components?.[key];
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "time" in value) {
    const time = (value as { time?: unknown }).time;
    if (typeof time === "string" && time) return time;
  }
  return null;
}

function fromAlpha(row: AlphaResultRow): ClassifiedDriver {
  return {
    position: String(row.position_text ?? row.position),
    name: `${row.driver.given_name} ${row.driver.family_name}`,
    teamName: row.team.name,
    teamColor: teamColor(row.team.primary_color, row.team.name),
    time: row.time ?? null,
    gap: null,
    q1: componentTime(row.components, "Q1"),
    q2: componentTime(row.components, "Q2"),
    q3: componentTime(row.components, "Q3"),
  };
}

export function fromErgastQualifying(rows: QualifyingResult[]): ClassifiedDriver[] {
  return rows.map((row) => ({
    position: row.position,
    name: `${row.Driver.givenName} ${row.Driver.familyName}`,
    teamName: row.Constructor.name,
    teamColor: constructorColor(row.Constructor.constructorId),
    time: row.Q3 ?? row.Q2 ?? row.Q1 ?? null,
    gap: null,
    q1: row.Q1 ?? null,
    q2: row.Q2 ?? null,
    q3: row.Q3 ?? null,
  }));
}

export function fromTimingSnapshot(snapshot: TimingSnapshot): ClassifiedDriver[] {
  return [...snapshot.rows]
    .sort((a, b) => a.position - b.position)
    .map((row) => ({
      position: String(row.position),
      name: row.name,
      teamName: row.teamName,
      teamColor: row.teamColor,
      time: row.lastLap != null ? formatLapTime(row.lastLap) : null,
      gap: row.position === 1 ? null : formatGap(row.gapToLeader),
    }));
}

export function isQualifyingSnapshot(snapshot: TimingSnapshot) {
  const label = `${snapshot.session?.name ?? ""} ${snapshot.session?.type ?? ""}`;
  return /qualifying/i.test(label) && !/sprint/i.test(label);
}

export function meetingMatchesRace(
  meeting: { name: string; location: string; country: string } | null | undefined,
  race: Race | null | undefined,
) {
  if (!meeting || !race) return false;
  const hay = `${meeting.name} ${meeting.location} ${meeting.country}`.toLowerCase();
  return [
    race.raceName,
    race.Circuit.circuitName,
    race.Circuit.Location.locality,
    race.Circuit.Location.country,
  ].some((bit) => {
    const needle = bit.toLowerCase();
    return needle.length >= 3 && hay.includes(needle);
  });
}

export function hasClassificationTimes(rows: ClassifiedDriver[]) {
  return (
    rows.filter((row) => row.time || row.q1 || row.q2 || row.q3).length >= 3
  );
}

async function fetchAlphaRoundResults(season: string, round: string) {
  const schedule = await alphaSoft<{ data: { events: AlphaScheduleEvent[] } }>(
    `/schedules/${season}/`,
    3600,
  );
  const event = schedule?.data.events.find(
    (item) => String(item.round.number) === String(Number(round)),
  );
  if (!event) return new Map<string, ClassifiedDriver[]>();

  const jobs = event.schedule.filter(
    (item) =>
      SESSION_CODES.includes(item.code as (typeof SESSION_CODES)[number]) &&
      item.results_url,
  );
  const settled = await Promise.all(
    jobs.map(async (item) => {
      const payload = await alphaSoft<{ data: { results?: AlphaResultRow[] } }>(
        `/results/${event.round.id}/${item.code}/`,
        120,
      );
      const rows = (payload?.data.results ?? []).map(fromAlpha);
      return [item.code, rows] as const;
    }),
  );
  return new Map(settled);
}

function fromOpenF1(
  results: OpenF1SessionResult[],
  drivers: OpenF1Driver[],
): ClassifiedDriver[] {
  const byNumber = new Map(drivers.map((driver) => [driver.driver_number, driver]));
  return results
    .filter((row) => row.position != null)
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((row) => {
      const driver = byNumber.get(row.driver_number);
      const status = row.dsq ? "DSQ" : row.dns ? "DNS" : row.dnf ? "DNF" : null;
      return {
        position: String(row.position),
        name:
          driver?.full_name ||
          [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") ||
          `#${row.driver_number}`,
        teamName: driver?.team_name ?? "",
        teamColor: driver?.team_colour ?? "888888",
        time: status ?? (row.duration != null ? formatLapTime(row.duration) : null),
        gap: row.position === 1 ? null : formatGap(row.gap_to_leader),
      };
    });
}

async function cachedOpenF1<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.openf1.org${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 180 },
  });
  if (!response.ok) {
    throw new Error(`OpenF1 ${path} failed (${response.status})`);
  }
  return (await response.json()) as T;
}

async function openF1Classified(sessionKey: string | number) {
  try {
    const [results, drivers] = await Promise.all([
      cachedOpenF1<OpenF1SessionResult[]>(`/v1/session_result?session_key=${sessionKey}`),
      cachedOpenF1<OpenF1Driver[]>(`/v1/drivers?session_key=${sessionKey}`),
    ]);
    return fromOpenF1(results, drivers);
  } catch {
    return [];
  }
}

function pickSessionKey(sessions: MeetingSession[], ...names: string[]) {
  return sessions.find((session) =>
    names.some((name) => session.name.toLowerCase() === name.toLowerCase()),
  )?.key;
}

export async function fetchWeekendSessionResults({
  season,
  round,
  openF1Sessions = [],
  timingQualifying,
}: {
  season: string;
  round: string;
  openF1Sessions?: MeetingSession[];
  timingQualifying?: ClassifiedDriver[];
}): Promise<WeekendSessionResults> {
  const alpha = await fetchAlphaRoundResults(season, round);
  const sessions = openF1Sessions;

  const practiceCodes = [
    ["FP1", "Practice 1", "FP1"],
    ["FP2", "Practice 2", "FP2"],
    ["FP3", "Practice 3", "FP3"],
  ] as const;

  const practices = [];
  for (const [code, openName, label] of practiceCodes) {
    let rows = alpha.get(code) ?? [];
    if (rows.length === 0) {
      const key = pickSessionKey(sessions, openName, label);
      if (key != null) rows = await openF1Classified(key);
    }
    practices.push({ code, label, rows });
  }

  let qualifying = alpha.get("Q") ?? [];
  if (qualifying.length === 0 && timingQualifying?.length) {
    qualifying = timingQualifying;
  }
  if (qualifying.length === 0) {
    const key = pickSessionKey(sessions, "Qualifying");
    if (key != null) qualifying = await openF1Classified(key);
  }

  let sprintQualifying = alpha.get("SQ") ?? [];
  if (sprintQualifying.length === 0) {
    const key = pickSessionKey(sessions, "Sprint Qualifying", "Sprint Shootout");
    if (key != null) sprintQualifying = await openF1Classified(key);
  }

  let sprint = alpha.get("S") ?? [];
  if (sprint.length === 0) {
    const key = pickSessionKey(sessions, "Sprint");
    if (key != null) sprint = await openF1Classified(key);
  }

  return { practices, qualifying, sprintQualifying, sprint };
}
