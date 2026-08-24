import {
  fetchCalendar,
  fetchDriverStandings,
  fetchLastResults,
  formGuide,
  nextUpcomingRace,
  raceDate,
} from "@/lib/jolpica";
import { addPick, listPicks, scorePicks } from "@/lib/predictions";

export async function GET() {
  const [calendar, standings, last] = await Promise.all([
    fetchCalendar(),
    fetchDriverStandings(),
    fetchLastResults(),
  ]);
  const target = nextUpcomingRace(calendar.races);
  if (!target) {
    return Response.json({ error: "No upcoming race found" }, { status: 404 });
  }
  const locked = raceDate(target).getTime() <= Date.now();
  const picks = listPicks(target.season, target.round);
  const lastPicks = listPicks(last.season, last.round);
  return Response.json({
    race: target,
    locked,
    drivers: standings.standings.map((row) => ({
      driverId: row.Driver.driverId,
      code: row.Driver.code,
      name: `${row.Driver.givenName} ${row.Driver.familyName}`,
      team: row.Constructors[0]?.name ?? "",
    })),
    picks,
    scored: last.round === target.round ? scorePicks(picks, last.results) : null,
    lastScored: scorePicks(lastPicks, last.results),
    formGuide: formGuide(standings.standings, last.results),
    lastRace: { name: last.raceName, round: last.round, season: last.season },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    p1?: string;
    p2?: string;
    p3?: string;
  };
  const name = body.name?.trim();
  const { p1, p2, p3 } = body;
  if (!name || !p1 || !p2 || !p3) {
    return Response.json({ error: "Name and a full podium are required." }, { status: 400 });
  }
  if (new Set([p1, p2, p3]).size !== 3) {
    return Response.json({ error: "P1, P2, and P3 must be three different drivers." }, { status: 400 });
  }

  const calendar = await fetchCalendar();
  const target = nextUpcomingRace(calendar.races);
  if (!target) {
    return Response.json({ error: "No upcoming race found" }, { status: 404 });
  }
  if (raceDate(target).getTime() <= Date.now()) {
    return Response.json(
      { error: "Picks are locked for this race (lights are out or the race is done)." },
      { status: 409 },
    );
  }

  const pick = addPick({
    name,
    season: target.season,
    round: target.round,
    raceName: target.raceName,
    p1,
    p2,
    p3,
  });
  return Response.json(pick, { status: 201 });
}
