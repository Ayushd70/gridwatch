import {
  fetchConstructorStandings,
  fetchDriverStandings,
} from "@/lib/jolpica";

export async function GET() {
  const [drivers, constructors] = await Promise.all([
    fetchDriverStandings(),
    fetchConstructorStandings(),
  ]);
  return Response.json({ drivers, constructors });
}
