import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import type { TerminalState } from "./types";
import { getDefinitionForScenario } from "./initializer";
import { parseMetadata } from "./rules";
import { businessAvailability } from "./availability";

export async function advanceAutonomousBlueDefense(scenarioId: string) {
  const scenario = await prisma.scenario.findFirst({ where: { id: scenarioId, mode: "RED", state: "ACTIVE" }, include: { actors: true } });
  const blue = scenario?.actors.find((actor) => actor.role === "blue_ai");
  const red = scenario?.actors.find((actor) => actor.role === "red_operator");
  if (!scenario || !blue || !red) return;
  const events = await prisma.securityEvent.findMany({ where: { scenarioId }, orderBy: { timestamp: "asc" } });
  const evidence = events.filter((event) => event.actorId === red.id && event.visibleToBlue && event.action !== "DETECTION_TRIGGERED");
  const detections = events.filter((event) => event.action === "DETECTION_TRIGGERED" && event.visibleToBlue);
  const existing = new Set(events.filter((event) => event.actorId === blue.id).map((event) => event.action));
  const categories = new Set(evidence.map((event) => event.category));
  const emitStage = async (action: string, confidence: number, rationale: string) => {
    if (existing.has(action)) return;
    await prisma.securityEvent.create({ data: { scenarioId, actorId: blue.id, action, category: "SYSTEM", severity: confidence >= 70 ? "HIGH" : confidence >= 40 ? "MEDIUM" : "LOW", visibleToRed: false, visibleToBlue: true, metadata: JSON.stringify({ confidence, rationale, evidenceIds: evidence.slice(-8).map((event) => event.id) }) } });
    existing.add(action);
  };
  if (evidence.length) await emitStage("BLUE_OBSERVE", 15, "New monitored activity entered the baseline telemetry stream.");
  if (evidence.length >= 3) await emitStage("BLUE_INVESTIGATE", 30, "Several related events warrant host and identity review.");
  if (categories.size >= 2 && evidence.some((event) => event.severity === "HIGH" || event.severity === "CRITICAL")) await emitStage("BLUE_CORRELATE", 55, "Activity crosses telemetry categories and includes a high-confidence signal.");
  if (detections.length >= 2) await emitStage("BLUE_ALERT", 70, "Multiple independent detection rules now support escalation.");

  const failed = evidence.filter((event) => event.action === "AUTH_FAILED" || event.action === "POSTGRES_AUTH_FAILED");
  const repeatedIdentity = failed.map((event) => event.userId).find((username) => username && failed.filter((event) => event.userId === username).length >= 3);
  if (repeatedIdentity && !existing.has("BLUE_RESTRICT_ACCOUNT")) {
    const invalidated = await prisma.credential.updateMany({ where: { scenarioId, username: repeatedIdentity, valid: true }, data: { valid: false } });
    const closed = await prisma.session.updateMany({ where: { scenarioId, active: true, user: { username: repeatedIdentity } }, data: { active: false } });
    await prisma.securityEvent.create({ data: { scenarioId, actorId: blue.id, action: "BLUE_RESTRICT_ACCOUNT", category: "SYSTEM", severity: "HIGH", userId: repeatedIdentity, visibleToRed: true, visibleToBlue: true, metadata: JSON.stringify({ confidence: 85, affected: invalidated.count + closed.count, reason: "Repeated authentication failures" }) } });
  }

  const beacon = evidence.find((event) => event.action === "AGENT_BEACON" && event.sourceMachineId);
  if (beacon?.sourceMachineId && !existing.has("BLUE_ISOLATE_HOST")) {
    const services = await prisma.service.updateMany({ where: { machineId: beacon.sourceMachineId }, data: { status: "STOPPED" } });
    await prisma.session.updateMany({ where: { scenarioId, machineId: beacon.sourceMachineId, active: true }, data: { active: false } });
    await prisma.securityEvent.create({ data: { scenarioId, actorId: blue.id, action: "HOST_ISOLATED", category: "SYSTEM", severity: "HIGH", targetMachineId: beacon.sourceMachineId, visibleToRed: true, visibleToBlue: true, metadata: JSON.stringify({ confidence: 95, affected: services.count, reason: "Correlated persistent beacon" }) } });
    await prisma.securityEvent.create({ data: { scenarioId, actorId: blue.id, action: "BLUE_ISOLATE_HOST", category: "SYSTEM", severity: "HIGH", targetMachineId: beacon.sourceMachineId, visibleToRed: false, visibleToBlue: true } });
  }
}

