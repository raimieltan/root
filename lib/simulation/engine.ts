import { AccessLevel, ScenarioState, SecurityEventCategory, SecurityEventSeverity } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { CommandResult, SimulationEvent, TerminalState } from "./types";
import { detectionForAction } from "./rules";

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
  constructor(private scenarioId: string, private actorId: string) {}

  async executeCommand(command: string, state: TerminalState): Promise<CommandResult> {
    const [raw = "", ...args] = command.trim().split(/\s+/);
    const cmd = raw.toLowerCase();
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
      case "msfconsole": return this.result(true, "Metasploit simulation ready. Use: exploit WEB-01");
      case "exploit": return this.exploit(args, state);
      case "ssh": return this.ssh(args, state);
      case "john": return this.john(args);
      case "sessions": return this.sessions();
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
System:      whoami · hostname · ps · privesc backup-sync
Tools:       john <file> · msfconsole · install-agent · clear`;
  }

  private async currentMachine(state: TerminalState) {
    const session = await prisma.session.findFirst({
      where: { scenarioId: this.scenarioId, actorId: this.actorId, active: true, machine: { hostname: state.currentMachine }, user: { username: state.currentUser } },
      include: { machine: { include: { files: true, services: true, processes: true } }, user: true },
    });
    return session;
  }

  private async target(value: string) {
    const resolved = value === "portal.meridian.test" || value === "fin-app.internal" ? (value.startsWith("portal") ? "WEB-01" : "FIN-APP") : value;
    return prisma.machine.findFirst({ where: { scenarioId: this.scenarioId, OR: [{ hostname: resolved.toUpperCase() }, { ip: resolved }] }, include: { services: true, users: true } });
  }

  private async emit(input: EventInput): Promise<SimulationEvent> {
    const event = await prisma.securityEvent.create({
      data: {
        scenarioId: this.scenarioId, actorId: this.actorId, action: input.action, category: input.category,
        severity: input.severity, sourceMachineId: input.sourceMachineId, targetMachineId: input.targetMachineId,
        userId: input.userId, visibleToRed: input.visibleToRed ?? true, visibleToBlue: input.visibleToBlue ?? true,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
      },
    });
    const detection = detectionForAction(event.action);
    if (detection) {
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
    const events = await prisma.securityEvent.findMany({ where: { scenarioId: this.scenarioId, action: "HOST_DISCOVERED" }, include: { targetMachine: true } });
    return ["portal.meridian.test", ...new Set(events.flatMap((event) => event.targetMachine ? [event.targetMachine.hostname] : []))];
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
    const allowed = session.privilege === AccessLevel.ROOT || file.owner === session.user.username || Boolean(file.group && groups.includes(file.group)) || file.permissions.endsWith("4");
    if (!allowed) return this.result(false, "Permission denied");
    const events: SimulationEvent[] = [];
    events.push(await this.emit({ action: file.isSecret ? "SENSITIVE_FILE_READ" : "FILE_READ", category: SecurityEventCategory.FILESYSTEM, severity: file.isSecret ? SecurityEventSeverity.HIGH : SecurityEventSeverity.INFO, targetMachineId: session.machine.id, userId: session.user.username, visibleToBlue: file.isSecret, metadata: { path: file.path } }));

    const discoveries: Record<string, { host: string; credential: string; scope: string }> = {
      "/var/www/meridian/app.conf": { host: "DEV-01", credential: "deploy", scope: "DEV-01" },
      "/etc/meridian/routes.conf": { host: "FIN-APP", credential: "svc_web", scope: "FIN-APP" },
      "/etc/fin-app/db.conf": { host: "FIN-DB", credential: "finance_app", scope: "FIN-DB" },
    };
    const clue = discoveries[file.path];
    if (clue) {
      const machine = await this.target(clue.host);
      events.push(await this.emit({ action: "CREDENTIAL_DISCOVERED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, targetMachineId: machine?.id, userId: clue.credential, visibleToBlue: false, metadata: { ...clue, origin: `${session.machine.hostname}:${file.path}` } }));
      events.push(await this.emit({ action: "HOST_DISCOVERED", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.INFO, targetMachineId: machine?.id, visibleToBlue: false }));
    }
    if (file.path.endsWith("PROJECT_ATLAS.pdf")) {
      if (!retrieve) return this.result(true, `${file.contents}\n\nUse 'retrieve PROJECT_ATLAS.pdf' to extract the objective.`, events);
      events.push(await this.emit({ action: "OBJECTIVE_RETRIEVED", category: SecurityEventCategory.FILESYSTEM, severity: SecurityEventSeverity.CRITICAL, targetMachineId: session.machine.id, userId: session.user.username, metadata: { file: "PROJECT_ATLAS.pdf" } }));
      await prisma.scenario.update({ where: { id: this.scenarioId }, data: { state: ScenarioState.COMPLETED, endedAt: new Date() } });
      return { success: true, output: "PROJECT_ATLAS.pdf retrieved. Operation Glasshouse complete.", events, objectiveRetrieved: true, discoveredHosts: await this.discoveredHosts() };
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
    const event = await this.emit({ action: "PING", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.LOW, sourceMachineId: source.machine.id, targetMachineId: target.id });
    return this.result(true, `64 bytes from ${target.ip}: time=1.2 ms`, [event]);
  }

  private async scan(args: string[], state: TerminalState) {
    if (!args[0]) return this.result(false, "Usage: nmap <host>");
    const [source, target] = await Promise.all([this.currentMachine(state), this.target(args[0])]);
    if (!source || !target) return this.result(false, "Host seems down.");
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
    if (args[0].includes("portal.meridian.test") || args[0].includes("10.10.10.10")) {
      const web = await this.target("WEB-01");
      const event = await this.emit({ action: "WEB_REQUEST", category: SecurityEventCategory.WEB, severity: SecurityEventSeverity.INFO, sourceMachineId: source.machine.id, targetMachineId: web?.id, metadata: { path: args[0] } });
      return this.result(true, "Meridian Employee Portal\nNotice: legacy upload endpoint /legacy-upload", [event]);
    }
    return this.result(false, "curl: connection failed");
  }

  private async exploit(args: string[], state: TerminalState) {
    const source = await this.currentMachine(state);
    const target = await this.target(args[0] ?? "");
    if (!source || target?.hostname !== "WEB-01") return this.result(false, "Target is not vulnerable.");
    const scanned = await prisma.securityEvent.count({ where: { scenarioId: this.scenarioId, action: "PORT_PROBE", targetMachineId: target.id } });
    if (!scanned) return this.result(false, "Exploit profile unknown. Scan and inspect the portal first.");
    const user = target.users.find((entry) => entry.username === "www-data")!;
    const events = [
      await this.emit({ action: "EXPLOIT_EXECUTED", category: SecurityEventCategory.WEB, severity: SecurityEventSeverity.HIGH, sourceMachineId: source.machine.id, targetMachineId: target.id, metadata: { module: "legacy_upload" } }),
      await this.emit({ action: "PROCESS_SPAWN", category: SecurityEventCategory.PROCESS, severity: SecurityEventSeverity.MEDIUM, targetMachineId: target.id, userId: user.username }),
      await this.emit({ action: "SESSION_CREATED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: user.username, metadata: { privilege: user.privilege } }),
    ];
    const session = await prisma.session.create({ data: { actorId: this.actorId, userId: user.id, machineId: target.id, privilege: user.privilege, sourceMachineId: source.machine.id, scenarioId: this.scenarioId } });
    return { success: true, output: "Session opened: www-data@WEB-01", events, sessionUpdated: true, newSession: { id: session.id, userId: user.username, machineId: target.hostname, privilege: user.privilege, sourceMachineId: source.machine.id, createdAt: session.createdAt, active: true } };
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
    const allowed = Boolean(user && credential && !reset && link && (!isolated || restored));
    const events = [await this.emit({ action: allowed ? "AUTH_SUCCESS" : "AUTH_FAILED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: username })];
    if (!allowed || !user) return this.result(false, "Permission denied or route blocked.", events);
    events.push(await this.emit({ action: "SESSION_CREATED", category: SecurityEventCategory.AUTH, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: username, metadata: { privilege: user.privilege } }));
    events.push(await this.emit({ action: "LATERAL_MOVEMENT", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.MEDIUM, sourceMachineId: source.machine.id, targetMachineId: target.id, userId: username, visibleToRed: false }));
    const session = await prisma.session.create({ data: { actorId: this.actorId, userId: user.id, machineId: target.id, privilege: user.privilege, sourceMachineId: source.machine.id, scenarioId: this.scenarioId } });
    return { success: true, output: `Connected to ${target.hostname}.`, events, sessionUpdated: true, newSession: { id: session.id, userId: user.username, machineId: target.hostname, privilege: user.privilege, sourceMachineId: source.machine.id, createdAt: session.createdAt, active: true } };
  }

  private john(args: string[]) {
    return args[0] ? this.result(true, "Loaded 1 simulated hash\ndeployed (deploy)\n1 hash cracked") : this.result(false, "Usage: john <file>");
  }

  private async sessions() {
    const sessions = await prisma.session.findMany({ where: { scenarioId: this.scenarioId, actorId: this.actorId, active: true }, include: { machine: true, user: true }, orderBy: { createdAt: "asc" } });
    return this.result(true, sessions.map((session, index) => `[${index + 1}] ${session.user.username}@${session.machine.hostname} (${session.privilege})`).join("\n") || "No active sessions");
  }

  private async privesc(args: string[], state: TerminalState) {
    const current = await this.currentMachine(state);
    if (args[0] !== "backup-sync" || current?.machine.hostname !== "DEV-01" || current.user.username !== "deploy") return this.result(false, "Usage from deploy@DEV-01: privesc backup-sync");
    const root = await prisma.user.findFirstOrThrow({ where: { machineId: current.machine.id, username: "root" } });
    const actions = ["PRIVILEGED_CONFIG_MODIFIED", "SERVICE_RESTARTED", "PRIVILEGE_ESCALATION", "ROOT_SESSION_CREATED"];
    const events: SimulationEvent[] = [];
    for (const action of actions) events.push(await this.emit({ action, category: action === "PRIVILEGED_CONFIG_MODIFIED" ? SecurityEventCategory.FILESYSTEM : SecurityEventCategory.PRIVILEGE, severity: action === "PRIVILEGE_ESCALATION" ? SecurityEventSeverity.CRITICAL : SecurityEventSeverity.HIGH, targetMachineId: current.machine.id, userId: action === "ROOT_SESSION_CREATED" ? "root" : "deploy", metadata: action === "ROOT_SESSION_CREATED" ? { privilege: AccessLevel.ROOT } : undefined }));
    const session = await prisma.session.create({ data: { actorId: this.actorId, userId: root.id, machineId: current.machine.id, privilege: AccessLevel.ROOT, sourceMachineId: current.machine.id, scenarioId: this.scenarioId } });
    return { success: true, output: "backup-sync trusted the modified hook. Root session opened.", events, sessionUpdated: true, newSession: { id: session.id, userId: "root", machineId: "DEV-01", privilege: AccessLevel.ROOT, createdAt: session.createdAt, active: true } };
  }

  private async installAgent(state: TerminalState) {
    const current = await this.currentMachine(state);
    if (!current || current.privilege !== AccessLevel.ROOT) return this.result(false, "Root access is required.");
    const artifact = await prisma.persistence.create({ data: { machineId: current.machine.id, type: "remote_agent" } });
    const process = await prisma.process.create({ data: { machineId: current.machine.id, name: "root-agent", pid: 4400 + Math.floor(Math.random() * 400), runningAs: current.user.username } });
    const events = [await this.emit({ action: "PERSISTENCE_INSTALLED", category: SecurityEventCategory.PERSISTENCE, severity: SecurityEventSeverity.HIGH, targetMachineId: current.machine.id, userId: current.user.username, metadata: { artifactId: artifact.id, processId: process.id } }), await this.emit({ action: "AGENT_BEACON", category: SecurityEventCategory.NETWORK, severity: SecurityEventSeverity.HIGH, sourceMachineId: current.machine.id, metadata: { intervalSeconds: 30 } })];
    return this.result(true, "root-agent installed; beacon interval 30 seconds.", events);
  }
}
