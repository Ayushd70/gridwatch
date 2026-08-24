import { fetchDriverStandings, fetchLastResults } from "@/lib/jolpica";
import type { TimingSnapshot } from "../../shared/timing";

type Identity = { name: string; acronym: string; teamName: string };

function needsIdentity(name: string, teamName: string, acronym: string) {
  return (
    !teamName ||
    name.startsWith("#") ||
    /^\d+$/.test(acronym)
  );
}

export async function fillMissingIdentities(
  snapshot: TimingSnapshot,
): Promise<TimingSnapshot> {
  const rowsNeed = snapshot.rows.some((row) =>
    needsIdentity(row.name, row.teamName, row.acronym),
  );
  const champNeed = snapshot.championship.some((row) =>
    needsIdentity(row.name, row.teamName, row.acronym),
  );
  if (!rowsNeed && !champNeed) return snapshot;

  try {
    const [standings, last] = await Promise.all([
      fetchDriverStandings(),
      fetchLastResults(),
    ]);
    const byNumber = new Map<string, Identity>();

    for (const row of standings.standings) {
      const number = row.Driver.permanentNumber;
      if (!number) continue;
      byNumber.set(number, {
        name: `${row.Driver.givenName} ${row.Driver.familyName}`,
        acronym: row.Driver.code ?? row.Driver.familyName.slice(0, 3).toUpperCase(),
        teamName: row.Constructors[0]?.name ?? "",
      });
    }
    for (const row of last.results) {
      const number = row.Driver.permanentNumber;
      if (!number || byNumber.has(number)) continue;
      byNumber.set(number, {
        name: `${row.Driver.givenName} ${row.Driver.familyName}`,
        acronym: row.Driver.code ?? row.Driver.familyName.slice(0, 3).toUpperCase(),
        teamName: row.Constructor.name,
      });
    }

    const apply = <T extends { driverNumber: number; name: string; acronym: string; teamName: string }>(
      row: T,
    ): T => {
      const ident = byNumber.get(String(row.driverNumber));
      if (!ident) return row;
      return {
        ...row,
        name: needsIdentity(row.name, row.teamName, row.acronym) ? ident.name : row.name,
        acronym: /^\d+$/.test(row.acronym) ? ident.acronym : row.acronym,
        teamName: row.teamName || ident.teamName,
      };
    };

    return {
      ...snapshot,
      rows: snapshot.rows.map(apply),
      championship: snapshot.championship.map(apply),
    };
  } catch (error) {
    console.warn("Jolpica driver names skipped", error);
    return snapshot;
  }
}