export async function advanceBlueScenario(scenarioId: string, blueActorId: string) {
  const scenario = await prisma.scenario.findFirst({ where: { id: scenarioId, mode: "BLUE" }, include: { actors: true } });
  if (!scenario || !scenario.actors.some((a) => a.id === blueActorId && a.role === "blue_operator")) throw new Error("Scenario not found");
  if (scenario.state !== "ACTIVE") return { advanced: false, state: scenario.state };
  const definition = await getDefinitionForScenario(scenarioId);
  const red = scenario.actors.find((a) => a.role === "red_ai")!;
  const events = await prisma.securityEvent.findMany({ where: { scenarioId }, orderBy: { timestamp: "asc" } });
  const mission = parseMetadata(events.find((e) => e.action === "MISSION_STARTED")?.metadata);
  const preferred = definition.blueProfiles.find((p) => p.id === mission.blueProfileId) ?? definition.blueProfiles[0];
  const profiles = [preferred, ...definition.blueProfiles.filter((p) => p.id !== preferred.id)];
  const recovery = events.filter((e) => e.action === "HOST_RESTORED").at(-1)?.timestamp.getTime() ?? 0;
  const blocked = new Set(events.filter((e) => e.action === "AI_ROUTE_BLOCKED" && e.timestamp.getTime() > recovery).map((e) => parseMetadata(e.metadata).profileId));
  const profile = profiles.find((p) => !blocked.has(p.id));
  const expired = Boolean(scenario.startedAt && Date.now() - scenario.startedAt.getTime() >= definition.conditions.timeLimitMinutes * 60_000);
  if (!profile || expired) {
    const availability = await businessAvailability(scenarioId);
    const state = availability.percent >= definition.conditions.minimumAvailability ? "COMPLETED" : "FAILED";
    await prisma.securityEvent.create({ data: { scenarioId, actorId: blueActorId, action: "ATTACK_CONTAINED", category: "SYSTEM", severity: "INFO", metadata: JSON.stringify({ reason: expired ? "Objective prevented through response window" : "All objective approaches interrupted", availability: availability.percent }) } });
    await prisma.scenario.update({ where: { id: scenarioId }, data: { state, endedAt: new Date() } });
    return { advanced: false, contained: true, state };
  }
  const steps = events.filter((e) => e.action === "AI_STEP" && e.timestamp.getTime() > recovery && parseMetadata(e.metadata).profileId === profile.id);
  const step = steps.length;
  const previous = parseMetadata(steps.at(-1)?.metadata);
  const context = step === 0 ? { machine: { hostname: definition.startingKnowledge.knownHosts[0] } } : { machine: { hostname: String(previous.machine) }, user: { username: String(previous.user) } };
  let current = await prisma.session.findFirst({ where: { scenarioId, actorId: red.id, active: true, ...context }, include: { machine: true, user: true }, orderBy: { createdAt: "desc" } });
  if (!current && step > 0) {
    const old = await prisma.session.findFirst({ where: { scenarioId, actorId: red.id, ...context }, include: { machine: { include: { persistence: true, services: true } }, user: true }, orderBy: { createdAt: "desc" } });
    if (old?.machine.persistence.some((p) => p.active) && old.machine.services.some((s) => s.status === "RUNNING")) {
      const session = await prisma.session.create({ data: { scenarioId, actorId: red.id, machineId: old.machineId, userId: old.userId, privilege: old.privilege, sourceMachineId: old.sourceMachineId } });
      await prisma.securityEvent.create({ data: { scenarioId, actorId: red.id, targetMachineId: old.machineId, userId: old.user.username, action: "SESSION_CREATED", category: "PERSISTENCE", severity: "HIGH", metadata: JSON.stringify({ sessionId: session.id, privilege: session.privilege, persistenceReconnect: true }) } });
      current = { ...session, machine: old.machine, user: old.user };
    }
  }
  const previousContext = previous.context;
  const terminalContext = previousContext && typeof previousContext === "object" && "type" in previousContext && (previousContext.type === "UNIX" || previousContext.type === "SSH" || previousContext.type === "POSTGRES" || previousContext.type === "AUTHENTICATING")
    ? previousContext as TerminalState["context"]
    : current?.context === "AUTHENTICATING" && current.serviceName
      ? { type: "AUTHENTICATING" as const, serviceName: current.serviceName, username: current.user.username, host: current.machine.hostname, databaseName: current.databaseName ?? undefined }
    : current?.context === "POSTGRES" && current.serviceName
      ? { type: "POSTGRES" as const, serviceName: current.serviceName, databaseName: current.databaseName ?? undefined }
      : { type: current?.context === "SSH" ? "SSH" as const : "UNIX" as const };
  const state: TerminalState | undefined = current ? { currentMachine: current.machine.hostname, currentUser: current.user.username, currentSessionId: current.id, currentPrivilege: current.privilege, currentPath: "/", context: terminalContext, activeSessions: [], discoveredHosts: [], credentials: new Map() } : undefined;
  const command = profile.commands[step];
  const result = state && command ? await new SimulationEngine(scenarioId, red.id).executeCommand(command, state) : { success: false, output: "No usable session", newSession: undefined, objectiveRetrieved: false };
  if (!result.success) {
    await prisma.securityEvent.create({ data: { scenarioId, actorId: red.id, action: "AI_ROUTE_BLOCKED", category: "SYSTEM", severity: "INFO", visibleToRed: false, visibleToBlue: false, metadata: JSON.stringify({ profileId: profile.id, routeId: profile.routeId, command, reason: result.output }) } });
    return { advanced: false, state: "ACTIVE", routeInterrupted: true };
  }
  await prisma.securityEvent.create({ data: { scenarioId, actorId: red.id, action: "AI_STEP", category: "SYSTEM", severity: "INFO", visibleToRed: false, visibleToBlue: false, metadata: JSON.stringify({ profileId: profile.id, step, command, machine: result.newSession?.machineId ?? state!.currentMachine, user: result.newSession?.userId ?? state!.currentUser, context: ("context" in result ? result.context : undefined) ?? state!.context }) } });
  return { advanced: true, step, objectiveRetrieved: result.objectiveRetrieved };
}

