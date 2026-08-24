import { sampleSnapshot } from "./fixture";
import {
  OpenF1Error,
  openf1Get,
  sleep,
  type OpenF1Championship,
  type OpenF1Driver,
  type OpenF1Interval,
  type OpenF1Lap,
  type OpenF1Meeting,
  type OpenF1Pit,
  type OpenF1Position,
  type OpenF1RaceControl,
  type OpenF1Session,
  type OpenF1SessionResult,
  type OpenF1Stint,
  type OpenF1TeamChampionship,
  type OpenF1Weather,
} from "./openf1";
import { TimingStore } from "./state";
import type { TimingSnapshot } from "../shared/timing";

type BootstrapOptions = {
  token?: string;
  /** Skip the heavy laps feed. Use this on Vercel so the function stays under the time limit. */
  lean?: boolean;
  pauseMs?: number;
};

export async function fillStoreFromRest(
  store: TimingStore,
  options: BootstrapOptions = {},
): Promise<boolean> {
  const token = options.token;
  const pause = options.pauseMs ?? (options.lean ? 250 : 400);

  try {
    const sessions = await openf1Get<OpenF1Session[]>(
      "/v1/sessions?session_key=latest",
      token,
    );
    const session = sessions[0];
    if (!session) throw new Error("No latest session");
    store.applySession(session, "rest");
    await sleep(pause);

    try {
      const meetings = await openf1Get<OpenF1Meeting[]>(
        `/v1/meetings?meeting_key=${session.meeting_key}`,
        token,
      );
      if (meetings[0]) store.applyMeeting(meetings[0], "rest");
    } catch (error) {
      console.warn("meetings fetch skipped", error);
    }

    const key = session.session_key;
    const isRace =
      /race/i.test(session.session_name) || /race/i.test(session.session_type);
    let usedSessionResult = false;
    const fetches: Array<() => Promise<void>> = [
      async () => {
        const drivers = await openf1Get<OpenF1Driver[]>(
          `/v1/drivers?session_key=${key}`,
          token,
        );
        store.applyDrivers(drivers, "rest");
      },
      async () => {
        try {
          const results = await openf1Get<OpenF1SessionResult[]>(
            `/v1/session_result?session_key=${key}`,
            token,
          );
          if (results.length) {
            store.applySessionResults(results, "rest");
            usedSessionResult = true;
            return;
          }
        } catch (error) {
          console.warn("session_result unavailable", error);
        }
        const positions = await openf1Get<OpenF1Position[]>(
          `/v1/position?session_key=${key}`,
          token,
        );
        store.applyPositions(positions, "rest");
      },
      async () => {
        if (usedSessionResult) return;
        const intervals = await openf1Get<OpenF1Interval[]>(
          `/v1/intervals?session_key=${key}`,
          token,
        );
        store.applyIntervals(intervals, "rest");
      },
      async () => {
        const stints = await openf1Get<OpenF1Stint[]>(
          `/v1/stints?session_key=${key}`,
          token,
        );
        store.applyStints(stints, "rest");
      },
      async () => {
        const pits = await openf1Get<OpenF1Pit[]>(
          `/v1/pit?session_key=${key}`,
          token,
        );
        store.applyPits(pits, "rest", true);
      },
      async () => {
        const weather = await openf1Get<OpenF1Weather[]>(
          `/v1/weather?session_key=${key}`,
          token,
        );
        store.applyWeather(weather, "rest");
      },
      async () => {
        const control = await openf1Get<OpenF1RaceControl[]>(
          `/v1/race_control?session_key=${key}`,
          token,
        );
        store.applyRaceControl(control, "rest");
      },
    ];

    if (!options.lean) {
      fetches.push(async () => {
        const laps = await openf1Get<OpenF1Lap[]>(
          `/v1/laps?session_key=${key}`,
          token,
        );
        store.applyLaps(laps, "rest");
      });
    }

    if (isRace) {
      fetches.push(async () => {
        const championship = await openf1Get<OpenF1Championship[]>(
          `/v1/championship_drivers?session_key=${key}`,
          token,
        );
        store.applyChampionship(championship, "rest");
      });
      fetches.push(async () => {
        const teams = await openf1Get<OpenF1TeamChampionship[]>(
          `/v1/championship_teams?session_key=${key}`,
          token,
        );
        store.applyTeamChampionship(teams, "rest");
      });
    }

    for (const fetchOne of fetches) {
      await sleep(pause);
      try {
        await fetchOne();
      } catch (error) {
        console.warn("REST partial fetch failed", error);
      }
    }

    store.setMeta({
      restricted: false,
      authenticated: Boolean(token),
      notice: token
        ? "Showing latest OpenF1 session via authenticated REST."
        : session.date_end && Date.parse(session.date_end) < Date.now()
          ? `Replay of the latest OpenF1 session (${session.session_name} at ${session.circuit_short_name ?? session.location}).`
          : "Showing latest OpenF1 session via free historical REST.",
    });
    return true;
  } catch (error) {
    if (error instanceof OpenF1Error && error.restricted) {
      store.replaceSnapshot(sampleSnapshot());
      store.setMeta({
        restricted: true,
        authenticated: Boolean(token),
        notice: token
          ? "Authenticated, but OpenF1 still locked this session."
          : sampleSnapshot().notice,
      });
      return false;
    }
    console.error("REST bootstrap failed", error);
    store.setMeta({
      mode: "idle",
      notice:
        error instanceof Error ? error.message : "Could not reach OpenF1.",
    });
    return false;
  }
}

export async function buildRestSnapshot(
  options: BootstrapOptions = {},
): Promise<TimingSnapshot> {
  const store = new TimingStore();
  await fillStoreFromRest(store, options);
  return store.get();
}
