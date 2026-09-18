import type { TerminalContext } from "./types";

export type SimulationIntent =
  | { kind: "SHELL"; command: string; args: string[] }
  | { kind: "CURL_REQUEST"; url?: string; method: string; data?: string }
  | { kind: "SERVICE_OPERATION"; service: string; args: string[] }
  | { kind: "PSQL_CONNECT"; host: string; username: string; database?: string; password?: string }
  | { kind: "PSQL_INPUT"; input: string }
  | { kind: "AUTHENTICATION_INPUT"; password: string };

/**
 * Parses only ROOT's supported syntax. It deliberately never invokes a host
 * binary or a network client; the engine resolves every intent against the
 * simulated world.
 */
export function parseTerminalInput(input: string, context: TerminalContext = { type: "UNIX" }): SimulationIntent {
  const trimmed = input.trim();
  if (context.type === "AUTHENTICATING") return { kind: "AUTHENTICATION_INPUT", password: input };
  if (context.type === "POSTGRES") return { kind: "PSQL_INPUT", input: trimmed };

  const [command = "", ...args] = trimmed.split(/\s+/);
  if (command.toLowerCase() === "curl") {
    let method = "GET";
    let explicitMethod = false;
    let data: string | undefined;
    let url: string | undefined;
    for (let index = 0; index < args.length; index += 1) {
      const value = args[index];
      if (value === "-X" || value === "--request") { method = (args[++index] ?? "GET").toUpperCase(); explicitMethod = true; }
      else if (value === "-d" || value === "--data") data = (args[++index] ?? "").replace(/^([\"'])(.*)\1$/, "$2");
      else if (!value.startsWith("-")) url ??= value;
    }
    if (data !== undefined && !explicitMethod) method = "POST";
    return { kind: "CURL_REQUEST", url, method, data };
  }
  if (command.toLowerCase() === "backup-sync") return { kind: "SERVICE_OPERATION", service: "backup-sync", args };
  if (command.toLowerCase() !== "psql") return { kind: "SHELL", command: command.toLowerCase(), args };

  let host: string | undefined;
  let username: string | undefined;
  let database: string | undefined;
  let password: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "-h") host = args[++index];
    else if (value === "-U") username = args[++index];
    else if (value === "-d") database = args[++index];
    else if (value.startsWith("--password=")) password = value.slice("--password=".length);
    else if (value === "--password") password = args[++index];
  }
  if (!host || !username) return { kind: "SHELL", command: "psql", args };
  return { kind: "PSQL_CONNECT", host, username, database, password };
}

export const psqlUsage = "Usage: psql -h HOST -U USER [-d DATABASE] [--password SECRET]\n  Omit -d to connect and list databases with \\l once authenticated.";
