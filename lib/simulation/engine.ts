import { AccessLevel, ScenarioState, SecurityEventCategory, SecurityEventSeverity } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { CommandResult, SimulationEvent, TerminalState } from "./types";
import { detectionForAction, parseMetadata } from "./rules";
import { getDefinitionForScenario } from "./initializer";
import type { ScenarioDefinition, ScenarioEventDefinition } from "./scenarios";
import { reachable } from "./network";
import { createToolAdapterRegistry, psqlUsage } from "./tools";
import type { CurlIntent, PostgresConnectIntent, ServiceIntent, ToolContract } from "./tools";

type EventInput = {
  action: string;
  category: SecurityEventCategory;
  severity: SecurityEventSeverity;
  sourceMachineId?: string;
  targetMachineId?: string;
  userId?: string;
  visibleToRed?: boolean;
  visibleToBlue?: boolean;
  metadata?: Record<string, unknown>;
};

export class SimulationEngine {
  private scenarioDefinition?: Promise<ScenarioDefinition>;
  private activeTool?: ToolContract;

  constructor(private scenarioId: string, private actorId: string) {}

  private definition() {
    this.scenarioDefinition ??= getDefinitionForScenario(this.scenarioId);
    return this.scenarioDefinition;
  }

  async executeCommand(command: string, state: TerminalState): Promise<CommandResult> {
    const scenario = await prisma.scenario.findUnique({ where: { id: this.scenarioId } });
    if (!scenario || scenario.state !== "ACTIVE") return this.result(false, "This operation has ended.");
    const registry = this.toolRegistry();
    this.activeTool = registry.resolve(command, state.context).contract;
    try {
      const result = await registry.execute(command, state);
      const audit = await this.emit({
        action: "TOOL_EXECUTED", category: SecurityEventCategory.SYSTEM, severity: SecurityEventSeverity.INFO,
        visibleToRed: false, visibleToBlue: false,
        metadata: { family: this.activeTool.family, success: result.success, replay: this.activeTool.replay },
      });
      const progress = result.success ? await this.evaluateObjectives() : { events: [] as SimulationEvent[], operationCompleted: false };
      const output = progress.operationCompleted && !result.output.endsWith("Operation complete.")
        ? `${result.output}${result.output ? "\n\n" : ""}Operation complete. Evidence package is ready for review.`
        : result.output;
      return {
        ...result,
        output,
        events: [...result.events, audit, ...progress.events],
        objectiveRetrieved: result.objectiveRetrieved || progress.operationCompleted,
      };
    } finally {
      this.activeTool = undefined;
    }
  }

  private toolRegistry() {
    return createToolAdapterRegistry({
      invalid: (message) => this.result(false, message),
      unknown: (command) => this.result(false, `Command not found: ${command}. Type help.`),
      shell: {
        help: (args) => this.result(true, this.help(args[0])),
        clear: () => this.result(true, ""),
        whoami: (_args, state) => this.observe(state, "CURRENT_USER", state.currentUser),
        id: (_args, state) => this.identity(state),
        env: (_args, state) => this.environment(state),
        hostname: (_args, state) => this.observe(state, "CURRENT_HOST", state.currentMachine),
        pwd: (_args, state) => this.observe(state, "CURRENT_DIRECTORY", state.currentPath ?? "/"),
        cd: (args, state) => this.changeDirectory(args, state),
        ls: (args, state) => this.listFiles(args, state),
        cat: (args, state) => this.readFile(args, state, false),
        less: (args, state) => this.readFile(args, state, false),
        grep: (args, state) => this.grep(args, state),
        find: (args, state) => this.find(args, state),
        retrieve: (args, state) => this.readFile(args, state, true),
        ps: (_args, state) => this.processes(state),
        ip: (_args, state) => this.ip(state),
        ping: (args, state) => this.ping(args, state),
        nmap: (args, state) => this.scan(args, state),
        ssh: (args, state) => this.ssh(args, state),
        john: (args) => this.john(args),
        sessions: (args) => this.sessions(args),
        "install-agent": (_args, state) => this.installAgent(state),
      },
      curl: (intent, state) => this.curl(intent, state),
      service: (intent, state) => this.serviceOperation(intent, state),
      postgresConnect: (intent, state) => this.connectPostgres(intent, state),
      postgresInput: (input, state) => this.postgresInput(input, state),
      authenticate: (password, state) => this.completeAuthentication(password, state),
    });
  }

  private result(success: boolean, output: string, events: SimulationEvent[] = []): CommandResult {
    return { success, output, events };
  }

  private async evaluateObjectives() {
    const [definition, scenario, storedEvents] = await Promise.all([
      this.definition(),
      prisma.scenario.findUniqueOrThrow({ where: { id: this.scenarioId } }),
      prisma.securityEvent.findMany({
        where: { scenarioId: this.scenarioId },
        include: { sourceMachine: true, targetMachine: true },
        orderBy: { timestamp: "asc" },
      }),
    ]);
    if (scenario.state !== ScenarioState.ACTIVE) return { events: [] as SimulationEvent[], operationCompleted: false };

    const completedIds = new Set(
      storedEvents
        .filter((event) => event.action === "OBJECTIVE_COMPLETED")
        .map((event) => parseMetadata(event.metadata).objectiveId)
        .filter((id): id is string => typeof id === "string"),
    );
    const emitted: SimulationEvent[] = [];
    for (const objective of definition.objectives) {
      if (completedIds.has(objective.id)) continue;
      const evidence = storedEvents.find((event) => {
        const metadata = parseMetadata(event.metadata);
        if (objective.type === "retrieve_file") return event.action === "OBJECTIVE_RETRIEVED" && metadata.objectiveId === objective.id;
        if (objective.type === "fact") return event.action === "FACT_DISCOVERED" && metadata.factId === objective.factId;
        if (event.action !== objective.event.action) return false;
        if (objective.event.sourceHost && event.sourceMachine?.hostname !== objective.event.sourceHost) return false;
        if (objective.event.targetHost && event.targetMachine?.hostname !== objective.event.targetHost) return false;
        if (objective.event.userId && event.userId !== objective.event.userId) return false;
        return Object.entries(objective.event.metadata ?? {}).every(([key, value]) => metadata[key] === value);
      });
      if (!evidence) continue;
      emitted.push(await this.emit({
        action: "OBJECTIVE_COMPLETED",
        category: SecurityEventCategory.SYSTEM,
        severity: SecurityEventSeverity.INFO,
        sourceMachineId: evidence.sourceMachineId ?? undefined,
        targetMachineId: evidence.targetMachineId ?? undefined,
        userId: evidence.userId ?? undefined,
        visibleToRed: true,
        visibleToBlue: true,
        metadata: {
          objectiveId: objective.id,
          label: objective.label,
          evidenceEventId: evidence.id,
          learning: objective.learning,
        },
      }));
      completedIds.add(objective.id);
    }

    const operationCompleted = definition.objectiveCompletion === "ALL"
      ? definition.objectives.every((objective) => completedIds.has(objective.id))
      : definition.objectives.some((objective) => completedIds.has(objective.id));
    if (!operationCompleted) return { events: emitted, operationCompleted: false };

    emitted.push(await this.emit({
      action: "OPERATION_COMPLETED",
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.INFO,
      visibleToRed: true,
      visibleToBlue: true,
      metadata: { objectiveIds: [...completedIds], completion: definition.objectiveCompletion ?? "ANY" },
    }));
    await prisma.scenario.update({
      where: { id: this.scenarioId },
      data: { state: scenario.mode === "BLUE" ? ScenarioState.FAILED : ScenarioState.COMPLETED, endedAt: new Date() },
    });
    return { events: emitted, operationCompleted: true };
  }

