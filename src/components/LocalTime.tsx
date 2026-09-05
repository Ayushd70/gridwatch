"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  formatDay,
  formatSessionWhen,
  formatWeekday,
  formatWhen,
  sanitizeTimeZone,
  TIME_ZONE_COOKIE,
  viewerTimeZone,
} from "@/lib/format";

const TimeZoneContext = createContext("UTC");

export function TimeZoneProvider({
  timeZone,
  children,
}: {
  timeZone: string;
  children: ReactNode;
}) {
  const initial = sanitizeTimeZone(timeZone);
  const [zone, setZone] = useState(initial);

  useEffect(() => {
    const actual = viewerTimeZone();
    if (actual === zone) return;
    setZone(actual);
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(actual)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [zone]);

  return (
    <TimeZoneContext.Provider value={zone}>{children}</TimeZoneContext.Provider>
  );
}

export function useTimeZone() {
  return useContext(TimeZoneContext);
}

export function LocalTime({
  iso,
  kind = "when",
  className,
}: {
  iso: string | Date | null | undefined;
  kind?: "when" | "day" | "session" | "weekday";
  className?: string;
}) {
  const timeZone = useTimeZone();
  if (iso == null || iso === "") return "—";
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return typeof iso === "string" ? iso : "—";

  const text =
    kind === "day"
      ? formatDay(typeof iso === "string" ? iso : iso.toISOString(), timeZone)
      : kind === "session"
        ? formatSessionWhen(date, timeZone)
        : kind === "weekday"
          ? formatWeekday(date, timeZone)
          : formatWhen(date.toISOString(), timeZone);

  return (
    <time
      dateTime={date.toISOString()}
      className={className}
      suppressHydrationWarning
    >
      {text}
    </time>
  );
}
