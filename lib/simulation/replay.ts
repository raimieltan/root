import { detectionForAction, parseMetadata } from "./rules";
import type { RouteDefinition } from "./scenarios";

export type ReplayLens = "RED" | "BLUE" | "TRUTH";

export type ReplayEvent = {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  severity: string;
  source: string | null;
  target: string | null;
  userId: string | null;
  metadata: Record<string, unknown>;
  visibleToRed: boolean;
  visibleToBlue: boolean;
};

export type ReplayScenario = {
  state: string;
  startedAt?: string;
  endedAt?: string;
};

export type ReplaySnapshot = {
  knownHosts: string[];
  accessedHosts: string[];
  privilegedHosts: string[];
  isolatedHosts: string[];
  activeSessions: Array<{ host: string; user: string; privilege: string }>;
  detections: Array<{ ruleId: string; title: string; severity: string }>;
  objectiveRetrieved: boolean;
};

export type ReplaySummary = {
  durationMs: number;
  detectionTimeMs: number | null;
  contained: boolean;
  objectiveRetrieved: boolean;
  status: "SUCCESS" | "CONTAINED" | "FAILED" | "INCOMPLETE";
  attackPath: string[];
  sessionCount: number;
  persistenceInstalled: boolean;
  evidenceCount: number;
  route: {
    id: string;
    name: string;
    trustRelationship: string;
    evidenceProfile: RouteDefinition["evidenceProfile"];
    actual: { networkEvents: number; authenticationEvents: number; endpointEvents: number; detectionCount: number };
  } | null;
};

export type KeyDecision = {
  title: string;
  analysis: string;
  redPerspective: string;
  bluePerspective: string;
};

export function visibleToLens(event: ReplayEvent, lens: ReplayLens) {
  return lens === "TRUTH" || (lens === "RED" ? event.visibleToRed : event.visibleToBlue);
}

export function snapshotAt(events: ReplayEvent[], lens: ReplayLens, throughEventId?: string, initialKnownHosts: string[] = ["INTERNET", "WEB-01"]): ReplaySnapshot {
  const known = new Set<string>(lens === "RED" ? initialKnownHosts : []);
  const accessed = new Set<string>();
  const privileged = new Set<string>();
  const isolated = new Set<string>();
  const sessions: ReplaySnapshot["activeSessions"] = [];
  const detections: ReplaySnapshot["detections"] = [];
  let objectiveRetrieved = false;

  for (const event of events) {
    if (visibleToLens(event, lens)) {
      if (lens !== "RED") {
        if (event.source) known.add(event.source);
        if (event.target) known.add(event.target);
      }
      if (event.action === "HOST_DISCOVERED" && event.target) known.add(event.target);
      if (event.action === "SESSION_CREATED" && event.target) {
        known.add(event.target);
        accessed.add(event.target);
        sessions.push({ host: event.target, user: event.userId ?? "unknown", privilege: typeof event.metadata.privilege === "string" ? event.metadata.privilege : "USER" });
      }
      if (event.action === "ROOT_SESSION_CREATED" && event.target) {
        privileged.add(event.target);
        sessions.push({ host: event.target, user: event.userId ?? "root", privilege: "ROOT" });
      }
      if (event.action === "HOST_ISOLATED" && event.target) {
        isolated.add(event.target);
        for (let index = sessions.length - 1; index >= 0; index -= 1) if (sessions[index].host === event.target) sessions.splice(index, 1);
      }
      if (event.action === "HOST_RESTORED" && event.target) isolated.delete(event.target);
      if (event.action === "REVOKE_SESSION") {
        const index = event.target ? sessions.findLastIndex((session) => session.host === event.target) : sessions.length - 1;
        if (index >= 0) sessions.splice(index, 1);
      }
      if (event.action === "RESET_PASSWORD" && event.userId) {
        for (let index = sessions.length - 1; index >= 0; index -= 1) if (sessions[index].user === event.userId) sessions.splice(index, 1);
      }
      if (event.action === "OBJECTIVE_RETRIEVED") objectiveRetrieved = true;
      if (event.action === "DETECTION_TRIGGERED") {
        detections.push({
          ruleId: typeof event.metadata.ruleId === "string" ? event.metadata.ruleId : "UNKNOWN",
          title: typeof event.metadata.title === "string" ? event.metadata.title : "Detection triggered",
          severity: typeof event.metadata.severity === "string" ? event.metadata.severity : event.severity,
        });
      }
    }
    if (event.id === throughEventId) break;
  }

  return {
    knownHosts: [...known], accessedHosts: [...accessed], privilegedHosts: [...privileged], isolatedHosts: [...isolated],
    activeSessions: sessions, detections, objectiveRetrieved,
  };
}

export function attackPathFromEvents(events: ReplayEvent[]) {
  const path: string[] = ["INTERNET"];
  for (const event of events) {
    if (event.action === "SESSION_CREATED" && event.target && path.at(-1) !== event.target) path.push(event.target);
  }
  return path;
}

