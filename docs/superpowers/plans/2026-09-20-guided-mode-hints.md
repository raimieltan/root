# Guided Mode Hints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add objective-scoped, progressive, context-aware Guided Mode hints and a non-revealing stuck nudge across every campaign scenario.

**Architecture:** Keep hint definitions in scenario content and persist requests as `HINT_REQUESTED` security events. Pure guidance helpers derive unlocked/revealed hints and stuck state from ordered events; `getScenarioView` exposes that derived state, a server-authoritative mutation service records the next valid tier, and the existing Mission panel renders and requests hints without changing Operator Mode or working hypotheses.

**Tech Stack:** TypeScript, Next.js 16 App Router route handlers, React 19 client components, Prisma 7/PostgreSQL, Node test runner, existing ROOT/OS CSS.

**Spec:** `docs/superpowers/specs/2026-09-20-guided-mode-hints-design.md`

## Global Constraints

- Every objective has exactly three tiers in concept → direction → strong order.
- A hint teaches the next thought, not merely the next command; strong hints may approach command level.
- `skipIfFactKnown` may reference only fact ids declared by that scenario.
- Hint requests are `SecurityEvent` rows; do not add a Prisma model or migration.
- Only an active `red_operator` may request a hint for an incomplete objective.
- The server computes the next tier; clients cannot unlock an arbitrary tier.
- `assistance.guided` remains `string[]` but contains general onboarding guidance only.
- Operator Mode, Black Box behavior, and `guidance.hypotheses` remain unchanged.
- The UI stays dense, square, restrained, keyboard accessible, and within the existing TASK EVIDENCE table.

## Review Focus

- Concurrent or forged tier requests must not create a tier jump or a fourth tier; pin this in the request-service tests.
- A known fact on tier 1 must advance the visible copy to the next unknown tier instead of producing an empty hint; pin this in pure guidance tests.
- Three recent failed tools should set `stuck` even before ten attempts, while a later progress event resets the ten-attempt counter; pin both paths in pure guidance tests.
- Completed objectives must disappear from `guidance.hints` and reject future requests; pin this in request-flow tests.
- Guided-only controls must never render or mutate state in Operator Mode; verify via a UI assertion or browser check plus the existing Operator acceptance path.

---

### Task 1: Scenario hint schema and complete campaign content

**Files:**
- Modify: `lib/simulation/scenarios/types.ts`
- Modify: `lib/simulation/scenarios/content.ts`
- Modify: `lib/simulation/scenarios/first-shift.ts`
- Modify: `lib/simulation/scenarios/the-printer.ts`
- Modify: `lib/simulation/scenarios/locked-out.ts`
- Modify: `lib/simulation/scenarios/website-down.ts`
- Modify: `lib/simulation/scenarios/service-unavailable.ts`
- Modify: `lib/simulation/scenarios/wrong-network.ts`
- Modify: `lib/simulation/scenarios/the-new-server.ts`
- Modify: `lib/simulation/scenarios/glasshouse.ts`
- Modify: `lib/simulation/scenarios/nightshift.ts`
- Modify: `lib/simulation/scenarios/dead-drop.ts`
- Modify: `lib/simulation/scenarios/paper-trail.ts`
- Modify: `lib/simulation/scenarios/strange-login.ts`
- Modify: `lib/simulation/scenarios/something-calling-home.ts`
- Modify: `lib/simulation/scenarios/ghost-account.ts`
- Modify: `lib/simulation/scenarios/no-one-knows.ts`
- Test: `lib/simulation/campaign.test.ts`

**Interfaces:**
- Produces: `HintTier`, `HintChain`, and required `ObjectiveBase.hints`.
- Produces: `hintChain(concept, direction, strong): HintChain` and reusable Act 0 chains for repeated shell-orientation objectives.
- Consumes: each scenario's existing objective ids, fact ids, discovery paths, hosts, and route commands.

- [ ] **Step 1: Add a failing campaign contract test**

Add this test beside the campaign metadata test:

