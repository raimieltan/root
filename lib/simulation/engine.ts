import { AccessLevel, ScenarioState, SecurityEventCategory, SecurityEventSeverity } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { CommandResult, SimulationEvent, TerminalState } from "./types";
import { detectionForAction } from "./rules";
import { getDefinitionForScenario } from "./initializer";
import type { ScenarioDefinition, ScenarioEventDefinition } from "./scenarios";
import { reachable } from "./network";
import { parseTerminalInput, psqlUsage } from "./tools";

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

  constructor(private scenarioId: string, private actorId: string) {}

  private definition() {
    this.scenarioDefinition ??= getDefinitionForScenario(this.scenarioId);
    return this.scenarioDefinition;
  }

  async executeCommand(command: string, state: TerminalState): Promise<CommandResult> {
    const scenario = await prisma.scenario.findUnique({ where: { id: this.scenarioId } });
    if (!scenario || scenario.state !== "ACTIVE") return this.result(false, "This operation has ended.");
    const intent = parseTerminalInput(command, state.context);
    if (intent.kind === "PSQL_CONNECT") return this.connectPostgres(intent, state);
    if (intent.kind === "PSQL_INPUT") return this.postgresInput(intent.input, state);
    const { command: cmd, args } = intent;
    switch (cmd) {
      case "help": return this.result(true, this.help());
      case "clear": return this.result(true, "");
      case "whoami": return this.result(true, state.currentUser);
      case "hostname": return this.result(true, state.currentMachine);
      case "pwd": return this.result(true, state.currentPath ?? "/");
      case "cd": return this.changeDirectory(args, state);
      case "ls": return this.listFiles(args, state);
      case "cat": return this.readFile(args, state, false);
      case "retrieve": return this.readFile(args, state, true);
      case "ps": return this.processes(state);
      case "ip": return this.ip(state);
      case "ping": return this.ping(args, state);
      case "nmap": return this.scan(args, state);
      case "curl": return this.curl(args, state);
      case "psql": return this.result(false, psqlUsage);
      case "msfconsole": return this.result(true, "Metasploit simulation ready. Use: exploit <host>");
      case "exploit": return this.exploit(args, state);
      case "ssh": return this.ssh(args, state);
      case "john": return this.john(args);
      case "sessions": return this.sessions(args);
      case "privesc": return this.privesc(args, state);
      case "install-agent": return this.installAgent(state);
      default: return this.result(false, `Command not found: ${cmd}. Type help.`);
    }
  }

  private result(success: boolean, output: string, events: SimulationEvent[] = []): CommandResult {
    return { success, output, events };
  }

  private help() {
    return `ROOT/OS commands

Recon:       nmap <host> · ping <host> · curl <url> · ip
Access:      exploit <host> · ssh <user@host> · sessions
Filesystem:  pwd · cd <path> · ls [path] · cat <path> · retrieve <file>
System:      whoami · hostname · ps · privesc <trusted-service>
Database:    psql -h HOST -U USER -d DATABASE --password SECRET
Tools:       john <file> · msfconsole · install-agent · clear`;
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
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
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

  private async applyDiscovery(kind: "file" | "web", host: string, value: string, sourceMachineId?: string) {
    const definition = await this.definition();
    const discovery = definition.discoveries.find((entry) => entry.trigger.kind === kind && entry.trigger.host === host && (kind === "file" ? entry.trigger.value === value : value.includes(entry.trigger.value)));
    if (!discovery) return { events: [] as SimulationEvent[], output: undefined as string | undefined };
    const events: SimulationEvent[] = [];
    const discoveryHost = await this.target(host);
    for (const hostname of discovery.hosts ?? []) {
      const machine = await this.target(hostname);
      events.push(await this.emit({ action: "HOST_DISCOVERED", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.INFO, sourceMachineId, targetMachineId: machine?.id, visibleToBlue: false }));
    }
    for (const credential of discovery.credentials ?? []) {
      const machine = await this.target(credential.scope);
      events.push(await this.emit({ action: "CREDENTIAL_DISCOVERED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId, targetMachineId: machine?.id, userId: credential.username, visibleToBlue: false, metadata: { scope: credential.scope, origin: `${host}:${value}` } }));
    }
    for (const evidence of discovery.evidence ?? []) events.push(await this.emitDefinition(evidence, { sourceMachineId, targetMachineId: discoveryHost?.id, metadata: { origin: `${host}:${value}` } }));
    return { events, output: discovery.output };
  }

  private changeDirectory(args: string[], state: TerminalState) {
    if (!args[0]) return this.result(false, "Usage: cd <path>");
    return { ...this.result(true, ""), currentPath: args[0].startsWith("/") ? args[0] : `${state.currentPath ?? "/"}/${args[0]}`.replace(/\/+/g, "/") } as CommandResult;
  }

  private async listFiles(args: string[], state: TerminalState) {
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const path = args[0] ?? state.currentPath ?? "/";
    const files = session.machine.files.filter((file) => file.path.startsWith(path === "/" ? "/" : path));
    return this.result(true, files.length ? files.map((file) => `${file.permissions} ${file.owner}:${file.group ?? file.owner} ${file.path}`).join("\n") : "(empty)");
  }

  private async readFile(args: string[], state: TerminalState, retrieve: boolean) {
    if (!args[0]) return this.result(false, `Usage: ${retrieve ? "retrieve" : "cat"} <file>`);
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const file = session.machine.files.find((entry) => entry.path === args[0] || entry.path.endsWith(`/${args[0]}`));
    if (!file) return this.result(false, `File not found: ${args[0]}`);
    const groups = session.user.groups;
    const permission = file.owner === session.user.username ? file.permissions[0] : file.group && groups.includes(file.group) ? file.permissions[1] : file.permissions[2];
    const allowed = session.privilege === AccessLevel.ROOT || Boolean(Number(permission) & 4);
    if (!allowed) return this.result(false, "Permission denied");
    const events: SimulationEvent[] = [];
    events.push(await this.emit({ action: file.isSecret ? "SENSITIVE_FILE_READ" : "FILE_READ", category: SecurityEventCategory.FILESYSTEM, severity: file.isSecret ? SecurityEventSeverity.HIGH : SecurityEventSeverity.INFO, targetMachineId: session.machine.id, userId: session.user.username, visibleToBlue: file.isSecret, metadata: { path: file.path } }));

    const discovery = await this.applyDiscovery("file", session.machine.hostname, file.path, session.machine.id);
    events.push(...discovery.events);
    const definition = await this.definition();
    const objective = definition.objectives.find((entry) => entry.type === "retrieve_file" && entry.host === session.machine.hostname && entry.path === file.path);
    if (objective) {
      if (!retrieve) return this.result(true, `${file.contents}\n\nUse 'retrieve ${file.path.split("/").at(-1)}' to extract the objective.`, events);
      events.push(await this.emit({ action: "OBJECTIVE_RETRIEVED", category: SecurityEventCategory.FILESYSTEM, severity: SecurityEventSeverity.CRITICAL, targetMachineId: session.machine.id, userId: session.user.username, metadata: { objectiveId: objective.id, file: objective.path.split("/").at(-1) } }));
      const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: this.scenarioId } });
      await prisma.scenario.update({ where: { id: this.scenarioId }, data: { state: scenario.mode === "BLUE" ? ScenarioState.FAILED : ScenarioState.COMPLETED, endedAt: new Date() } });
      return { success: true, output: `${objective.label.replace(/^Retrieve /, "")} retrieved. Operation complete.`, events, objectiveRetrieved: true, discoveredHosts: await this.discoveredHosts() };
    }
    return { success: true, output: file.contents ?? "(empty)", events, discoveredHosts: await this.discoveredHosts() };
  }

  private async processes(state: TerminalState) {
    const session = await this.currentMachine(state);
    if (!session) return this.result(false, "No active session for this host.");
    const lines = session.machine.processes.map((process) => `${process.pid.toString().padEnd(7)} ${process.runningAs.padEnd(12)} ${process.name}`);
    return this.result(true, `PID     USER         COMMAND\n1       root         init\n${lines.join("\n")}`);
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
    events.push(await this.emit({ action: "HOST_DISCOVERED", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.INFO, sourceMachineId: source.machine.id, targetMachineId: target.id, visibleToBlue: false }));
    events.push(await this.emit({ action: "PORT_SCAN_DETECTED", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.LOW, sourceMachineId: source.machine.id, targetMachineId: target.id, visibleToRed: false }));
    return { success: true, output: `Nmap scan report for ${target.hostname} (${target.ip})\nPORT     STATE  SERVICE\n${target.services.map((service) => `${service.port}/tcp`.padEnd(9) + `open   ${service.name}`).join("\n")}`, events, discoveredHosts: await this.discoveredHosts() };
  }

  private async curl(args: string[], state: TerminalState) {
    if (!args[0]) return this.result(false, "Usage: curl <url>");
    const source = await this.currentMachine(state);
    if (!source) return this.result(false, "No active session.");
    const target = await this.target(args[0]);
    if (!target?.services.some((service) => service.name === "http" || service.name === "https")) return this.result(false, "curl: connection failed");
    if (!await reachable(this.scenarioId, source.machine.id, target.id, [80, 443])) return this.result(false, "curl: route blocked");
    const events = [await this.emit({ action: "WEB_REQUEST", category: SecurityEventCategory.WEB, severity: SecurityEventSeverity.INFO, sourceMachineId: source.machine.id, targetMachineId: target.id, metadata: { path: args[0] } })];
    const discovery = await this.applyDiscovery("web", target.hostname, args[0], source.machine.id);
    events.push(...discovery.events);
    return { success: true, output: discovery.output ?? `${target.hostname} responded.`, events, discoveredHosts: await this.discoveredHosts() };
  }

  private async connectPostgres(intent: Extract<ReturnType<typeof parseTerminalInput>, { kind: "PSQL_CONNECT" }>, state: TerminalState) {
    const [source, target, definition] = await Promise.all([this.currentMachine(state), this.target(intent.host), this.definition()]);
    const database = definition.databases?.find((entry) => entry.host === target?.hostname && entry.service === "postgres" && entry.database === intent.database);
    const service = target?.services.find((entry) => entry.name === "postgres" && entry.status === "RUNNING");
    const identity = target?.users.find((entry) => entry.username === intent.username);
    const credential = target && identity ? await prisma.securityEvent.findFirst({ where: { scenarioId: this.scenarioId, action: "CREDENTIAL_DISCOVERED", targetMachineId: target.id, userId: intent.username } }) : null;
    const reset = identity ? await prisma.securityEvent.findFirst({ where: { scenarioId: this.scenarioId, action: "RESET_PASSWORD", userId: intent.username }, orderBy: { timestamp: "desc" } }) : null;
    const allowed = Boolean(source && target && service && database && identity && credential && !reset && intent.password === identity.password && await reachable(this.scenarioId, source.machine.id, target.id, [5432]));
    const events = source && target ? [await this.emit({ action: allowed ? "POSTGRES_AUTH_SUCCESS" : "POSTGRES_AUTH_FAILED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: intent.username, metadata: { database: intent.database, service: "postgres" } })] : [];
    if (!allowed || !source || !target || !identity || !service || !database) return this.result(false, "psql: connection or authentication failed", events);
    const session = await prisma.session.create({ data: { actorId: this.actorId, userId: identity.id, machineId: target.id, privilege: identity.privilege, sourceMachineId: source.machine.id, scenarioId: this.scenarioId, context: "POSTGRES", serviceName: service.name, databaseName: database.database } });
    events.push(await this.emit({ action: "DATABASE_SESSION_CREATED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: identity.username, metadata: { sessionId: session.id, database: database.database } }));
    return {
      success: true,
      output: `psql (ROOT simulated PostgreSQL)\nSSL connection established.\n\nType "\\?" for help.`,
      events,
      sessionUpdated: true,
      context: { type: "POSTGRES" as const, serviceName: service.name, databaseName: database.database },
      newSession: { id: session.id, userId: identity.username, machineId: target.hostname, privilege: identity.privilege, sourceMachineId: source.machine.id, createdAt: session.createdAt, active: true, context: "POSTGRES" as const, serviceName: service.name, databaseName: database.database },
    };
  }

  private async postgresInput(input: string, state: TerminalState) {
    const session = await this.currentMachine(state);
    if (!session || session.context !== "POSTGRES" || !session.databaseName || !session.serviceName) return this.result(false, "PostgreSQL session is no longer active.");
    const database = (await this.definition()).databases?.find((entry) => entry.host === session.machine.hostname && entry.service === session.serviceName && entry.database === session.databaseName);
    const access = database?.identities.find((entry) => entry.username === session.user.username);
    if (!database || !access) return this.result(false, "ERROR: permission denied for database");
    if (input === "\\dt") return this.result(true, ` Schema | Name\n--------+-----------------\n${access.tables.map((table) => ` public | ${table.name}`).join("\n")}`);
    if (input === "\\?") return this.result(true, "ROOT psql supports: \\dt, SELECT <columns> FROM <table>;, \\q");
    if (input === "\\q") {
      await prisma.session.update({ where: { id: session.id }, data: { active: false } });
      const parent = await prisma.session.findFirst({
        where: { scenarioId: this.scenarioId, actorId: this.actorId, active: true, id: { not: session.id } },
        include: { machine: true, user: true },
        orderBy: { createdAt: "desc" },
      });
      if (!parent) return { ...this.result(true, "PostgreSQL session closed."), context: { type: "UNIX" as const } };
      const context = parent.context === "POSTGRES" && parent.serviceName && parent.databaseName
        ? { type: "POSTGRES" as const, serviceName: parent.serviceName, databaseName: parent.databaseName }
        : { type: parent.context === "SSH" ? "SSH" as const : "UNIX" as const };
      return {
        ...this.result(true, "PostgreSQL session closed."),
        context,
        sessionUpdated: true,
        newSession: { id: parent.id, userId: parent.user.username, machineId: parent.machine.hostname, privilege: parent.privilege, sourceMachineId: parent.sourceMachineId ?? undefined, createdAt: parent.createdAt, active: parent.active, context: parent.context, serviceName: parent.serviceName ?? undefined, databaseName: parent.databaseName ?? undefined },
      };
    }
    const match = input.match(/^SELECT\s+([\w\s,*]+)\s+FROM\s+(\w+)\s*;?$/i);
    if (!match) return this.result(false, "ERROR: ROOT psql supports bounded SELECT queries only.");
    const table = access.tables.find((entry) => entry.name.toLowerCase() === match[2].toLowerCase());
    if (!table) return this.result(false, `ERROR: relation "${match[2]}" does not exist`);
    const requested = match[1].trim() === "*" ? table.columns : match[1].split(",").map((column) => column.trim());
    if (requested.some((column) => !table.columns.includes(column))) return this.result(false, "ERROR: column does not exist");
    const rows = table.rows.map((row) => requested.map((column) => row[column] ?? "").join(" | "));
    const events = [await this.emit({ action: "DATABASE_QUERY", category: SecurityEventCategory.FILESYSTEM, severity: SecurityEventSeverity.HIGH, sourceMachineId: session.sourceMachineId ?? undefined, targetMachineId: session.machineId, userId: session.user.username, metadata: { database: database.database, table: table.name, columns: requested } })];
    const objective = (await this.definition()).objectives.find((entry) => entry.host === session.machine.hostname && table.rows.some((row) => row.filename === entry.path.split("/").at(-1)));
    if (objective) {
      events.push(await this.emit({ action: "OBJECTIVE_RETRIEVED", category: SecurityEventCategory.FILESYSTEM, severity: SecurityEventSeverity.CRITICAL, targetMachineId: session.machineId, userId: session.user.username, metadata: { objectiveId: objective.id, file: objective.path.split("/").at(-1), via: "postgres" } }));
      const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: this.scenarioId } });
      await prisma.scenario.update({ where: { id: this.scenarioId }, data: { state: scenario.mode === "BLUE" ? ScenarioState.FAILED : ScenarioState.COMPLETED, endedAt: new Date() } });
      return { success: true, output: `${requested.join(" | ")}\n${requested.map(() => "----------------").join("+")}\n${rows.join("\n")}\n(${rows.length} row)\n\n${objective.label.replace(/^Retrieve /, "")} retrieved. Operation complete.`, events, objectiveRetrieved: true };
    }
    return { success: true, output: `${requested.join(" | ")}\n${requested.map(() => "----------------").join("+")}\n${rows.join("\n")}\n(${rows.length} row)`, events };
  }

  private async exploit(args: string[], state: TerminalState) {
    const source = await this.currentMachine(state);
    const target = await this.target(args[0] ?? "");
    const definition = await this.definition();
    const profile = definition.exploits.find((entry) => entry.target === target?.hostname);
    if (!source || !target || !profile) return this.result(false, "Target is not vulnerable.");
    if (!await reachable(this.scenarioId, source.machine.id, target.id, [80, 443])) return this.result(false, "Exploit cannot reach the target service.");
    if (profile.prerequisiteAction) {
      const satisfied = await prisma.securityEvent.count({ where: { scenarioId: this.scenarioId, action: profile.prerequisiteAction, targetMachineId: target.id } });
      if (!satisfied) return this.result(false, "Exploit profile unknown. Gather service evidence first.");
    }
    const user = target.users.find((entry) => entry.username === profile.sessionUser);
    if (!user) return this.result(false, "Exploit session identity is unavailable.");
    await prisma.process.create({ data: { machineId: target.id, name: `${profile.module} → interactive-shell`, pid: 3000 + Math.floor(Math.random() * 900), runningAs: user.username } });
    const events: SimulationEvent[] = [];
    for (const evidence of profile.evidence) events.push(await this.emitDefinition(evidence, { sourceMachineId: source.machine.id, targetMachineId: target.id, userId: evidence.action === "PROCESS_SPAWN" ? user.username : undefined }));
    events.push(await this.emit({ action: "SESSION_CREATED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: user.username, metadata: { privilege: user.privilege } }));
    const session = await prisma.session.create({ data: { actorId: this.actorId, userId: user.id, machineId: target.id, privilege: user.privilege, sourceMachineId: source.machine.id, scenarioId: this.scenarioId, context: "SSH" } });
    return { success: true, output: profile.output, events, sessionUpdated: true, context: { type: "SSH" as const }, newSession: { id: session.id, userId: user.username, machineId: target.hostname, privilege: user.privilege, sourceMachineId: source.machine.id, createdAt: session.createdAt, active: true, context: "SSH" as const } };
  }

  private async ssh(args: string[], state: TerminalState) {
    if (!args[0]?.includes("@")) return this.result(false, "Usage: ssh <user@host>");
    const [username, host] = args[0].split("@");
    const [source, target] = await Promise.all([this.currentMachine(state), this.target(host)]);
    if (!source || !target) return this.result(false, "Host not found.");
    const user = target.users.find((entry) => entry.username === username);
    const credential = await prisma.securityEvent.findFirst({ where: { scenarioId: this.scenarioId, action: "CREDENTIAL_DISCOVERED", userId: username, targetMachineId: target.id } });
    const reset = await prisma.securityEvent.findFirst({ where: { scenarioId: this.scenarioId, action: "RESET_PASSWORD", userId: username }, orderBy: { timestamp: "desc" } });
    const link = await prisma.networkConnection.findFirst({ where: { sourceMachineId: source.machine.id, targetMachineId: target.id, port: { in: [22, 5432] }, allowed: true } });
    const isolated = await prisma.securityEvent.findFirst({ where: { scenarioId: this.scenarioId, action: "HOST_ISOLATED", targetMachineId: { in: [source.machine.id, target.id] } }, orderBy: { timestamp: "desc" } });
    const restored = isolated ? await prisma.securityEvent.findFirst({ where: { scenarioId: this.scenarioId, action: "HOST_RESTORED", targetMachineId: isolated.targetMachineId, timestamp: { gt: isolated.timestamp } } }) : null;
    const allowed = Boolean(user && credential && !reset && (!args[1] || args[1] === user.password) && link && (!isolated || restored) && await reachable(this.scenarioId, source.machine.id, target.id, [22, 5432]));
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
      const context = selected.context === "POSTGRES" && selected.serviceName && selected.databaseName
        ? { type: "POSTGRES" as const, serviceName: selected.serviceName, databaseName: selected.databaseName }
        : { type: selected.context === "SSH" ? "SSH" as const : "UNIX" as const };
      return { ...this.result(true, `Using ${selected.user.username}@${selected.machine.hostname}`), context, newSession: { id: selected.id, machineId: selected.machine.hostname, userId: selected.user.username, privilege: selected.privilege, active: selected.active, createdAt: selected.createdAt, sourceMachineId: selected.sourceMachineId ?? undefined, context: selected.context, serviceName: selected.serviceName ?? undefined, databaseName: selected.databaseName ?? undefined }, sessionUpdated: true };
    }
    return this.result(true, sessions.map((session, index) => `[${index + 1}] ${session.user.username}@${session.machine.hostname} (${session.privilege})`).join("\n") || "No active sessions");
  }

  private async privesc(args: string[], state: TerminalState) {
    const current = await this.currentMachine(state);
    const definition = await this.definition();
    const escalation = definition.privilegeEscalations.find((entry) => entry.command === args[0] && entry.host === current?.machine.hostname && entry.fromUser === current?.user.username);
    if (!current || !escalation) return this.result(false, "No matching trusted-service escalation was found in this context.");
    const elevated = await prisma.user.findFirstOrThrow({ where: { machineId: current.machine.id, username: escalation.toUser } });
    const events: SimulationEvent[] = [];
    for (const evidence of escalation.evidence) events.push(await this.emitDefinition(evidence, { targetMachineId: current.machine.id, userId: current.user.username }));
    events.push(await this.emit({ action: "ROOT_SESSION_CREATED", category: SecurityEventCategory.PRIVILEGE, severity: SecurityEventSeverity.HIGH, targetMachineId: current.machine.id, userId: elevated.username, metadata: { privilege: elevated.privilege } }));
    const session = await prisma.session.create({ data: { actorId: this.actorId, userId: elevated.id, machineId: current.machine.id, privilege: elevated.privilege, sourceMachineId: current.machine.id, scenarioId: this.scenarioId, context: "SSH" } });
    return { success: true, output: escalation.output, events, sessionUpdated: true, context: { type: "SSH" as const }, newSession: { id: session.id, userId: elevated.username, machineId: current.machine.hostname, privilege: elevated.privilege, createdAt: session.createdAt, active: true, context: "SSH" as const } };
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
