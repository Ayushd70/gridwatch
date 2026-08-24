import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import mqtt from "mqtt";
import { WebSocketServer, type WebSocket } from "ws";
import {
  ingestPort,
  loadEnvFile,
  openf1Credentials,
  fixtureEnabled,
} from "./env";
import { fillStoreFromRest } from "./bootstrap";
import { sampleSnapshot } from "./fixture";
import {
  fetchOpenF1Token,
  OpenF1Error,
  openf1Get,
  sleep,
  type OpenF1Championship,
  type OpenF1Driver,
  type OpenF1Interval,
  type OpenF1Lap,
  type OpenF1Meeting,
  type OpenF1Pit,
  type OpenF1Position,
  type OpenF1RaceControl,
  type OpenF1Session,
  type OpenF1Stint,
  type OpenF1TeamChampionship,
  type OpenF1Weather,
} from "./openf1";
import { TimingStore } from "./state";

loadEnvFile();

const TOPICS = [
  "v1/position",
  "v1/intervals",
  "v1/laps",
  "v1/drivers",
  "v1/race_control",
  "v1/stints",
  "v1/pit",
  "v1/weather",
  "v1/championship_drivers",
  "v1/championship_teams",
  "v1/sessions",
  "v1/meetings",
];

const store = new TimingStore();
const sockets = new Set<WebSocket>();
let accessToken: string | null = null;
let mqttClient: mqtt.MqttClient | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function broadcast() {
  const payload = JSON.stringify({ type: "snapshot", payload: store.get() });
  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) socket.send(payload);
  }
}

store.subscribe(() => broadcast());

async function refreshToken() {
  const creds = openf1Credentials();
  if (!creds.configured) {
    accessToken = null;
    store.setMeta({ authenticated: false });
    return null;
  }
  const token = await fetchOpenF1Token(creds.username, creds.password);
  accessToken = token.accessToken;
  store.setMeta({ authenticated: true });
  console.log("OpenF1 token refreshed");
  return token.expiresIn;
}

function applyMqttMessage(topic: string, raw: Buffer) {
  let data: unknown;
  try {
    data = JSON.parse(raw.toString());
  } catch {
    return;
  }
  const items = Array.isArray(data) ? data : [data];
  switch (topic) {
    case "v1/sessions":
      store.applySession(items[0] as OpenF1Session, "mqtt");
      break;
    case "v1/meetings":
      store.applyMeeting(items[0] as OpenF1Meeting, "mqtt");
      break;
    case "v1/drivers":
      store.applyDrivers(items as OpenF1Driver[], "mqtt");
      break;
    case "v1/position":
      store.applyPositions(items as OpenF1Position[], "mqtt");
      break;
    case "v1/intervals":
      store.applyIntervals(items as OpenF1Interval[], "mqtt");
      break;
    case "v1/laps":
      store.applyLaps(items as OpenF1Lap[], "mqtt");
      break;
    case "v1/stints":
      store.applyStints(items as OpenF1Stint[], "mqtt");
      break;
    case "v1/race_control":
      store.applyRaceControl(items as OpenF1RaceControl[], "mqtt");
      break;
    case "v1/championship_drivers":
      store.applyChampionship(items as OpenF1Championship[], "mqtt");
      break;
    case "v1/championship_teams":
      store.applyTeamChampionship(items as OpenF1TeamChampionship[], "mqtt");
      break;
    case "v1/pit":
      store.applyPits(items as OpenF1Pit[], "mqtt");
      break;
    case "v1/weather":
      store.applyWeather(items as OpenF1Weather[], "mqtt");
      break;
    default:
      break;
  }
}

async function connectMqtt() {
  if (!accessToken) return;
  if (mqttClient) {
    mqttClient.end(true);
    mqttClient = null;
  }
  const client = mqtt.connect("mqtts://mqtt.openf1.org:8883", {
    username: "gridwatch",
    password: accessToken,
    protocolVersion: 4,
    reconnectPeriod: 5000,
  });
  mqttClient = client;
  client.on("connect", () => {
    console.log("Connected to OpenF1 MQTT");
    client.subscribe(TOPICS, (error) => {
      if (error) console.error("MQTT subscribe failed", error);
    });
    store.setMeta({
      source: "mqtt",
      notice: "Live MQTT feed connected.",
      restricted: false,
    });
  });
  client.on("message", (topic, payload) => applyMqttMessage(topic, payload));
  client.on("error", (error) => {
    console.error("MQTT error", error.message);
  });
  client.on("close", () => {
    console.log("MQTT connection closed");
  });
}

async function bootstrapRest() {
  return fillStoreFromRest(store, { token: accessToken ?? undefined });
}

async function pollLiveRest() {
  if (store.get().mode !== "live") return;
  if (!accessToken && store.get().restricted) return;
  const sessionKey = store.get().session?.key;
  if (sessionKey == null || sessionKey === "fixture") return;
  const token = accessToken ?? undefined;
  try {
    const positions = await openf1Get<OpenF1Position[]>(
      `/v1/position?session_key=${sessionKey}`,
      token,
    );
    store.applyPositions(positions, "rest");
    await sleep(400);
    const intervals = await openf1Get<OpenF1Interval[]>(
      `/v1/intervals?session_key=${sessionKey}`,
      token,
    );
    store.applyIntervals(intervals, "rest");
  } catch (error) {
    if (error instanceof OpenF1Error && error.restricted) {
      store.setMeta({ restricted: true });
    } else {
      console.warn("live poll failed", error);
    }
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (store.get().source === "mqtt") return;
    void pollLiveRest();
  }, 12_000);
}

async function startIngest() {
  if (fixtureEnabled()) {
    store.replaceSnapshot(sampleSnapshot());
    return;
  }

  try {
    await refreshToken();
  } catch (error) {
    console.error("OpenF1 login failed", error);
    store.setMeta({
      authenticated: false,
      notice:
        "OpenF1 credentials were rejected. Using historical REST or the sample board.",
    });
  }

  const ok = await bootstrapRest();
  if (accessToken) {
    await connectMqtt();
  } else if (!ok) {
    store.replaceSnapshot(sampleSnapshot());
  }
  startPolling();

  setInterval(() => {
    void refreshToken()
      .then(() => {
        if (accessToken) return connectMqtt();
      })
      .catch((error) => console.error("token refresh failed", error));
  }, 50 * 60 * 1000);
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(json);
}

function handleHttp(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    });
    res.end();
    return;
  }
  if (url.pathname === "/health") {
    sendJson(res, 200, { ok: true, ingest: store.get().source });
    return;
  }
  if (url.pathname === "/snapshot") {
    sendJson(res, 200, store.get());
    return;
  }
  sendJson(res, 404, { error: "not found" });
}

const port = ingestPort();
const httpServer = createServer(handleHttp);
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket) => {
  sockets.add(socket);
  socket.send(JSON.stringify({ type: "snapshot", payload: store.get() }));
  socket.on("close", () => sockets.delete(socket));
});

httpServer.listen(port, () => {
  console.log(`Gridwatch ingest listening on http://localhost:${port}`);
  void startIngest();
});