```ts
it("authors a three-tier Guided Mode chain for every objective", () => {
  for (const definition of campaign) {
    const factIds = new Set((definition.facts ?? []).map((fact) => fact.id));
    for (const objective of definition.objectives) {
      assert.equal(objective.hints.length, 3, `${definition.id}/${objective.id}`);
      assert.ok(objective.hints.every((tier) => tier.text.trim().length > 0));
      for (const tier of objective.hints) {
        for (const factId of tier.skipIfFactKnown ?? []) {
          assert.ok(factIds.has(factId), `${definition.id}/${objective.id}: ${factId}`);
        }
      }
    }
    assert.ok(definition.assistance.guided.every((line) =>
      !definition.objectives.some((objective) => line.includes(objective.id))
    ));
  }
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `yarn test --test-name-pattern="three-tier Guided Mode"`

Expected: FAIL because `ObjectiveBase` has no `hints` and campaign objectives do not carry chains.

- [ ] **Step 3: Add the required tuple type and authoring helper**

In `types.ts`:

```ts
export type HintTier = {
  text: string;
  skipIfFactKnown?: string[];
};

export type HintChain = [HintTier, HintTier, HintTier];

type ObjectiveBase = {
  id: string;
  label: string;
  learning?: LearningAnnotation;
  hints: HintChain;
};
```

In `content.ts` export:

```ts
export const hintChain = (
  concept: string | HintTier,
  direction: string | HintTier,
  strong: string | HintTier,
): HintChain => [concept, direction, strong].map((tier) =>
  typeof tier === "string" ? { text: tier } : tier,
) as HintChain;
```

Also export exact shared chains for `locate-session`, `identify-user`, `inspect-groups`, and `inspect-environment`:

```ts
export const orientationHints = {
  locateSession: hintChain(
    "First establish where the active shell is positioned in the filesystem.",
    "Ask the shell for its current working directory before navigating elsewhere.",
    "Run `pwd` and use the returned path as the session's starting location.",
  ),
  identifyUser: hintChain(
    "A shell session runs as a specific identity; establish that identity before judging access.",
    "Use the command that reports only the current username.",
    "Run `whoami` and record the returned account name.",
  ),
  inspectGroups: hintChain(
    "Permissions depend on more than a username; group membership is part of the identity.",
    "Inspect the current identity's uid, primary group, and supplementary groups.",
    "Run `id` and compare its groups with any file or service permissions you find.",
  ),
  inspectEnvironment: hintChain(
    "The session environment records host and execution context that the prompt may not show.",
    "Inspect environment variables and look for the current hostname.",
    "Run `env` and find `HOSTNAME` in the output.",
  ),
} satisfies Record<string, HintChain>;
```

- [ ] **Step 4: Add exact chains to the seven multi-objective Act 0 scenarios**

Use `orientationHints` for the four repeated objectives. For every remaining objective, add a `hintChain` whose strong tier names the existing evidence path or exact bounded command. Use these strong-tier anchors and fact-skip ids; concept and direction tiers must describe the reasoning immediately before the anchor:

| Scenario | Objective | Strong-tier anchor | `skipIfFactKnown` on earlier tiers |
|---|---|---|---|
| first-shift | inspect-permissions | `ls -l` in the current/home and documentation directories | none |
| first-shift | navigate-docs | `cd /usr/share/doc/nodeline` | none |
| first-shift | read-handbook | `cat /usr/share/doc/nodeline/FIRST_SHIFT.txt` | `orientation.handbook` |
| first-shift | inspect-services | `ps` and the `nodeline-docs --listen 10.0.0.10:8080` line | `orientation.serviceRelationship` |
| the-printer | review-ticket | `cat /home/trainee/TICKET-4471.txt` | `printer.ticket` |
| the-printer | inspect-process | `ps` and `print-spoolerd` | `printer.processState` |
| the-printer | inspect-log | `cat /var/log/print-spooler.log` | `printer.logEvidence` |
| the-printer | inspect-spool-permissions | `ls -l /var/spool/printer` | none |
| the-printer | correlate-cause | `cat /etc/nodeline/group-membership.txt`, then compare `printsvc` with group `print` | `printer.groupMismatch` |
| locked-out | review-handoff | `cat /home/trainee/onboarding/ARCHIVE_ACCESS.txt` | `locked.handoffNote` |
| locked-out | verify-no-local-account | attempt `ssh trainee@ARCHIVE-01` and observe the failure | none |
| locked-out | discover-credential | reread `ARCHIVE_ACCESS.txt` for `archivist` | `locked.tempCredential` |
| locked-out | authenticate-delegated | `ssh archivist@ARCHIVE-01` with the documented secret | `locked.tempCredential` |
| locked-out | retrieve-packet | `retrieve ONBOARDING_PACKET.txt` on `ARCHIVE-01` | `locked.tempCredential` |
| website-down | review-ticket | `cat /home/trainee/TICKET-5102.txt` | `website.ticket` |
| website-down | query-dns-record | `dig intranet.nodeline.test` | `website.dnsRecordStale` |
| website-down | confirm-old-host-up | `ping OLD-INTRANET-01` | `website.dnsRecordStale` |
| website-down | scan-old-host | `nmap OLD-INTRANET-01` and distinguish SSH from HTTP | `website.hostUpNoSite` |
| website-down | discover-migration-notice | `cat /home/trainee/DNS_MIGRATION_NOTICE.txt` | `website.migrationNotice` |
| website-down | reach-live-site | `curl intranet-new.nodeline.test` | `website.confirmedLive` |
| service-unavailable | review-ticket | `cat /home/trainee/TICKET-5188.txt` | `reports.ticket` |
| service-unavailable | confirm-host-up | `ping REPORTS-01`, then note SSH reachability | `reports.hostUp` |
| service-unavailable | confirm-port-closed | `nmap REPORTS-01` and compare SSH with HTTPS | `reports.portClosed` |
| service-unavailable | discover-access | `cat /home/trainee/STANDARD_ACCESS.txt` | `reports.standardAccess` |
| service-unavailable | authenticate-reports | `ssh trainee@REPORTS-01` with the standard credential | `reports.standardAccess` |
| service-unavailable | correlate-cause | inspect `/var/log/reports-app.log` and the absent `reports-app` process | `reports.processCrashed` |
| wrong-network | review-ticket | `cat /home/trainee/TICKET-5220.txt` | `wrongnet.ticket` |
| wrong-network | discover-jumphost | `cat /home/trainee/NETWORK_ACCESS.txt` | `wrongnet.jumphostNote` |
| wrong-network | reach-netops | `ssh netops@NETOPS-01` | `wrongnet.jumphostNote` |
| wrong-network | discover-deploy-access | `cat /home/netops/DEPLOY_ACCESS.txt` | `wrongnet.deployAccess` |
| wrong-network | reach-deploy-stage | `ssh deploy@DEPLOY-STAGE` from `NETOPS-01` | `wrongnet.deployAccess` |
| wrong-network | retrieve-healthcheck | `retrieve STAGE_HEALTHCHECK.txt` on `DEPLOY-STAGE` | `wrongnet.deployAccess` |
| the-new-server | review-ticket | `cat /home/trainee/TICKET-5300.txt` | `newserver.ticket` |
| the-new-server | confirm-address | compare `ping 10.0.0.90` with `ping 10.0.0.91` | `newserver.confirmedAddress` |
| the-new-server | confirm-ports | `nmap NEW-APP-01` and verify SSH plus HTTPS | `newserver.portsConfirmed` |
| the-new-server | confirm-app | `curl https://NEW-APP-01` | `newserver.appConfirmed` |
| the-new-server | discover-commissioning-access | `cat /home/trainee/COMMISSIONING_ACCESS.txt` | `newserver.commissioningAccess` |
| the-new-server | authenticate-newapp | `ssh commissioning@NEW-APP-01` | `newserver.commissioningAccess` |
| the-new-server | retrieve-checklist | `retrieve GO_LIVE_CHECKLIST.txt` on `NEW-APP-01` | `newserver.commissioningAccess` |

