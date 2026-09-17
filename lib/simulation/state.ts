import { prisma } from "@/lib/prisma";
import { alertsFromEvents, parseMetadata, suspicionFromEvents } from "./rules";
import { getDefinitionForScenario } from "./initializer";

export async function getScenarioView(scenarioId: string, actorId: string) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    include: {
      actors: true,
      machines: { include: { services: true, files: true, processes: true, persistence: true } },
      sessions: { include: { machine: true, user: true }, orderBy: { createdAt: "asc" } },
      events: { include: { sourceMachine: true, targetMachine: true }, orderBy: { timestamp: "asc" } },
    },
  });
  if (!scenario) return null;
  const definition = await getDefinitionForScenario(scenarioId);
  const actor = scenario.actors.find((entry) => entry.id === actorId);
  if (!actor) return null;
  const isBlue = actor.role === "blue_operator";
  const redActor = scenario.actors.find((entry) => entry.role === "red_operator" || entry.role === "red_ai");
  const actorSessions = scenario.sessions.filter((session) => session.actorId === redActor?.id);
  const activeSessions = actorSessions.filter((session) => session.active);
  const current = activeSessions.at(-1);
  const discovered = new Set(definition.startingKnowledge.knownHosts);
  for (const event of scenario.events) if (event.action === "HOST_DISCOVERED" && event.targetMachine) discovered.add(event.targetMachine.hostname);
  for (const session of actorSessions) discovered.add(session.machine.hostname);
  const visibleEvents = scenario.events.filter((event) => isBlue ? event.visibleToBlue : event.visibleToRed);
  const isolated = new Set<string>();
  for (const event of scenario.events) {
    if (event.action === "HOST_ISOLATED" && event.targetMachineId) isolated.add(event.targetMachineId);
    if (event.action === "HOST_RESTORED" && event.targetMachineId) isolated.delete(event.targetMachineId);
  }
  const machines = scenario.machines
    .filter((machine) => isBlue || machine.hostname === "INTERNET" || discovered.has(machine.hostname))
    .map((machine) => {
      const accessed = actorSessions.some((session) => session.machineId === machine.id);
      const compromised = actorSessions.some((session) => session.machineId === machine.id && session.privilege === "ROOT");
      const suspicious = scenario.events.some((event) => event.targetMachineId === machine.id && event.visibleToBlue && ["HIGH", "CRITICAL"].includes(event.severity));
      return {
        id: machine.id, hostname: machine.hostname, ip: machine.ip, zone: machine.zone, os: machine.os,
        state: isolated.has(machine.id) ? "ISOLATED" : compromised ? "COMPROMISED" : accessed ? "ACCESSED" : suspicious ? "SUSPICIOUS" : "HEALTHY",
        services: machine.services.map((service) => ({ name: service.name, port: service.port, status: service.status })),
        processes: (isBlue || current?.machineId === machine.id) ? machine.processes : [],
        files: current?.machineId === machine.id && !isBlue ? machine.files.map((file) => ({ path: file.path, owner: file.owner, permissions: file.permissions, isSecret: file.isSecret })) : [],
        persistence: machine.persistence.filter((artifact) => artifact.active),
        availability: isolated.has(machine.id) ? "OFFLINE" : "ONLINE",
      };
    });
  const events = visibleEvents.map((event) => ({
    id: event.id, timestamp: event.timestamp.toISOString(), category: event.category, action: event.action,
    severity: event.severity, source: event.sourceMachine?.hostname ?? null, target: event.targetMachine?.hostname ?? null,
    userId: event.userId, metadata: parseMetadata(event.metadata), visibleToRed: event.visibleToRed, visibleToBlue: event.visibleToBlue,
  }));
  const rawEvents = scenario.events.map((event) => ({ ...event, metadata: event.metadata }));
  const objectiveRetrieved = scenario.events.some((event) => event.action === "OBJECTIVE_RETRIEVED");
  const credentials = scenario.events
    .filter((event) => event.action === "CREDENTIAL_DISCOVERED" && event.visibleToRed)
    .map((event) => {
      const metadata = parseMetadata(event.metadata);
      return {
        username: event.userId ?? "unknown",
        scope: typeof metadata.scope === "string" ? metadata.scope : event.targetMachine?.hostname ?? "unknown",
        origin: typeof metadata.origin === "string" ? metadata.origin : "discovered file",
      };
    })
    .filter((credential, index, entries) => entries.findIndex((entry) => entry.username === credential.username && entry.scope === credential.scope) === index);
  const relationships = scenario.events
    .filter((event) => event.action === "SESSION_CREATED" && event.sourceMachine && event.targetMachine)
    .map((event) => `${event.sourceMachine!.hostname} → ${event.targetMachine!.hostname} via ${event.userId ?? "unknown"}`)
    .filter((relationship, index, entries) => entries.indexOf(relationship) === index);
  const redFootprint = scenario.events.filter((event) => event.actorId === redActor?.id && event.visibleToRed && event.action !== "DETECTION_TRIGGERED");
  const level = (count: number) => count >= 8 ? "ELEVATED" : count >= 3 ? "MODERATE" : "LOW";
  return {
    scenario: { id: scenario.id, mode: scenario.mode, state: scenario.state, startedAt: scenario.startedAt?.toISOString(), endedAt: scenario.endedAt?.toISOString() },
    actor: { id: actor.id, role: actor.role }, redActorId: redActor?.id,
    currentSession: current ? { id: current.id, machine: current.machine.hostname, user: current.user.username, privilege: current.privilege } : null,
    sessions: activeSessions.map((session) => ({ id: session.id, machine: session.machine.hostname, user: session.user.username, privilege: session.privilege, createdAt: session.createdAt.toISOString() })),
    discoveredHosts: [...discovered], machines, events,
    alerts: alertsFromEvents(rawEvents), suspicion: suspicionFromEvents(rawEvents), objectiveRetrieved,
    credentials,
    intel: { hosts: [...discovered], relationships },
    opsec: {
      network: level(redFootprint.filter((event) => event.category === "NETWORK" || event.category === "WEB").length),
      authentication: level(redFootprint.filter((event) => event.category === "AUTH").length),
      endpoint: level(redFootprint.filter((event) => ["PROCESS", "FILESYSTEM", "PRIVILEGE", "PERSISTENCE"].includes(event.category)).length),
    },
    guidance: {
      objective: definition.objectives[0]?.label ?? "Complete the objective",
      hypotheses: definition.routes.map((route) => {
        const reached = route.hosts.filter((host) => host !== "INTERNET" && actorSessions.some((session) => session.machine.hostname === host));
        const observed = route.hosts.filter((host) => discovered.has(host));
        const newObservation = observed.some((host) => !definition.startingKnowledge.knownHosts.includes(host));
        return {
          id: route.id,
          title: `${route.name} hypothesis`,
          question: route.hypothesis,
          status: objectiveRetrieved && route.hosts.every((host) => host === "INTERNET" || actorSessions.some((session) => session.machine.hostname === host)) ? "VALIDATED" : reached.length || newObservation ? "SUPPORTED" : "OPEN",
          evidence: [...new Set([...observed.map((host) => `${host} observed`), ...reached.map((host) => `${host} accessed`)])],
        };
      }),
    },
  };
}

export type ScenarioView = NonNullable<Awaited<ReturnType<typeof getScenarioView>>>;
