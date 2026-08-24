import { TimingBoard } from "@/components/TimingBoard";
import { getTimingSnapshot } from "@/lib/session-snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export default async function HomePage() {
  const initial = await getTimingSnapshot();
  return <TimingBoard initial={initial} />;
}
