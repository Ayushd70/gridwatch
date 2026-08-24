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
  if (value === 0) return "LEADER";
  return `+${value.toFixed(3)}`;
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

export function teamSwatch(color: string) {
  const hex = color.replace("#", "");
  return `#${hex}`;
}

export function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