Each fact objective's tier 1 may carry the listed fact id even though discovery normally completes it; final-objective tiers should use prerequisite fact ids so context-aware forward-skipping is observable before completion.

- [ ] **Step 5: Add exact chains to Glasshouse and the compact two-route scenarios**

Use these three-tier progressions:

| Scenario/objective | Concept | Direction | Strong |
|---|---|---|---|
| glasshouse/atlas | Trace trust from the public service toward the protected finance data. | Inspect the portal's published interfaces, then follow configuration and process command lines on each gained host. | Start with `nmap 10.10.10.10` and `curl portal.meridian.test`; the application route ultimately reaches `FIN-DB`, database `finance`, and `/opt/db/data/PROJECT_ATLAS.pdf`. |
| nightshift/manifest | Separate the human handover identity from the service identity that can reach dispatch. | Either inspect the public maintenance worker or follow the documented handover through `ACCESS-01`. | POST `job=handover` to `/maintenance/jobs`, then inspect `/etc/shift/worker.conf` and use `dispatch_svc@DISPATCH-01` to retrieve `NIGHT_MANIFEST.csv`. |
| dead-drop/archive | A segmented vault must be reached through an authorized relay relationship. | Follow the partner route from the exchange host and inspect each pivot's local route configuration. | Use `partner@EXCHANGE-01`, read `/home/partner/routes.conf`, then pivot as `relay_svc` and `research_svc` to `VAULT-01`. |
| dead-drop/archive-copy | Recovery infrastructure provides an independent path to a copy of the objective. | Inspect `RECOVERY-01` and its restore worker rather than forcing the blocked vault route. | POST `source=external` to `RECOVERY-01/restore/jobs`, read `/etc/recovery/replica.conf`, then use `recovery_svc@REPLICA-01`. |
| paper-trail/award-roster | Compare the public export worker with the legitimate vendor reconciliation trust. | The export worker's configuration identifies the records identity; the vendor path documents the same destination. | POST `format=award` to `/exports/jobs`, inspect `/etc/aster/export.conf`, then use `records_svc@RECORDS-01` to retrieve `AWARD_ROSTER.csv`. |
| strange-login/on-call-roster | A valid login becomes suspicious through source and follow-on behavior. | Compare the care maintenance worker with the locum handover path; both can expose the results service identity. | POST `source=external` to `/maintenance/reconcile`, inspect `/etc/northline/maintenance.conf`, then use `results_svc@RESULTS-01`. |
| something-calling-home/switch-window | Treat the beacon and the credential path as related but distinct evidence. | The outage dashboard worker runs privileged work; its configuration points to the schedule identity. | POST `outage=external` to `/dashboard/reconcile`, inspect `/etc/halcyon/dashboard.conf`, then use `switch_svc@SCHEDULE-01`. |
| ghost-account/recovery-codes | Identity validity and lifecycle authorization are separate questions. | Compare the intake reconciliation worker with the retired provisioning path to the recovery service. | POST `import=external` to `/intake/reconcile`, inspect `/etc/intake/recovery.conf`, then use `recovery_svc@RECOVERY-01`. |
| no-one-knows/restoration-plan | Test which trust relationship is compromised without assuming every valid vendor action is hostile. | Compare the privileged status worker with the vendor diagnostics path to `PLAN-01`. | POST `update=emergency` to `/status/reconcile`, inspect `/etc/status/restoration.conf`, then use `plan_svc@PLAN-01`. |

