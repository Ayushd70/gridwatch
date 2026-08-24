const OPENF1 = "https://api.openf1.org";

export class OpenF1Error extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly restricted: boolean,
  ) {
    super(message);
  }
}

export async function fetchOpenF1Token(
  username: string,
  password: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch(`${OPENF1}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenF1 token failed (${response.status}): ${body}`);
  }
  const data = (await response.json()) as {
    access_token: string;
    expires_in: string | number;
  };
  return {
    accessToken: data.access_token,
    expiresIn: Number(data.expires_in) || 3600,
  };
}

export async function openf1Get<T>(
  path: string,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${OPENF1}${path}`, { headers });
  const text = await response.text();
  if (!response.ok) {
    const restricted =
      response.status === 401 ||
      response.status === 403 ||
      text.toLowerCase().includes("live f1 session") ||
      text.toLowerCase().includes("authenticated");
    throw new OpenF1Error(
      `OpenF1 ${path} failed (${response.status}): ${text.slice(0, 240)}`,
      response.status,
      restricted,
    );
  }
  return JSON.parse(text) as T;
}

export type OpenF1Session = {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end?: string | null;
  location?: string;
  country_name?: string;
  circuit_short_name?: string;
  year?: number;
};

export type OpenF1Meeting = {
  meeting_key: number;
  meeting_name: string;
  location?: string;
  country_name?: string;
  year?: number;
};

export type OpenF1Driver = {
  driver_number: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name_acronym?: string;
  team_name?: string;
  team_colour?: string;
  session_key?: number;
};

export type OpenF1Position = {
  driver_number: number;
  position: number;
  date?: string;
  session_key?: number;
};

export type OpenF1Interval = {
  driver_number: number;
  gap_to_leader?: number | string | null;
  interval?: number | string | null;
  date?: string;
};

export type OpenF1Lap = {
  driver_number: number;
  lap_number?: number;
  lap_duration?: number | null;
  duration_sector_1?: number | null;
  duration_sector_2?: number | null;
  duration_sector_3?: number | null;
  date_start?: string;
};

export type OpenF1Stint = {
  driver_number: number;
  stint_number?: number;
  compound?: string | null;
  lap_start?: number;
  lap_end?: number | null;
};

export type OpenF1RaceControl = {
  date?: string;
  flag?: string | null;
  message?: string;
  category?: string | null;
  driver_number?: number | null;
};

export type OpenF1Championship = {
  driver_number: number;
  points_current?: number;
  points_start?: number;
  position_current?: number;
  position_start?: number;
};

export type OpenF1TeamChampionship = {
  team_name: string;
  points_current?: number;
  points_start?: number;
  position_current?: number;
  position_start?: number;
};

export type OpenF1Weather = {
  date?: string;
  air_temperature?: number;
  track_temperature?: number;
  humidity?: number;
  rainfall?: number;
  wind_speed?: number;
};

export type OpenF1Pit = {
  driver_number: number;
  date?: string;
  lap_number?: number;
  pit_duration?: number | null;
};

export type OpenF1SessionResult = {
  driver_number: number;
  position: number | null;
  number_of_laps?: number | null;
  gap_to_leader?: number | string | null;
  duration?: number | null;
  dnf?: boolean;
  dns?: boolean;
  dsq?: boolean;
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
