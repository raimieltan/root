import { prisma } from "@/lib/prisma";
import { normalizeReplayEvent, selectKeyDecision, summarizeReplay } from "@/lib/simulation/replay";
import { getDefinitionForScenario } from "@/lib/simulation/initializer";
import { operationPresentation } from "@/lib/simulation/scenarios";
import { businessAvailability } from "@/lib/simulation/availability";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scenarioId = url.searchParams.get("scenarioId");
  const actorId = url.searchParams.get("actorId");
  if (!scenarioId || !actorId) return Response.json({ success: false, error: "Missing fields" }, { status: 400 });
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId }, include: { actors: true, machines: { orderBy: { hostname: "asc" } }, events: { include: { sourceMachine: true, targetMachine: true }, orderBy: { timestamp: "asc" } } } });
  if (!scenario || !scenario.actors.some((actor) => actor.id === actorId)) return Response.json({ success: false, error: "Not found" }, { status: 404 });
  if (scenario.state === "ACTIVE") return Response.json({ success: false, error: "Full reconstruction is available when the operation resolves." }, { status: 409 });
  const replayScenario = { state: scenario.state, startedAt: scenario.startedAt?.toISOString(), endedAt: scenario.endedAt?.toISOString() };
  const events = scenario.events.filter((event) => event.visibleInReplay).map((event) => normalizeReplayEvent({
    id: event.id,
    timestamp: event.timestamp.toISOString(),
    category: event.category,
    action: event.action,
    severity: event.severity,
    source: event.sourceMachine?.hostname ?? null,
    target: event.targetMachine?.hostname ?? null,
    userId: event.userId,
    metadata: event.metadata,
    visibleToRed: event.visibleToRed,
    visibleToBlue: event.visibleToBlue,
  }));
  const definition = await getDefinitionForScenario(scenario.id);
  const summary = summarizeReplay(events, replayScenario, definition.routes);
  const availability = await businessAvailability(scenario.id);
  const reviewed = new Set(events.flatMap((event) => Array.isArray(event.metadata.evidenceIds) ? event.metadata.evidenceIds as string[] : []));
  const missed = events.filter((event) => event.action === "DETECTION_TRIGGERED" && !reviewed.has(event.id) && !reviewed.has(String(event.metadata.evidenceEventId)));
  const demonstrated = new Set(events.filter((event) => scenario.events.find((raw) => raw.id === event.id)?.actorId === actorId).map((event) => event.action));
  const progression = { won: scenario.state === "COMPLETED", route: summary.route?.id ?? null, detected: events.some((event) => event.action === "DETECTION_TRIGGERED"), availability: availability.percent, concepts: definition.knowledgeRewards.filter((reward) => reward.actions.some((action) => demonstrated.has(action))).map((reward) => reward.concept) };
  return Response.json({
    success: true,
    operation: operationPresentation(definition),
    progression,
    availability,
    missedOpportunities: missed.map((event) => ({ id: event.id, title: event.metadata.title, rationale: event.metadata.rationale, target: event.target })),
    alternatives: definition.routes.filter((route) => route.id !== summary.route?.id),
    defensiveActions: events.filter((event) => ["HOST_ISOLATED", "HOST_RESTORED", "BLOCK_CONNECTION", "RESET_PASSWORD", "REVOKE_SESSION", "REMOVE_PERSISTENCE"].includes(event.action)),
    scenario: { id: scenario.id, mode: scenario.mode, ...replayScenario },
    machines: scenario.machines.map((machine) => ({ hostname: machine.hostname, ip: machine.ip, zone: machine.zone })),
    startingKnowledge: definition.startingKnowledge,
    events,
    summary,
    keyDecision: selectKeyDecision(events, definition.routes),
  });
}