export function identifyRoute(events: ReplayEvent[], routes: RouteDefinition[]) {
  const path = attackPathFromEvents(events);
  return routes.find((route) => route.hosts.length === path.length && route.hosts.every((host, index) => path[index] === host))
    ?? routes.filter((route) => route.hosts.every((host) => path.includes(host))).sort((a, b) => b.hosts.length - a.hosts.length)[0];
}

export function summarizeReplay(events: ReplayEvent[], scenario: ReplayScenario, routes: RouteDefinition[] = []): ReplaySummary {
  const objective = events.find((event) => event.action === "OBJECTIVE_RETRIEVED");
  const containment = events.find((event) => event.action === "ATTACK_CONTAINED");
  const firstDetection = events.find((event) => event.action === "DETECTION_TRIGGERED") ?? (routes.length ? undefined : events.find((event) => Boolean(detectionForAction(event.action))));
  const start = scenario.startedAt ? new Date(scenario.startedAt).getTime() : events[0] ? new Date(events[0].timestamp).getTime() : 0;
  const end = scenario.endedAt ? new Date(scenario.endedAt).getTime() : events.at(-1) ? new Date(events.at(-1)!.timestamp).getTime() : start;
  const path = attackPathFromEvents(events);
  const route = identifyRoute(events, routes);
  const evidence = events.filter((event) => event.action !== "DETECTION_TRIGGERED");
  const objectiveRetrieved = Boolean(objective);
  const contained = Boolean(containment);
  return {
    durationMs: Math.max(0, end - start),
    detectionTimeMs: firstDetection ? Math.max(0, new Date(firstDetection.timestamp).getTime() - start) : null,
    contained,
    objectiveRetrieved,
    status: objectiveRetrieved ? "SUCCESS" : contained ? "CONTAINED" : scenario.state === "FAILED" ? "FAILED" : "INCOMPLETE",
    attackPath: path,
    sessionCount: events.filter((event) => event.action === "SESSION_CREATED" || event.action === "ROOT_SESSION_CREATED").length,
    persistenceInstalled: events.some((event) => event.action === "PERSISTENCE_INSTALLED"),
    evidenceCount: evidence.length,
    route: route ? {
      id: route.id,
      name: route.name,
      trustRelationship: route.trustRelationship,
      evidenceProfile: route.evidenceProfile,
      actual: {
        networkEvents: evidence.filter((event) => event.category === "NETWORK" || event.category === "WEB").length,
        authenticationEvents: evidence.filter((event) => event.category === "AUTH").length,
        endpointEvents: evidence.filter((event) => ["PROCESS", "FILESYSTEM", "PRIVILEGE", "PERSISTENCE"].includes(event.category)).length,
        detectionCount: events.filter((event) => event.action === "DETECTION_TRIGGERED").length,
      },
    } : null,
  };
}

export function selectKeyDecision(events: ReplayEvent[], routes: RouteDefinition[] = []): KeyDecision {
  const route = identifyRoute(events, routes);
  if (route) return {
    title: `${route.name} route reconstructed from recorded session evidence`,
    analysis: `${route.trustRelationship} ${route.evidenceProfile.comparison}`,
    redPerspective: `${route.evidenceProfile.consequence} This was one viable route, not a universally correct answer.`,
    bluePerspective: `${route.evidenceProfile.detections} The evidence profile should be assessed against the alternate route, not as a fixed attack script.`,
  };
  const unusualLogin = events.find((event) => event.action === "LATERAL_MOVEMENT");
  if (unusualLogin) return {
    title: `Valid credentials moved the operation to ${unusualLogin.target ?? "an internal host"}`,
    analysis: "The authentication was valid, but its source and destination relationship made it suspicious. Identity validity did not make the behavior normal.",
    redPerspective: `Red used ${unusualLogin.userId ?? "a discovered identity"} to preserve a believable access path.`,
    bluePerspective: "Blue received enough evidence to investigate the unusual internal login before the next pivot.",
  };
  const escalation = events.find((event) => event.action === "PRIVILEGE_ESCALATION");
  if (escalation) return {
    title: `A trusted service boundary failed on ${escalation.target ?? "the host"}`,
    analysis: "Low-privilege control of a root-trusted input converted ordinary access into privileged execution.",
    redPerspective: "Red recognized a permission relationship instead of relying on a generic exploit.",
    bluePerspective: "Blue could correlate the configuration modification, service restart, and new root session.",
  };
  return {
    title: "Reconnaissance established the first useful relationship",
    analysis: "The operation advanced by turning service information into a concrete access hypothesis.",
    redPerspective: "Red learned which exposed service deserved investigation.",
    bluePerspective: "Blue could distinguish ordinary traffic from concentrated probing.",
  };
}

export function normalizeReplayEvent(event: Omit<ReplayEvent, "metadata"> & { metadata: string | Record<string, unknown> | null }): ReplayEvent {
  return { ...event, metadata: typeof event.metadata === "string" ? parseMetadata(event.metadata) : event.metadata ?? {} };
}
