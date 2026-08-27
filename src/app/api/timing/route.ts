import { getTimingSnapshot } from "@/lib/session-snapshot";

export const maxDuration = 10;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = new URL(request.url).searchParams.get("session");
  return Response.json(await getTimingSnapshot(session));
}
