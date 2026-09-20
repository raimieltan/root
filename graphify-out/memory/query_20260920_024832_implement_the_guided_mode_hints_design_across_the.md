---
type: "query"
date: "2026-09-20T02:48:32.910462+00:00"
question: "Implement the Guided Mode hints design across the ROOT codebase"
contributor: "graphify"
outcome: "useful"
source_nodes: ["ObjectiveBase", "ScenarioDefinition", "mission-panel.tsx", "ScenarioView", "validate.ts"]
---

# Q: Implement the Guided Mode hints design across the ROOT codebase

## Answer

Expanded from the original request via graph vocabulary: guided, guidance, hint, hints, objective, scenario, mission, panel, route, security, event, state. The implementation crosses ObjectiveBase in lib/simulation/scenarios/types.ts, all scenario definitions, validateScenario, getScenarioView in lib/simulation/state.ts, a new server-authoritative hint route/service, app/sim-types.ts, useOperation, and MissionPanel. SecurityEvent is the persistence boundary; MissionPanel is the existing Guided UI surface.

## Outcome

- Signal: useful

## Source Nodes

- ObjectiveBase
- ScenarioDefinition
- mission-panel.tsx
- ScenarioView
- validate.ts