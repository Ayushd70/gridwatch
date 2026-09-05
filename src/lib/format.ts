export function formatLapTime(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const mins = Math.floor(seconds / 60);
  const rest = seconds - mins * 60;
  const body = rest.toFixed(3).padStart(6, "0");
  return mins > 0 ? `${mins}:${body}` : body;
}

export function formatGap(value: number | string | null | undefined) {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "LEADER";
  return `+${n.toFixed(3)}`;
}

export function tyreCode(compound: string | null | undefined) {
  if (!compound) return "—";
  const key = compound.toUpperCase();
  if (key.startsWith("SOFT")) return "S";
  if (key.startsWith("MED")) return "M";
  if (key.startsWith("HARD")) return "H";
  if (key.startsWith("INTER")) return "I";
  if (key.startsWith("WET")) return "W";
  return key.slice(0, 1);
}

export function tyreClass(compound: string | null | undefined) {
  const code = tyreCode(compound);
  if (code === "S") return "tyre-soft";
  if (code === "M") return "tyre-med";
  if (code === "H") return "tyre-hard";
  if (code === "I") return "tyre-inter";
  if (code === "W") return "tyre-wet";
  return "tyre-unknown";
}

export const TIME_ZONE_COOKIE = "gridwatch-tz";

export function viewerTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidTimeZone(zone: string) {
  if (!/^[A-Za-z0-9_+\-/]{1,80}$/.test(zone)) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone }).format();
    return true;
  } catch {
    return false;
  }
}

export function sanitizeTimeZone(zone?: string | null) {
  if (!zone) return "UTC";
  return isValidTimeZone(zone) ? zone : "UTC";
}

export function teamSwatch(color: string) {
  const hex = color.replace("#", "");
  return `#${hex}`;
}

function asDate(iso: string | Date) {
  return iso instanceof Date ? iso : new Date(iso);
}

export function formatWhen(
  iso: string | null | undefined,
  timeZone = "UTC",
) {
  if (!iso) return "—";
  const date = asDate(iso);
  if (Number.isNaN(date.getTime())) return typeof iso === "string" ? iso : "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: sanitizeTimeZone(timeZone),
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function formatDay(
  isoOrDate: string | null | undefined,
  timeZone = "UTC",
) {
  if (!isoOrDate) return "—";
  const date = new Date(
    isoOrDate.includes("T") ? isoOrDate : `${isoOrDate}T12:00:00Z`,
  );
  if (Number.isNaN(date.getTime())) return isoOrDate;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: sanitizeTimeZone(timeZone),
    dateStyle: "medium",
  }).format(date);
}

export function formatSessionWhen(iso: string | Date, timeZone = "UTC") {
  const date = asDate(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: sanitizeTimeZone(timeZone),
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function formatWeekday(iso: string | Date, timeZone = "UTC") {
  const date = asDate(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: sanitizeTimeZone(timeZone),
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function dayKey(iso: string | Date, timeZone = "UTC") {
  const date = asDate(iso);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: sanitizeTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatChampionshipGap(
  gap: number,
  kind: "leader" | "interval",
) {
  if (gap === 0) return kind === "leader" ? "LEADER" : "—";
  const pretty = Number.isInteger(gap) ? String(gap) : gap.toFixed(1);
  return `-${pretty}`;
}
