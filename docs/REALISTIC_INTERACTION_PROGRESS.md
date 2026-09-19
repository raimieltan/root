# Realistic Interaction Layer — Progress Checkpoint

**Status:** Realistic interaction Slices 1–8 complete; canonical pre-multiplayer gaps remain, 2026-09-19
**Source direction:** `docs/tools/tools-unix.md` and `docs/ROOT_CANONICAL_PLAN.md`

This document records the state of the realistic Red-team interaction work before the PvP build begins. ROOT remains a fully simulated environment: terminal commands, services, credentials, events, and Blue-team consequences are modeled by the application; no live network targets are contacted.

## Delivered vertical slices

### 1. Structured tool intents and terminal context

- Added typed terminal intents for web requests, trusted-service operations, PostgreSQL connections, and prompted authentication in `lib/simulation/tools.ts`.
- Added persisted terminal session context, including `AUTHENTICATING`, so an incomplete login survives a terminal/API round trip rather than relying on client-only state.
- The terminal API derives context from the saved session, and Blue scripted activity preserves that context between Red steps.

### 2. Declarative Glasshouse application route

The Glasshouse scenario now models its key application path as declared interactions instead of one generic exploit command:

1. discover `WEB-01`;
2. submit a bounded legacy-upload web request with `curl`;
3. use the deploy account to investigate the backup configuration;
4. invoke the declared trusted backup hook;
5. pivot to `FIN-APP`, then its database.

The declarations live alongside scenario content as web interactions and trusted-service operations. They produce targeted simulation events and are visible to Blue detection/response logic.

### 3. Unix investigation commands

The simulated shell now supports bounded investigation behavior for:

- identity and environment: `id`, `env`, `whoami`, `hostname`;
- navigation and inspection: `pwd`, `ls`, `cd`, `cat`;
- investigations: `ls -l`, `grep`, `find`;
- existing process/network primitives: `ps`, `ip`, `ping`, `nmap`, `curl`, `ssh`.

Commands operate only on scenario-declared resources and intentionally reject unsupported/general shell behavior.

### 4. Prompted SSH and PostgreSQL authentication

- `ssh` and `psql` can now open a persisted password prompt.
- The terminal masks entered passwords in command history.
- Validation occurs server-side against the simulated target, reachable route, source context, and discovered credential state.
- Wrong passwords create an authentication failure while keeping the prompt active; a Blue reset invalidates a pending prompt.
- Glasshouse’s official deploy, application, and database routes now use prompts rather than embedding those secrets in commands.

### 5. Scenario content and migrations

Applied local Prisma migrations:

| Migration | Purpose |
| --- | --- |
| `20260918100938_add_terminal_session_context` | Persist terminal session context. |
| `20260918103343_add_authentication_context` | Add the authentication-prompt session state. |
| `20260918104807_add_first_class_credentials` | Persist discovered credentials with scoped service metadata and validity. |

### 6. First-class credentials and Credentials application

- Discoveries now create scoped `Credential` records instead of relying on `CREDENTIAL_DISCOVERED` event history as the credential store.
- Each record carries the identity, origin, known scope, type, privilege, simulated secret, service/database metadata, and validity.
- SSH and PostgreSQL authorization now resolve a valid persisted credential for the exact target and service; a discovery event remains telemetry, not the authorization source of truth.
- The Red Credentials application displays origin, scope, type, validity, and a masked secret. `Reveal` makes the simulated secret visible on demand, `Copy` works after reveal, and `Use` prepares a connection command without placing the secret on the command line. Authentication still happens through the terminal prompt.
- Blue `RESET_PASSWORD` invalidates discovered credentials as well as active sessions. If Blue resets an identity before Red discovers it, a later discovery is created already invalid; it cannot reactivate that identity accidentally.

### 7. Legacy generic attack shortcuts retired

- Removed the player-facing `exploit`, `privesc`, and `msfconsole` commands and their monolithic engine handlers.
- Removed the legacy scenario `exploits` and `privilegeEscalations` authoring fields.
- Migrated every endpoint-style campaign route to a declared, bounded `curl -X POST` web interaction. Each interaction defines its host, method, path, expected payload fragment, prerequisite reconnaissance, resulting identity/session, and evidence.
- Preserved the corresponding worker-execution, process, authentication, replay, and Blue-detection evidence. Endpoint worker activity now uses the outcome-oriented `WEB_WORKER_EXECUTED` event rather than a generic command-shaped event.
- Glasshouse remains the reference for declared web interactions and trusted-service operations; the remaining campaign scenarios now follow the same authoring approach.

## Verification completed

- `yarn tsc --noEmit` passed.
- The focused Nightshift credential-invalidation test passed.
- Glasshouse simulation coverage passed, including persisted PostgreSQL credential invalidation.
- Full simulation suite passed: 60 tests across 4 suites.
- The production webpack build passed.

### 8. Composable tool-adapter layer

- Replaced the central command-dispatch switch with an executable adapter registry covering shell, network, service, database, authentication, and system tools.
- Every adapter now owns recognition, parsing, validation, execution, and a machine-checkable contract describing permissions, resources, outcomes, telemetry, detectability, replay impact, and concrete Blue responses.
- Every submitted tool intent records a Truth-only `TOOL_EXECUTED` audit event, while domain events record the originating `toolId`. This makes the intent-to-event-to-replay chain auditable without storing passwords or coupling replay to terminal syntax.
- Compatibility parsing remains available for syntax-only callers, but engine execution now goes through adapters.

