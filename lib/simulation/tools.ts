import type { CommandResult, TerminalContext, TerminalState } from "./types";

export type ShellIntent = { kind: "SHELL"; command: string; args: string[] };
export type CurlIntent = { kind: "CURL_REQUEST"; url?: string; method: string; data?: string };
export type ServiceIntent = { kind: "SERVICE_OPERATION"; service: string; args: string[] };
export type PostgresConnectIntent = { kind: "PSQL_CONNECT"; host: string; username: string; database?: string; password?: string };
export type PostgresInputIntent = { kind: "PSQL_INPUT"; input: string };
export type AuthenticationIntent = { kind: "AUTHENTICATION_INPUT"; password: string };

export type SimulationIntent = ShellIntent | CurlIntent | ServiceIntent | PostgresConnectIntent | PostgresInputIntent | AuthenticationIntent;
export type ToolFamily = "shell" | "network" | "service" | "database" | "authentication" | "system";
export type Detectability = "NONE" | "CONTROL_DEPENDENT" | "ALWAYS";
export type ReplayEffect = "NONE" | "EVENTS" | "STATE_AND_EVENTS";

export type ToolContract = {
  id: string;
  family: ToolFamily;
  syntax: string;
  permissions: string[];
  resources: string[];
  outcomes: string[];
  telemetry: string[];
  detectability: Detectability;
  blueResponses: string[];
  replay: ReplayEffect;
};

export type ToolAdapter = {
  contract: ToolContract;
  canHandle(input: string, context: TerminalContext): boolean;
  parse(input: string, context: TerminalContext): SimulationIntent;
  validate(intent: SimulationIntent): string | null;
  execute(intent: SimulationIntent, state: TerminalState): Promise<CommandResult>;
};

type MaybePromise<T> = T | Promise<T>;
type ShellHandler = (args: string[], state: TerminalState) => MaybePromise<CommandResult>;

export type ToolExecutionHandlers = {
  invalid(message: string): CommandResult;
  shell: Record<string, ShellHandler>;
  unknown(command: string): CommandResult;
  curl(intent: CurlIntent, state: TerminalState): Promise<CommandResult>;
  service(intent: ServiceIntent, state: TerminalState): Promise<CommandResult>;
  postgresConnect(intent: PostgresConnectIntent, state: TerminalState): Promise<CommandResult>;
  postgresInput(input: string, state: TerminalState): Promise<CommandResult>;
  authenticate(password: string, state: TerminalState): Promise<CommandResult>;
};

const contextOf = (context?: TerminalContext): TerminalContext => context ?? { type: "UNIX" };
const commandOf = (input: string) => input.trim().split(/\s+/, 1)[0]?.toLowerCase() ?? "";
const argsOf = (input: string) => input.trim().split(/\s+/).slice(1);
const valid = () => null;

const passive = (id: string, family: ToolFamily, syntax: string, resources: string[] = []): ToolContract => ({
  id, family, syntax, permissions: ["active session"], resources, outcomes: ["bounded simulated output"], telemetry: ["TOOL_EXECUTED"],
  detectability: "NONE", blueResponses: [], replay: "EVENTS",
});

const observable = (contract: Omit<ToolContract, "detectability" | "replay"> & Partial<Pick<ToolContract, "detectability" | "replay">>): ToolContract => ({
  ...contract, detectability: contract.detectability ?? "CONTROL_DEPENDENT", replay: contract.replay ?? "EVENTS",
});

type ShellDefinition = { command: string; contract: ToolContract; validate?: (args: string[]) => string | null };

