"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatGap,
  formatLapTime,
  teamSwatch,
  tyreClass,
  tyreCode,
} from "@/lib/format";
import type { TeamChampionshipRow, TimingRow, TimingSnapshot } from "../../shared/timing";
import { emptySnapshot } from "../../shared/timing";

const WS_URL = process.env.NEXT_PUBLIC_INGEST_WS ?? "";

export function TimingBoard({ initial }: { initial?: TimingSnapshot }) {
  const [snapshot, setSnapshot] = useState<TimingSnapshot>(
    initial ?? emptySnapshot(),
  );
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let closed = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const loadHttp = async () => {
      try {
        const response = await fetch("/api/timing", { cache: "no-store" });
        if (!response.ok) return;
        setSnapshot((await response.json()) as TimingSnapshot);
      } catch {
        /* ingest may still be starting */
      }
    };

    const connect = () => {
      socket = new WebSocket(WS_URL);
      socket.onopen = () => {
        if (!closed) setConnected(true);
      };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as {
            type: string;
            payload: TimingSnapshot;
          };
          if (message.type === "snapshot") setSnapshot(message.payload);
        } catch {
          /* ignore malformed frames */
        }
      };
      socket.onclose = () => {
        if (closed) return;
        setConnected(false);
        void loadHttp();
        retry = setTimeout(connect, 2500);
      };
      socket.onerror = () => socket?.close();
    };

    const poll = WS_URL
      ? null
      : setInterval(() => {
          void loadHttp();
        }, 15_000);

    if (WS_URL) connect();
    else void loadHttp();

    return () => {
      closed = true;
      if (poll) clearInterval(poll);
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, []);

  const modeLabel = useMemo(() => {
    if (snapshot.mode === "live") return "LIVE";
    if (snapshot.mode === "replay")
      return snapshot.source === "fixture" ? "SAMPLE" : "REPLAY";
    return "IDLE";
  }, [snapshot.mode, snapshot.source]);

  const weather = snapshot.weather;
  const live = snapshot.mode === "live";
  const finishedRace = isFinishedRace(snapshot);
  const podium = finishedRace ? snapshot.rows.slice(0, 3) : [];

  return (
    <div className="space-y-5">
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-subtle">
              {snapshot.meeting?.country || "Session"}
            </p>
            <h1 className="mt-1 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
              {snapshot.meeting?.name ?? "Waiting for a session"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {snapshot.session?.name ?? "No OpenF1 session loaded"}
              {snapshot.lap
                ? ` · ${finishedRace ? "Finished · " : ""}Lap ${snapshot.lap.current}${snapshot.lap.total ? ` / ${snapshot.lap.total}` : ""}`
                : ""}
              {snapshot.lastFlag ? ` · ${snapshot.lastFlag}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                live
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : snapshot.mode === "replay"
                    ? "bg-sky-500/15 text-sky-800 dark:text-sky-300"
                    : "bg-chip text-muted"
              }`}
            >
              {live ? <span className="live-dot" /> : null}
              {modeLabel}
            </span>
            <span className="chip text-[11px]">
              {connected ? "socket" : WS_URL ? "http" : "poll"} · {snapshot.source}
              {snapshot.authenticated ? " · auth" : ""}
            </span>
          </div>
        </div>
        {weather ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="chip">Air {fmtTemp(weather.airTemp)}</span>
            <span className="chip">Track {fmtTemp(weather.trackTemp)}</span>
            <span className="chip">
              {weather.rainfall && weather.rainfall > 0
                ? `Rain ${weather.rainfall}`
                : "Dry"}
            </span>
            {weather.windSpeed != null ? (
              <span className="chip">Wind {weather.windSpeed.toFixed(1)} m/s</span>
            ) : null}
            {weather.humidity != null ? (
              <span className="chip">RH {Math.round(weather.humidity)}%</span>
            ) : null}
          </div>
        ) : null}
        {snapshot.notice ? (
          <p className="mt-4 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-sm text-foreground">
            {snapshot.notice}
          </p>
        ) : null}
      </section>

      {podium.length === 3 ? <Podium rows={podium} /> : null}

      {snapshot.championship.length > 0 ? (
        <ChampionshipStrip
          title="Drivers championship"
          items={snapshot.championship.map((row) => ({
            key: String(row.driverNumber),
            label: /^\d+$/.test(row.acronym) ? row.name : row.acronym,
            sub: `P${row.positionCurrent}`,
            points: row.pointsCurrent,
            delta: row.pointsCurrent - row.pointsStart,
            color: row.teamColor,
          }))}
        />
      ) : null}

      {snapshot.teams.length > 0 ? (
        <ChampionshipStrip
          title="Constructors championship"
          items={snapshot.teams.map((row: TeamChampionshipRow) => ({
            key: row.teamName,
            label: row.teamName,
            sub: `P${row.positionCurrent}`,
            points: row.pointsCurrent,
            delta: row.pointsCurrent - row.pointsStart,
            color: row.teamColor,
          }))}
        />
      ) : null}

      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-subtle">
            <tr className="border-b border-border">
              <th className="px-3 py-3 text-left font-medium">P</th>
              <th className="px-3 py-3 text-left font-medium">Driver</th>
              <th className="hidden px-3 py-3 text-left font-medium sm:table-cell">
                Team
              </th>
              <th className="px-3 py-3 text-right font-medium">Lap</th>
              <th className="hidden px-3 py-3 text-right font-medium xl:table-cell">
                S1
              </th>
              <th className="hidden px-3 py-3 text-right font-medium xl:table-cell">
                S2
              </th>
              <th className="hidden px-3 py-3 text-right font-medium xl:table-cell">
                S3
              </th>
              <th className="px-3 py-3 text-right font-medium">Last</th>
              <th className="px-3 py-3 text-right font-medium">Gap</th>
              <th className="hidden px-3 py-3 text-right font-medium sm:table-cell">
                Int
              </th>
              <th className="hidden px-3 py-3 text-right font-medium lg:table-cell">
                Pits
              </th>
              <th className="px-3 py-3 text-center font-medium">Tyre</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-12 text-center text-muted">
                  No timing rows yet. When a session is open, positions appear
                  here.
                </td>
              </tr>
            ) : (
              snapshot.rows.map((row) => (
                <tr
                  key={row.driverNumber}
                  className="border-b border-border last:border-0"
                  style={{
                    background:
                      row.position === 1 ? "var(--leader)" : undefined,
                  }}
                >
                  <td className="px-3 py-2.5">
                    <PositionMark n={row.position} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-8 w-1.5 shrink-0 rounded-full"
                        style={{ background: teamSwatch(row.teamColor) }}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-mono text-xs text-subtle">
                            #{row.driverNumber}
                          </span>
                          {row.acronym && row.acronym !== String(row.driverNumber) ? (
                            <span className="font-display text-lg tracking-wide text-foreground">
                              {row.acronym}
                            </span>
                          ) : null}
                          <span className="text-sm text-foreground">{row.name}</span>
                        </div>
                        {row.teamName ? (
                          <div className="text-xs text-muted sm:hidden">
                            {row.teamName}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted sm:table-cell">
                    {row.teamName || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted">
                    {row.lapNumber ?? "—"}
                  </td>
                  <td className="hidden px-3 py-2.5 text-right font-mono text-subtle xl:table-cell">
                    {formatLapTime(row.sectors[0])}
                  </td>
                  <td className="hidden px-3 py-2.5 text-right font-mono text-subtle xl:table-cell">
                    {formatLapTime(row.sectors[1])}
                  </td>
                  <td className="hidden px-3 py-2.5 text-right font-mono text-subtle xl:table-cell">
                    {formatLapTime(row.sectors[2])}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-foreground">
                    {formatLapTime(row.lastLap)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-foreground">
                    {row.position === 1 ? "LEADER" : formatGap(row.gapToLeader)}
                  </td>
                  <td className="hidden px-3 py-2.5 text-right font-mono text-muted sm:table-cell">
                    {row.position === 1 ? "—" : formatGap(row.interval)}
                  </td>
                  <td className="hidden px-3 py-2.5 text-right font-mono text-muted lg:table-cell">
                    {row.pitCount || "—"}
                    {row.lastPit != null ? (
                      <span className="ml-1 text-[11px] text-subtle">
                        {row.lastPit.toFixed(1)}s
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`tyre ${tyreClass(row.tyre)}`}>
                      {tyreCode(row.tyre)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {snapshot.raceControl.length > 0 ? (
        <section className="panel p-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-subtle">
            Race control
          </p>
          <ul className="space-y-2.5 text-sm">
            {[...snapshot.raceControl].reverse().map((item, index) => (
              <li
                key={`${item.date}-${index}`}
                className="flex gap-3 text-foreground"
              >
                <span
                  className={`w-24 shrink-0 font-mono text-[11px] font-semibold ${flagTone(item.flag || item.category)}`}
                >
                  {item.flag || item.category || "MSG"}
                </span>
                <span className="text-muted">{item.message}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function isFinishedRace(snapshot: TimingSnapshot) {
  const label = `${snapshot.session?.type ?? ""} ${snapshot.session?.name ?? ""}`;
  if (!/race/i.test(label) || snapshot.rows.length < 3) return false;
  if (snapshot.mode === "live") return false;
  const total = snapshot.lap?.total;
  const current = snapshot.lap?.current;
  const distanceDone = total != null && current != null && current >= total;
  const chequered = /chequered|checkered/i.test(
    `${snapshot.lastFlag ?? ""} ${snapshot.trackStatus ?? ""}`,
  );
  return distanceDone || chequered;
}

function Podium({ rows }: { rows: TimingRow[] }) {
  const cards = [
    { row: rows[0], order: "order-1 sm:order-2 sm:-translate-y-1" },
    { row: rows[1], order: "order-2 sm:order-1 sm:translate-y-4" },
    { row: rows[2], order: "order-3 sm:order-3 sm:translate-y-6" },
  ];
  return (
    <section className="panel p-5 sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
        Podium
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end">
        {cards.map(({ row, order }) =>
          row ? (
            <div
              key={row.driverNumber}
              className={`rounded-2xl bg-surface-2 px-4 py-4 ${order}`}
              style={{ boxShadow: `inset 4px 0 0 ${teamSwatch(row.teamColor)}` }}
            >
              <div className="flex items-center gap-2">
                <PositionMark n={row.position} />
                <span className="font-display text-lg tracking-wide text-foreground">
                  {row.acronym && row.acronym !== String(row.driverNumber)
                    ? row.acronym
                    : row.name}
                </span>
              </div>
              <p className="mt-2 text-sm text-foreground">{row.name}</p>
              <p className="text-xs text-muted">{row.teamName || "—"}</p>
              <p className="mt-3 font-mono text-sm text-foreground">
                {row.position === 1 ? "Winner" : formatGap(row.gapToLeader)}
              </p>
            </div>
          ) : null,
        )}
      </div>
    </section>
  );
}

function PositionMark({ n }: { n: number }) {
  const tone =
    n === 1
      ? "bg-amber-400 text-zinc-950"
      : n === 2
        ? "bg-zinc-300 text-zinc-950"
        : n === 3
          ? "bg-amber-800 text-amber-50"
          : "bg-chip text-muted";
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs font-semibold ${tone}`}
    >
      {n}
    </span>
  );
}

function flagTone(flag?: string | null) {
  const value = (flag || "").toUpperCase();
  if (value.includes("GREEN") || value.includes("CLEAR")) {
    return "text-emerald-700 dark:text-emerald-400";
  }
  if (value.includes("YELLOW")) return "text-amber-700 dark:text-amber-400";
  if (value.includes("RED")) return "text-red-700 dark:text-red-400";
  if (value.includes("BLUE")) return "text-sky-700 dark:text-sky-400";
  return "text-subtle";
}

function fmtTemp(value: number | null) {
  return value == null ? "—" : `${value.toFixed(1)}°`;
}

function ChampionshipStrip({
  title,
  items,
}: {
  title: string;
  items: {
    key: string;
    label: string;
    sub: string;
    points: number;
    delta: number;
    color: string;
  }[];
}) {
  return (
    <section className="panel overflow-x-auto p-4">
      <p className="mb-3 px-1 text-[11px] uppercase tracking-[0.18em] text-subtle">
        {title}
      </p>
      <div className="flex min-w-max gap-2">
        {items.slice(0, 8).map((row) => (
          <div
            key={row.key}
            className="w-40 rounded-xl bg-surface-2 px-3 py-2.5"
            style={{ boxShadow: `inset 3px 0 0 ${teamSwatch(row.color)}` }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-subtle">{row.sub}</span>
              <span className="truncate font-display text-base tracking-wide text-foreground">
                {row.label}
              </span>
            </div>
            <div className="mt-1 font-mono text-lg text-foreground">
              {row.points}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
              {row.delta > 0 ? `+${row.delta} this race` : "no change yet"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
