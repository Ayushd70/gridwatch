import { unstable_cache } from "next/cache";
import { buildRestSnapshot } from "../../server/bootstrap";
import { fetchOpenF1Token } from "../../server/openf1";
import { emptySnapshot, type TimingSnapshot } from "../../shared/timing";
import { fillMissingIdentities } from "@/lib/driver-identities";

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

async function openf1Token() {
  const username = process.env.OPENF1_USERNAME?.trim();
  const password = process.env.OPENF1_PASSWORD?.trim();
  if (!username || !password) return undefined;
  try {
    return (await fetchOpenF1Token(username, password)).accessToken;
  } catch (error) {
    console.warn("OpenF1 login skipped", error);
    return undefined;
  }
}

function restSnapshot(sessionKey: string) {
  const latest = sessionKey === "latest";
  return unstable_cache(
    async () => {
      const token = await openf1Token();
      const snap = await fillMissingIdentities(
        await buildRestSnapshot({
          token,
          lean: true,
          sessionKey: latest ? undefined : sessionKey,
        }),
      );
      if (snap.restricted) return snap;
      if (!snap.session) {
        throw new Error(snap.notice ?? "Could not load OpenF1 timing.");
      }
      return snap;
    },
    ["openf1-rest-snapshot-v5", sessionKey],
    { revalidate: latest ? 30 : 120 },
  )();
}

export function sanitizeSessionKey(raw?: string | null) {
  if (!raw || raw === "latest") return undefined;
  return /^\d+$/.test(raw) ? raw : undefined;
}

export async function getTimingSnapshot(
  sessionKey?: string | null,
): Promise<TimingSnapshot> {
  const key = sanitizeSessionKey(sessionKey);
  if (!key) {
    const ingest = await fromIngest();
    if (ingest) return ingest;
  }
  try {
    return await restSnapshot(key ?? "latest");
  } catch (error) {
    return emptySnapshot({
      notice:
        error instanceof Error
          ? error.message
          : "Could not load OpenF1 timing.",
    });
  }
}
