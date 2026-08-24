import { TimingBoard } from "@/components/TimingBoard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { emptySnapshot, type TimingSnapshot } from "../../shared/timing";

export const dynamic = "force-dynamic";

async function loadSnapshot(): Promise<TimingSnapshot> {
  const ingest = process.env.INGEST_URL ?? "http://localhost:4001";
  try {
    const response = await fetch(`${ingest}/snapshot`, { cache: "no-store" });
    if (!response.ok) return emptySnapshot();
    return (await response.json()) as TimingSnapshot;
  } catch {
    return emptySnapshot({
      notice:
        "Ingest server is offline. Run `npm run dev` so timing can stream on port 4001.",
    });
  }
}

export default async function HomePage() {
  const initial = await loadSnapshot();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader current="/" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <TimingBoard initial={initial} />
      </main>
      <SiteFooter />
    </div>
  );
}
