import { glasshouse } from "./glasshouse";
import type { ScenarioDefinition } from "./types";

const scenarios: Record<string, ScenarioDefinition> = { [glasshouse.id]: glasshouse };

export function getScenarioDefinition(id = glasshouse.id) {
  const definition = scenarios[id];
  if (!definition) throw new Error(`Unknown scenario definition: ${id}`);
  return definition;
}

export { glasshouse };
export type { RouteDefinition, ScenarioDefinition, ScenarioEventDefinition } from "./types";
