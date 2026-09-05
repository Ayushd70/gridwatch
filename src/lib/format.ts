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

/** Display clocks in India Standard Time. */
export const DISPLAY_TIME_ZONE = "Asia/Kolkata";

const istDate = {
  timeZone: DISPLAY_TIME_ZONE,
} as const;

export function teamSwatch(color: string) {
  const hex = color.replace("#", "");
  return `#${hex}`;
}

export function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${new Intl.DateTimeFormat("en-IN", {
    ...istDate,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)} IST`;
}

export function formatDay(isoOrDate: string | null | undefined) {
  if (!isoOrDate) return "—";
  const date = new Date(
    isoOrDate.includes("T") ? isoOrDate : `${isoOrDate}T12:00:00Z`,
  );
  if (Number.isNaN(date.getTime())) return isoOrDate;
  return new Intl.DateTimeFormat("en-IN", {
    ...istDate,
    dateStyle: "medium",
  }).format(date);
}

export function formatSessionWhen(iso: string | Date) {
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${new Intl.DateTimeFormat("en-IN", {
    ...istDate,
    hour: "numeric",
    minute: "2-digit",
  }).format(date)} IST`;
}

export function formatIstWeekday(iso: string | Date) {
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    ...istDate,
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function istDayKey(iso: string | Date) {
  const date = iso instanceof Date ? iso : new Date(iso);
  return new Intl.DateTimeFormat("en-CA", {
    ...istDate,
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