For Glasshouse, add `skipIfFactKnown` to successive tiers using `portal.hostname`, then `finance.appRelationship`, then `finance.database`. The compact scenarios currently declare no facts, so do not invent dangling `skipIfFactKnown` ids; their hints remain grounded in their existing routes, configurations, and discoveries.

- [ ] **Step 6: Rewrite `assistance.guided` as general onboarding only**

Use short, mission-agnostic lines such as:

```ts
guided: [
  "Use `pwd`, `ls`, and `cat` to establish context and inspect readable evidence before acting.",
  "Use `ping`, `nmap`, and `curl` to distinguish reachability, exposed services, and application behavior.",
  "Use `whoami`, `id`, `ps`, and configuration files to reason about identities, processes, permissions, and trust.",
]
```

Retain scenario-appropriate subsets where commands have already been taught, but remove hostnames, credentials, objective filenames, endpoint paths, database names, and solution sequences from every `assistance.guided` array.

- [ ] **Step 7: Run campaign tests and type checking**

Run: `yarn test --test-name-pattern="three-tier Guided Mode|Canonical campaign"`

Expected: PASS.

Run: `yarn tsc --noEmit`

Expected: PASS with all objectives satisfying the required tuple.

- [ ] **Step 8: Commit**

```bash
git add lib/simulation/scenarios lib/simulation/campaign.test.ts
git commit -m "feat: author guided hint chains for campaign"
```

