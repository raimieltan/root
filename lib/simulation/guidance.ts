import type { ScenarioObjective } from "./scenarios/types";

export type GuidanceEvent = {
  action: string;
  actorId: string | null;
  timestamp: Date;
  metadata: unknown;
};

export type ObjectiveHintGuidance = {
  objectiveId: string;
  unlockedTier: number;
  revealedText: string[];
  nextAvailable: boolean;
};

function metadataOf(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function deriveHintGuidance(
  objectives: ScenarioObjective[],
  events: GuidanceEvent[],
  discoveredFactIds: Set<string>,
  completedObjectiveIds: Set<string>,
): ObjectiveHintGuidance[] {
  return objectives
    .filter((objective) => !completedObjectiveIds.has(objective.id))
    .map((objective) => {
      const unlockedTier = events.reduce((highest, event) => {
        if (event.action !== "HINT_REQUESTED") return highest;
        const metadata = metadataOf(event.metadata);
        const tier = metadata.tier;
        return metadata.objectiveId === objective.id && Number.isInteger(tier) && Number(tier) >= 1 && Number(tier) <= 3
          ? Math.max(highest, Number(tier))
          : highest;
      }, 0);

      const revealedText: string[] = [];
      let authoredIndex = 0;
      for (let slot = 0; slot < unlockedTier; slot += 1) {
        while (authoredIndex < objective.hints.length) {
          const tier = objective.hints[authoredIndex];
          authoredIndex += 1;
          const alreadyKnown = tier.skipIfFactKnown?.some((factId) => discoveredFactIds.has(factId)) ?? false;
          if (alreadyKnown) continue;
          if (!revealedText.includes(tier.text)) revealedText.push(tier.text);
          break;
        }
      }

      return { objectiveId: objective.id, unlockedTier, revealedText, nextAvailable: unlockedTier < 3 };
    });
}

export function isActorStuck(events: GuidanceEvent[], actorId: string, startedAt: Date): boolean {
  const actorEvents = events
    .filter((event) => event.actorId === actorId && event.timestamp >= startedAt)
    .sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
  const latestProgressAt = actorEvents
    .filter((event) => event.action === "OBJECTIVE_COMPLETED" || event.action === "FACT_DISCOVERED")
    .reduce((latest, event) => Math.max(latest, event.timestamp.getTime()), startedAt.getTime());
  const tools = actorEvents.filter((event) => event.action === "TOOL_EXECUTED");
  const sinceProgress = tools.filter((event) => event.timestamp.getTime() > latestProgressAt).length;
  const lastThree = tools.slice(-3);
  const recentFailures = lastThree.length === 3 && lastThree.every((event) => metadataOf(event.metadata).success === false);
  return sinceProgress >= 10 || recentFailures;
}