  private help(topic?: string) {
    const topics: Record<string, string> = {
      nmap: "nmap <host>\n  Scans a reachable host and reports open ports and the service listening on each.\n  Example: nmap 10.10.10.10\n  Use it after discovering a host, before assuming what it runs.",
      ping: "ping <host>\n  Checks whether a host is reachable over the network.\n  Example: ping 10.10.10.10",
      curl: "curl [-X METHOD] <url> [--data BODY]\n  curl <url>                     performs a GET request and prints the response.\n  curl -X POST <url> --data \"field=value\"   sends form data, usually as a POST.\n  Inspect a page's response for forms, links, or comments before guessing an endpoint.\n  Example: curl portal.example.test",
      ssh: "ssh <user@host>\n  Opens a remote shell session if you hold valid credentials for that user on that host.\n  You'll be prompted for a password if one is required.\n  Example: ssh deploy@10.20.10.20",
      psql: "psql -h HOST -U USER [-d DATABASE] [--password SECRET]\n  Connects to a PostgreSQL service. Omit -d to connect without selecting a database,\n  then use \\l to list databases and \\c <database> to select one.\n  Once connected: \\dt lists tables, \\d <table> describes its columns,\n  SELECT <columns> FROM <table>; reads rows, \\q disconnects.\n  Example: psql -h 10.30.10.21 -U someuser",
      ls: "ls [-l] [path]\n  Lists files visible to your current session. -l shows owner and permissions.\n  Example: ls -l /etc",
      cat: "cat <path>\n  Prints a file's contents if your session has permission to read it.",
      less: "less <path>\n  Opens a readable file for inspection. ROOT prints the bounded simulated file contents.\n  Example: less /etc/example.conf",
      grep: "grep <text> [path]\n  Searches file contents (or all readable files if no path given) for a case-insensitive match.\n  Example: grep password /etc/app.conf",
      find: "find [path] -name <name>\n  Searches a directory tree for a file by exact filename.\n  Example: find /etc -name app.conf",
      ps: "ps\n  Lists running processes on the current host, including their full command line.\n  Command lines often reveal configuration file paths worth inspecting.",
      "backup-sync": "backup-sync --run-hook\n  Manually triggers a service's maintained hook, if your session has the required group\n  membership and the hook script is writable by your group.",
      "install-agent": "install-agent\n  Installs a persistent access agent. Requires root privilege on the current host.",
      sessions: "sessions [number]\n  Lists your active sessions across hosts, or switches to one by number.",
      john: "john <file>\n  Attempts to crack a hash file, if one has been discovered.",
    };
    if (topic && topics[topic.toLowerCase()]) return topics[topic.toLowerCase()];
    if (topic) return `No detailed help for '${topic}'. Type help for the command list.`;
    return `ROOT/OS commands

Recon:       nmap <host> · ping <host> · curl <url> · ip
Access:      ssh <user@host> · sessions
Filesystem:  pwd · cd <path> · ls [-l] [path] · cat <path> · less <path> · grep TEXT [path] · find [path] -name NAME
System:      whoami · id · hostname · env · ps · backup-sync --run-hook
Web:         curl [-X METHOD] URL [--data BODY]
Database:    psql -h HOST -U USER [-d DATABASE] --password SECRET
Tools:       john <file> · install-agent · clear

Type 'help <command>' for details, e.g. help curl`;
  }

  private async currentMachine(state: TerminalState) {
    const session = await prisma.session.findFirst({
      where: {
        scenarioId: this.scenarioId,
        actorId: this.actorId,
        active: true,
        ...(state.currentSessionId ? { id: state.currentSessionId } : { machine: { hostname: state.currentMachine }, user: { username: state.currentUser } }),
      },
      include: { machine: { include: { files: true, services: true, processes: true } }, user: true },
    });
    return session;
  }

  private async target(value: string) {
    const definition = await this.definition();
    const normalized = value.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    const resolved = definition.aliases[normalized] ?? normalized;
    return prisma.machine.findFirst({ where: { scenarioId: this.scenarioId, OR: [{ hostname: resolved.toUpperCase() }, { ip: resolved }] }, include: { services: true, users: true } });
  }

  private async emit(input: EventInput): Promise<SimulationEvent> {
    const definition = await this.definition();
    const hostId = input.targetMachineId ?? input.sourceMachineId;
    const machine = hostId ? await prisma.machine.findUnique({ where: { id: hostId } }) : null;
    const control = definition.securityControls.find((entry) => entry.host === machine?.hostname);
    const monitored = input.category === "SYSTEM" || Boolean(control?.telemetry.includes(input.category));
    const event = await prisma.securityEvent.create({
      data: {
        scenarioId: this.scenarioId, actorId: this.actorId, action: input.action, category: input.category,
        severity: input.severity, sourceMachineId: input.sourceMachineId, targetMachineId: input.targetMachineId,
        userId: input.userId, visibleToRed: input.visibleToRed ?? true, visibleToBlue: (input.visibleToBlue ?? true) && monitored,
        metadata: input.metadata || this.activeTool ? JSON.stringify({ toolId: this.activeTool?.id, ...input.metadata }) : undefined,
      },
    });
    const detection = detectionForAction(event.action, definition.detections);
    if (detection && event.visibleToBlue) {
      await prisma.securityEvent.create({
        data: {
          scenarioId: this.scenarioId,
          actorId: this.actorId,
          action: "DETECTION_TRIGGERED",
          category: SecurityEventCategory.SYSTEM,
          severity: detection.severity as SecurityEventSeverity,
          sourceMachineId: event.sourceMachineId,
          targetMachineId: event.targetMachineId,
          userId: event.userId,
          visibleToRed: false,
          visibleToBlue: true,
          metadata: JSON.stringify({ ruleId: detection.id, title: detection.title, severity: detection.severity, rationale: detection.rationale, evidenceEventId: event.id }),
        },
      });
    }
    return { id: event.id, timestamp: event.timestamp, category: event.category, action: event.action, severity: event.severity, sourceMachineId: event.sourceMachineId ?? undefined, targetMachineId: event.targetMachineId ?? undefined, userId: event.userId ?? undefined, visibleToRed: event.visibleToRed, visibleToBlue: event.visibleToBlue, metadata: input.metadata };
  }