### Task 2: Structural scenario validation

**Files:**
- Modify: `lib/simulation/scenarios/validate.ts`
- Modify: `lib/simulation/campaign.test.ts`

**Interfaces:**
- Consumes: `ScenarioObjective.hints` and `ScenarioDefinition.facts` from Task 1.
- Produces: eager validation errors for missing/blank tiers and dangling fact references.

- [ ] **Step 1: Add failing validator tests**

```ts
it("rejects incomplete and dangling hint chains", () => {
  const missing = structuredClone(campaign[0]);
  missing.objectives[0].hints = missing.objectives[0].hints.slice(0, 2) as never;
  assert.throws(() => validateScenario(missing), /exactly 3 hints/);

  const blank = structuredClone(campaign[0]);
  blank.objectives[0].hints[1].text = "   ";
  assert.throws(() => validateScenario(blank), /empty hint text/);

  const dangling = structuredClone(campaign[0]);
  dangling.objectives[0].hints[0].skipIfFactKnown = ["absent.fact"];
  assert.throws(() => validateScenario(dangling), /unknown hint fact absent\.fact/);
});
```

- [ ] **Step 2: Verify RED**

Run: `yarn test --test-name-pattern="incomplete and dangling hint"`

Expected: FAIL because `validateScenario` does not inspect hints.

- [ ] **Step 3: Implement validation beside the existing objective checks**

