export type TimingMode = "live" | "replay" | "idle";
export type TimingSource = "mqtt" | "rest" | "fixture";

export type TimingRow = {
  driverNumber: number;
  position: number;
  name: string;
  acronym: string;
  teamName: string;
  teamColor: string;
  lastLap: number | null;
  sectors: [number | null, number | null, number | null];
  gapToLeader: number | string | null;
  interval: number | string | null;
  tyre: string | null;
  lapNumber: number | null;
  pitCount: number;
  lastPit: number | null;
};

export type ChampionshipRow = {
  driverNumber: number;
  name: string;
  acronym: string;
  teamName: string;
  teamColor: string;
  pointsCurrent: number;
  pointsStart: number;
  positionCurrent: number;
  positionStart: number;
};

export type TeamChampionshipRow = {
  teamName: string;
  teamColor: string;
  pointsCurrent: number;
  pointsStart: number;
  positionCurrent: number;
  positionStart: number;
};

export type RaceControlItem = {
  date: string | null;
  flag: string | null;
  message: string;
  category: string | null;
};

export type WeatherState = {
  airTemp: number | null;
  trackTemp: number | null;
  humidity: number | null;
  rainfall: number | null;
  windSpeed: number | null;
};

export type TimingSnapshot = {
  mode: TimingMode;
  source: TimingSource;
  authenticated: boolean;
  restricted: boolean;
  notice: string | null;
  meeting: {
    name: string;
    location: string;
    country: string;
    year: number;
  } | null;
  session: {
    key: number | string;
    name: string;
    type: string;
    dateStart: string | null;
  } | null;
  lap: {
    current: number;
    total: number | null;
  } | null;
  trackStatus: string | null;
  lastFlag: string | null;
  weather: WeatherState | null;
  raceControl: RaceControlItem[];
  rows: TimingRow[];
  championship: ChampionshipRow[];
  teams: TeamChampionshipRow[];
  updatedAt: string;
};

export function emptySnapshot(
  partial: Partial<TimingSnapshot> = {},
): TimingSnapshot {
  return {
    mode: "idle",
    source: "rest",
    authenticated: false,
    restricted: false,
    notice: null,
    meeting: null,
    session: null,
    lap: null,
    trackStatus: null,
    lastFlag: null,
    weather: null,
    raceControl: [],
    rows: [],
    championship: [],
    teams: [],
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}
