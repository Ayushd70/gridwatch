import { getTimingSnapshot } from "@/lib/session-snapshot";

export const maxDuration = 20;
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getTimingSnapshot());
}
