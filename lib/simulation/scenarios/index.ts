import { glasshouse } from "./glasshouse";
import type { ScenarioDefinition } from "./types";
import { nightshift } from "./nightshift";
import { deadDrop } from "./dead-drop";
import { paperTrail } from "./paper-trail";
import { strangeLogin } from "./strange-login";
import { somethingCallingHome } from "./something-calling-home";
import { ghostAccount } from "./ghost-account";
import { noOneKnows } from "./no-one-knows";
import { firstShift } from "./first-shift";
import { validateScenario } from "./validate";

export const campaign = [firstShift, glasshouse, nightshift, deadDrop, paperTrail, strangeLogin, somethingCallingHome, ghostAccount, noOneKnows].map(validateScenario);
const scenarios: Record<string, ScenarioDefinition> = Object.fromEntries(campaign.map((definition) => [definition.id, definition]));

export function operationPresentation(definition: ScenarioDefinition) {
  return { id: definition.id, name: definition.name, organization: definition.organization, briefing: definition.briefing, presentation: definition.presentation, availableModes: definition.availableModes, assistance: definition.assistance, conditions: definition.conditions, startingKnowledge: definition.startingKnowledge, objective: definition.objectiveSummary ?? definition.objectives[0].label };
}
export type OperationPresentation = ReturnType<typeof operationPresentation>;

export function getScenarioDefinition(id = glasshouse.id) {
  const definition = scenarios[id];
  if (!definition) throw new Error(`Unknown scenario definition: ${id}`);
  return definition;
}

export { glasshouse };
export type { BeginnerExitQuestion, LearningAnnotation, RouteDefinition, ScenarioDefinition, ScenarioEventDefinition, ScenarioObjective } from "./types";
