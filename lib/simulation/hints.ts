import { prisma } from "@/lib/prisma";
import { getDefinitionForScenario } from "./initializer";
import { parseMetadata } from "./rules";
import { getScenarioView, type ScenarioView } from "./state";

export type HintRequestInput = {
  scenarioId: string;
  actorId: string;
  objectiveId: string;
  tier?: number;
};

export class HintRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "HintRequestError";
  }
}

const isRetryableTransactionError = (error: unknown) => Boolean(
  error && typeof error === "object" && "code" in error && (error.code === "P2034" || error.code === "40001"),
);

export async function requestHint(input: HintRequestInput): Promise<ScenarioView> {
  if (!input.scenarioId || !input.actorId || !input.objectiveId) throw new HintRequestError("Invalid hint request", 400);
  const actor = await prisma.actor.findFirst({ where: { id: input.actorId, scenarioId: input.scenarioId }, include: { scenario: true } });
  if (!actor || actor.role !== "red_operator") throw new HintRequestError("Hints require a Red operator", 403);
  if (actor.scenario.state !== "ACTIVE") throw new HintRequestError("Hints require an active operation", 409);
  const definition = await getDefinitionForScenario(input.scenarioId);
  if (!definition.objectives.some((objective) => objective.id === input.objectiveId)) throw new HintRequestError("Unknown objective", 404);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await prisma.$transaction(async (tx) => {
        const currentActor = await tx.actor.findFirst({
          where: { id: input.actorId, scenarioId: input.scenarioId, role: "red_operator" },
          include: { scenario: true },
        });
        if (!currentActor) throw new HintRequestError("Hints require a Red operator", 403);
        if (currentActor.scenario.state !== "ACTIVE") throw new HintRequestError("Hints require an active operation", 409);
        const events = await tx.securityEvent.findMany({
          where: { scenarioId: input.scenarioId, action: { in: ["OBJECTIVE_COMPLETED", "HINT_REQUESTED"] } },
          orderBy: { timestamp: "asc" },
        });
        const completed = events.some((event) => {
          const metadata = parseMetadata(event.metadata);
          return event.action === "OBJECTIVE_COMPLETED" && metadata.objectiveId === input.objectiveId;
        });
        if (completed) throw new HintRequestError("Cannot request a hint for a completed objective", 409);
        const currentTier = events.reduce((highest, event) => {
          if (event.action !== "HINT_REQUESTED") return highest;
          const metadata = parseMetadata(event.metadata);
          const tier = metadata.tier;
          return metadata.objectiveId === input.objectiveId && Number.isInteger(tier) && Number(tier) >= 1 && Number(tier) <= 3
            ? Math.max(highest, Number(tier))
            : highest;
        }, 0);
        const nextTier = currentTier + 1;
        if (nextTier > 3) throw new HintRequestError("No more hints are available for this objective", 409);
        if (input.tier !== undefined && input.tier !== nextTier) throw new HintRequestError(`The next hint tier is ${nextTier}`, 409);
        await tx.securityEvent.create({
          data: {
            scenarioId: input.scenarioId,
            actorId: input.actorId,
            action: "HINT_REQUESTED",
            category: "SYSTEM",
            severity: "INFO",
            visibleToRed: true,
            visibleToBlue: false,
            metadata: JSON.stringify({ objectiveId: input.objectiveId, tier: nextTier }),
          },
        });
      }, { isolationLevel: "Serializable" });
      break;
    } catch (error) {
      if (attempt < 2 && isRetryableTransactionError(error)) continue;
      throw error;
    }
  }

  const view = await getScenarioView(input.scenarioId, input.actorId);
  if (!view) throw new HintRequestError("Operation view unavailable", 404);
  return view;
}