export type ResponseInput = { scenarioId: string; actorId: string; action: string; targetId?: string; sessionId?: string; username?: string; connectionId?: string; evidenceIds?: string[]; finding?: string; status?: string };
export async function respondToAttack(input: ResponseInput) {
  const actor = await prisma.actor.findFirst({ where: { id: input.actorId, scenarioId: input.scenarioId, role: "blue_operator" }, include: { scenario: true } });
  if (!actor || actor.scenario.state !== "ACTIVE") throw new Error("No active authorized operation");
  const definition = await getDefinitionForScenario(input.scenarioId);
  const allowed = ["INSPECT_HOST", "INSPECT_USER", "INSPECT_PROCESS", "REVOKE_SESSION", "RESET_PASSWORD", "BLOCK_CONNECTION", "ISOLATE_HOST", "RESTORE_HOST", "INCREASE_MONITORING", "REMOVE_PERSISTENCE", "INCIDENT_FINDING", "ALERT_REVIEWED"];
  if (!allowed.includes(input.action)) throw new Error("Unsupported response action");
  const target = input.targetId ? await prisma.machine.findFirst({ where: { id: input.targetId, scenarioId: input.scenarioId } }) : null;
  if (["INSPECT_HOST", "INSPECT_PROCESS", "ISOLATE_HOST", "RESTORE_HOST", "REMOVE_PERSISTENCE", "INCREASE_MONITORING"].includes(input.action) && !target) throw new Error("Select a valid host");
  const evidenceIds = input.evidenceIds ?? [];
  if (evidenceIds.length > 50 || await prisma.securityEvent.count({ where: { scenarioId: input.scenarioId, id: { in: evidenceIds }, visibleToBlue: true } }) !== new Set(evidenceIds).size) throw new Error("Invalid evidence");
  if (input.action === "INCIDENT_FINDING" && (!input.finding?.trim() || input.finding.length > 2000 || !evidenceIds.length)) throw new Error("A finding needs text and visible evidence");
  let affected = 0;
  let resolvedTarget = target?.id;
  if (input.action === "REVOKE_SESSION") {
    const session = await prisma.session.findFirst({ where: { id: input.sessionId ?? "", scenarioId: input.scenarioId, active: true } });
    if (!session) throw new Error("Session unavailable");
    resolvedTarget = session.machineId;
    await prisma.session.update({ where: { id: session.id }, data: { active: false } }); affected = 1;
  }
  if (["RESET_PASSWORD", "INSPECT_USER"].includes(input.action)) {
    if (!input.username || !await prisma.user.count({ where: { username: input.username, machine: { scenarioId: input.scenarioId } } })) throw new Error("Select a valid identity");
    if (input.action === "RESET_PASSWORD") {
      const closed = await prisma.session.updateMany({ where: { scenarioId: input.scenarioId, active: true, user: { username: input.username } }, data: { active: false } });
      const invalidated = await prisma.credential.updateMany({ where: { scenarioId: input.scenarioId, username: input.username, valid: true }, data: { valid: false } });
      affected = closed.count + invalidated.count + 1;
    }
  }
  if (input.action === "BLOCK_CONNECTION") {
    const connection = await prisma.networkConnection.findFirst({ where: { id: input.connectionId ?? "", source: { scenarioId: input.scenarioId }, target: { scenarioId: input.scenarioId } } });
    if (!connection) throw new Error("Select a connection");
    await prisma.networkConnection.update({ where: { id: connection.id }, data: { allowed: false } }); resolvedTarget = connection.targetMachineId; affected = 1;
  }
  if (input.action === "ISOLATE_HOST" && target) {
    affected = (await prisma.service.updateMany({ where: { machineId: target.id }, data: { status: "STOPPED" } })).count;
    await prisma.session.updateMany({ where: { scenarioId: input.scenarioId, machineId: target.id, active: true }, data: { active: false } });
  }
  if (input.action === "RESTORE_HOST" && target) {
    affected = (await prisma.service.updateMany({ where: { machineId: target.id }, data: { status: "RUNNING" } })).count;
    await prisma.networkConnection.updateMany({ where: { targetMachineId: target.id }, data: { allowed: true } });
  }
  if (input.action === "REMOVE_PERSISTENCE" && target) {
    affected = (await prisma.persistence.updateMany({ where: { machineId: target.id, active: true }, data: { active: false } })).count;
    await prisma.process.deleteMany({ where: { machineId: target.id, name: definition.persistencePolicy.process } });
  }
  const availability = await businessAvailability(input.scenarioId);
  const businessImpact = definition.businessServices.filter((service) => service.hosts.includes(target?.hostname ?? "")).map((service) => service.impact);
  const action = input.action === "ISOLATE_HOST" ? "HOST_ISOLATED" : input.action === "RESTORE_HOST" ? "HOST_RESTORED" : input.action;
  await prisma.securityEvent.create({ data: { scenarioId: input.scenarioId, actorId: input.actorId, action, targetMachineId: resolvedTarget, userId: input.username, category: "SYSTEM", severity: "INFO", visibleToRed: false, visibleToBlue: true, metadata: JSON.stringify({ affected, sessionId: input.sessionId, connectionId: input.connectionId, evidenceIds, finding: input.finding, status: input.status, availability: availability.percent, businessImpact }) } });
  return { success: true, affected, availability };
}
