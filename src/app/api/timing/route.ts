import { emptySnapshot } from "../../../../shared/timing";

const INGEST = process.env.INGEST_URL ?? "http://localhost:4001";

export async function GET() {
  try {
    const response = await fetch(`${INGEST}/snapshot`, { cache: "no-store" });
    if (!response.ok) {
      return Response.json(
        emptySnapshot({
          notice: `Ingest returned ${response.status}. Is the ingest server running?`,
        }),
        { status: 200 },
      );
    }
    return Response.json(await response.json());
  } catch {
    return Response.json(
      emptySnapshot({
        notice:
          "Ingest server is offline. Run `npm run dev` so the Node ingest process starts on port 4001.",
      }),
    );
  }
}
