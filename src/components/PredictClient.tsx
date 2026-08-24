"use client";

import { useMemo, useState, type FormEvent } from "react";

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
      <section className="rounded-2xl border border-white/8 bg-[#12141b] p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          {data.race.Circuit.Location.country}
        </p>
        <h1 className="font-display text-3xl text-zinc-50">{data.race.raceName}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {data.race.Circuit.circuitName} · {data.race.date}
          {data.locked ? " · picks locked" : " · picks open until lights out"}
        </p>

        <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
            Form guide
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Weighted from current standings and {data.lastRace.name}. Not official odds.
          </p>
          <ol className="mt-3 space-y-2">
            {data.formGuide.map((pick, index) => (
              <li key={pick.driverId} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">
                  P{index + 1} · {pick.code} {pick.name}
                </span>
                <span className="font-mono text-zinc-500">{pick.score}</span>
              </li>
            ))}
          </ol>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-sm text-zinc-400">
            Your name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-zinc-100"
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
              <label key={field.slot} className="block text-sm text-zinc-400">
                {field.slot}
                <select
                  value={field.value}
                  onChange={(event) => field.setter(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-zinc-100"
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
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={data.locked || pending}
            className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {data.locked ? "Locked" : pending ? "Saving…" : "Lock in podium"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#12141b] p-5">
        <h2 className="font-display text-2xl text-zinc-50">Picks</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Scoring: 5 / 3 / 1 for exact P1–P3, plus 1 if the driver finishes on the podium in another slot.
        </p>
        <ul className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <li className="text-sm text-zinc-500">No picks yet for this race.</li>
          ) : (
            rows.map((pick) => (
              <li key={pick.id} className="rounded-xl bg-black/25 px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-100">{pick.name}</span>
                  {pick.points != null ? (
                    <span className="font-mono text-amber-300">{pick.points} pts</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {label(pick.p1)} · {label(pick.p2)} · {label(pick.p3)}
                </p>
              </li>
            ))
          )}
        </ul>
        {data.lastScored.length > 0 && data.lastRace.round !== undefined ? (
          <div className="mt-8">
            <h3 className="font-display text-xl text-zinc-50">
              {data.lastRace.name} scores
            </h3>
            <ul className="mt-3 space-y-3">
              {data.lastScored.map((pick) => (
                <li key={pick.id} className="rounded-xl bg-black/25 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-100">{pick.name}</span>
                    <span className="font-mono text-amber-300">{pick.points} pts</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
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
