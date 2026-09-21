# Campaign-wide Operator Discoverability Implementation Plan

> Execution ruling: implement immediately and verify afterward, matching the user's explicit test-last/full-auto direction.

**Goal:** Prove every player-facing attack route in Acts II-V is completable in Operator Mode using only the briefing, starting state, terminal output, filesystem enumeration, and credentials deliberately exposed by the simulator.

**Architecture:** Keep autonomous Blue profiles as AI behavior only. Add a separate player-validation route catalog and execute it with the real simulation engine plus `OperatorKnowledgeLedger`. Model the existing Credentials app's Reveal action as an explicit ledger observation so credential discoveries remain legitimate without leaking secrets into terminal output.

**Tech Stack:** TypeScript, Node test runner, Prisma-backed simulation engine.

---

### Task 1: Model player-visible credential reveals

**Files:**
- Modify: `lib/simulation/operator-discoverability.ts`
- Test: `lib/simulation/operator-discoverability.test.ts`

Add an explicit ledger method for credentials the player can reveal in the Credentials app. Verify that a secret remains unknown before reveal and becomes authorized afterward.

### Task 2: Add campaign player-route validation

**Files:**
- Create: `lib/simulation/campaign-operator-routes.test.ts`
- Modify: `lib/simulation/scenarios/nightshift.ts`
- Modify: `lib/simulation/scenarios/dead-drop.ts`
- Modify: `lib/simulation/scenarios/paper-trail.ts`
- Modify: `lib/simulation/scenarios/strange-login.ts`
- Modify: `lib/simulation/scenarios/something-calling-home.ts`
- Modify: `lib/simulation/scenarios/ghost-account.ts`
- Modify: `lib/simulation/scenarios/no-one-knows.ts`

Define operator routes independently of `blueProfiles`, assert exact route coverage, and run every command through the real engine and knowledge gate. Repair public web evidence so worker endpoints, methods, and form values are discoverable rather than guessed.

### Task 3: Gate the Glasshouse alternate route

**Files:**
- Modify: `lib/simulation/glasshouse.e2e.test.ts`

Replace shortcut commands with an enumerated backup-trust path, observe revealed credentials, and enforce the ledger on the backup route as well as the existing organic application route.

### Task 4: Verify and synchronize project knowledge

**Files:**
- Modify: `docs/ROOT_PROGRESS.md`
- Modify: `docs/ROOT_CANONICAL_PLAN.md`
- Modify: `graphify-out/*`

Run focused simulation tests, the full simulation suite, type checking/build as appropriate, `git diff --check`, and `graphify update .`. Record the completed slice and the next slice in canonical progress documentation.
