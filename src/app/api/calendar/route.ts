import { fetchCalendar } from "@/lib/jolpica";

export async function GET() {
  return Response.json(await fetchCalendar());
}
