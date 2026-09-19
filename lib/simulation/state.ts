import { prisma } from "@/lib/prisma";
import { alertsFromEvents, parseMetadata, suspicionFromEvents } from "./rules";
import { getDefinitionForScenario } from "./initializer";
import { operationPresentation } from "./scenarios";
import { businessAvailability } from "./availability";

export async function getScenarioView(scenarioId: string, actorId: string) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    include: {
      actors: true,
      machines: { include: { services: true, files: true, processes: true, persistence: true } },
      sessions: { include: { machine: true, user: true }, orderBy: { createdAt: "asc" } },
      credentials: { orderBy: { discoveredAt: "asc" } },
      events: { include: { sourceMachine: true, targetMachine: true }, orderBy: { timestamp: "asc" } },
    },
  });
  if (!scenario) return null;
  const definition = await getDefinitionForScenario(scenarioId);
  const actor = scenario.actors.find((entry) => entry.id === actorId);
  if (!actor) return null;
  const isBlue = actor.role === "blue_operator";
  const mission = parseMetadata(scenario.events.find((event) => event.action === "MISSION_STARTED")?.metadata);
  const availability = await businessAvailability(scenarioId);
  const connections = isBlue ? await prisma.networkConnection.findMany({ where: { source: { scenarioId } }, include: { source: true, target: true } }) : [];
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
      const servicesInspected = isBlue || scenario.events.some((event) => event.action === "PORT_PROBE" && event.targetMachineId === machine.id && event.actorId === redActor?.id);
      return {
        id: machine.id, hostname: machine.hostname, ip: machine.ip, zone: machine.zone, os: machine.os,
        state: isolated.has(machine.id) ? "ISOLATED" : isBlue ? (suspicious ? "SUSPICIOUS" : "HEALTHY") : compromised ? "COMPROMISED" : accessed ? "ACCESSED" : "DISCOVERED",
        services: servicesInspected ? machine.services.map((service) => ({ name: service.name, port: service.port, status: service.status })) : [],
        processes: (isBlue || current?.machineId === machine.id) ? machine.processes : [],
        files: current?.machineId === machine.id && !isBlue ? machine.files.map((file) => ({ path: file.path, owner: file.owner, permissions: file.permissions, isSecret: file.isSecret })) : [],
        persistence: isBlue && !scenario.events.some((e) => e.action === "INSPECT_HOST" && e.targetMachineId === machine.id) ? [] : machine.persistence.filter((artifact) => artifact.active),
        availability: isolated.has(machine.id) ? "OFFLINE" : "ONLINE",
      };
    });
  const events = visibleEvents.map((event) => ({
    id: event.id, timestamp: event.timestamp.toISOString(), category: event.category, action: event.action,
    severity: event.severity, source: event.sourceMachine?.hostname ?? null, target: event.targetMachine?.hostname ?? null,
    userId: event.userId, metadata: Object.fromEntries(Object.entries(parseMetadata(event.metadata)).filter(([key]) => !isBlue || key !== "background")), visibleToRed: event.visibleToRed, visibleToBlue: event.visibleToBlue,
  }));
  const investigation = !isBlue ? [] : definition.routes.map((route) => {
    const routeConnections = connections.filter((connection) =>
      route.hosts.includes(connection.source.hostname) && route.hosts.includes(connection.target.hostname),
    );
    const routeEvents = events.filter((event) =>
      [event.source, event.target].some((host) => host && host !== "INTERNET" && route.hosts.includes(host)),
    );
    const observedHosts = new Set(routeEvents.flatMap((event) => [event.source, event.target]).filter((host): host is string => Boolean(host)));
    const observedIdentities = [...new Set(routeEvents.map((event) => event.userId).filter((identity): identity is string => Boolean(identity)))];
    const observedProcesses = machines
      .filter((machine) => observedHosts.has(machine.hostname))
      .flatMap((machine) => machine.processes.map((process) => `${machine.hostname}: ${process.runningAs} ${process.name}`));
    const blockedLinks = routeConnections.filter((connection) => !connection.allowed);
    const unobservedHosts = route.hosts.filter((host) => host !== "INTERNET" && !observedHosts.has(host));
    const routeServices = definition.businessServices.filter((service) => service.hosts.some((host) => route.hosts.includes(host)));
    return {
      id: route.id,
      name: route.name,
      hypothesis: route.hypothesis,
      status: blockedLinks.length ? "CONTAINED" : routeEvents.length >= 2 ? "SUPPORTED" : "OPEN",
      evidence: {
        hosts: [...observedHosts],
        identities: observedIdentities,
        processes: observedProcesses,
        connections: routeConnections.map((connection) => ({ id: connection.id, source: connection.source.hostname, target: connection.target.hostname, protocol: connection.protocol, port: connection.port, allowed: connection.allowed })),
        timeline: routeEvents.map((event) => ({ id: event.id, timestamp: event.timestamp, action: event.action, source: event.source, target: event.target, identity: event.userId })),
      },
      uncertainty: unobservedHosts.length
        ? `No observed telemetry yet from ${unobservedHosts.join(", ")}; the route remains a hypothesis.`
        : "Observed telemetry supports the route, but intent and the final objective still need confirmation.",
      businessImpact: routeServices.map((service) => ({ name: service.name, impact: service.impact })),
    };
  });
  const rawEvents = scenario.events.map((event) => ({ ...event, metadata: event.metadata }));
  const alerts = isBlue ? alertsFromEvents(rawEvents) : [];
  const reviewedAlertIds = new Set(
    scenario.events
      .filter((event) => event.action === "ALERT_REVIEWED")
      .flatMap((event) => {
        const evidenceIds = parseMetadata(event.metadata).evidenceIds;
        return Array.isArray(evidenceIds)
          ? evidenceIds.filter((id): id is string => typeof id === "string")
          : [];
      }),
  );
  const lastResponseEvent = isBlue
    ? scenario.events
        .filter((event) => event.actorId === actor.id && event.action !== "ALERT_REVIEWED")
        .at(-1)
    : undefined;
  const lastResponseMetadata = parseMetadata(lastResponseEvent?.metadata);
  const objectiveRetrieved = scenario.events.some((event) => event.action === "OBJECTIVE_RETRIEVED" || event.action === "OPERATION_COMPLETED");
  const completedObjectiveIds = new Set(
    scenario.events
      .filter((event) => event.action === "OBJECTIVE_COMPLETED")
      .map((event) => parseMetadata(event.metadata).objectiveId)
      .filter((id): id is string => typeof id === "string"),
  );
  const factEvents = scenario.events
    .filter((event) => event.action === "FACT_DISCOVERED")
    .map((event) => ({ event, metadata: parseMetadata(event.metadata) }));
  const discoveredFactIds = new Set(factEvents.map(({ metadata }) => metadata.factId).filter((id): id is string => typeof id === "string"));
  const knownFacts = (definition.facts ?? []).filter((fact) => fact.knownAtStart || discoveredFactIds.has(fact.id));
  const unknownFacts = [...new Set((definition.facts ?? []).filter((fact) => !fact.knownAtStart && !discoveredFactIds.has(fact.id)).map((fact) => fact.unknown))];
  const latestFactEvent = factEvents.at(-1);
  const latestFact = definition.facts?.find((fact) => fact.id === latestFactEvent?.metadata.factId);
  const credentials = scenario.credentials.map((credential) => ({
    id: credential.id,
    username: credential.username,
    type: credential.type,
    scope: credential.knownScope,
    origin: credential.origin,
    serviceName: credential.serviceName,
    databaseName: credential.databaseName,
    valid: credential.valid,
  }));
  const relationships = scenario.events
    .filter((event) => event.action === "SESSION_CREATED" && event.sourceMachine && event.targetMachine)
    .map((event) => `${event.sourceMachine!.hostname} → ${event.targetMachine!.hostname} via ${event.userId ?? "unknown"}`)
    .filter((relationship, index, entries) => entries.indexOf(relationship) === index);
  const redFootprint = scenario.events.filter((event) => event.actorId === redActor?.id && event.visibleToRed && event.action !== "DETECTION_TRIGGERED");
  const level = (count: number) => count >= 8 ? "ELEVATED" : count >= 3 ? "MODERATE" : "LOW";
  return {
    operation: operationPresentation(definition),
    assistance: mission.assistance === "OPERATOR" ? "OPERATOR" : "GUIDED",
    availability,
    connections: connections.map((c) => ({ id: c.id, source: c.source.hostname, target: c.target.hostname, protocol: c.protocol, port: c.port, allowed: c.allowed })),
    scenario: { id: scenario.id, mode: scenario.mode, state: scenario.state, startedAt: scenario.startedAt?.toISOString(), endedAt: scenario.endedAt?.toISOString() },
    actor: { id: actor.id, role: actor.role },
    currentSession: !isBlue && current ? { id: current.id, machine: current.machine.hostname, user: current.user.username, privilege: current.privilege, path: typeof mission.startingPath === "string" && actorSessions.length === 1 ? mission.startingPath : "/" } : null,
    sessions: (isBlue ? scenario.sessions.filter((s) => s.active && s.machine.zone !== "EXTERNAL") : activeSessions).map((session) => ({ id: session.id, machine: session.machine.hostname, user: session.user.username, privilege: session.privilege, createdAt: session.createdAt.toISOString() })),
    discoveredHosts: isBlue ? machines.map((m) => m.hostname) : [...discovered], machines, events,
    investigation,
    alerts,
    blueStatus: isBlue
      ? {
          responseWindow: {
            elapsedSeconds: Math.max(0, Math.floor((Date.now() - (scenario.startedAt?.getTime() ?? Date.now())) / 1000)),
            limitSeconds: definition.conditions.timeLimitMinutes * 60,
          },
          alertsReviewed: alerts.filter((alert) => reviewedAlertIds.has(alert.id)).length,
          activeHypotheses: investigation.filter((route) => route.status !== "CONTAINED").length,
          containedHypotheses: investigation.filter((route) => route.status === "CONTAINED").length,
          lastResponse: lastResponseEvent
            ? {
                action: lastResponseEvent.action,
                timestamp: lastResponseEvent.timestamp.toISOString(),
                availability: typeof lastResponseMetadata.availability === "number" ? lastResponseMetadata.availability : availability.percent,
                businessImpact: Array.isArray(lastResponseMetadata.businessImpact)
                  ? lastResponseMetadata.businessImpact.filter((impact): impact is string => typeof impact === "string")
                  : [],
              }
            : undefined,
        }
      : undefined,
    suspicion: isBlue ? suspicionFromEvents(rawEvents) : 0, objectiveRetrieved,
    credentials: isBlue ? [] : credentials,
    intel: { hosts: isBlue ? machines.map((m) => m.hostname) : [...discovered], relationships: isBlue ? [] : relationships },
    opsec: {
      network: level(redFootprint.filter((event) => event.category === "NETWORK" || event.category === "WEB").length),
      authentication: level(redFootprint.filter((event) => event.category === "AUTH").length),
      endpoint: level(redFootprint.filter((event) => ["PROCESS", "FILESYSTEM", "PRIVILEGE", "PERSISTENCE"].includes(event.category)).length),
    },
    guidance: {
      objective: definition.objectiveSummary ?? definition.objectives[0]?.label ?? "Complete the objective",
      objectives: definition.objectives.map((objective) => ({ id: objective.id, label: objective.label, completed: completedObjectiveIds.has(objective.id) })),
      knowledge: {
        known: knownFacts.map((fact) => ({ id: fact.id, category: fact.category, value: fact.known })),
        unknown: unknownFacts.slice(0, 6),
        lastRevealed: latestFact ? latestFact.known : undefined,
        contextual: mission.assistance === "OPERATOR" ? undefined : latestFact?.guidance,
      },
      hypotheses: isBlue || mission.assistance === "OPERATOR" ? [] : definition.routes.map((route) => {
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
