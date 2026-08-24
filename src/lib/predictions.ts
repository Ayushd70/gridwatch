import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { RaceResult } from "./jolpica";

export type PickRecord = {
  id: string;
  name: string;
  season: string;
  round: string;
  raceName: string;
  p1: string;
  p2: string;
  p3: string;
  createdAt: string;
};

export type ScoredPick = PickRecord & {
  points: number;
  breakdown: { p1: number; p2: number; p3: number };
};

type Store = { picks: PickRecord[] };

const STORE_PATH = resolve(process.cwd(), "data/picks.json");

function readStore(): Store {
  if (!existsSync(STORE_PATH)) return { picks: [] };
  try {
    return JSON.parse(readFileSync(STORE_PATH, "utf8")) as Store;
  } catch {
    return { picks: [] };
  }
}

function writeStore(store: Store) {
  try {
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch {
    // Vercel filesystems are read-only. Picks still return to the client.
  }
}

export function listPicks(season: string, round: string) {
  return readStore().picks.filter(
    (pick) => pick.season === season && pick.round === round,
  );
}

export function addPick(pick: Omit<PickRecord, "id" | "createdAt">) {
  const store = readStore();
  const record: PickRecord = {
    ...pick,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  store.picks.push(record);
  writeStore(store);
  return record;
}

export function scorePicks(picks: PickRecord[], results: RaceResult[]) {
  const byPosition = new Map<string, string>();
  for (const result of results) {
    byPosition.set(result.position, result.Driver.driverId);
  }
  const podium = new Set(
    [byPosition.get("1"), byPosition.get("2"), byPosition.get("3")].filter(
      Boolean,
    ) as string[],
  );

  return picks
    .map((pick) => {
      const awarded = (slot: "p1" | "p2" | "p3", expected: string, exact: number) => {
        if (byPosition.get(expected) === pick[slot]) return exact;
        if (podium.has(pick[slot])) return 1;
        return 0;
      };
      const p1 = awarded("p1", "1", 5);
      const p2 = awarded("p2", "2", 3);
      const p3 = awarded("p3", "3", 1);
      return {
        ...pick,
        points: p1 + p2 + p3,
        breakdown: { p1, p2, p3 },
      };
    })
    .sort((a, b) => b.points - a.points);
}