```ts
if (objective.hints.length !== 3) fail(`objective ${objective.id} must define exactly 3 hints`);
for (const tier of objective.hints) {
  if (!tier.text.trim()) fail(`objective ${objective.id} has empty hint text`);
  for (const factId of tier.skipIfFactKnown ?? []) {
    if (!factIds.includes(factId)) fail(`objective ${objective.id} references unknown hint fact ${factId}`);
  }
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run: `yarn test --test-name-pattern="incomplete and dangling hint|three-tier Guided Mode"`

Expected: PASS.

```bash
git add lib/simulation/scenarios/validate.ts lib/simulation/campaign.test.ts
git commit -m "test: validate objective hint chains"
```

### Task 3: Pure derived guidance and ScenarioView integration

**Files:**
- Create: `lib/simulation/guidance.ts`
- Create: `lib/simulation/guidance.test.ts`
- Modify: `lib/simulation/state.ts`
- Modify: `app/sim-types.ts`

**Interfaces:**
- Produces: `deriveHintGuidance(objectives, events, discoveredFactIds, completedObjectiveIds)`.
- Produces: `isActorStuck(events, actorId, startedAt)`.
- Produces: `ScenarioView.guidance.hints` and `ScenarioView.guidance.stuck`.

- [ ] **Step 1: Write failing pure unit tests**

Cover all of these assertions with small in-memory event fixtures:

```ts
assert.deepEqual(deriveHintGuidance(objectives, [], new Set(), new Set()), [
  { objectiveId: "one", unlockedTier: 0, revealedText: [], nextAvailable: true },
]);
assert.deepEqual(
  deriveHintGuidance(objectives, [hintRequested("one", 1)], new Set(["known.first"]), new Set())[0].revealedText,
  ["direction"],
);
assert.deepEqual(
  deriveHintGuidance(objectives, [hintRequested("one", 1), hintRequested("one", 2)], new Set(["known.first"]), new Set())[0].revealedText,
  ["direction", "strong"],
);
assert.equal(isActorStuck(tenSuccessfulTools, "red", startedAt), true);
assert.equal(isActorStuck(threeFailedTools, "red", startedAt), true);
assert.equal(isActorStuck([...nineTools, progressEvent, ...oneTool], "red", startedAt), false);
```

Also assert tier ordering, malformed metadata ignored, other actors ignored, and completed objectives excluded.

- [ ] **Step 2: Verify RED**

Run: `yarn test lib/simulation/guidance.test.ts`

Expected: FAIL because `guidance.ts` does not exist.

- [ ] **Step 3: Implement the pure functions**

Use structural event inputs rather than Prisma-generated types so tests remain fast:

```ts
type GuidanceEvent = {
  action: string;
  actorId: string | null;
  timestamp: Date;
  metadata: unknown;
};
```

`deriveHintGuidance` must:

1. Exclude completed objectives.
2. Parse only `HINT_REQUESTED` events with matching `objectiveId` and integer tiers 1–3.
3. Set `unlockedTier` to the maximum recorded tier.
4. For each unlocked slot, scan forward through the authored tiers until it finds a tier whose `skipIfFactKnown` does not intersect known fact ids; this implements the prose requirement that a known tier advances to the next useful text rather than rendering nothing.
5. Deduplicate revealed text while preserving authored order.
6. Set `nextAvailable` from `unlockedTier < 3`.

`isActorStuck` must count actor `TOOL_EXECUTED` events after the later of `startedAt` and the actor's latest `OBJECTIVE_COMPLETED`/`FACT_DISCOVERED`; it also checks whether the actor's last three tool events all parse to `metadata.success === false`.

- [ ] **Step 4: Verify pure tests GREEN**

Run: `yarn test lib/simulation/guidance.test.ts`

Expected: PASS.

- [ ] **Step 5: Integrate into `getScenarioView` and the client view type**

After `completedObjectiveIds` and `discoveredFactIds` are known:

```ts
const hints = deriveHintGuidance(
  definition.objectives,
  scenario.events,
  discoveredFactIds,
  completedObjectiveIds,
);
const stuck = isActorStuck(scenario.events, actor.id, scenario.startedAt ?? scenario.createdAt);
```

Add `hints` and `stuck` to the existing `guidance` object without changing `objective`, `objectives`, `knowledge`, or `hypotheses`. Mirror the exact shape in `app/sim-types.ts`:

```ts
hints: Array<{
  objectiveId: string;
  unlockedTier: number;
  revealedText: string[];
  nextAvailable: boolean;
}>;
stuck: boolean;
```

- [ ] **Step 6: Run unit and representative acceptance tests, then commit**

Run: `yarn test lib/simulation/guidance.test.ts lib/simulation/first-shift.acceptance.test.ts`

Expected: PASS.

```bash
git add lib/simulation/guidance.ts lib/simulation/guidance.test.ts lib/simulation/state.ts app/sim-types.ts
git commit -m "feat: derive guided hint state from events"
```

### Task 4: Server-authoritative hint request flow

**Files:**
- Create: `lib/simulation/hints.ts`
- Create: `lib/simulation/hints.test.ts`
- Create: `app/api/sim/hint/route.ts`

**Interfaces:**
- Produces: `requestHint(input: { scenarioId: string; actorId: string; objectiveId: string; tier?: number }): Promise<ScenarioView>`.
- Consumes: `getDefinitionForScenario`, `getScenarioView`, Prisma actors/scenarios/security events, and Task 3 guidance derivation.
- Route accepts JSON `{ scenarioId, actorId, objectiveId }`; an optional forged `tier` is validated but never required by the real client.

- [ ] **Step 1: Write failing integration tests**

Initialize Guided Glasshouse for each test and clean it up in `finally`. Assert:

```ts
const first = await requestHint({ scenarioId, actorId, objectiveId: "atlas" });
assert.equal(first.guidance.hints[0].unlockedTier, 1);
assert.equal(await prisma.securityEvent.count({ where: { scenarioId, action: "HINT_REQUESTED" } }), 1);

