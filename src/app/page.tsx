import { TimingBoard } from "@/components/TimingBoard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { getTimingSnapshot } from "@/lib/session-snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

export default async function HomePage() {
  const initial = await getTimingSnapshot();
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