const shellDefinitions: ShellDefinition[] = [
  { command: "help", contract: passive("shell.help", "shell", "help [command]") },
  { command: "clear", contract: passive("shell.clear", "shell", "clear") },
  { command: "whoami", contract: passive("shell.whoami", "shell", "whoami", ["session identity"]) },
  { command: "id", contract: passive("shell.id", "shell", "id [username]", ["local identities", "groups", "privilege"]) },
  { command: "env", contract: passive("shell.env", "shell", "env", ["session environment"]) },
  { command: "hostname", contract: passive("shell.hostname", "shell", "hostname", ["machine identity"]) },
  { command: "pwd", contract: passive("shell.pwd", "shell", "pwd", ["session working directory"]) },
  { command: "cd", contract: passive("shell.cd", "shell", "cd [path]", ["session working directory"]) },
  { command: "ls", contract: passive("shell.ls", "shell", "ls [-l] [path]", ["filesystem metadata"]) },
  { command: "cat", contract: observable({ id: "shell.cat", family: "shell", syntax: "cat <file>", permissions: ["filesystem read permission"], resources: ["file", "credential discovery", "scenario fact"], outcomes: ["resource contents", "discovery"], telemetry: ["FILE_READ", "SENSITIVE_FILE_READ", "CREDENTIAL_DISCOVERED", "FACT_DISCOVERED"], blueResponses: ["ISOLATE_HOST", "RESET_PASSWORD", "DISABLE_ACCOUNT"] }), validate: (args) => args[0] ? null : "Usage: cat <file>" },
  { command: "less", contract: observable({ id: "shell.less", family: "shell", syntax: "less <file>", permissions: ["filesystem read permission"], resources: ["file", "credential discovery", "scenario fact"], outcomes: ["resource contents", "discovery"], telemetry: ["FILE_READ", "SENSITIVE_FILE_READ", "CREDENTIAL_DISCOVERED", "FACT_DISCOVERED"], blueResponses: ["ISOLATE_HOST", "RESET_PASSWORD", "DISABLE_ACCOUNT"] }), validate: (args) => args[0] ? null : "Usage: less <file>" },
  { command: "grep", contract: observable({ id: "shell.grep", family: "shell", syntax: "grep <text> [path]", permissions: ["filesystem read permission"], resources: ["file contents"], outcomes: ["matching readable lines", "discovery"], telemetry: ["FILE_READ", "SENSITIVE_FILE_READ", "CREDENTIAL_DISCOVERED", "FACT_DISCOVERED"], blueResponses: ["ISOLATE_HOST", "RESET_PASSWORD"] }), validate: (args) => args[0] ? null : "Usage: grep <text> [path]" },
  { command: "find", contract: passive("shell.find", "shell", "find [path] -name <name>", ["readable filesystem metadata"]) },
  { command: "retrieve", contract: observable({ id: "shell.retrieve", family: "shell", syntax: "retrieve <file>", permissions: ["filesystem read permission", "declared objective resource"], resources: ["objective file"], outcomes: ["objective retrieved", "operation result"], telemetry: ["SENSITIVE_FILE_READ", "OBJECTIVE_RETRIEVED"], detectability: "ALWAYS", blueResponses: ["ISOLATE_HOST", "BLOCK_CONNECTION", "RESET_PASSWORD"], replay: "STATE_AND_EVENTS" }), validate: (args) => args[0] ? null : "Usage: retrieve <file>" },
  { command: "ps", contract: observable({ id: "shell.ps", family: "system", syntax: "ps", permissions: ["active host session"], resources: ["process table", "process-backed discoveries"], outcomes: ["process inventory", "discovery"], telemetry: ["FACT_DISCOVERED", "CREDENTIAL_DISCOVERED"], blueResponses: ["TERMINATE_PROCESS", "ISOLATE_HOST"] }) },
  { command: "ip", contract: passive("network.ip", "network", "ip", ["network interface"]) },
  { command: "ping", contract: observable({ id: "network.ping", family: "network", syntax: "ping <host>", permissions: ["reachable network path"], resources: ["network connection"], outcomes: ["reachability result"], telemetry: ["PING"], blueResponses: ["BLOCK_CONNECTION", "ISOLATE_HOST"] }), validate: (args) => args[0] ? null : "Usage: ping <host>" },
  { command: "nmap", contract: observable({ id: "network.nmap", family: "network", syntax: "nmap <host>", permissions: ["reachable network path"], resources: ["running services", "network connection"], outcomes: ["service inventory", "host discovery"], telemetry: ["PORT_PROBE", "PORT_SCAN_DETECTED", "HOST_DISCOVERED"], detectability: "ALWAYS", blueResponses: ["BLOCK_CONNECTION", "ISOLATE_HOST", "INCREASE_MONITORING"] }), validate: (args) => args[0] ? null : "Usage: nmap <host>" },
  { command: "dig", contract: observable({ id: "network.dig", family: "network", syntax: "dig <name>", permissions: ["active host session"], resources: ["dns record"], outcomes: ["dns answer", "discovery"], telemetry: ["DNS_QUERY", "FACT_DISCOVERED", "HOST_DISCOVERED"], blueResponses: ["INCREASE_MONITORING"] }), validate: (args) => args.find((arg) => !arg.startsWith("-")) ? null : "Usage: dig <name>" },
  { command: "nslookup", contract: observable({ id: "network.nslookup", family: "network", syntax: "nslookup <name>", permissions: ["active host session"], resources: ["dns record"], outcomes: ["dns answer", "discovery"], telemetry: ["DNS_QUERY", "FACT_DISCOVERED", "HOST_DISCOVERED"], blueResponses: ["INCREASE_MONITORING"] }), validate: (args) => args.find((arg) => !arg.startsWith("-")) ? null : "Usage: nslookup <name>" },
  { command: "ssh", contract: observable({ id: "service.ssh", family: "service", syntax: "ssh <user@host>", permissions: ["reachable SSH service", "valid scoped credential", "active identity"], resources: ["ssh service", "identity", "credential", "session"], outcomes: ["authentication prompt", "remote session", "authentication failure"], telemetry: ["AUTH_SUCCESS", "AUTH_FAILED", "SESSION_CREATED", "LATERAL_MOVEMENT"], blueResponses: ["REVOKE_SESSION", "RESET_PASSWORD", "DISABLE_ACCOUNT", "BLOCK_CONNECTION", "ISOLATE_HOST"], replay: "STATE_AND_EVENTS" }), validate: (args) => args[0]?.includes("@") ? null : "Usage: ssh <user@host>" },
  { command: "john", contract: passive("tool.john", "system", "john <file>", ["discovered hash material"]) },
  { command: "sessions", contract: passive("shell.sessions", "shell", "sessions [number]", ["actor sessions"]) },
  { command: "install-agent", contract: observable({ id: "system.install-agent", family: "system", syntax: "install-agent", permissions: ["scenario persistence privilege"], resources: ["process", "persistence artifact", "outbound connection"], outcomes: ["persistent access", "periodic beacon"], telemetry: ["PERSISTENCE_INSTALLED", "AGENT_BEACON"], detectability: "ALWAYS", blueResponses: ["REMOVE_PERSISTENCE", "TERMINATE_PROCESS", "ISOLATE_HOST"], replay: "STATE_AND_EVENTS" }) },
];

