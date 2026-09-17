import { prisma } from "@/lib/prisma";
import { normalizeReplayEvent, selectKeyDecision, summarizeReplay } from "@/lib/simulation/replay";
import { getDefinitionForScenario } from "@/lib/simulation/initializer";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scenarioId = url.searchParams.get("scenarioId");
  const actorId = url.searchParams.get("actorId");
  if (!scenarioId || !actorId) return Response.json({ success: false, error: "Missing fields" }, { status: 400 });
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId }, include: { actors: true, machines: { orderBy: { hostname: "asc" } }, events: { include: { sourceMachine: true, targetMachine: true }, orderBy: { timestamp: "asc" } } } });
  if (!scenario || !scenario.actors.some((actor) => actor.id === actorId)) return Response.json({ success: false, error: "Not found" }, { status: 404 });
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
  return Response.json({
    success: true,
    scenario: { id: scenario.id, mode: scenario.mode, ...replayScenario },
    machines: scenario.machines.map((machine) => ({ hostname: machine.hostname, ip: machine.ip, zone: machine.zone })),
    startingKnowledge: definition.startingKnowledge,
    events,
    summary: summarizeReplay(events, replayScenario, definition.routes),
    keyDecision: selectKeyDecision(events, definition.routes),
  });
}
