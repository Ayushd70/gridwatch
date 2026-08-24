import { unstable_cache } from "next/cache";
import { buildRestSnapshot } from "../../server/bootstrap";
import { fetchOpenF1Token } from "../../server/openf1";
import { emptySnapshot, type TimingSnapshot } from "../../shared/timing";

async function fromIngest(): Promise<TimingSnapshot | null> {
  const ingest = process.env.INGEST_URL;
  if (!ingest) return null;
  try {
    const response = await fetch(`${ingest}/snapshot`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as TimingSnapshot;
  } catch {
    return null;
  }
}

const restSnapshot = unstable_cache(
  async () => {
    const username = process.env.OPENF1_USERNAME?.trim();
    const password = process.env.OPENF1_PASSWORD?.trim();
    let token: string | undefined;
    if (username && password) {
      try {
        token = (await fetchOpenF1Token(username, password)).accessToken;
      } catch (error) {
        console.warn("OpenF1 login skipped", error);
      }
    }
    return buildRestSnapshot({ token, lean: true });
  },
  ["openf1-rest-snapshot"],
  { revalidate: 30 },
);

export async function getTimingSnapshot(): Promise<TimingSnapshot> {
  const ingest = await fromIngest();
  if (ingest) return ingest;
  try {
    return await restSnapshot();
  } catch (error) {
    return emptySnapshot({
      notice:
        error instanceof Error
          ? error.message
          : "Could not load OpenF1 timing.",
    });
  }
}
