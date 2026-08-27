import type { TimingSnapshot } from "../shared/timing";

/** Sample board used when OpenF1 is locked to live-session subscribers. */
export function sampleSnapshot(): TimingSnapshot {
  return {
    mode: "replay",
    source: "fixture",
    authenticated: false,
    restricted: true,
    notice:
      "OpenF1 is locked to subscribers while a session is live. This is a sample board so you can develop between (or during) sessions. Add OPENF1_USERNAME and OPENF1_PASSWORD for the real feed.",
    meeting: {
      name: "Sample Grand Prix",
      location: "Spa-Francorchamps",
      country: "Belgium",
      year: 2026,
    },
    meetingSessions: [],
    session: {
      key: "fixture",
      name: "Race",
      type: "Race",
      dateStart: "2026-07-26T13:00:00+00:00",
    },
    lap: { current: 28, total: 44 },
    trackStatus: "GREEN",
    lastFlag: "GREEN",
    weather: {
      airTemp: 19.2,
      trackTemp: 32.8,
      humidity: 58,
      rainfall: 0,
      windSpeed: 3.4,
    },
    raceControl: [
      {
        date: "2026-07-26T13:41:00+00:00",
        flag: "GREEN",
        message: "Track clear — green flag",
        category: "Flag",
      },
    ],
    rows: [
      row(1, 12, "Andrea Kimi Antonelli", "ANT", "Mercedes", "27F4D2", 107.812, null, null, "MEDIUM", 28, 1, 22.4),
      row(2, 63, "George Russell", "RUS", "Mercedes", "27F4D2", 108.041, 1.842, 1.842, "MEDIUM", 28, 1, 23.1),
      row(3, 44, "Lewis Hamilton", "HAM", "Ferrari", "E8002D", 108.204, 3.551, 1.709, "HARD", 28, 1, 22.8),
      row(4, 16, "Charles Leclerc", "LEC", "Ferrari", "E8002D", 108.117, 4.992, 1.441, "HARD", 28, 1, 23.5),
      row(5, 1, "Lando Norris", "NOR", "McLaren", "FF8000", 107.988, 8.214, 3.222, "MEDIUM", 28, 1, 22.1),
      row(6, 3, "Max Verstappen", "VER", "Red Bull", "3671C6", 108.334, 9.108, 0.894, "HARD", 28, 1, 23.9),
      row(7, 81, "Oscar Piastri", "PIA", "McLaren", "FF8000", 108.401, 12.66, 3.552, "MEDIUM", 28, 1, 22.6),
      row(8, 6, "Isack Hadjar", "HAD", "Red Bull", "3671C6", 108.772, 18.901, 6.241, "HARD", 27, 1, 24.2),
    ],
    championship: [
      { driverNumber: 12, name: "Andrea Kimi Antonelli", acronym: "ANT", teamName: "Mercedes", teamColor: "27F4D2", pointsCurrent: 224, pointsStart: 209, positionCurrent: 1, positionStart: 1 },
      { driverNumber: 44, name: "Lewis Hamilton", acronym: "HAM", teamName: "Ferrari", teamColor: "E8002D", pointsCurrent: 186, pointsStart: 171, positionCurrent: 2, positionStart: 2 },
      { driverNumber: 63, name: "George Russell", acronym: "RUS", teamName: "Mercedes", teamColor: "27F4D2", pointsCurrent: 186, pointsStart: 168, positionCurrent: 3, positionStart: 3 },
      { driverNumber: 16, name: "Charles Leclerc", acronym: "LEC", teamName: "Ferrari", teamColor: "E8002D", pointsCurrent: 157, pointsStart: 145, positionCurrent: 4, positionStart: 4 },
      { driverNumber: 1, name: "Lando Norris", acronym: "NOR", teamName: "McLaren", teamColor: "FF8000", pointsCurrent: 144, pointsStart: 134, positionCurrent: 5, positionStart: 5 },
    ],
    teams: [
      { teamName: "Mercedes", teamColor: "27F4D2", pointsCurrent: 410, pointsStart: 377, positionCurrent: 1, positionStart: 1 },
      { teamName: "Ferrari", teamColor: "E8002D", pointsCurrent: 343, pointsStart: 316, positionCurrent: 2, positionStart: 2 },
      { teamName: "McLaren", teamColor: "FF8000", pointsCurrent: 256, pointsStart: 246, positionCurrent: 3, positionStart: 3 },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function row(
  position: number,
  driverNumber: number,
  name: string,
  acronym: string,
  teamName: string,
  teamColor: string,
  lastLap: number,
  gapToLeader: number | null,
  interval: number | null,
  tyre: string,
  lapNumber: number,
  pitCount = 0,
  lastPit: number | null = null,
): TimingSnapshot["rows"][number] {
  return {
    driverNumber,
    position,
    name,
    acronym,
    teamName,
    teamColor,
    lastLap,
    sectors: [28.1, 46.4, lastLap - 74.5],
    gapToLeader,
    interval,
    tyre,
    lapNumber,
    pitCount,
    lastPit,
  };
}