function shellAdapter(definition: ShellDefinition, handler: ShellHandler): ToolAdapter {
  return {
    contract: definition.contract,
    canHandle: (input, context) => context.type !== "POSTGRES" && context.type !== "AUTHENTICATING" && commandOf(input) === definition.command,
    parse: (input) => ({ kind: "SHELL", command: definition.command, args: argsOf(input) }),
    validate: (intent) => intent.kind === "SHELL" ? definition.validate?.(intent.args) ?? null : `Invalid ${definition.command} intent`,
    execute: async (intent, state) => handler(intent.kind === "SHELL" ? intent.args : [], state),
  };
}

function parseCurl(input: string): CurlIntent {
  const args = argsOf(input); let method = "GET"; let explicitMethod = false; let data: string | undefined; let url: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "-X" || value === "--request") { method = (args[++index] ?? "GET").toUpperCase(); explicitMethod = true; }
    else if (value === "-d" || value === "--data") data = (args[++index] ?? "").replace(/^([\"'])(.*)\1$/, "$2");
    else if (!value.startsWith("-")) url ??= value;
  }
  if (data !== undefined && !explicitMethod) method = "POST";
  return { kind: "CURL_REQUEST", url, method, data };
}

function parsePostgres(input: string): SimulationIntent {
  const args = argsOf(input); let host: string | undefined; let username: string | undefined; let database: string | undefined; let password: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "-h") host = args[++index]; else if (value === "-U") username = args[++index]; else if (value === "-d") database = args[++index];
    else if (value.startsWith("--password=")) password = value.slice("--password=".length); else if (value === "--password") password = args[++index];
  }
  return host && username ? { kind: "PSQL_CONNECT", host, username, database, password } : { kind: "SHELL", command: "psql", args };
}

