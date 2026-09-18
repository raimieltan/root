import type { TerminalContext } from "./types";

export type SimulationIntent =
  | { kind: "SHELL"; command: string; args: string[] }
  | { kind: "PSQL_CONNECT"; host: string; username: string; database: string; password?: string }
  | { kind: "PSQL_INPUT"; input: string };

/**
 * Parses only ROOT's supported syntax. It deliberately never invokes a host
 * binary or a network client; the engine resolves every intent against the
 * simulated world.
 */
export function parseTerminalInput(input: string, context: TerminalContext = { type: "UNIX" }): SimulationIntent {
  const trimmed = input.trim();
  if (context.type === "POSTGRES") return { kind: "PSQL_INPUT", input: trimmed };

  const [command = "", ...args] = trimmed.split(/\s+/);
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
  if (!host || !username || !database) return { kind: "SHELL", command: "psql", args };
  return { kind: "PSQL_CONNECT", host, username, database, password };
}

export const psqlUsage = "Usage: psql -h HOST -U USER -d DATABASE --password SECRET";
