# Guided Mode Hints — Design

## Problem

Guided Mode currently exposes its full assistance surface immediately and
permanently: `assistance.guided` is a static list of strings rendered
unconditionally in `MissionPanel`, alongside a "working hypotheses" panel.
There is no per-objective help, no progressive disclosure, and no way for
a player to ask for help only when they want it. Playtesting surfaced this
directly — players had no organic way to discover things like the portal
hostname, database name, POST body requirement, or configuration clues,
because the only assistance available was either "everything, all the time"
or nothing.

The design principle for this feature:

> **Guided Mode teaches the next thought, not the next command.**

## Goals

- Objective-scoped, on-demand, progressive (3-tier) hints.
- Hints are context-aware: a tier is skipped if the player has already
  discovered the fact it would have pointed them toward.
- Nothing is shown until requested, except a subtle "stuck" nudge that
  itself does not reveal hint content.
- `assistance.guided` stops carrying mission-solving content; it becomes
  general onboarding guidance only (e.g. "use `ls` and `cat` to explore
  files").
- The "working hypotheses" panel is unchanged — it teaches reasoning, not
  answers, and serves a different purpose than hints.
- All existing scenarios get authored hint chains for every objective
  (not just Glasshouse).

## Non-goals

- No new Prisma tables/migrations. The existing event-sourced pattern
  (`SecurityEvent` rows read back into a computed `ScenarioView`) already
  covers everything this feature needs.
- No changes to Operator Mode or Black Box mode behavior.
- No changes to the hypotheses panel's content or computation.

## Data model

`lib/simulation/scenarios/types.ts`

```ts
export type HintTier = {
  text: string;
  // If the player has already discovered any of these facts, this tier
  // is considered already-known and is skipped when advancing tiers.
  skipIfFactKnown?: string[];
};

type ObjectiveBase = {
  id: string;
  label: string;
  learning?: LearningAnnotation;
  hints: [HintTier, HintTier, HintTier]; // concept, direction, strong
};
```

`hints` is required (not optional) on `ObjectiveBase` so the validator can
enforce every objective has a complete chain — see Validation below.

`assistance.guided` on `ScenarioDefinition` keeps its existing shape
(`string[]`) but its authored content changes: general onboarding lines
only, never objective- or mission-specific solutions. No type change.

## Reveal state (event-sourced, no new persistence)

A hint request is recorded as a `SecurityEvent`, following the exact
pattern already used by `respondToAttack` / `ALERT_REVIEWED`:

```ts
{
  action: "HINT_REQUESTED",
  category: "SYSTEM",
  severity: "INFO",
  visibleToRed: true,
  visibleToBlue: false,
  metadata: { objectiveId, tier }, // tier: 1 | 2 | 3
}
```

The unlocked tier for a given objective is the highest `tier` value in
any `HINT_REQUESTED` event for that `objectiveId`, computed the same way
`completedObjectiveIds` is computed today in `state.ts` — no separate
tracking table, no session field.

Requesting tier N implicitly reveals tiers 1..N (a player can jump
straight to "View Hint" without stepping through 1 then 2, since the UI
only ever exposes "reveal the next tier").

## Stuck detection

Computed, not tracked:

- Let `sinceProgress` = count of `TOOL_EXECUTED` events for the actor
  since the later of (scenario `startedAt`, most recent
  `OBJECTIVE_COMPLETED` or `FACT_DISCOVERED` event).
- Let `recentFailures` = whether the last 3 `TOOL_EXECUTED` events (in
  order) all have `metadata.success === false`.
- `guidance.stuck = sinceProgress >= 10 || recentFailures`.

`stuck` only controls whether a "Having trouble?" nudge is shown next to
the current open objective. It never auto-reveals hint text.

## Context-aware skipping

When computing the revealed text for an unlocked tier, a tier whose
`skipIfFactKnown` intersects the player's `knownFacts` (already computed
in `state.ts` for the knowledge panel) is skipped forward to the next
tier automatically, up to and including tier 3. This means "Hint 1" for
a player who already found `portal.meridian.test` can present what would
otherwise be "Hint 2" content, without the player needing to page through
a hint they've already effectively passed.