await assert.rejects(
  requestHint({ scenarioId, actorId, objectiveId: "atlas", tier: 3 }),
  /next hint tier/i,
);
```

Also cover a Blue actor, an inactive scenario, an unknown objective, a completed objective, tier 3 cap, and two simultaneous requests producing consecutive tiers rather than duplicate tier 1.

- [ ] **Step 2: Verify RED**

Run: `yarn test lib/simulation/hints.test.ts`

Expected: FAIL because `requestHint` does not exist.

- [ ] **Step 3: Implement `requestHint`**

Inside a serializable Prisma transaction:

1. Find the actor by `id`, `scenarioId`, and `role: "red_operator"`, including its scenario.
2. Require scenario state `ACTIVE`.
3. Load the definition and require the objective exists.
4. Read `OBJECTIVE_COMPLETED` and `HINT_REQUESTED` events for the scenario.
5. Reject a completed objective.
6. Compute `nextTier = max(existing valid tiers) + 1`; reject `nextTier > 3`.
7. If input includes `tier`, require it equals `nextTier`.
8. Create:

```ts
await tx.securityEvent.create({
  data: {
    scenarioId,
    actorId,
    action: "HINT_REQUESTED",
    category: "SYSTEM",
    severity: "INFO",
    visibleToRed: true,
    visibleToBlue: false,
    metadata: JSON.stringify({ objectiveId, tier: nextTier }),
  },
});
```

Return `getScenarioView` after the transaction commits. Use a typed `HintRequestError` with HTTP status 400/403/404/409 so the route can preserve authorization and conflict semantics.

- [ ] **Step 4: Verify GREEN**

Run: `yarn test lib/simulation/hints.test.ts`

Expected: PASS.

- [ ] **Step 5: Add the thin Next.js route handler**

```ts
export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const view = await requestHint({
      scenarioId: typeof body.scenarioId === "string" ? body.scenarioId : "",
      actorId: typeof body.actorId === "string" ? body.actorId : "",
      objectiveId: typeof body.objectiveId === "string" ? body.objectiveId : "",
      tier: typeof body.tier === "number" ? body.tier : undefined,
    });
    return Response.json(view);
  } catch (error) {
    const status = error instanceof HintRequestError ? error.status : 500;
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Unable to request hint" }, { status });
  }
}
```

- [ ] **Step 6: Add the full request-flow acceptance test**

Use a Guided Glasshouse run:

1. Discover `portal.hostname` through the normal engine flow.
2. Request tier 1 and assert the returned text advances past the portal-hostname tier.
3. Request tier 2 and assert two useful texts are revealed in order.
4. Request tier 3 and assert `nextAvailable === false`.
5. Assert a fourth request rejects and only three `HINT_REQUESTED` events exist.

- [ ] **Step 7: Run tests and commit**

Run: `yarn test lib/simulation/hints.test.ts lib/simulation/glasshouse.e2e.test.ts`

Expected: PASS.

```bash
git add lib/simulation/hints.ts lib/simulation/hints.test.ts app/api/sim/hint/route.ts
git commit -m "feat: add event-sourced hint requests"
```

### Task 5: Guided Mission panel controls and restrained visual treatment

**Files:**
- Modify: `app/use-operation.ts`
- Modify: `app/red/page.tsx`
- Modify: `app/red/mission-panel.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Task 3 `view.guidance.hints/stuck` and Task 4 `/api/sim/hint`.
- Produces: `MissionPanel` props for `scenarioId`, `actorId`, and `onViewChange(view)`.

