import {
  emptySnapshot,
  type ChampionshipRow,
  type RaceControlItem,
  type TeamChampionshipRow,
  type TimingRow,
  type MeetingSession,
  type TimingSnapshot,
  type TimingSource,
  type WeatherState,
} from "../shared/timing";
import type {
  OpenF1Championship,
  OpenF1Driver,
  OpenF1Interval,
  OpenF1Lap,
  OpenF1Meeting,
  OpenF1Pit,
  OpenF1Position,
  OpenF1RaceControl,
  OpenF1Session,
  OpenF1SessionResult,
  OpenF1Stint,
  OpenF1TeamChampionship,
  OpenF1Weather,
} from "./openf1";

type DriverState = {
  driverNumber: number;
  position: number | null;
  lastLap: number | null;
  sectors: [number | null, number | null, number | null];
  gapToLeader: number | string | null;
  interval: number | string | null;
  tyre: string | null;
  lapNumber: number | null;
  pitCount: number;
  lastPit: number | null;
  name: string;
  acronym: string;
  teamName: string;
  teamColor: string;
};

function latestBy<T>(
  items: T[],
  key: (item: T) => string | number,
  time: (item: T) => string | number | undefined,
): Map<string | number, T> {
  const map = new Map<string | number, T>();
  for (const item of items) {
    const id = key(item);
    const current = map.get(id);
    if (!current) {
      map.set(id, item);
      continue;
    }
    const nextTime = time(item);
    const prevTime = time(current);
    if (nextTime == null) continue;
    if (prevTime == null || isLater(nextTime, prevTime)) {
      map.set(id, item);
    }
  }
  return map;
}

/** Numeric fields must not be compared as strings ("9" > "72"). */
function isLater(
  next: string | number,
  prev: string | number,
): boolean {
  const a = sortable(next);
  const b = sortable(prev);
  if (typeof a === "number" && typeof b === "number") return a >= b;
  return String(next) >= String(prev);
}

function sortable(value: string | number): string | number {
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (trimmed !== "" && !/[T:-]/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric;
  }
  return value;
}

export class TimingStore {
  private snapshot: TimingSnapshot = emptySnapshot();
  private drivers = new Map<number, DriverState>();
  private championship = new Map<number, ChampionshipRow>();
  private teams = new Map<string, TeamChampionshipRow>();
  private pits: OpenF1Pit[] = [];
  private weather: WeatherState | null = null;
  private session: OpenF1Session | null = null;
  private meeting: OpenF1Meeting | null = null;
  private meetingSessions: MeetingSession[] = [];
  private listeners = new Set<(snapshot: TimingSnapshot) => void>();
  private emitTimer: ReturnType<typeof setTimeout> | null = null;

  get(): TimingSnapshot {
    return this.snapshot;
  }