## API

`app/api/sim/hint/route.ts` (new), mirroring
`app/api/sim/blue/respond/route.ts`:

- `POST { scenarioId, actorId, objectiveId }`
- Validates: actor exists, is `red_operator`, scenario is `ACTIVE`,
  objective exists and is not already completed, requested tier is
  `currentUnlockedTier + 1` (server computes "next" tier; the client
  cannot request an arbitrary tier).
- Writes the `HINT_REQUESTED` event via `prisma.securityEvent.create`
  (same call shape as `blue.ts`'s existing event writes).
- Returns the updated `guidance` slice (or the full `ScenarioView`, to
  match how other mutation routes return state) so the client doesn't
  need a separate refetch.

## `state.ts` changes

Add to the `guidance` object returned by `getScenarioView`:

```ts
hints: definition.objectives
  .filter((o) => !completedObjectiveIds.has(o.id))
  .map((objective) => {
    const requestedTiers = /* HINT_REQUESTED events for this objective */;
    const unlockedTier = Math.max(0, ...requestedTiers);
    const revealedText = objective.hints
      .slice(0, unlockedTier)
      .filter((tier) => !tier.skipIfFactKnown?.some((id) => discoveredFactIds.has(id)))
      .map((tier) => tier.text);
    return { objectiveId: objective.id, unlockedTier, revealedText, nextAvailable: unlockedTier < 3 };
  }),
stuck: /* computed per above */,
```

This is additive; existing `guidance.objective`, `guidance.objectives`,
`guidance.knowledge`, `guidance.hypotheses` are unchanged.

## UI (`app/red/mission-panel.tsx`)

- Only rendered when `assistance === "GUIDED"`.
- Each incomplete objective row in the TASK EVIDENCE list gets a
  "Request Hint" control when `nextAvailable` is true, disabled/hidden
  once `unlockedTier === 3`.
- `revealedText` renders underneath its objective row, in tier order,
  once any tier has been requested. Nothing renders before the first
  request.
- When `guidance.stuck` is true, a small "HAVING TROUBLE? · A hint is
  available for your current objective" banner appears near the open
  objective — visually subtle (not a modal, not auto-expanding).
- The hypotheses panel (`view.guidance.hypotheses`) is untouched.
- Clicking "Request Hint" calls the new `/api/sim/hint` endpoint and
  updates local state from the response, consistent with how terminal
  commands update state today via `/api/sim/command`.

## Validation (`lib/simulation/scenarios/validate.ts`)

Add a check alongside the existing objective/fact checks:

- Every objective has exactly 3 `hints` entries, each with non-empty
  `text`.
- Every id in `skipIfFactKnown` exists in `definition.facts`.

This fails scenario validation (same `fail()` mechanism already used for
duplicate ids, dangling references, etc.) if a scenario is missing hint
content, so the content-authoring pass below is enforced structurally
rather than left as a convention.

## Content authoring — all scenarios

All ~17 scenario files in `lib/simulation/scenarios/` get 3-tier hint
chains authored for every objective. Most scenarios have a single
"retrieve the final file" objective; `first-shift`, `locked-out`,
`service-unavailable`, `the-printer`, `wrong-network`, `the-new-server`,
and `website-down` have multi-objective checklists (roughly 8-11
objectives each), for a total of roughly 60-70 hint chains.

Each chain is authored against that scenario's actual `facts` and
`discoveries`, so `skipIfFactKnown` references are meaningful rather than
decorative. Tier 1 is conceptual, tier 2 is directional (may name a host
or category of thing to inspect), tier 3 is close to command-level
(matching the `portal.meridian.test` example from the design
discussion). Because the validator enforces the 3-tier requirement,
content authoring and system implementation can proceed as parallel
concerns, but the validator (and therefore any test suite run) will fail
until every scenario has hints authored — so this is not an optional
follow-up, it's part of shipping the feature.

## Testing

- Unit: `unlockedTier`/`revealedText`/`stuck` computation in `state.ts`
  (fact-skip logic, threshold logic, tier-ordering).
- API: `/api/sim/hint` rejects out-of-order tier requests, rejects
  non-red actors, rejects completed objectives.
- Validator: scenario missing a hint tier fails validation; dangling
  `skipIfFactKnown` id fails validation.
- Existing acceptance tests (`*.acceptance.test.ts`,
  `glasshouse.e2e.test.ts`) continue to pass unchanged — hints are
  additive and don't alter objective completion logic.
- One acceptance-style test exercising the full request flow end to end
  (request tier 1, verify fact-skip, request tier 2, hit tier 3 cap).

## Open items resolved during design

- No new Prisma migration — everything rides on the existing
  `SecurityEvent` log, matching the codebase's established pattern for
  ephemeral/meta state (`OBJECTIVE_COMPLETED`, `FACT_DISCOVERED`,
  `ALERT_REVIEWED`, `HINT_REQUESTED` now joining that set).
- Hints authored for all scenarios in this pass, not just Glasshouse,
  per explicit direction — this is the majority of the implementation
  effort and should be planned as its own phase.



⏺ Here's where things stand — I'm stopping here rather than pushing further given the context budget.

  Committed already (from earlier in this session):
  - docs/superpowers/specs/2026-09-20-guided-mode-hints-design.md — full design spec for Guided Mode hints (objective-scoped, 3-tier progressive disclosure, context-aware skipping via
    skipIfFactKnown, stuck detection, event-sourced via HINT_REQUESTED events, no new Prisma tables).
  - docs/ROOT_CANONICAL_PLAN.md and AGENTS.md updated to mandate 3-tier hint chains for every objective in every scenario, enforced by the validator.
  
  Not yet written: the implementation plan document (docs/superpowers/plans/2026-09-20-guided-mode-hints.md) required by the writing-plans skill. This session was spent gathering the real
  content needed to avoid placeholders in that plan:

  - Confirmed exact current shapes of lib/simulation/scenarios/types.ts, validate.ts, and lib/simulation/state.ts (guidance object, fact/objective computation) — these are the three core
    files the system-side tasks will touch, plus a new app/api/sim/hint/route.ts mirroring app/api/sim/blue/respond/route.ts.
  - Read all 15 scenario files in full and verified exact objective IDs, fact IDs, hosts, and (critically) the actual exploit chains for the 7 "web-worker" scenarios (ghost-account,
    no-one-knows, something-calling-home, strange-login, paper-trail, nightshift, dead-drop) — these use a curl+POST reconciliation-worker root-shell pattern plus an alternate
    legitimate-identity pivot path, which I had gotten wrong in my initial (pre-verification) hint drafts. Re-derived correct 3-tier hint text for all of these against their real
    discoveries/configs.
  - Also re-verified the generic Act-0 tutorial objectives (locate-session/identify-user/inspect-groups/inspect-environment, shared across first-shift, locked-out, the-printer,
    service-unavailable, the-new-server, website-down, wrong-network) and the scenario-specific objectives for each of those 7 files, plus Glasshouse's single rich atlas objective (confirmed
    FIN-DB / /opt/db/data/PROJECT_ATLAS.pdf, not the path I'd guessed earlier).

  Key implementation note surfaced during verification: lib/simulation/scenarios/index.ts calls validateScenario eagerly on the whole campaign array at module load, so making hints a
  required field + adding validator enforcement will break every test until all 15 files have hints authored — the plan needs to sequence content-authoring tasks immediately after the
  type/validator change (using a synthetic fixture, like campaign.test.ts already does, for the validator's own unit test so that task isn't blocked on content).

  Next step when resumed: write docs/superpowers/plans/2026-09-20-guided-mode-hints.md using the writing-plans skill format — system tasks (types → validator → state.ts → API route → UI)
  followed by one content-authoring task per scenario file, using the verified hint text derived above — then run the plan's self-review and offer the Subagent-Driven vs. Inline execution
  choice.