**Visual design:** Reuse `#071013` row surfaces, existing border tokens, muted blue action text, amber for the stuck nudge, Geist Sans for explanatory copy, and Geist Mono for tier/status metadata. Keep hints nested under their objective row with the action on the right; do not add cards, pills, glow, modal behavior, or animation.

```text
┌ TASK EVIDENCE ─────────────────────────────── 2 / 8 verified ┐
│ □  Inspect the service process                    REQUEST HINT│
│    HINT 1  A running process and a healthy service differ... │
│    HAVING TROUBLE?  A hint is available for this objective.  │
└───────────────────────────────────────────────────────────────┘
```

- [ ] **Step 1: Expose authoritative view replacement from `useOperation`**

Return `updateView: setView` from the hook so a mutation response can replace local state without a second `/state` fetch.

- [ ] **Step 2: Add request state and behavior to `MissionPanel`**

For Guided Mode only:

1. Match each incomplete objective with its `guidance.hints` entry.
2. Render a `Request hint` button when `nextAvailable` is true.
3. Disable only the objective currently submitting; announce failures with `role="alert"` and successful updates through the changed content.
4. POST `{ scenarioId, actorId, objectiveId }` to `/api/sim/hint`.
5. On success, call `onViewChange(data)`.
6. Render revealed texts as `Hint 1`, `Hint 2`, etc. beneath that objective, preserving order.
7. Render the subtle stuck line only beside the first incomplete objective and only when `guidance.stuck` is true.
8. Remove unconditional rendering of `view.operation.assistance.guided`; keep hypotheses byte-for-byte behaviorally unchanged.

- [ ] **Step 3: Pass ids and view updater from the Red page**

Both Mission panel call sites receive:

```tsx
<MissionPanel
  view={view}
  assistance={assistance ?? "GUIDED"}
  scenarioId={ids.scenarioId}
  actorId={ids.actorId}
  onViewChange={updateView}
/>
```

- [ ] **Step 4: Add scoped CSS**

Extend `.objective-list` with nested `.objective-row`, `.objective-main`, `.hint-action`, `.objective-hints`, and `.stuck-nudge` rules. Maintain a visible `:focus-visible` outline, minimum 24px button height, readable line height, and no color-only state. At narrow operational widths, let the action wrap below the objective label rather than clipping it.

- [ ] **Step 5: Type-check and visually verify**

Run: `yarn tsc --noEmit`

Expected: PASS.

Run the app, open a Guided operation at 1440×900, and verify:

- No hint text appears before a request.
- Button focus is visible by keyboard.
- A requested hint appears under the correct objective.
- The third request removes/disables further access.
- Operator Mode shows no hint controls or stuck nudge.
- Working hypotheses are unchanged.

- [ ] **Step 6: Commit**

```bash
git add app/use-operation.ts app/red/page.tsx app/red/mission-panel.tsx app/globals.css
git commit -m "feat: add progressive hints to mission panel"
```

### Task 6: Full regression verification and graph refresh

**Files:**
- Modify (generated): `graphify-out/*`

**Interfaces:**
- Verifies all prior tasks together.

- [ ] **Step 1: Run the complete simulation suite**

Run: `yarn test`

Expected: all unit, acceptance, campaign, and Glasshouse tests pass with no omitted failures.

- [ ] **Step 2: Run static and production checks**

Run: `yarn tsc --noEmit`

Expected: PASS.

Run: `yarn build`

Expected: PASS.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 3: Refresh the project knowledge graph**

Run: `graphify update .`

Expected: the graph includes the new guidance helper, hint service, route, types, and Mission panel relationships.

- [ ] **Step 4: Review the final diff against the spec**

Confirm every objective in all 15 scenarios has exactly three non-empty tiers, all skip ids resolve, no migration exists, Operator behavior is unchanged, hypotheses were not edited, and only requested hints render.

- [ ] **Step 5: Commit verification artifacts if the repository tracks them**

```bash
git add graphify-out
git commit -m "chore: refresh graph for guided hints"
```
