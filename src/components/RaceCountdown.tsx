"use client";

import { useEffect, useState } from "react";

function splitRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function RaceCountdown({
  targetIso,
  serverNow,
}: {
  targetIso: string;
  serverNow: number;
}) {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = new Date(targetIso).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return (
      <p className="font-display text-2xl tracking-tight text-foreground">
        Lights out
      </p>
    );
  }

  const parts = splitRemaining(remaining);
  const units = [
    [pad(parts.days), "Days"],
    [pad(parts.hours), "Hrs"],
    [pad(parts.minutes), "Min"],
    [pad(parts.seconds), "Sec"],
  ] as const;

  return (
    <div
      className="flex gap-3 sm:gap-4"
      suppressHydrationWarning
      aria-label={`Time until race: ${parts.days} days ${parts.hours} hours ${parts.minutes} minutes ${parts.seconds} seconds`}
    >
      {units.map(([value, label]) => (
        <div key={label} className="min-w-[3.25rem] text-center">
          <p className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            {value}
          </p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