  private async discoveredHosts() {
    const [definition, events] = await Promise.all([
      this.definition(),
      prisma.securityEvent.findMany({ where: { scenarioId: this.scenarioId, action: "HOST_DISCOVERED" }, include: { targetMachine: true } }),
    ]);
    return [...new Set([...definition.startingKnowledge.knownAssets, ...definition.startingKnowledge.knownHosts, ...events.flatMap((event) => event.targetMachine ? [event.targetMachine.hostname] : [])])];
  }

  private emitDefinition(definition: ScenarioEventDefinition, context: Omit<EventInput, "action" | "category" | "severity">) {
    return this.emit({ ...context, ...definition, metadata: { ...context.metadata, ...definition.metadata } });
  }

  private async applyDiscovery(kind: "file" | "web" | "scan" | "process" | "postgres", host: string, value: string, sourceMachineId?: string, visibleContent?: string) {
    const definition = await this.definition();
    const matches = definition.discoveries
      .filter((entry) => {
        if (entry.trigger.kind !== kind || entry.trigger.host !== host) return false;
        if (kind !== "web") return entry.trigger.value === value;
        const normalize = (input: string) => input.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
        return normalize(value) === normalize(entry.trigger.value);
      })
      .sort((a, b) => b.trigger.value.length - a.trigger.value.length);
    const discoveries = kind === "web" ? matches.slice(0, 1) : matches;
    if (!discoveries.length) return { events: [] as SimulationEvent[], output: undefined as string | undefined };
    const events: SimulationEvent[] = [];
    const discoveryHost = await this.target(host);
    for (const discovery of discoveries) {
      for (const hostname of discovery.hosts ?? []) {
        const machine = await this.target(hostname);
        events.push(await this.emit({ action: "HOST_DISCOVERED", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.INFO, sourceMachineId, targetMachineId: machine?.id, visibleToBlue: false }));
      }
      for (const credential of discovery.credentials ?? []) {
        const machine = await this.target(credential.scope);
        const identity = machine?.users.find((user) => user.username === credential.username);
        const database = definition.databases?.find((entry) => entry.host === machine?.hostname && entry.identities.some((entry) => entry.username === credential.username));
        const reset = await prisma.securityEvent.findFirst({ where: { scenarioId: this.scenarioId, action: "RESET_PASSWORD", userId: credential.username } });
        if (machine && identity) {
          await prisma.credential.upsert({
            where: { scenarioId_username_knownScope: { scenarioId: this.scenarioId, username: credential.username, knownScope: credential.scope } },
            create: {
              scenarioId: this.scenarioId, username: credential.username, origin: `${host}:${value}`, knownScope: credential.scope,
              secret: identity.password, privilege: identity.privilege, valid: !reset, serviceName: database ? "postgres" : "ssh", databaseName: database?.database,
            },
            update: { origin: `${host}:${value}`, secret: identity.password, privilege: identity.privilege, valid: !reset, serviceName: database ? "postgres" : "ssh", databaseName: database?.database },
          });
        }
        events.push(await this.emit({ action: "CREDENTIAL_DISCOVERED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId, targetMachineId: machine?.id, userId: credential.username, visibleToBlue: false, metadata: { scope: credential.scope, origin: `${host}:${value}` } }));
      }
      for (const factId of discovery.facts ?? []) {
        const fact = definition.facts?.find((entry) => entry.id === factId);
        const pattern = discovery.factPatterns?.[factId];
        if (pattern && !visibleContent?.toLowerCase().includes(pattern.toLowerCase())) continue;
        if (!fact || await prisma.securityEvent.count({ where: { scenarioId: this.scenarioId, action: "FACT_DISCOVERED", metadata: { contains: `\"factId\":\"${factId}\"` } } })) continue;
        events.push(await this.emit({ action: "FACT_DISCOVERED", category: SecurityEventCategory.SYSTEM, severity: SecurityEventSeverity.INFO, sourceMachineId, targetMachineId: discoveryHost?.id, visibleToBlue: false, metadata: { factId, fact: fact.known, category: fact.category, source: `${kind}:${host}:${value}` } }));
      }
      for (const evidence of discovery.evidence ?? []) events.push(await this.emitDefinition(evidence, { sourceMachineId, targetMachineId: discoveryHost?.id, metadata: { origin: `${host}:${value}` } }));
    }
    return { events, output: discoveries.find((entry) => entry.output)?.output };
  }

  private async observe(state: TerminalState, kind: string, value: string, metadata: Record<string, unknown> = {}) {
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const event = await this.emit({
      action: "OBSERVATION_RECORDED",
      category: SecurityEventCategory.SYSTEM,
      severity: SecurityEventSeverity.INFO,
      targetMachineId: session.machine.id,
      userId: session.user.username,
      visibleToBlue: false,
      metadata: { kind, value, ...metadata },
    });
    return this.result(true, value, [event]);
  }

  private async changeDirectory(args: string[], state: TerminalState) {
    if (!args[0]) return this.result(false, "Usage: cd <path>");
    const currentPath = args[0].startsWith("/") ? args[0] : `${state.currentPath ?? "/"}/${args[0]}`.replace(/\/+/g, "/");
    const observed = await this.observe(state, "DIRECTORY_CHANGED", currentPath, { from: state.currentPath ?? "/", path: currentPath });
    return { ...observed, currentPath } as CommandResult;
  }

  private async identity(state: TerminalState) {
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const uid = 1000 + [...session.user.username].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 800;
    const output = `uid=${uid}(${session.user.username}) gid=${uid}(${session.user.username}) groups=${session.user.groups.map((group) => `${group}`).join(",")}`;
    const event = await this.emit({ action: "OBSERVATION_RECORDED", category: SecurityEventCategory.SYSTEM, severity: SecurityEventSeverity.INFO, targetMachineId: session.machine.id, userId: session.user.username, visibleToBlue: false, metadata: { kind: "IDENTITY_GROUPS", value: output, groups: session.user.groups, privilege: session.user.privilege } });
    return this.result(true, output, [event]);
  }

  private async environment(state: TerminalState) {
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const output = [
      `HOME=/home/${session.user.username}`,
      `HOSTNAME=${session.machine.hostname}`,
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      "SHELL=/bin/sh",
      `USER=${session.user.username}`,
      `ROOT_CONTEXT=${session.context}`,
    ].join("\n");
    const event = await this.emit({ action: "OBSERVATION_RECORDED", category: SecurityEventCategory.SYSTEM, severity: SecurityEventSeverity.INFO, targetMachineId: session.machine.id, userId: session.user.username, visibleToBlue: false, metadata: { kind: "ENVIRONMENT", value: output, hostname: session.machine.hostname, username: session.user.username } });
    return this.result(true, output, [event]);
  }

  private canReadFile(file: { owner: string; group: string | null; permissions: string }, user: { username: string; groups: string[]; privilege: AccessLevel }) {
    const permission = file.owner === user.username ? file.permissions[0] : file.group && user.groups.includes(file.group) ? file.permissions[1] : file.permissions[2];
    return user.privilege === AccessLevel.ROOT || Boolean(Number(permission) & 4);
  }

  private async listFiles(args: string[], state: TerminalState) {
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const detailed = args[0] === "-l";
    const path = args.find((argument) => argument !== "-l") ?? state.currentPath ?? "/";
    const files = session.machine.files.filter((file) => file.path === path || file.path.startsWith(path === "/" ? "/" : `${path.replace(/\/$/, "")}/`));
    const output = files.length ? files.map((file) => detailed ? `${file.permissions} ${file.owner}:${file.group ?? file.owner} ${file.path}` : file.path.split("/").at(-1)).join("\n") : "(empty)";
    const event = await this.emit({ action: "OBSERVATION_RECORDED", category: SecurityEventCategory.FILESYSTEM, severity: SecurityEventSeverity.INFO, targetMachineId: session.machine.id, userId: session.user.username, visibleToBlue: false, metadata: { kind: "DIRECTORY_LISTING", value: output, path, detailed } });
    return this.result(true, output, [event]);
  }

  private async readFile(args: string[], state: TerminalState, retrieve: boolean) {
    if (!args[0]) return this.result(false, `Usage: ${retrieve ? "retrieve" : "cat"} <file>`);
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const file = session.machine.files.find((entry) => entry.path === args[0] || entry.path.endsWith(`/${args[0]}`));
    if (!file) return this.result(false, `File not found: ${args[0]}`);
    if (!this.canReadFile(file, session.user)) return this.result(false, "Permission denied");
    const events: SimulationEvent[] = [];
    events.push(await this.emit({ action: file.isSecret ? "SENSITIVE_FILE_READ" : "FILE_READ", category: SecurityEventCategory.FILESYSTEM, severity: file.isSecret ? SecurityEventSeverity.HIGH : SecurityEventSeverity.INFO, targetMachineId: session.machine.id, userId: session.user.username, visibleToBlue: file.isSecret, metadata: { path: file.path } }));

    const discovery = await this.applyDiscovery("file", session.machine.hostname, file.path, session.machine.id, file.contents ?? "");
    events.push(...discovery.events);
    const definition = await this.definition();
    const objective = definition.objectives.find((entry) => entry.type === "retrieve_file" && entry.host === session.machine.hostname && entry.path === file.path);
    if (objective?.type === "retrieve_file") {
      if (!retrieve) return this.result(true, `${file.contents}\n\nUse 'retrieve ${file.path.split("/").at(-1)}' to extract the objective.`, events);
      events.push(await this.emit({ action: "OBJECTIVE_RETRIEVED", category: SecurityEventCategory.FILESYSTEM, severity: SecurityEventSeverity.CRITICAL, targetMachineId: session.machine.id, userId: session.user.username, metadata: { objectiveId: objective.id, file: objective.path.split("/").at(-1) } }));
      return { success: true, output: `${objective.label.replace(/^Retrieve /, "")} retrieved.`, events, objectiveRetrieved: true, discoveredHosts: await this.discoveredHosts() };
    }
    return { success: true, output: file.contents ?? "(empty)", events, discoveredHosts: await this.discoveredHosts() };
  }

  private async grep(args: string[], state: TerminalState) {
    const pattern = args[0];
    if (!pattern) return this.result(false, "Usage: grep <text> [path]");
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const path = args[1];
    const files = session.machine.files.filter((file) => (!path || file.path === path || file.path.endsWith(`/${path}`)) && this.canReadFile(file, session.user));
    const matchedFiles = files.filter((file) => (file.contents ?? "").toLowerCase().includes(pattern.toLowerCase()));
    const lines = matchedFiles.flatMap((file) => (file.contents ?? "").split("\n").flatMap((line, index) => line.toLowerCase().includes(pattern.toLowerCase()) ? [`${file.path}:${index + 1}:${line}`] : []));
    const events: SimulationEvent[] = [];
    for (const file of matchedFiles) {
      events.push(await this.emit({ action: file.isSecret ? "SENSITIVE_FILE_READ" : "FILE_READ", category: SecurityEventCategory.FILESYSTEM, severity: file.isSecret ? SecurityEventSeverity.HIGH : SecurityEventSeverity.INFO, targetMachineId: session.machine.id, userId: session.user.username, visibleToBlue: file.isSecret, metadata: { path: file.path, via: "grep" } }));
      const visibleLines = (file.contents ?? "").split("\n").filter((line) => line.toLowerCase().includes(pattern.toLowerCase())).join("\n");
      events.push(...(await this.applyDiscovery("file", session.machine.hostname, file.path, session.machine.id, visibleLines)).events);
    }
    return this.result(true, lines.join("\n") || "", events);
  }

  private async find(args: string[], state: TerminalState) {
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const nameIndex = args.indexOf("-name");
    const name = nameIndex >= 0 ? args[nameIndex + 1] : undefined;
    if (nameIndex >= 0 && !name) return this.result(false, "Usage: find [path] -name <name>");
    const root = args.find((argument, index) => index !== nameIndex && index !== nameIndex + 1 && !argument.startsWith("-")) ?? state.currentPath ?? "/";
    const files = session.machine.files.filter((file) => file.path.startsWith(root === "/" ? "/" : root) && this.canReadFile(file, session.user) && (!name || file.path.split("/").at(-1) === name));
    return this.result(true, files.map((file) => file.path).join("\n") || "");
  }

  private async processes(state: TerminalState) {
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const lines = session.machine.processes.map((process) => `${process.pid.toString().padEnd(7)} ${process.runningAs.padEnd(12)} ${process.commandLine ?? process.name}`);
    const events: SimulationEvent[] = [];
    for (const process of session.machine.processes) events.push(...(await this.applyDiscovery("process", session.machine.hostname, process.name, session.machine.id, process.commandLine ?? process.name)).events);
    events.push(await this.emit({ action: "OBSERVATION_RECORDED", category: SecurityEventCategory.PROCESS, severity: SecurityEventSeverity.INFO, targetMachineId: session.machine.id, userId: session.user.username, visibleToBlue: false, metadata: { kind: "PROCESS_LISTING", value: lines.join("\n"), processCount: session.machine.processes.length } }));
    return this.result(true, `PID     USER         COMMAND\n1       root         init\n${lines.join("\n")}`, events);
  }

  private async ip(state: TerminalState) {
    const session = await this.currentMachine(state);
    return session ? this.result(true, `eth0: inet ${session.machine.ip}/24 (${session.machine.zone})`) : this.result(false, "No active session.");
  }

  private async ping(args: string[], state: TerminalState) {
    if (!args[0]) return this.result(false, "Usage: ping <host>");
    const [source, target] = await Promise.all([this.currentMachine(state), this.target(args[0])]);
    if (!source || !target) return this.result(false, `ping: ${args[0]}: unknown host`);
    if (!await reachable(this.scenarioId, source.machine.id, target.id)) return this.result(false, "Destination unreachable: network policy denies this path.");
    const event = await this.emit({ action: "PING", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.LOW, sourceMachineId: source.machine.id, targetMachineId: target.id });
    return this.result(true, `64 bytes from ${target.ip}: time=1.2 ms`, [event]);
  }

  private async scan(args: string[], state: TerminalState) {
    if (!args[0]) return this.result(false, "Usage: nmap <host>");
    const [source, target] = await Promise.all([this.currentMachine(state), this.target(args[0])]);
    if (!source || !target) return this.result(false, "Host seems down.");
    if (!await reachable(this.scenarioId, source.machine.id, target.id)) return this.result(false, "Host unreachable from this session.");
    const events: SimulationEvent[] = [];
    for (const service of target.services) events.push(await this.emit({ action: "PORT_PROBE", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.LOW, sourceMachineId: source.machine.id, targetMachineId: target.id, metadata: { port: service.port, service: service.name } }));
    for (const service of target.services) events.push(...(await this.applyDiscovery("scan", target.hostname, service.name, source.machine.id)).events);
    events.push(await this.emit({ action: "HOST_DISCOVERED", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.INFO, sourceMachineId: source.machine.id, targetMachineId: target.id, visibleToBlue: false }));
    events.push(await this.emit({ action: "PORT_SCAN_DETECTED", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.LOW, sourceMachineId: source.machine.id, targetMachineId: target.id, visibleToRed: false }));
    return { success: true, output: `Nmap scan report for ${target.hostname} (${target.ip})\nPORT     STATE   SERVICE\n${target.services.map((service) => `${service.port}/tcp`.padEnd(9) + `${service.status === "STOPPED" ? "closed" : "open"}  `.padEnd(8) + service.name).join("\n")}`, events, discoveredHosts: await this.discoveredHosts() };
  }

  private async curl(intent: CurlIntent, state: TerminalState) {
    if (!intent.url) return this.result(false, "Usage: curl [-X METHOD] <url> [--data BODY]");
    const source = await this.currentMachine(state);
    if (!source) return this.result(false, "No active session.");
    const target = await this.target(intent.url);
    if (!target?.services.some((service) => service.name === "http" || service.name === "https")) return this.result(false, "curl: connection failed");
    if (!await reachable(this.scenarioId, source.machine.id, target.id, [80, 443])) return this.result(false, "curl: route blocked");
    const path = new URL(`http://${intent.url.replace(/^https?:\/\//, "")}`).pathname;
    const events = [await this.emit({ action: "WEB_REQUEST", category: SecurityEventCategory.WEB, severity: SecurityEventSeverity.INFO, sourceMachineId: source.machine.id, targetMachineId: target.id, metadata: { method: intent.method, path, data: intent.data } })];
    const form = new URLSearchParams(intent.data ?? "");
    const webInteractions = (await this.definition()).webInteractions ?? [];
    const publishedInterface = webInteractions.find((entry) => entry.host === target.hostname && entry.path === path);
    const interaction = webInteractions.find((entry) => entry.host === target.hostname && entry.method === intent.method && entry.path === path && (!entry.dataIncludes || intent.data?.includes(entry.dataIncludes)) && (!entry.formField || form.get(entry.formField) === entry.formValue));
    if (interaction) {
      if (interaction.prerequisiteAction && !await prisma.securityEvent.count({ where: { scenarioId: this.scenarioId, action: interaction.prerequisiteAction, targetMachineId: target.id } })) return this.result(false, "Application behavior is not understood yet. Gather service evidence first.", events);
      const user = target.users.find((entry) => entry.username === interaction.sessionUser);
      if (!user) return this.result(false, "Application session identity is unavailable.", events);
      await prisma.process.create({ data: { machineId: target.id, name: `http ${intent.method} ${path} → interactive-worker`, pid: 3000 + Math.floor(Math.random() * 900), runningAs: user.username } });
      for (const evidence of interaction.evidence) events.push(await this.emitDefinition(evidence, { sourceMachineId: source.machine.id, targetMachineId: target.id, userId: evidence.action === "PROCESS_SPAWN" ? user.username : undefined }));
      events.push(await this.emit({ action: "SESSION_CREATED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: user.username, metadata: { privilege: user.privilege, interface: "http" } }));
      const session = await prisma.session.create({ data: { actorId: this.actorId, userId: user.id, machineId: target.id, privilege: user.privilege, sourceMachineId: source.machine.id, scenarioId: this.scenarioId, context: "UNIX", serviceName: "http" } });
      return { success: true, output: interaction.output, events, sessionUpdated: true, context: { type: "UNIX" as const }, newSession: { id: session.id, userId: user.username, machineId: target.hostname, privilege: user.privilege, sourceMachineId: source.machine.id, createdAt: session.createdAt, active: true, context: "UNIX" as const, serviceName: "http" } };
    }
    if (publishedInterface && publishedInterface.method !== intent.method) return this.result(false, `HTTP/1.1 405 Method Not Allowed\nAllow: ${publishedInterface.method}`, events);
    if (publishedInterface) return this.result(false, "HTTP/1.1 422 Unprocessable Content\nThe submitted form fields or values are not accepted by this interface.", events);
    const discovery = await this.applyDiscovery("web", target.hostname, intent.url, source.machine.id);
    events.push(...discovery.events);
    return { success: true, output: discovery.output ?? `${target.hostname} responded.`, events, discoveredHosts: await this.discoveredHosts() };
  }

  private async serviceOperation(intent: ServiceIntent, state: TerminalState) {
    const [current, definition] = await Promise.all([this.currentMachine(state), this.definition()]);
    const operation = definition.trustedServiceOperations?.find((entry) => entry.host === current?.machine.hostname && entry.service === intent.service && entry.fromUser === current?.user.username && entry.arguments.every((argument) => intent.args.includes(argument)));
    const service = current?.machine.services.find((entry) => entry.name === intent.service && entry.status === "RUNNING");
    const hook = current?.machine.files.find((entry) => entry.path === "/opt/backup/run.sh");
    const hookWritable = Boolean(hook && current?.user.groups.includes(hook.group ?? "") && (Number(hook.permissions[1]) & 2));
    if (!current || !operation || !service || !current.user.groups.includes(operation.requiredGroup) || !hookWritable) return this.result(false, `${intent.service}: no permitted trusted-service operation in this context.`);
    const elevated = await prisma.user.findFirst({ where: { machineId: current.machine.id, username: operation.toUser } });
    if (!elevated) return this.result(false, `${intent.service}: privileged service identity unavailable.`);
    const events: SimulationEvent[] = [];
    for (const evidence of operation.evidence) events.push(await this.emitDefinition(evidence, { targetMachineId: current.machine.id, userId: current.user.username, metadata: { service: service.name, hook: hook?.path } }));
    events.push(await this.emit({ action: "ROOT_SESSION_CREATED", category: SecurityEventCategory.PRIVILEGE, severity: SecurityEventSeverity.HIGH, targetMachineId: current.machine.id, userId: elevated.username, metadata: { privilege: elevated.privilege, service: service.name } }));
    const session = await prisma.session.create({ data: { actorId: this.actorId, userId: elevated.id, machineId: current.machine.id, privilege: elevated.privilege, sourceMachineId: current.machine.id, scenarioId: this.scenarioId, context: "SSH", serviceName: service.name } });
    return { success: true, output: operation.output, events, sessionUpdated: true, context: { type: "SSH" as const }, newSession: { id: session.id, userId: elevated.username, machineId: current.machine.hostname, privilege: elevated.privilege, sourceMachineId: current.machine.id, createdAt: session.createdAt, active: true, context: "SSH" as const, serviceName: service.name } };
  }

  private async connectPostgres(intent: PostgresConnectIntent, state: TerminalState) {
    const [source, target, definition] = await Promise.all([this.currentMachine(state), this.target(intent.host), this.definition()]);
    const service = target?.services.find((entry) => entry.name === "postgres" && entry.status === "RUNNING");
    const identity = target?.users.find((entry) => entry.username === intent.username);
    const database = intent.database ? definition.databases?.find((entry) => entry.host === target?.hostname && entry.service === "postgres" && entry.database === intent.database) : undefined;
    if (intent.database && !database) return this.result(false, `psql: FATAL: database "${intent.database}" does not exist`);
    const credential = target && identity ? await prisma.credential.findFirst({ where: { scenarioId: this.scenarioId, username: intent.username, knownScope: target.hostname, valid: true, serviceName: "postgres" } }) : null;
    if (source && target && service && identity && !intent.password) {
      const pending = await prisma.session.create({ data: { actorId: this.actorId, userId: identity.id, machineId: target.id, privilege: identity.privilege, sourceMachineId: source.machine.id, scenarioId: this.scenarioId, context: "AUTHENTICATING", serviceName: "postgres", databaseName: database?.database } });
      return { success: true, output: `Password for user ${identity.username}:`, events: [], sessionUpdated: true, context: { type: "AUTHENTICATING" as const, serviceName: "postgres", username: identity.username, host: target.hostname, databaseName: database?.database }, newSession: { id: pending.id, userId: identity.username, machineId: target.hostname, privilege: identity.privilege, sourceMachineId: source.machine.id, createdAt: pending.createdAt, active: true, context: "AUTHENTICATING" as const, serviceName: "postgres", databaseName: database?.database } };
    }
    const allowed = Boolean(source && target && service && identity && credential && intent.password === credential.secret && await reachable(this.scenarioId, source.machine.id, target.id, [5432]));
    const events = source && target ? [await this.emit({ action: allowed ? "POSTGRES_AUTH_SUCCESS" : "POSTGRES_AUTH_FAILED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: intent.username, metadata: { database: intent.database, service: "postgres" } })] : [];
    if (!allowed || !source || !target || !identity || !service) return this.result(false, "psql: connection or authentication failed", events);
    const session = await prisma.session.create({ data: { actorId: this.actorId, userId: identity.id, machineId: target.id, privilege: identity.privilege, sourceMachineId: source.machine.id, scenarioId: this.scenarioId, context: "POSTGRES", serviceName: service.name, databaseName: database?.database } });
    events.push(await this.emit({ action: "DATABASE_SESSION_CREATED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: identity.username, metadata: { sessionId: session.id, database: database?.database } }));
    return {
      success: true,
      output: `psql (ROOT simulated PostgreSQL)\nSSL connection established.\n\nType "\\?" for help.${database ? "" : "\nNot connected to a database. Type \\l to list databases, then \\c <database>."}`,
      events,
      sessionUpdated: true,
      context: { type: "POSTGRES" as const, serviceName: service.name, databaseName: database?.database },
      newSession: { id: session.id, userId: identity.username, machineId: target.hostname, privilege: identity.privilege, sourceMachineId: source.machine.id, createdAt: session.createdAt, active: true, context: "POSTGRES" as const, serviceName: service.name, databaseName: database?.database },
    };
  }

  private async postgresInput(input: string, state: TerminalState) {
    const session = await this.currentMachine(state);
    if (!session || session.context !== "POSTGRES" || !session.serviceName) return this.result(false, "PostgreSQL session is no longer active.");
    const definition = await this.definition();
    const hostDatabases = definition.databases?.filter((entry) => entry.host === session.machine.hostname && entry.service === session.serviceName) ?? [];
    if (input === "\\l") {
      if (!hostDatabases.length) return this.result(true, "No databases visible on this server.");
      const discovery = await this.applyDiscovery("postgres", session.machine.hostname, "databases", session.machine.id);
      return this.result(true, ` Name       | Accessible as\n------------+----------------\n${hostDatabases.map((entry) => ` ${entry.database.padEnd(10)} | ${entry.identities.map((identity) => identity.username).join(", ")}`).join("\n")}`, discovery.events);
    }
    if (input.startsWith("\\c")) {
      const requested = input.slice(2).trim();
      if (!requested) return this.result(false, "Usage: \\c <database>");
      const target = hostDatabases.find((entry) => entry.database === requested);
      if (!target) return this.result(false, `psql: FATAL: database "${requested}" does not exist`);
      const access = target.identities.find((entry) => entry.username === session.user.username);
      if (!access) return this.result(false, `psql: FATAL: permission denied for database "${requested}"`);
      await prisma.session.update({ where: { id: session.id }, data: { databaseName: target.database } });
      return {
        ...this.result(true, `You are now connected to database "${target.database}" as user "${session.user.username}".`),
        context: { type: "POSTGRES" as const, serviceName: session.serviceName, databaseName: target.database },
        sessionUpdated: true,
        newSession: { id: session.id, userId: session.user.username, machineId: session.machine.hostname, privilege: session.privilege, sourceMachineId: session.sourceMachineId ?? undefined, createdAt: session.createdAt, active: true, context: "POSTGRES" as const, serviceName: session.serviceName, databaseName: target.database },
      };
    }
    if (input === "\\?") return this.result(true, "ROOT psql supports:\n  \\l           list databases\n  \\c DATABASE  connect to a database\n  \\dt          list tables in the current database\n  \\d TABLE     describe a table's columns\n  SELECT <columns> FROM <table>;\n  \\q           quit");
    if (input === "\\q") {
      await prisma.session.update({ where: { id: session.id }, data: { active: false } });
      const parent = await prisma.session.findFirst({
        where: { scenarioId: this.scenarioId, actorId: this.actorId, active: true, id: { not: session.id } },
        include: { machine: true, user: true },
        orderBy: { createdAt: "desc" },
      });
      if (!parent) return { ...this.result(true, "PostgreSQL session closed."), context: { type: "UNIX" as const } };
      const context = parent.context === "POSTGRES" && parent.serviceName
        ? { type: "POSTGRES" as const, serviceName: parent.serviceName, databaseName: parent.databaseName ?? undefined }
        : { type: parent.context === "SSH" ? "SSH" as const : "UNIX" as const };
      return {
        ...this.result(true, "PostgreSQL session closed."),
        context,
        sessionUpdated: true,
        newSession: { id: parent.id, userId: parent.user.username, machineId: parent.machine.hostname, privilege: parent.privilege, sourceMachineId: parent.sourceMachineId ?? undefined, createdAt: parent.createdAt, active: parent.active, context: parent.context, serviceName: parent.serviceName ?? undefined, databaseName: parent.databaseName ?? undefined },
      };
    }
    if (!session.databaseName) return this.result(false, "You are not connected to a database. Type \\l to list databases, then \\c <database>.");
    const database = hostDatabases.find((entry) => entry.database === session.databaseName);
    const access = database?.identities.find((entry) => entry.username === session.user.username);
    if (!database || !access) return this.result(false, "ERROR: permission denied for database");
    if (input === "\\dt") {
      const discovery = await this.applyDiscovery("postgres", session.machine.hostname, `tables:${database.database}`, session.machine.id);
      return this.result(true, ` Schema | Name\n--------+-----------------\n${access.tables.map((table) => ` public | ${table.name}`).join("\n")}`, discovery.events);
    }
    if (input.startsWith("\\d ")) {
      const tableName = input.slice(3).trim();
      const table = access.tables.find((entry) => entry.name.toLowerCase() === tableName.toLowerCase());
      if (!table) return this.result(false, `ERROR: relation "${tableName}" does not exist`);
      const discovery = await this.applyDiscovery("postgres", session.machine.hostname, `schema:${database.database}.${table.name}`, session.machine.id);
      return this.result(true, ` Column        | Type\n---------------+---------\n${table.columns.map((column) => ` ${column.padEnd(13)} | text`).join("\n")}`, discovery.events);
    }
    const match = input.match(/^SELECT\s+([\w\s,*]+)\s+FROM\s+(\w+)\s*;?$/i);
    if (!match) return this.result(false, "ERROR: ROOT psql supports bounded SELECT queries only.");
    const table = access.tables.find((entry) => entry.name.toLowerCase() === match[2].toLowerCase());
    if (!table) return this.result(false, `ERROR: relation "${match[2]}" does not exist`);
    const requested = match[1].trim() === "*" ? table.columns : match[1].split(",").map((column) => column.trim());
    if (requested.some((column) => !table.columns.includes(column))) return this.result(false, "ERROR: column does not exist");
    const rows = table.rows.map((row) => requested.map((column) => row[column] ?? "").join(" | "));
    const events = [await this.emit({ action: "DATABASE_QUERY", category: SecurityEventCategory.FILESYSTEM, severity: SecurityEventSeverity.HIGH, sourceMachineId: session.sourceMachineId ?? undefined, targetMachineId: session.machineId, userId: session.user.username, metadata: { database: database.database, table: table.name, columns: requested } })];
    const objective = (await this.definition()).objectives.find((entry) => entry.type === "retrieve_file" && entry.host === session.machine.hostname && table.rows.some((row) => row.filename === entry.path.split("/").at(-1)));
    if (objective?.type === "retrieve_file") {
      events.push(await this.emit({ action: "OBJECTIVE_RETRIEVED", category: SecurityEventCategory.FILESYSTEM, severity: SecurityEventSeverity.CRITICAL, targetMachineId: session.machineId, userId: session.user.username, metadata: { objectiveId: objective.id, file: objective.path.split("/").at(-1), via: "postgres" } }));
      return { success: true, output: `${requested.join(" | ")}\n${requested.map(() => "----------------").join("+")}\n${rows.join("\n")}\n(${rows.length} row)\n\n${objective.label.replace(/^Retrieve /, "")} retrieved.`, events, objectiveRetrieved: true };
    }
    return { success: true, output: `${requested.join(" | ")}\n${requested.map(() => "----------------").join("+")}\n${rows.join("\n")}\n(${rows.length} row)`, events };
  }

  private async completeAuthentication(password: string, state: TerminalState): Promise<CommandResult> {
    const pending = await this.currentMachine(state);
    if (!pending || pending.context !== "AUTHENTICATING" || !pending.serviceName) return this.result(false, "No authentication prompt is active.");
    const source = pending.sourceMachineId ? await prisma.machine.findUnique({ where: { id: pending.sourceMachineId } }) : null;
    const credential = await prisma.credential.findFirst({ where: { scenarioId: this.scenarioId, username: pending.user.username, knownScope: pending.machine.hostname, valid: true, serviceName: pending.serviceName } });
    const port = pending.serviceName === "postgres" ? 5432 : 22;
    const service = pending.machine.services.find((entry) => entry.name === pending.serviceName && entry.status === "RUNNING");
    const reachableTarget = source && await reachable(this.scenarioId, source.id, pending.machineId, [port]);
    const allowed = Boolean(source && service && credential && password === credential.secret && reachableTarget);
    const action = pending.serviceName === "postgres" ? allowed ? "POSTGRES_AUTH_SUCCESS" : "POSTGRES_AUTH_FAILED" : allowed ? "AUTH_SUCCESS" : "AUTH_FAILED";
    const events = [await this.emit({ action, category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source?.id, targetMachineId: pending.machineId, userId: pending.user.username, metadata: { service: pending.serviceName, database: pending.databaseName } })];
    if (!allowed || !source) return { ...this.result(false, pending.serviceName === "postgres" ? "psql: password authentication failed" : "Permission denied, please try again.", events), context: { type: "AUTHENTICATING", serviceName: pending.serviceName, username: pending.user.username, host: pending.machine.hostname, databaseName: pending.databaseName ?? undefined } };
    if (pending.serviceName === "postgres") {
      await prisma.session.update({ where: { id: pending.id }, data: { context: "POSTGRES" } });
      events.push(await this.emit({ action: "DATABASE_SESSION_CREATED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.id, targetMachineId: pending.machineId, userId: pending.user.username, metadata: { sessionId: pending.id, database: pending.databaseName } }));
      const connection = (await this.definition()).connections.find((entry) => entry.source === source.hostname && entry.target === pending.machine.hostname && entry.port === 5432);
      if (connection?.accessEvent) events.push(await this.emitDefinition(connection.accessEvent, { sourceMachineId: source.id, targetMachineId: pending.machineId, userId: pending.user.username, metadata: { connectionPort: 5432 } }));
      return { success: true, output: `psql (ROOT simulated PostgreSQL)\nSSL connection established.\n\nType "\\?" for help.${pending.databaseName ? "" : "\nNot connected to a database. Type \\l to list databases, then \\c <database>."}`, events, sessionUpdated: true, context: { type: "POSTGRES", serviceName: "postgres", databaseName: pending.databaseName ?? undefined }, newSession: { id: pending.id, userId: pending.user.username, machineId: pending.machine.hostname, privilege: pending.privilege, sourceMachineId: source.id, createdAt: pending.createdAt, active: true, context: "POSTGRES", serviceName: "postgres", databaseName: pending.databaseName ?? undefined } };
    }
    await prisma.session.update({ where: { id: pending.id }, data: { context: "SSH" } });
    events.push(await this.emit({ action: "SESSION_CREATED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.id, targetMachineId: pending.machineId, userId: pending.user.username, metadata: { privilege: pending.privilege } }));
    const definition = await this.definition();
    const connection = definition.connections.find((entry) => entry.source === source.hostname && entry.target === pending.machine.hostname && entry.port === 22);
    if (connection?.accessEvent) events.push(await this.emitDefinition(connection.accessEvent, { sourceMachineId: source.id, targetMachineId: pending.machineId, userId: pending.user.username, metadata: { connectionPort: 22 } }));
    return { success: true, output: `Connected to ${pending.machine.hostname}.`, events, sessionUpdated: true, context: { type: "SSH" }, newSession: { id: pending.id, userId: pending.user.username, machineId: pending.machine.hostname, privilege: pending.privilege, sourceMachineId: source.id, createdAt: pending.createdAt, active: true, context: "SSH", serviceName: "ssh" } };
  }

  private async ssh(args: string[], state: TerminalState) {
    if (!args[0]?.includes("@")) return this.result(false, "Usage: ssh <user@host>");
    const [username, host] = args[0].split("@");
    const [source, target] = await Promise.all([this.currentMachine(state), this.target(host)]);
    if (!source || !target) return this.result(false, "Host not found.");
    const user = target.users.find((entry) => entry.username === username);
    const credential = await prisma.credential.findFirst({ where: { scenarioId: this.scenarioId, username, knownScope: target.hostname, valid: true, serviceName: "ssh" } });
    if (source && target && user?.password && !args[1]) {
      const pending = await prisma.session.create({ data: { actorId: this.actorId, userId: user.id, machineId: target.id, privilege: user.privilege, sourceMachineId: source.machine.id, scenarioId: this.scenarioId, context: "AUTHENTICATING", serviceName: "ssh" } });
      return { success: true, output: `${username}@${target.hostname}'s password:`, events: [], sessionUpdated: true, context: { type: "AUTHENTICATING" as const, serviceName: "ssh", username, host: target.hostname }, newSession: { id: pending.id, userId: username, machineId: target.hostname, privilege: user.privilege, sourceMachineId: source.machine.id, createdAt: pending.createdAt, active: true, context: "AUTHENTICATING" as const, serviceName: "ssh" } };
    }
    const link = await prisma.networkConnection.findFirst({ where: { sourceMachineId: source.machine.id, targetMachineId: target.id, port: { in: [22, 5432] }, allowed: true } });
    const isolated = await prisma.securityEvent.findFirst({ where: { scenarioId: this.scenarioId, action: "HOST_ISOLATED", targetMachineId: { in: [source.machine.id, target.id] } }, orderBy: { timestamp: "desc" } });
    const restored = isolated ? await prisma.securityEvent.findFirst({ where: { scenarioId: this.scenarioId, action: "HOST_RESTORED", targetMachineId: isolated.targetMachineId, timestamp: { gt: isolated.timestamp } } }) : null;
    const allowed = Boolean(user && credential && (!args[1] || args[1] === credential.secret) && link && (!isolated || restored) && await reachable(this.scenarioId, source.machine.id, target.id, [22, 5432]));
    const events = [await this.emit({ action: allowed ? "AUTH_SUCCESS" : "AUTH_FAILED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: username })];
    if (!allowed || !user) return this.result(false, "Permission denied or route blocked.", events);
    events.push(await this.emit({ action: "SESSION_CREATED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: username, metadata: { privilege: user.privilege } }));
    const definition = await this.definition();
    const connection = definition.connections.find((entry) => entry.source === source.machine.hostname && entry.target === target.hostname && entry.port === link?.port);
    if (connection?.accessEvent) events.push(await this.emitDefinition(connection.accessEvent, { sourceMachineId: source.machine.id, targetMachineId: target.id, userId: username, metadata: { connectionPort: link?.port } }));
    const session = await prisma.session.create({ data: { actorId: this.actorId, userId: user.id, machineId: target.id, privilege: user.privilege, sourceMachineId: source.machine.id, scenarioId: this.scenarioId, context: "SSH", serviceName: "ssh" } });
    return { success: true, output: `Connected to ${target.hostname}.`, events, sessionUpdated: true, context: { type: "SSH" as const }, newSession: { id: session.id, userId: user.username, machineId: target.hostname, privilege: user.privilege, sourceMachineId: source.machine.id, createdAt: session.createdAt, active: true, context: "SSH" as const, serviceName: "ssh" } };
  }

  private john(args: string[]) {
    return this.result(false, args[0] ? "No supported hash material has been discovered in this operation." : "Usage: john <file>");
  }

  private async sessions(args: string[] = []) {
    const sessions = await prisma.session.findMany({ where: { scenarioId: this.scenarioId, actorId: this.actorId, active: true }, include: { machine: true, user: true }, orderBy: { createdAt: "asc" } });
    if (args[0]) {
      const selected = sessions[Number(args[0]) - 1];
      if (!selected) return this.result(false, "Unknown session number. Use sessions to list active sessions.");
      const context = selected.context === "POSTGRES" && selected.serviceName
        ? { type: "POSTGRES" as const, serviceName: selected.serviceName, databaseName: selected.databaseName ?? undefined }
        : { type: selected.context === "SSH" ? "SSH" as const : "UNIX" as const };
      return { ...this.result(true, `Using ${selected.user.username}@${selected.machine.hostname}`), context, newSession: { id: selected.id, machineId: selected.machine.hostname, userId: selected.user.username, privilege: selected.privilege, active: selected.active, createdAt: selected.createdAt, sourceMachineId: selected.sourceMachineId ?? undefined, context: selected.context, serviceName: selected.serviceName ?? undefined, databaseName: selected.databaseName ?? undefined }, sessionUpdated: true };
    }
    return this.result(true, sessions.map((session, index) => `[${index + 1}] ${session.user.username}@${session.machine.hostname} (${session.privilege})`).join("\n") || "No active sessions");
  }

  private async installAgent(state: TerminalState) {
    const current = await this.currentMachine(state);
    const policy = (await this.definition()).persistencePolicy;
    if (!current || current.privilege !== policy.requiredPrivilege) return this.result(false, `${policy.requiredPrivilege} access is required.`);
    if (await prisma.persistence.count({ where: { machineId: current.machine.id, active: true } })) return this.result(false, "An active agent is already installed.");
    const artifact = await prisma.persistence.create({ data: { machineId: current.machine.id, type: "remote_agent", beaconIntervalSeconds: policy.beaconSeconds } });
    const process = await prisma.process.create({ data: { machineId: current.machine.id, name: policy.process, pid: 4400 + Math.floor(Math.random() * 400), runningAs: current.user.username } });
    const events = [await this.emit({ action: "PERSISTENCE_INSTALLED", category: SecurityEventCategory.PERSISTENCE, severity: SecurityEventSeverity.HIGH, targetMachineId: current.machine.id, userId: current.user.username, metadata: { artifactId: artifact.id, processId: process.id } }), await this.emit({ action: "AGENT_BEACON", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.HIGH, sourceMachineId: current.machine.id, metadata: { intervalSeconds: 30 } })];
    return this.result(true, `${policy.process} installed; beacon interval ${policy.beaconSeconds} seconds. Revocation alone will not remove persistent access.`, events);
  }
}
