# Operator Discoverability Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Act 0, Act I, and Glasshouse prove that an Operator Mode player can derive every meaningful command operand from prior in-world evidence rather than from test-author knowledge.

**Architecture:** Add a pure `OperatorKnowledgeLedger` that records briefing/start-state knowledge plus the paths and literals exposed by successful command output. Acceptance runners ask the ledger to authorize each command before sending it to `SimulationEngine`, then record the result. Existing mission acceptance paths remain the executable source of truth; the campaign validator gains structural checks that every non-starting fact has a declared discovery source.

**Tech Stack:** TypeScript, Node test runner, existing simulation engine and scenario definitions.

**Spec:** `docs/ROOT_CANONICAL_PLAN.md` sections 32.1, 70/Milestones 2–5; `docs/story/canon-story.md`

## Global Constraints

- ROOT remains fully simulated; the gate must not contact real systems.
- Operator Mode receives no Guided Mode hints.
- A command may use standard shell vocabulary, but scenario-specific hosts, users, credentials, paths, HTTP routes/parameters, database names, tables, and columns must come from starting knowledge or prior output.
- Directory names become known through `ls`; relative traversal is valid evidence.
- Preserve the current dirty worktree and do not create commits.
- Per user direction, implement production behavior before adding/running regression tests.

## Review Focus

- Relative and absolute paths must both be accepted only after their directory entry or exact path was observed; covered by ledger unit tests.
- Password-prompt input must be rejected unless the secret appeared previously; covered by ledger unit tests and mission acceptance paths.
- Hostnames and usernames embedded in `ssh`, `curl`, `ping`, `nmap`, and `psql` must not bypass provenance checks; covered by ledger unit tests.
- HTTP form paths, field names, and values must be learned independently; covered by the New Server and Glasshouse organic paths.
- Failed commands must not add output to the knowledge ledger; covered by ledger unit tests.

---

### Task 1: Operator knowledge ledger

**Files:**
- Create: `lib/simulation/operator-discoverability.ts`
- Modify: `lib/simulation/scenarios/validate.ts`
- Test: `lib/simulation/operator-discoverability.test.ts`

**Interfaces:**
- Consumes: `ScenarioDefinition`, `TerminalState`, command text, and `CommandResult`.
- Produces: `OperatorKnowledgeLedger.fromScenario(definition)`, `authorize(command, state)`, and `record(command, stateBefore, result)`.

- [ ] **Step 1: Implement the ledger**

Create a ledger that seeds normalized searchable text from the Red briefing, constraints, starting knowledge, and starting session. `authorize` parses the bounded command families and returns `{ allowed: boolean; unknown: string[] }`. Exempt command vocabulary and ordinary navigation (`.`, `..`, `~`, `/`, `/home`, `/var`, `/etc`, `/usr`, `/opt`, `/tmp`); require scenario-specific operands to be present in observed text or an observed directory entry. `record` adds successful output and reconstructs full child paths from successful `ls` output.

- [ ] **Step 2: Add structural provenance validation**

In `validateScenario`, require every fact without `knownAtStart` to be emitted by at least one discovery and require every fact objective to have either `knownAtStart` or a discovery. Error messages must name the missing fact.

- [ ] **Step 3: Add regression tests after implementation**

Cover an unknown absolute file path, a path learned through `ls` plus `cd`, learned `user@host`, unknown/learned password input, HTTP form operands, SQL identifiers, and ignored failed-command output.

- [ ] **Step 4: Verify Task 1**

Run: `node --import tsx --test lib/simulation/operator-discoverability.test.ts lib/simulation/hints.test.ts`

Expected: all tests pass with zero failures.

### Task 2: Act 0 and Act I no-oracle adoption

**Files:**
- Modify: `lib/simulation/first-shift.acceptance.test.ts`
- Modify: `lib/simulation/the-printer.acceptance.test.ts`
- Modify: `lib/simulation/locked-out.acceptance.test.ts`
- Modify: `lib/simulation/website-down.acceptance.test.ts`
- Modify: `lib/simulation/service-unavailable.acceptance.test.ts`
- Modify: `lib/simulation/wrong-network.acceptance.test.ts`
- Modify: `lib/simulation/the-new-server.acceptance.test.ts`

**Interfaces:**
- Consumes: `OperatorKnowledgeLedger` from Task 1.
- Produces: seven acceptance paths whose runner rejects oracle operands before engine execution.

- [ ] **Step 1: Integrate the ledger into each runner**

Before execution, assert `ledger.authorize(command, state).allowed`; after execution, call `ledger.record(command, priorState, result)` only with the actual result. Include scenario id, command, and unknown operands in assertion messages.

- [ ] **Step 2: Repair unfair command sequences**

Add `ls`, directory traversal, file reads, process inspection, DNS/service inspection, or HTTP inspection wherever an existing path uses a value before its source exposed it. Do not seed hidden values into the ledger and do not use Guided hints.

- [ ] **Step 3: Run Act 0 and Act I acceptance coverage**

Run: `node --import tsx --test --test-concurrency=1 lib/simulation/{first-shift,the-printer,locked-out,website-down,service-unavailable,wrong-network,the-new-server}.acceptance.test.ts`

Expected: every mission reaches `COMPLETED`, every objective completes, and the ledger reports no unknown operands.

### Task 3: Glasshouse organic route adoption

**Files:**
- Modify: `lib/simulation/glasshouse.e2e.test.ts`

**Interfaces:**
- Consumes: `OperatorKnowledgeLedger` from Task 1.
- Produces: a Glasshouse organic route that derives web, filesystem, identity, and database operands entirely from observed evidence.

- [ ] **Step 1: Gate only the organic discovery route**

Keep deterministic alternate-route regression scripts unchanged. Add ledger authorization to the organic route runner and identify each previously oracle-supplied operand.

- [ ] **Step 2: Repair the organic sequence**

Use page responses to learn form action/fields, real directory traversal to learn configuration filenames, config/process output to learn identities and downstream hosts, and PostgreSQL enumeration to learn database/schema identifiers.

- [ ] **Step 3: Verify Glasshouse**

Run: `node --import tsx --test --test-concurrency=1 lib/simulation/glasshouse.e2e.test.ts`

Expected: all Glasshouse routes pass; the organic route reaches the objective without an unknown operand.

### Task 4: Repository verification and documentation

**Files:**
- Modify: `docs/REALISTIC_INTERACTION_PROGRESS.md`
- Update: `graphify-out/*` through `graphify update .`

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: documented authoring gate and refreshed code graph.

- [ ] **Step 1: Document the gate and remaining campaign scope**

Record that Act 0, Act I, and Glasshouse have executable no-oracle coverage, while Acts II–V remain the next adoption batch. Keep Milestone 4 as the next feature milestone after campaign adoption.

- [ ] **Step 2: Run full verification**

Run `yarn tsc --noEmit`, the complete simulation suite with local PostgreSQL access, `yarn build`, `git diff --check`, and `graphify update .`.

Expected: zero TypeScript errors, zero simulation failures, successful production build, and no whitespace errors.

