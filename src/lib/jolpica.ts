const JOLPICA = "https://api.jolpi.ca/ergast/f1";

export type JolpicaDriver = {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  givenName: string;
  familyName: string;
  nationality?: string;
};

export type JolpicaConstructor = {
  constructorId: string;
  name: string;
  nationality?: string;
};

export type DriverStanding = {
  position: string;
  points: string;
  wins: string;
  Driver: JolpicaDriver;
  Constructors: JolpicaConstructor[];
};

export type ConstructorStanding = {
  position: string;
  points: string;
  wins: string;
  Constructor: JolpicaConstructor;
};

export type Race = {
  season: string;
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: {
    circuitName: string;
    Location: { locality: string; country: string };
  };
  Qualifying?: { date: string; time?: string };
  Sprint?: { date: string; time?: string };
};

export type RaceResult = {
  position: string;
  positionText?: string;
  points: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  grid?: string;
  laps?: string;
  status: string;
  Time?: { time: string; millis?: string };
  FastestLap?: { rank?: string; lap?: string; Time?: { time: string } };
};

export type QualifyingResult = {
  position: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
};

async function jolpicaOptional<T>(path: string): Promise<T | null> {
  const response = await fetch(`${JOLPICA}${path}`, {
    next: { revalidate: 120 },
    headers: { accept: "application/json" },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Jolpica ${path} failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

async function jolpica<T>(path: string): Promise<T> {
  const response = await fetch(`${JOLPICA}${path}`, {
    next: { revalidate: 120 },
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Jolpica ${path} failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchDriverStandings() {
  const data = await jolpica<{
    MRData: {
      StandingsTable: {
        season: string;
        round: string;
        StandingsLists: { DriverStandings: DriverStanding[] }[];
      };
    };
  }>("/current/driverstandings/?limit=100");
  const table = data.MRData.StandingsTable;
  return {
    season: table.season,
    round: table.round,
    standings: table.StandingsLists[0]?.DriverStandings ?? [],
  };
}

export async function fetchConstructorStandings() {
  const data = await jolpica<{
    MRData: {
      StandingsTable: {
        season: string;
        round: string;
        StandingsLists: { ConstructorStandings: ConstructorStanding[] }[];
      };
    };
  }>("/current/constructorstandings/?limit=100");
  const table = data.MRData.StandingsTable;
  return {
    season: table.season,
    round: table.round,
    standings: table.StandingsLists[0]?.ConstructorStandings ?? [],
  };
}

export async function fetchCalendar() {
  const data = await jolpica<{
    MRData: { RaceTable: { season: string; Races: Race[] } };
  }>("/current/races/?limit=100");
  return {
    season: data.MRData.RaceTable.season,
    races: data.MRData.RaceTable.Races,
  };
}

export async function fetchLastResults() {
  const data = await jolpica<{
    MRData: {
      RaceTable: {
        season: string;
        round: string;
        Races: {
          raceName: string;
          round: string;
          date: string;
          Results: RaceResult[];
        }[];
      };
    };
  }>("/current/last/results/?limit=100");
  const race = data.MRData.RaceTable.Races[0];
  return {
    season: data.MRData.RaceTable.season,
    round: race?.round ?? data.MRData.RaceTable.round,
    raceName: race?.raceName ?? "Last race",
    date: race?.date ?? null,
    results: race?.Results ?? [],
  };
}

export async function fetchRaceResults(round: string) {
  const data = await jolpicaOptional<{
    MRData: {
      RaceTable: {
        season: string;
        round: string;
        Races: {
          raceName: string;
          round: string;
          date: string;
          Circuit: { circuitName: string; Location: { locality: string; country: string } };
          Results: RaceResult[];
        }[];
      };
    };
  }>(`/current/${round}/results/?limit=100`);
  const race = data?.MRData.RaceTable.Races[0];
  if (!race) return null;
  return {
    season: data.MRData.RaceTable.season,
    round: race.round,
    raceName: race.raceName,
    date: race.date,
    circuit: race.Circuit,
    results: race.Results ?? [],
  };
}

export async function fetchQualifying(round: string) {
  const data = await jolpicaOptional<{
    MRData: {
      RaceTable: {
        Races: { QualifyingResults?: QualifyingResult[] }[];
      };
    };
  }>(`/current/${round}/qualifying/?limit=100`);
  return data?.MRData.RaceTable.Races[0]?.QualifyingResults ?? [];
}

export async function fetchSprint(round: string) {
  const data = await jolpicaOptional<{
    MRData: {
      RaceTable: {
        Races: { SprintResults?: RaceResult[] }[];
      };
    };
  }>(`/current/${round}/sprint/?limit=100`);
  return data?.MRData.RaceTable.Races[0]?.SprintResults ?? [];
}

export function nextUpcomingRace(races: Race[], now = new Date(currentTime())) {
  const sorted = [...races].sort(
    (a, b) => raceDate(a).getTime() - raceDate(b).getTime(),
  );
  return sorted.find((race) => raceDate(race).getTime() > now.getTime()) ?? null;
}

export function raceDate(race: Pick<Race, "date" | "time">) {
  return new Date(`${race.date}T${race.time ?? "00:00:00Z"}`);
}

export function currentTime() {
  return Date.now();
}

export function nextOrCurrentRace(races: Race[], now = new Date(currentTime())) {
  const sorted = [...races].sort(
    (a, b) => raceDate(a).getTime() - raceDate(b).getTime(),
  );
  return (
    sorted.find((race) => raceDate(race).getTime() + 3 * 60 * 60 * 1000 > now.getTime()) ??
    sorted.at(-1) ??
    null
  );
}

export function constructorColor(id: string) {
  const map: Record<string, string> = {
    mercedes: "27F4D2",
    ferrari: "E8002D",
    mclaren: "FF8000",
    red_bull: "3671C6",
    alpine: "0093CC",
    williams: "64C4FF",
    rb: "6692FF",
    racing_bulls: "6692FF",
    aston_martin: "229971",
    haas: "B6BABD",
    sauber: "00E701",
    kick_sauber: "00E701",
    audi: "F50537",
    cadillac: "FFFFFF",
  };
  return map[id] ?? "888888";
}

export type FormGuidePick = {
  driverId: string;
  code: string;
  name: string;
  score: number;
};

export function formGuide(
  standings: DriverStanding[],
  results: RaceResult[],
): FormGuidePick[] {
  const scores = new Map<string, { score: number; standing: DriverStanding }>();
  for (const row of standings) {
    const pos = Number(row.position);
    scores.set(row.Driver.driverId, {
      score: Math.max(0, 21 - pos) * 2,
      standing: row,
    });
  }
  for (const row of results) {
    const pos = Number(row.position);
    const current = scores.get(row.Driver.driverId);
    const bump = Number.isFinite(pos) ? Math.max(0, 21 - pos) * 3 : 0;
    if (current) current.score += bump;
    else {
      const standing = standings.find((item) => item.Driver.driverId === row.Driver.driverId);
      if (standing) {
        scores.set(row.Driver.driverId, { score: bump, standing });
      }
    }
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score, standing }) => ({
      driverId: standing.Driver.driverId,
      code: standing.Driver.code ?? standing.Driver.familyName.slice(0, 3).toUpperCase(),
      name: `${standing.Driver.givenName} ${standing.Driver.familyName}`,
      score,
    }));
}
