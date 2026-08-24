import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function openf1Credentials() {
  const username = process.env.OPENF1_USERNAME?.trim() ?? "";
  const password = process.env.OPENF1_PASSWORD?.trim() ?? "";
  return {
    username,
    password,
    configured: Boolean(username && password),
  };
}

export function ingestPort() {
  const parsed = Number(process.env.INGEST_PORT ?? "4001");
  return Number.isFinite(parsed) ? parsed : 4001;
}

export function fixtureEnabled() {
  return process.env.OPENF1_USE_FIXTURE === "1";
}
