"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type DriverOption = {
  driverId: string;
  code?: string;
  name: string;
  team: string;
};

type PickRow = {
  id: string;
  name: string;
  p1: string;
  p2: string;
  p3: string;
  points?: number;
};

type Payload = {
  race: {
    raceName: string;
    date: string;
    time?: string;
    Circuit: { circuitName: string; Location: { locality: string; country: string } };
  };
  raceKey: string;
  locked: boolean;
  drivers: DriverOption[];
  picks: PickRow[];
  scored: PickRow[] | null;
  lastScored: PickRow[];
  formGuide: { driverId: string; code: string; name: string; score: number }[];
  lastRace: { name: string; round: string; season?: string };
};

export function PredictClient({ initial }: { initial: Payload }) {
  const [data, setData] = useState(initial);
  const [name, setName] = useState("");
  const [p1, setP1] = useState(initial.formGuide[0]?.driverId ?? "");
  const [p2, setP2] = useState(initial.formGuide[1]?.driverId ?? "");
  const [p3, setP3] = useState(initial.formGuide[2]?.driverId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`gridwatch-picks:${initial.raceKey}`);
      if (!raw) return;
      const local = JSON.parse(raw) as PickRow[];
      if (!Array.isArray(local) || local.length === 0) return;
      // localStorage is not available during SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate browser-only picks
      setData((current) => {
        const seen = new Set(current.picks.map((pick) => pick.id));
        const extra = local.filter((pick) => !seen.has(pick.id));
        return extra.length
          ? { ...current, picks: [...current.picks, ...extra] }
          : current;
      });
    } catch {
      /* ignore bad local data */
    }
  }, [initial.raceKey]);

  const label = useMemo(() => {
    const map = new Map(data.drivers.map((driver) => [driver.driverId, driver]));
    return (id: string) => {
      const driver = map.get(id);
      return driver ? `${driver.code ?? ""} ${driver.name}`.trim() : id;
    };
  }, [data.drivers]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, p1, p2, p3 }),
      });
      const body = (await response.json()) as PickRow & { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not save pick.");
        return;
      }
      setData((current) => ({ ...current, picks: [...current.picks, body] }));
      try {
        const key = `gridwatch-picks:${initial.raceKey}`;
        const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as PickRow[];
        localStorage.setItem(key, JSON.stringify([...existing, body]));
      } catch {
        /* private mode, etc */
      }
      setName("");
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  const rows = data.scored ?? data.picks;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="panel p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
          {data.race.Circuit.Location.country}
        </p>
        <h2 className="mt-1 font-display text-3xl tracking-tight text-foreground">
          {data.race.raceName}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {data.race.Circuit.circuitName} · {data.race.date}
          {data.locked ? " · picks locked" : " · picks open until lights out"}
        </p>

        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            Form guide
          </p>
          <p className="mt-1 text-xs text-subtle">
            Weighted from current standings and {data.lastRace.name}. Not official
            odds.
          </p>
          <ol className="mt-3 space-y-2">
            {data.formGuide.map((pick, index) => (
              <li
                key={pick.driverId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">
                  P{index + 1} · {pick.code} {pick.name}
                </span>
                <span className="font-mono text-subtle">{pick.score}</span>
              </li>
            ))}
          </ol>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-sm text-muted">
            Your name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
              disabled={data.locked}
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { slot: "P1", value: p1, setter: setP1 },
                { slot: "P2", value: p2, setter: setP2 },
                { slot: "P3", value: p3, setter: setP3 },
              ] as const
            ).map((field) => (
              <label key={field.slot} className="block text-sm text-muted">
                {field.slot}
                <select
                  value={field.value}
                  onChange={(event) => field.setter(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
                  disabled={data.locked}
                >
                  <option value="">Select</option>
                  {data.drivers.map((driver) => (
                    <option key={driver.driverId} value={driver.driverId}>
                      {driver.code} · {driver.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={data.locked || pending}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:opacity-90 disabled:opacity-50"
          >
            {data.locked ? "Locked" : pending ? "Saving…" : "Lock in podium"}
          </button>
        </form>
      </section>

      <section className="panel p-5 sm:p-6">
        <h2 className="font-display text-2xl text-foreground">Picks</h2>
        <p className="mt-1 text-xs text-subtle">
          Scoring: 5 / 3 / 1 for exact P1–P3, plus 1 if the driver finishes on the
          podium in another slot.
        </p>
        <ul className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <li className="text-sm text-muted">No picks yet for this race.</li>
          ) : (
            rows.map((pick) => (
              <li key={pick.id} className="rounded-xl bg-surface-2 px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{pick.name}</span>
                  {pick.points != null ? (
                    <span className="font-mono text-accent">{pick.points} pts</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-subtle">
                  {label(pick.p1)} · {label(pick.p2)} · {label(pick.p3)}
                </p>
              </li>
            ))
          )}
        </ul>
        {data.lastScored.length > 0 && data.lastRace.round !== undefined ? (
          <div className="mt-8">
            <h3 className="font-display text-xl text-foreground">
              {data.lastRace.name} scores
            </h3>
            <ul className="mt-3 space-y-3">
              {data.lastScored.map((pick) => (
                <li key={pick.id} className="rounded-xl bg-surface-2 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{pick.name}</span>
                    <span className="font-mono text-accent">{pick.points} pts</span>
                  </div>
                  <p className="mt-1 text-xs text-subtle">
                    {label(pick.p1)} · {label(pick.p2)} · {label(pick.p3)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
