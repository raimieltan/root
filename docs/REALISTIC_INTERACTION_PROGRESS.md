# Realistic Interaction Layer — Progress Checkpoint

**Status:** active implementation checkpoint, 2026-09-18  
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

## Verification completed

- `yarn tsc --noEmit` passed.
- The focused Nightshift credential-invalidation test passed.
- Glasshouse simulation coverage passed (4 tests), including persisted PostgreSQL credential invalidation.
- Full test suite passed: 52 tests across 3 suites.
- `yarn build` passed.

## Deliberately still present

The older `exploit`, `privesc`, and `msfconsole` command paths still exist for campaign content that has not yet been migrated. They are not the intended future authoring interface, but removing them now would break those scenarios. Similarly, some legacy SSH routes retain implicit/compatibility authentication where their scenario data has no password target yet.

## Remaining work, in recommended order

### Slice 6 — retire generic attack shortcuts

Migrate every remaining campaign route from generic `exploit`/`privesc`/`msfconsole` branches to declared web interactions, service operations, permissions, and resources. Add authoring validation and tests that prevent new scenario content from depending on the retired shortcuts, then remove the handlers.

### Slice 7 — formalize the tool-adapter layer

Evolve the current discriminated parser intents into composable tool adapters with explicit parse, validation, execution, event, and Blue-detection contracts. Migrate shell, network, service, and database tools to that shared contract so additions do not expand one monolithic engine branch.

### Slice 8 — deepen simulated services and Blue parity

Model service permissions, data resources, and operation outcomes more explicitly. Ensure each new Red intent emits replayable telemetry, has intentional detectability, and can be invalidated by a concrete Blue response. Expand the Red/Blue/replay acceptance matrix beyond Glasshouse.

## PvP assessment

This work is a useful prerequisite for fair PvP, but ROOT is **not PvP-ready yet**. Before networked matches, complete at least the retirement and parity work above, then build the PvP authority layer:

- durable player/account and match records;
- authoritative per-match state, command ordering, versions, and transactions;
- real-time propagation, reconnect/resync, and desynchronization tests;
- lobbies and bounded 1v1 matchmaking;
- server-owned win conditions, visibility rules, and anti-race guarantees;
- spectator/ranking work only after the core match is reliable.

The key rule for PvP is that clients may render and submit intent, but only the authoritative match simulation may decide state, telemetry, detection, or victory.

## Suggested immediate next task

Implement Slice 6: migrate the remaining campaign routes from generic shortcuts to declared interactions, then remove the player-facing generic attack commands behind coverage gates.

## Session memory

**2026-09-18 decision:** Slice 5 is complete. The next implementation priority is Slice 6, retiring the legacy generic attack shortcuts only after every dependent campaign route has a declared replacement and test coverage. Do not begin PvP authority work before this migration and Red/Blue telemetry parity are complete.