  subscribe(fn: (snapshot: TimingSnapshot) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  setMeta(partial: Partial<TimingSnapshot>) {
    this.snapshot = { ...this.snapshot, ...partial, updatedAt: new Date().toISOString() };
    this.queueEmit();
  }

  applySession(session: OpenF1Session, source: TimingSource) {
    if (this.session && this.session.session_key !== session.session_key) {
      this.resetTiming();
    }
    this.session = session;
    this.rebuild(source);
  }

  applyMeeting(meeting: OpenF1Meeting, source: TimingSource) {
    this.meeting = meeting;
    this.rebuild(source);
  }

  applyMeetingSessions(sessions: OpenF1Session[], source: TimingSource) {
    this.meetingSessions = [...sessions]
      .sort(
        (a, b) => Date.parse(a.date_start) - Date.parse(b.date_start),
      )
      .map((item) => ({
        key: item.session_key,
        name: item.session_name,
        type: item.session_type,
      }));
    this.rebuild(source);
  }

  applyDrivers(drivers: OpenF1Driver[], source: TimingSource) {
    for (const driver of drivers) {
      const row = this.ensure(driver.driver_number);
      const name = displayName(driver);
      if (name) row.name = name;
      if (driver.name_acronym) row.acronym = driver.name_acronym;
      if (driver.team_name) row.teamName = driver.team_name;
      row.teamColor = normalizeColor(driver.team_colour) ?? row.teamColor;
    }
    this.rebuild(source);
  }

  applyPositions(positions: OpenF1Position[], source: TimingSource) {
    const latest = latestBy(
      positions,
      (item) => item.driver_number,
      (item) => item.date,
    );
    for (const item of latest.values()) {
      const row = this.ensure(item.driver_number);
      row.position = item.position;
    }
    this.rebuild(source);
  }

  applySessionResults(results: OpenF1SessionResult[], source: TimingSource) {
    let maxLaps = 0;
    const classified = results
      .filter((item) => item.position != null)
      .sort((a, b) => Number(a.position) - Number(b.position));
    const others = results.filter((item) => item.position == null);
    for (const item of classified) {
      const row = this.ensure(item.driver_number);
      row.position = item.position;
      row.gapToLeader = item.gap_to_leader ?? row.gapToLeader;
      row.lapNumber = item.number_of_laps ?? row.lapNumber;
      if (item.number_of_laps) maxLaps = Math.max(maxLaps, item.number_of_laps);
    }
    let next = classified.length + 1;
    for (const item of others) {
      const row = this.ensure(item.driver_number);
      row.position = next;
      next += 1;
      row.lapNumber = item.number_of_laps ?? row.lapNumber;
      row.gapToLeader = item.dsq ? "DSQ" : item.dns ? "DNS" : "DNF";
    }
    if (maxLaps) {
      this.snapshot = {
        ...this.snapshot,
        lap: { current: maxLaps, total: maxLaps },
      };
    }
    this.rebuild(source);
  }

  applyIntervals(intervals: OpenF1Interval[], source: TimingSource) {
    const latest = latestBy(
      intervals,
      (item) => item.driver_number,
      (item) => item.date,
    );
    for (const item of latest.values()) {
      const row = this.ensure(item.driver_number);
      row.gapToLeader = item.gap_to_leader ?? row.gapToLeader;
      row.interval = item.interval ?? row.interval;
    }
    this.rebuild(source);
  }

  applyLaps(laps: OpenF1Lap[], source: TimingSource) {
    const grouped = new Map<number, OpenF1Lap[]>();
    for (const item of laps) {
      const list = grouped.get(item.driver_number);
      if (list) list.push(item);
      else grouped.set(item.driver_number, [item]);
    }
    for (const [driverNumber, items] of grouped) {
      const row = this.ensure(driverNumber);
      let maxLap = row.lapNumber ?? 0;
      let lastCompleted: OpenF1Lap | null = null;
      for (const item of items) {
        if (item.lap_number != null && item.lap_number > maxLap) {
          maxLap = item.lap_number;
        }
        if (item.lap_duration == null) continue;
        if (
          !lastCompleted ||
          (item.lap_number ?? 0) >= (lastCompleted.lap_number ?? 0)
        ) {
          lastCompleted = item;
        }
      }
      if (maxLap) row.lapNumber = maxLap;
      if (lastCompleted) {
        row.lastLap = lastCompleted.lap_duration ?? row.lastLap;
        row.sectors = [
          lastCompleted.duration_sector_1 ?? row.sectors[0],
          lastCompleted.duration_sector_2 ?? row.sectors[1],
          lastCompleted.duration_sector_3 ?? row.sectors[2],
        ];
      }
    }
    this.rebuild(source);
  }

  applyStints(stints: OpenF1Stint[], source: TimingSource) {
    const latest = latestBy(
      stints,
      (item) => item.driver_number,
      (item) => item.stint_number ?? item.lap_start,
    );
    for (const item of latest.values()) {
      const row = this.ensure(item.driver_number);
      row.tyre = item.compound ?? row.tyre;
    }
    this.rebuild(source);
  }

  applyPits(pits: OpenF1Pit[], source: TimingSource, replace = false) {
    if (replace) this.pits = [...pits];
    else {
      for (const pit of pits) {
        const dup = this.pits.some(
          (item) =>
            item.driver_number === pit.driver_number && item.date === pit.date,
        );
        if (!dup) this.pits.push(pit);
      }
    }
    const counts = new Map<number, { count: number; last: number | null }>();
    for (const pit of this.pits) {
      const current = counts.get(pit.driver_number) ?? { count: 0, last: null };
      current.count += 1;
      if (pit.pit_duration != null) current.last = pit.pit_duration;
      counts.set(pit.driver_number, current);
    }
    for (const [driverNumber, stats] of counts) {
      const row = this.ensure(driverNumber);
      row.pitCount = stats.count;
      row.lastPit = stats.last;
    }
    this.rebuild(source);
  }

  applyWeather(samples: OpenF1Weather[], source: TimingSource) {
    const latest = [...samples].sort((a, b) =>
      String(a.date ?? "").localeCompare(String(b.date ?? "")),
    ).at(-1);
    if (!latest) return;
    this.weather = {
      airTemp: latest.air_temperature ?? null,
      trackTemp: latest.track_temperature ?? null,
      humidity: latest.humidity ?? null,
      rainfall: latest.rainfall ?? null,
      windSpeed: latest.wind_speed ?? null,
    };
    this.rebuild(source);
  }

  applyRaceControl(messages: OpenF1RaceControl[], source: TimingSource) {
    const sorted = [...messages].sort((a, b) =>
      String(a.date ?? "").localeCompare(String(b.date ?? "")),
    );
    const items: RaceControlItem[] = sorted
      .slice(-10)
      .map((item) => ({
        date: item.date ?? null,
        flag: item.flag ?? null,
        message: item.message ?? "",
        category: item.category ?? null,
      }))
      .filter((item) => item.message || item.flag);
    const last = [...sorted].reverse().find((item) => item.flag || item.message);
    this.snapshot = {
      ...this.snapshot,
      raceControl: items,
      lastFlag: last?.flag ?? this.snapshot.lastFlag,
      trackStatus: last?.category ?? last?.flag ?? this.snapshot.trackStatus,
    };
    this.rebuild(source);
  }

  applyChampionship(rows: OpenF1Championship[], source: TimingSource) {
    for (const item of rows) {
      const driver = this.drivers.get(item.driver_number);
      this.championship.set(item.driver_number, {
        driverNumber: item.driver_number,
        name: driver?.name ?? `#${item.driver_number}`,
        acronym: driver?.acronym ?? String(item.driver_number),
        teamName: driver?.teamName ?? "",
        teamColor: driver?.teamColor ?? "888888",
        pointsCurrent: item.points_current ?? 0,
        pointsStart: item.points_start ?? 0,
        positionCurrent: item.position_current ?? 0,
        positionStart: item.position_start ?? 0,
      });
    }
    this.rebuild(source);
  }

  applyTeamChampionship(rows: OpenF1TeamChampionship[], source: TimingSource) {
    for (const item of rows) {
      const color =
        [...this.drivers.values()].find((driver) => driver.teamName === item.team_name)
          ?.teamColor ?? "888888";
      this.teams.set(item.team_name, {
        teamName: item.team_name,
        teamColor: color,
        pointsCurrent: item.points_current ?? 0,
        pointsStart: item.points_start ?? 0,
        positionCurrent: item.position_current ?? 0,
        positionStart: item.position_start ?? 0,
      });
    }
    this.rebuild(source);
  }

  replaceSnapshot(snapshot: TimingSnapshot) {
    this.snapshot = { ...snapshot, updatedAt: new Date().toISOString() };
    this.queueEmit();
  }

  private ensure(driverNumber: number): DriverState {
    const existing = this.drivers.get(driverNumber);
    if (existing) return existing;
    const created: DriverState = {
      driverNumber,
      position: null,
      lastLap: null,
      sectors: [null, null, null],
      gapToLeader: null,
      interval: null,
      tyre: null,
      lapNumber: null,
      pitCount: 0,
      lastPit: null,
      name: `#${driverNumber}`,
      acronym: String(driverNumber),
      teamName: "",
      teamColor: "888888",
    };
    this.drivers.set(driverNumber, created);
    return created;
  }

  private rebuild(source: TimingSource) {
    const rows: TimingRow[] = [...this.drivers.values()]
      .filter((row) => row.position != null)
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
      .map((row) => ({
        driverNumber: row.driverNumber,
        position: row.position ?? 99,
        name: row.name,
        acronym: row.acronym,
        teamName: row.teamName,
        teamColor: row.teamColor,
        lastLap: row.lastLap,
        sectors: row.sectors,
        gapToLeader: row.gapToLeader,
        interval: row.interval,
        tyre: row.tyre,
        lapNumber: row.lapNumber,
        pitCount: row.pitCount,
        lastPit: row.lastPit,
      }));

    const currentLap = rows.reduce(
      (max, row) => Math.max(max, row.lapNumber ?? 0),
      0,
    );
    const sessionEnded =
      this.session?.date_end != null &&
      Date.parse(this.session.date_end) < Date.now();
    const totalLaps = this.snapshot.lap?.total ?? (currentLap || null);
    const displayLap =
      sessionEnded && totalLaps
        ? Math.max(currentLap, totalLaps)
        : currentLap;

    const championship = [...this.championship.values()]
      .map((row) => {
        const driver = this.drivers.get(row.driverNumber);
        return driver
          ? {
              ...row,
              name: driver.name,
              acronym: driver.acronym,
              teamName: driver.teamName,
              teamColor: driver.teamColor,
            }
          : row;
      })
      .sort((a, b) => a.positionCurrent - b.positionCurrent);

    const teams = [...this.teams.values()]
      .map((row) => {
        const color =
          [...this.drivers.values()].find((driver) => driver.teamName === row.teamName)
            ?.teamColor ?? row.teamColor;
        return { ...row, teamColor: color };
      })
      .sort((a, b) => a.positionCurrent - b.positionCurrent);

    const now = Date.now();
    const start = this.session?.date_start
      ? Date.parse(this.session.date_start) - 30 * 60 * 1000
      : null;
    const end = this.session?.date_end
      ? Date.parse(this.session.date_end) + 30 * 60 * 1000
      : start
        ? start + 5 * 60 * 60 * 1000
        : null;
    let mode: TimingSnapshot["mode"] = "idle";
    if (this.session && start != null && end != null) {
      mode = now >= start && now <= end ? "live" : "replay";
    } else if (rows.length) {
      mode = source === "mqtt" ? "live" : "replay";
    }

    this.snapshot = {
      ...this.snapshot,
      source,
      mode,
      weather: this.weather ?? this.snapshot.weather,
      meetingSessions: this.meetingSessions.length
        ? this.meetingSessions
        : this.snapshot.meetingSessions,
      teams,
      meeting: this.meeting
        ? {
            name: this.meeting.meeting_name,
            location: this.meeting.location ?? "",
            country: this.meeting.country_name ?? "",
            year: this.meeting.year ?? new Date().getFullYear(),
          }
        : this.session
          ? {
              name: this.session.circuit_short_name ?? this.session.location ?? "Session",
              location: this.session.location ?? "",
              country: this.session.country_name ?? "",
              year: this.session.year ?? new Date().getFullYear(),
            }
          : this.snapshot.meeting,
      session: this.session
        ? {
            key: this.session.session_key,
            name: this.session.session_name,
            type: this.session.session_type,
            dateStart: this.session.date_start,
          }
        : this.snapshot.session,
      lap: displayLap
        ? {
            current: displayLap,
            total: totalLaps,
          }
        : this.snapshot.lap,
      rows,
      championship,
      updatedAt: new Date().toISOString(),
    };
    this.queueEmit();
  }

  private resetTiming() {
    this.drivers.clear();
    this.championship.clear();
    this.teams.clear();
    this.pits = [];
    this.weather = null;
    const { authenticated, restricted, notice } = this.snapshot;
    this.snapshot = emptySnapshot({
      authenticated,
      restricted,
      notice,
      meetingSessions: this.meetingSessions,
    });
  }

  private queueEmit() {
    if (this.emitTimer) return;
    this.emitTimer = setTimeout(() => {
      this.emitTimer = null;
      const snapshot = this.snapshot;
      for (const listener of this.listeners) listener(snapshot);
    }, 200);
  }
}

function displayName(driver: OpenF1Driver) {
  const first = driver.first_name?.trim();
  const last = driver.last_name?.trim();
  if (first && last) return `${first} ${last}`;
  if (driver.full_name?.trim()) return titleLastName(driver.full_name.trim());
  if (driver.broadcast_name?.trim()) return titleLastName(driver.broadcast_name.trim());
  return "";
}

function titleLastName(value: string) {
  return value.replace(/\b([A-Z]{2,})\b/g, (word) => word[0] + word.slice(1).toLowerCase());
}

function normalizeColor(value?: string) {
  if (!value) return null;
  return value.replace("#", "").toUpperCase();
}
