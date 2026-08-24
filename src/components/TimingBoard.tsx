"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatGap,
  formatLapTime,
  teamSwatch,
  tyreClass,
  tyreCode,
} from "@/lib/format";
import type { TeamChampionshipRow, TimingSnapshot } from "../../shared/timing";
import { emptySnapshot } from "../../shared/timing";

const WS_URL = process.env.NEXT_PUBLIC_INGEST_WS ?? "ws://localhost:4001";

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

    void loadHttp();
    connect();

    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, []);

  const modeLabel = useMemo(() => {
    if (snapshot.mode === "live") return "LIVE";
    if (snapshot.mode === "replay") return snapshot.source === "fixture" ? "SAMPLE" : "REPLAY";
    return "IDLE";
  }, [snapshot.mode, snapshot.source]);

  const weather = snapshot.weather;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/8 bg-[#12141b] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              {snapshot.meeting?.country || "Session"}
            </p>
            <h1 className="font-display text-3xl tracking-tight text-zinc-50 sm:text-4xl">
              {snapshot.meeting?.name ?? "Waiting for a session"}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {snapshot.session?.name ?? "No OpenF1 session loaded"}
              {snapshot.lap
                ? ` · Lap ${snapshot.lap.current}${snapshot.lap.total ? ` / ${snapshot.lap.total}` : ""}`
                : ""}
              {snapshot.lastFlag ? ` · ${snapshot.lastFlag}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                snapshot.mode === "live"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : snapshot.mode === "replay"
                    ? "bg-sky-500/15 text-sky-300"
                    : "bg-zinc-700/50 text-zinc-300"
              }`}
            >
              {modeLabel}
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400">
              {connected ? "socket" : "http"} · {snapshot.source}
              {snapshot.authenticated ? " · auth" : ""}
            </span>
          </div>
        </div>
        {weather ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
            <Chip label={`Air ${fmtTemp(weather.airTemp)}`} />
            <Chip label={`Track ${fmtTemp(weather.trackTemp)}`} />
            <Chip label={weather.rainfall && weather.rainfall > 0 ? `Rain ${weather.rainfall}` : "Dry"} />
            {weather.windSpeed != null ? <Chip label={`Wind ${weather.windSpeed.toFixed(1)} m/s`} /> : null}
            {weather.humidity != null ? <Chip label={`RH ${Math.round(weather.humidity)}%`} /> : null}
          </div>
        ) : null}
        {snapshot.notice ? (
          <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-sm text-amber-100/90">
            {snapshot.notice}
          </p>
        ) : null}
      </section>

      {snapshot.championship.length > 0 ? (
        <ChampionshipStrip
          title="Drivers championship"
          items={snapshot.championship.map((row) => ({
            key: String(row.driverNumber),
            label: row.acronym,
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

      <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#12141b]">
        <table className="w-full border-collapse text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            <tr className="border-b border-white/8">
              <th className="px-3 py-2 text-left font-medium">P</th>
              <th className="px-3 py-2 text-left font-medium">Driver</th>
              <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Team</th>
              <th className="px-3 py-2 text-right font-medium">Lap</th>
              <th className="hidden px-3 py-2 text-right font-medium xl:table-cell">S1</th>
              <th className="hidden px-3 py-2 text-right font-medium xl:table-cell">S2</th>
              <th className="hidden px-3 py-2 text-right font-medium xl:table-cell">S3</th>
              <th className="px-3 py-2 text-right font-medium">Last</th>
              <th className="px-3 py-2 text-right font-medium">Gap</th>
              <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Int</th>
              <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">Pits</th>
              <th className="px-3 py-2 text-center font-medium">Tyre</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-10 text-center text-zinc-500">
                  No timing rows yet. When a session is open, positions appear here.
                </td>
              </tr>
            ) : (
              snapshot.rows.map((row) => (
                <tr key={row.driverNumber} className="border-b border-white/5 last:border-0">
                  <td className="px-3 py-2 font-mono text-zinc-300">{row.position}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-1.5 rounded-full"
                        style={{ background: teamSwatch(row.teamColor) }}
                      />
                      <span className="font-mono text-zinc-100">{row.acronym}</span>
                      <span className="hidden text-zinc-400 lg:inline">{row.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 text-zinc-400 md:table-cell">{row.teamName}</td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-300">
                    {row.lapNumber ?? "—"}
                  </td>
                  <td className="hidden px-3 py-2 text-right font-mono text-zinc-500 xl:table-cell">
                    {formatLapTime(row.sectors[0])}
                  </td>
                  <td className="hidden px-3 py-2 text-right font-mono text-zinc-500 xl:table-cell">
                    {formatLapTime(row.sectors[1])}
                  </td>
                  <td className="hidden px-3 py-2 text-right font-mono text-zinc-500 xl:table-cell">
                    {formatLapTime(row.sectors[2])}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-100">
                    {formatLapTime(row.lastLap)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-300">
                    {row.position === 1 ? "LEADER" : formatGap(row.gapToLeader)}
                  </td>
                  <td className="hidden px-3 py-2 text-right font-mono text-zinc-400 sm:table-cell">
                    {row.position === 1 ? "—" : formatGap(row.interval)}
                  </td>
                  <td className="hidden px-3 py-2 text-right font-mono text-zinc-400 lg:table-cell">
                    {row.pitCount || "—"}
                    {row.lastPit != null ? (
                      <span className="ml-1 text-[11px] text-zinc-600">
                        {row.lastPit.toFixed(1)}s
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`tyre ${tyreClass(row.tyre)}`}>{tyreCode(row.tyre)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {snapshot.raceControl.length > 0 ? (
        <section className="rounded-2xl border border-white/8 bg-[#12141b] p-4">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Race control
          </p>
          <ul className="space-y-2 text-sm">
            {[...snapshot.raceControl].reverse().map((item, index) => (
              <li key={`${item.date}-${index}`} className="flex gap-3 text-zinc-300">
                <span className="w-20 shrink-0 font-mono text-[11px] text-zinc-500">
                  {item.flag || item.category || "MSG"}
                </span>
                <span>{item.message}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/5 px-2.5 py-1 text-zinc-300">{label}</span>
  );
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
    <section className="overflow-x-auto rounded-2xl border border-white/8 bg-[#12141b] p-3">
      <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      <div className="flex min-w-max gap-2">
        {items.slice(0, 8).map((row) => (
          <div
            key={row.key}
            className="w-36 rounded-xl bg-black/30 px-3 py-2"
            style={{ boxShadow: `inset 3px 0 0 ${teamSwatch(row.color)}` }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-zinc-500">{row.sub}</span>
              <span className="truncate font-mono text-sm text-zinc-100">{row.label}</span>
            </div>
            <div className="mt-1 font-mono text-lg text-zinc-50">{row.points}</div>
            <div className="text-[11px] text-emerald-400">
              {row.delta > 0 ? `+${row.delta} this race` : "no change yet"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
