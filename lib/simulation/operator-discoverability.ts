import type { ScenarioDefinition } from "./scenarios";
import type { CommandResult, TerminalState } from "./types";

export type OperatorAuthorization = { allowed: boolean; unknown: string[] };
export type OperatorVisibleCredential = { username: string; scope: string; secret?: string | null };

const STANDARD_DIRECTORIES = new Set(["/", "/etc", "/home", "/opt", "/tmp", "/usr", "/var"]);
const UNQUOTED = /^["']|["']$/g;

function commandParts(command: string) {
  return command.trim().split(/\s+/).filter(Boolean).map((part) => part.replace(UNQUOTED, ""));
}

function normalizedPath(input: string, state: Pick<TerminalState, "currentPath" | "currentUser">) {
  const home = `/home/${state.currentUser}`;
  const expanded = input === "~" ? home : input.startsWith("~/") ? `${home}/${input.slice(2)}` : input;
  const source = expanded.startsWith("/") ? expanded : `${state.currentPath ?? home}/${expanded}`;
  const segments: string[] = [];
  for (const segment of source.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") segments.pop();
    else segments.push(segment);
  }
  return `/${segments.join("/")}`;
}

function urlParts(value: string) {
  const withoutProtocol = value.replace(/^https?:\/\//i, "");
  const slash = withoutProtocol.indexOf("/");
  return slash < 0
    ? { host: withoutProtocol, path: "/" }
    : { host: withoutProtocol.slice(0, slash), path: `/${withoutProtocol.slice(slash + 1)}` };
}

export class OperatorKnowledgeLedger {
  private observations: string[];
  private runtimeObservations: string[] = [];
  private observedPaths = new Set<string>();

  private constructor(seed: string[]) {
    this.observations = seed.map((value) => value.toLowerCase());
  }

  static fromScenario(definition: ScenarioDefinition) {
    const startingSession = definition.startingSession;
    const seed = [
      definition.briefing.red,
      ...definition.briefing.constraints,
      definition.objectiveSummary ?? "",
      definition.assistance.operatorAvailableAtStart ? definition.assistance.operator : "",
      ...definition.startingKnowledge.knownHosts,
      ...definition.startingKnowledge.knownAssets,
      ...(definition.facts ?? []).filter((fact) => fact.knownAtStart).map((fact) => fact.known),
      startingSession?.host ?? "",
      startingSession?.user ?? "",
      startingSession?.path ?? "/",
      ...definition.objectives.map((objective) => objective.label),
    ];
    const ledger = new OperatorKnowledgeLedger(seed);
    if (startingSession?.path) ledger.observePath(startingSession.host, startingSession.path);
    return ledger;
  }

  observeCredential(credential: OperatorVisibleCredential) {
    const observation = [
      `${credential.username}@${credential.scope}`,
      credential.username,
      credential.scope,
      credential.secret ?? "",
    ].filter(Boolean).join("\n").toLowerCase();
    this.observations.push(observation);
    this.runtimeObservations.push(observation);
  }

  authorize(command: string, state: TerminalState): OperatorAuthorization {
    const parts = commandParts(command);
    if (!parts.length) return { allowed: true, unknown: [] };
    if (state.context?.type === "AUTHENTICATING") {
      return this.resultFor(this.known(command.trim(), true) ? [] : [command.trim()]);
    }

    const [tool, ...args] = parts;
    const required: string[] = [];
    const requirePath = (value?: string) => {
      if (value && !this.pathKnown(value, state)) required.push(value);
    };
    const requireKnown = (value?: string) => {
      if (value && !this.known(value)) required.push(value);
    };

    if (["cat", "less", "retrieve"].includes(tool)) requirePath(args[0]);
    else if (tool === "ls" || tool === "cd") requirePath(args.find((argument) => argument !== "-l"));
    else if (tool === "grep") requirePath(args[1]);
    else if (tool === "find") {
      const nameIndex = args.indexOf("-name");
      requirePath(args.find((argument, index) => index !== nameIndex && index !== nameIndex + 1 && !argument.startsWith("-")));
      if (nameIndex >= 0) requireKnown(args[nameIndex + 1]);
    } else if (tool === "id") {
      if (args[0] && args[0] !== state.currentUser) requireKnown(args[0]);
    } else if (["ping", "nmap", "dig", "nslookup"].includes(tool)) requireKnown(args.find((argument) => !argument.startsWith("-")));
    else if (tool === "ssh") {
      const [username, host] = (args[0] ?? "").split("@");
      requireKnown(username);
      requireKnown(host);
    } else if (tool === "curl") {
      const target = args.find((argument, index) => !argument.startsWith("-") && args[index - 1] !== "-X" && args[index - 1] !== "--request" && args[index - 1] !== "-d" && args[index - 1] !== "--data");
      if (target) {
        const targetParts = urlParts(target);
        requireKnown(targetParts.host);
        if (targetParts.path !== "/" && !this.known(targetParts.path, true)) required.push(targetParts.path);
      }
      const dataIndex = Math.max(args.indexOf("-d"), args.indexOf("--data"));
      const data = dataIndex >= 0 ? args[dataIndex + 1] : undefined;
      for (const pair of data?.split("&") ?? []) {
        const [key, value] = pair.split("=");
        if (key && !this.known(key, true)) required.push(key);
        if (value && !this.known(value, true)) required.push(value);
      }
    } else if (tool === "psql") {
      for (const [flag, value] of [["-h", args[args.indexOf("-h") + 1]], ["-U", args[args.indexOf("-U") + 1]], ["-d", args[args.indexOf("-d") + 1]]] as const) {
        if (args.includes(flag) && value && (flag !== "-d" ? !this.known(value) : !this.known(value, true))) required.push(value);
      }
    } else if (tool === "\\c" || tool === "\\d") {
      if (args[0] && !this.known(args[0], true)) required.push(args[0]);
    }
    else if (tool.toUpperCase() === "SELECT") {
      const identifiers = command.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
      for (const identifier of identifiers.filter((value) => !["select", "from"].includes(value.toLowerCase()))) {
        if (!this.known(identifier, true)) required.push(identifier);
      }
    } else if (tool === "backup-sync" && !this.known(command.trim(), true)) required.push(command.trim());

    return this.resultFor(required);
  }

  record(command: string, stateBefore: TerminalState, result: CommandResult) {
    if (!result.success) return;
    if (result.output) {
      const observation = result.output.toLowerCase();
      this.observations.push(observation);
      this.runtimeObservations.push(observation);
    }
    if (result.currentPath) this.observePath(result.newSession?.machineId ?? stateBefore.currentMachine, result.currentPath);

    const parts = commandParts(command);
    if (parts[0] !== "ls") return;
    const requested = parts.slice(1).find((argument) => argument !== "-l") ?? ".";
    const directory = normalizedPath(requested, stateBefore);
    for (const line of result.output.split("\n")) {
      const printed = line.trim().split(/\s+/).at(-1)?.replace(/\/$/, "");
      if (!printed || printed === "(empty)") continue;
      const child = printed.startsWith("/") ? printed : normalizedPath(`${directory}/${printed}`, stateBefore);
      this.observePath(stateBefore.currentMachine, child);
    }
  }

  private known(value: string, runtimeOnly = false) {
    const needle = value.toLowerCase();
    const observations = runtimeOnly ? this.runtimeObservations : this.observations;
    return observations.some((observation) => observation.includes(needle));
  }

  private pathKnown(value: string, state: TerminalState) {
    if ([".", "..", "~", "~/"].includes(value)) return true;
    const path = normalizedPath(value, state);
    if (STANDARD_DIRECTORIES.has(path) || this.observedPaths.has(this.pathKey(state.currentMachine, path))) return true;
    const explicitPath = value.startsWith("/") || value.includes("/");
    return explicitPath && (this.known(value) || this.known(path));
  }

  private resultFor(required: string[]): OperatorAuthorization {
    const unknown = [...new Set(required.filter(Boolean))];
    return { allowed: unknown.length === 0, unknown };
  }

  private observePath(host: string, path: string) {
    this.observedPaths.add(this.pathKey(host, path));
  }

  private pathKey(host: string, path: string) {
    return `${host.toLowerCase()}:${path}`;
  }
}