export const psqlUsage = "Usage: psql -h HOST -U USER [-d DATABASE] [--password SECRET]\n  Omit -d to connect and list databases with \\l once authenticated.";

export function createToolAdapterRegistry(handlers: ToolExecutionHandlers) {
  const adapters: ToolAdapter[] = [
    {
      contract: observable({ id: "authentication.prompt", family: "authentication", syntax: "<password>", permissions: ["active authentication challenge", "valid scoped credential"], resources: ["identity", "credential", "service", "session"], outcomes: ["authentication success", "authentication failure"], telemetry: ["AUTH_SUCCESS", "AUTH_FAILED", "POSTGRES_AUTH_SUCCESS", "POSTGRES_AUTH_FAILED", "SESSION_CREATED", "DATABASE_SESSION_CREATED"], detectability: "ALWAYS", blueResponses: ["RESET_PASSWORD", "DISABLE_ACCOUNT", "REVOKE_SESSION", "BLOCK_CONNECTION"], replay: "STATE_AND_EVENTS" }),
      canHandle: (_input, context) => context.type === "AUTHENTICATING", parse: (input) => ({ kind: "AUTHENTICATION_INPUT", password: input }), validate: valid,
      execute: (intent, state) => handlers.authenticate(intent.kind === "AUTHENTICATION_INPUT" ? intent.password : "", state),
    },
    {
      contract: observable({ id: "database.psql-input", family: "database", syntax: "\\l | \\c DB | \\dt | \\d TABLE | SELECT ... | \\q", permissions: ["active PostgreSQL session", "database identity grants", "table/column access"], resources: ["database", "table", "columns", "rows"], outcomes: ["resource enumeration", "bounded query", "objective result", "session close"], telemetry: ["DATABASE_QUERY", "OBJECTIVE_RETRIEVED", "FACT_DISCOVERED"], blueResponses: ["REVOKE_SESSION", "RESET_PASSWORD", "BLOCK_CONNECTION", "ISOLATE_HOST"], replay: "STATE_AND_EVENTS" }),
      canHandle: (_input, context) => context.type === "POSTGRES", parse: (input) => ({ kind: "PSQL_INPUT", input: input.trim() }), validate: valid,
      execute: (intent, state) => handlers.postgresInput(intent.kind === "PSQL_INPUT" ? intent.input : "", state),
    },
    {
      contract: observable({ id: "network.curl", family: "network", syntax: "curl [-X METHOD] <url> [--data BODY]", permissions: ["reachable HTTP service", "declared application interface"], resources: ["web endpoint", "form", "application worker", "session"], outcomes: ["HTTP response", "application execution", "discovery", "session"], telemetry: ["WEB_REQUEST", "WEB_WORKER_EXECUTED", "PROCESS_SPAWN", "SESSION_CREATED", "FACT_DISCOVERED"], blueResponses: ["BLOCK_CONNECTION", "ISOLATE_HOST", "TERMINATE_PROCESS", "INCREASE_MONITORING"], replay: "STATE_AND_EVENTS" }),
      canHandle: (input, context) => context.type !== "POSTGRES" && context.type !== "AUTHENTICATING" && commandOf(input) === "curl", parse: parseCurl,
      validate: (intent) => intent.kind === "CURL_REQUEST" && intent.url ? null : "Usage: curl [-X METHOD] <url> [--data BODY]", execute: (intent, state) => handlers.curl(intent as CurlIntent, state),
    },
    {
      contract: observable({ id: "service.backup-sync", family: "service", syntax: "backup-sync --run-hook", permissions: ["running service", "declared user and group", "writable trusted hook"], resources: ["service", "configuration", "hook", "privileged session"], outcomes: ["trusted service execution", "privileged session"], telemetry: ["PRIVILEGED_CONFIG_MODIFIED", "PRIVILEGE_ESCALATION", "ROOT_SESSION_CREATED"], detectability: "ALWAYS", blueResponses: ["REVOKE_SESSION", "TERMINATE_PROCESS", "ISOLATE_HOST"], replay: "STATE_AND_EVENTS" }),
      canHandle: (input, context) => context.type !== "POSTGRES" && context.type !== "AUTHENTICATING" && commandOf(input) === "backup-sync", parse: (input) => ({ kind: "SERVICE_OPERATION", service: "backup-sync", args: argsOf(input) }),
      validate: (intent) => intent.kind === "SERVICE_OPERATION" && intent.args.includes("--run-hook") ? null : "Usage: backup-sync --run-hook", execute: (intent, state) => handlers.service(intent as ServiceIntent, state),
    },
    {
      contract: observable({ id: "database.psql-connect", family: "database", syntax: psqlUsage, permissions: ["running reachable PostgreSQL service", "valid scoped credential", "database identity grant"], resources: ["postgres service", "identity", "credential", "database session"], outcomes: ["authentication prompt", "database session", "authentication failure"], telemetry: ["POSTGRES_AUTH_SUCCESS", "POSTGRES_AUTH_FAILED", "DATABASE_SESSION_CREATED"], blueResponses: ["REVOKE_SESSION", "RESET_PASSWORD", "DISABLE_ACCOUNT", "BLOCK_CONNECTION", "ISOLATE_HOST"], replay: "STATE_AND_EVENTS" }),
      canHandle: (input, context) => context.type !== "POSTGRES" && context.type !== "AUTHENTICATING" && commandOf(input) === "psql", parse: parsePostgres,
      validate: (intent) => intent.kind === "PSQL_CONNECT" ? null : psqlUsage, execute: (intent, state) => handlers.postgresConnect(intent as PostgresConnectIntent, state),
    },
    ...shellDefinitions.map((definition) => shellAdapter(definition, handlers.shell[definition.command])),
    { contract: passive("shell.unknown", "shell", "<supported command>"), canHandle: () => true, parse: (input) => ({ kind: "SHELL", command: commandOf(input), args: argsOf(input) }), validate: valid, execute: async (intent) => handlers.unknown(intent.kind === "SHELL" ? intent.command : "") },
  ];
  return {
    adapters,
    contracts: adapters.filter((adapter) => adapter.contract.id !== "shell.unknown").map((adapter) => adapter.contract),
    resolve(input: string, context?: TerminalContext) { const resolved = contextOf(context); return adapters.find((adapter) => adapter.canHandle(input, resolved))!; },
    async execute(input: string, state: TerminalState) {
      const context = contextOf(state.context); const adapter = adapters.find((candidate) => candidate.canHandle(input, context))!; const intent = adapter.parse(input, context); const error = adapter.validate(intent);
      return error ? handlers.invalid(error) : adapter.execute(intent, state);
    },
  };
}

/** Compatibility parser for syntax-only callers. Execution belongs to adapters. */
export function parseTerminalInput(input: string, context: TerminalContext = { type: "UNIX" }): SimulationIntent {
  if (context.type === "AUTHENTICATING") return { kind: "AUTHENTICATION_INPUT", password: input };
  if (context.type === "POSTGRES") return { kind: "PSQL_INPUT", input: input.trim() };
  if (commandOf(input) === "curl") return parseCurl(input);
  if (commandOf(input) === "backup-sync") return { kind: "SERVICE_OPERATION", service: "backup-sync", args: argsOf(input) };
  if (commandOf(input) === "psql") return parsePostgres(input);
  return { kind: "SHELL", command: commandOf(input), args: argsOf(input) };
}

export function toolContracts() {
  const unavailable = async () => ({ success: false, output: "unavailable", events: [] }) as CommandResult;
  return createToolAdapterRegistry({ invalid: (output) => ({ success: false, output, events: [] }), shell: Object.fromEntries(shellDefinitions.map(({ command }) => [command, unavailable])), unknown: (command) => ({ success: false, output: command, events: [] }), curl: unavailable, service: unavailable, postgresConnect: unavailable, postgresInput: unavailable, authenticate: unavailable }).contracts;
}