### 9. Explicit services and Red/Blue/replay parity

- Scenario services now declare permissions, resources, and outcomes instead of being only a name/port/process tuple. These contracts are persisted in service metadata when a scenario starts.
- Scenario validation rejects incomplete service contracts, web interactions without web services or telemetry, trusted operations without a declared service or telemetry, and databases without service-backed identity resources.
- Contract tests require observable intents and service outcomes to declare replayable telemetry and supported Blue responses.
- The acceptance matrix now runs every route in all eight campaign operations through Red execution and scripted Red against Blue. Each completed Red route is also reconstructed through Red, Blue, and Truth replay lenses and checked against its expected route and objective outcome.

## Canonical roadmap alignment

The realistic interaction architecture is established, and new tools and scenario services must continue to satisfy the adapter/service contract tests. This does **not** move ROOT directly to Multiplayer Alpha.

The expanded canonical roadmap places Multiplayer Alpha at Milestone 11. Milestones 8–10, plus specific incomplete requirements from Milestones 2–4, remain product gates:

### Fundamentals, network, and application gaps

- Build the short Act 0 orientation operation and short network/service operation required by Milestone 2, then validate the beginner-understanding exit condition with human playtesting.
- Add a first-class DNS simulation and complete Intel auto-recording for Milestone 3.
- Add the Browser interface and persistent HTTP cookie/application-session behavior for Milestone 4.

### Milestone 8 — ROOT MVP gaps

- formalize reusable machine archetypes;
- add fundamentals/onboarding operations;
- add the Knowledge Tracker and strengthen learning-event annotations;
- validate 4–8 hours of first-play content and the new-player Red/Blue progression exit condition.

### Milestone 9 — Learning / Content Alpha gaps

- organize content into the canonical Act 0–V learning progression;
- improve in-world documentation and concept-aware hints;
- add the packet/connection viewer foundation and deepen web/database simulation;
- establish the enterprise identity foundation;
- validate the 10–15 hour campaign and beginner-to-intermediate reasoning exit condition.

The current campaign already reaches the numerical floor of six organizations and eight operations, with Red/Blue variants, Training Range exercises, certifications, profile presentation, proficiency, and designations. Those counts do not by themselves satisfy the milestone's learning progression or playtime gates.

### Milestone 10 — Enterprise Operator Alpha gaps

- build larger segmented organizations and a first-class identity/trust graph;
- add an enterprise-directory-inspired adapter and deeper group/service-account authorization;
- add richer detection correlation, packet/connection analysis, and advanced incident reconstruction;
- validate scenarios whose decisive path is identity, permission, and trust rather than a vulnerable machine.

## PvP assessment

The interaction retirement and parity prerequisites are complete, but ROOT is **not PvP-ready yet**. After the canonical Milestone 8–10 gates above, Multiplayer Alpha requires:

- durable player/account and match records;
- authoritative per-match state, command ordering, versions, and transactions;
- real-time propagation, reconnect/resync, and desynchronization tests;
- lobbies and bounded unranked 1v1 matches;
- server-owned win conditions, visibility rules, and anti-race guarantees;
- spectator foundation, replay, and match results.

Production matchmaking, competitive analytics, and Red/Blue ranking belong to Milestone 12, after the unranked Multiplayer Alpha is reliable.

The key rule for PvP is that clients may render and submit intent, but only the authoritative match simulation may decide state, telemetry, detection, or victory.

## Suggested immediate next task — Act 0 “First Shift” vertical slice

Build the first short Nodeline orientation operation before adding more offensive depth.

Scope:

1. Extend the scenario objective model beyond `retrieve_file` with reusable event/fact-based learning objectives; do not special-case the operation in the engine.
2. Author `First Shift` around `pwd`, `ls`, `cd`, `cat`, `whoami`, `id`, `env`, and `ps`, teaching current host, current user, groups, file permissions, processes, services, documentation, and evidence versus assumption.
3. Give the operation Guided and Operator presentations. Guided mode may explain interfaces and concepts but must not provide the answer; Operator mode should rely on in-world documentation.
4. Complete objectives from authoritative simulation events/facts and attach learning-event annotations so the Knowledge Tracker can consume them later.
5. Add acceptance coverage proving every required observation is discoverable in-world, the operation completes without hidden strings, and Red/Blue/Truth replay preserves the learning evidence.
6. Run a fresh-player playtest against the Milestone 2 exit questions before declaring the slice complete.

This slice closes the earliest unmet roadmap gate and creates reusable foundations for later onboarding, concept-aware hints, proficiency, and the Knowledge Tracker. The next natural slice after it is the Act I network/service operation with first-class DNS and fuller Intel auto-recording.

## Session memory

**2026-09-19 decision:** Realistic interaction Slices 7 and 8 are complete, but the expanded canonical roadmap supersedes the earlier direct move to PvP authority. Close the remaining Milestone 2–4 requirements and Milestones 8–10 before treating Multiplayer Alpha as the active product phase. The immediate implementation priority is the Act 0 `First Shift` vertical slice and its reusable event/fact-based objective foundation.
