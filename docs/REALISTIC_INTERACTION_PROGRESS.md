# Realistic Interaction Layer — Progress Checkpoint

**Status:** Realistic interaction Slices 1–8 complete; Act 0 and Act I content built; first-class DNS and full Intel auto-recording (Milestone 3 close-out) built; canonical pre-multiplayer gaps remain, 2026-09-20
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

### 10. Act 0 orientation and Act I network/service missions

- Built `First Shift`, `The Printer`, and `Locked Out` (Act 0), closing Milestone 2's short orientation requirement with reusable event/fact-based objectives (not `retrieve_file`-only), Guided/Operator presentations, learning-event annotations, and beginner exit questions.
- Built the Act I "Networks and Helpdesk" arc — `Where Did the Website Go?` (NET-01), `Service Unavailable` (NET-02), `Wrong Network` (NET-03), `The New Server` (NET-04) — closing Milestone 2's short network/service operation requirement and Milestone 3's exit condition (a tester can determine what hosts exist, what is reachable, what services are exposed, and which discovered information is useful) for a beginner-scoped network.
- DNS staleness/migration was initially modeled through the scenario-level `aliases` map (a name resolving to a decommissioned vs. live host); Slice 11 below replaces `aliases` with a first-class, queryable DNS record model.
- Added optional per-service `status` (`RUNNING`/`STOPPED`) to `ScenarioServiceDefinition`/`service()` so a mission can model a stopped service on an otherwise-reachable host; fixed `nmap` to report `closed` for stopped services instead of always `open`.
- Campaign order is now `first-shift → the-printer → locked-out → website-down → service-unavailable → wrong-network → the-new-server → glasshouse → nightshift → dead-drop → paper-trail → strange-login → something-calling-home → ghost-account → no-one-knows` (15 scenarios total).
- Each mission has full acceptance-test coverage (`*.acceptance.test.ts`) driving it end to end to `COMPLETED` with every objective satisfied.

### 11. First-class DNS and full Intel auto-recording (Milestone 3 close-out)

- Replaced the static `aliases: Record<string, string>` map with a first-class, scenario-declared `dnsRecords` model (`name`/`type`/`value`, `A` and `CNAME`, with CNAME chain resolution) in `lib/simulation/scenarios/types.ts`. `lib/simulation/scenarios/content.ts` exposes a `dns()` helper that converts a simple `name -> hostname` map into A records for scenarios with no staleness/chaining to model. Every campaign scenario, including Glasshouse, now declares `dnsRecords` instead of `aliases`; the old field and mechanism are fully retired, not kept alongside the new one.
- Added `dig`/`nslookup` terminal commands (`lib/simulation/engine.ts`, registered in `lib/simulation/tools.ts`) that resolve a queried name through the declared DNS records and print a resolver-style answer section (or NXDOMAIN), rather than resolution only happening implicitly inside `ping`/`curl`/`nmap`/`ssh` targeting. `target()` now resolves through the same `resolveDns()` chain walk.
- Added a `dns` discovery trigger kind (`ScenarioDiscovery.trigger.kind`) so a scenario can gate a fact/credential/host reveal on an explicit DNS query of a given name resolving to a given host, distinct from the existing `file`/`web`/`scan`/`process`/`postgres` triggers.
- `Where Did the Website Go?` (NET-01) now requires an explicit `dig intranet.nodeline.test` query (new `query-dns-record` objective, `website.dnsRecordStale` fact) before the rest of the investigation, so the mission exercises a real DNS lookup rather than resolution happening silently inside `ping`.
- Built the canonical-plan §40 Intel panel as its own Red-side app tab (`app/red/page.tsx`, `IntelPanel`) showing HOSTS / CREDENTIALS / NETWORKS / RELATIONSHIPS, auto-populated in `lib/simulation/state.ts` from the same discovery/credential/session data the engine already records (`applyDiscovery`, `Credential`, `SESSION_CREATED`/`DATABASE_SESSION_CREATED`/`ROOT_SESSION_CREATED` events) — no new per-scenario Intel wiring. The existing partial `intel.hosts`/`intel.relationships` view inside the Network Map tab is unchanged and still present alongside the new dedicated tab.
- Added acceptance coverage: `website-down.acceptance.test.ts` now asserts the DNS answer section and that completion requires the `dig` step; a new `lib/simulation/intel.test.ts` drives Glasshouse's application route through the engine and asserts `view.intel` populates HOSTS/CREDENTIALS/NETWORKS/RELATIONSHIPS from that activity alone.
- Re-validated: `yarn tsc --noEmit`, `yarn test` (76 tests; the 2 failures are pre-existing on `main`, unrelated to this slice — confirmed via `git stash`), and `yarn build` all pass.

### 12. Operator discoverability gate and realistic filesystem navigation

- Replaced string-concatenation working directories with normalized simulated paths supporting absolute and relative navigation, `.`, `..`, `~`, and home-directory defaults. File commands now resolve against the working directory, `ls` exposes immediate children instead of recursively leaking the filesystem, and invalid `cd` targets fail without changing state.
- Added `OperatorKnowledgeLedger`, which distinguishes mission-visible starting knowledge from evidence observed at runtime. Operator acceptance paths must learn scenario-specific hosts, identities, credentials, paths, HTTP routes/form data, and database identifiers before using them.
- Applied the no-oracle gate to Act 0, Act I, and Glasshouse's organic route. The audit replaced hidden absolute-path assumptions with directory traversal and exposed one missing New Server clue, now published in its provisioning ticket.
- Glasshouse's organic path now uses the IP addresses actually printed by configuration evidence instead of silently substituting internal symbolic hostnames.
- Scenario validation now rejects non-starting facts and fact objectives with no declared discovery source.
- Remaining adoption scope: extend the executable no-oracle gate across Acts II–V before treating the full campaign as organically discoverable.

## Canonical roadmap alignment

The realistic interaction architecture is established, and new tools and scenario services must continue to satisfy the adapter/service contract tests. This does **not** move ROOT directly to Multiplayer Alpha.

The expanded canonical roadmap places Multiplayer Alpha at Milestone 11. Milestones 8–10, plus specific incomplete requirements from Milestones 2–4, remain product gates:

### Fundamentals, network, and application gaps

- Act 0 orientation and the Act I network/service operations are built (see Slice 10 above). Milestone 2's content requirement is satisfied; its exit condition still needs validation with human playtesting, not just automated acceptance tests.
- First-class DNS and full Intel auto-recording are built (see Slice 11 above), closing Milestone 3's content requirement. Milestone 3's exit condition (a tester can independently determine what hosts exist, what is reachable, what services are exposed, and which discovered information is useful) is supported by the new `dig`/`nslookup` and Intel surfaces, but — like Milestone 2 — still needs a human playtest pass, not just automated acceptance tests.
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

## Suggested immediate next task — Milestone 4 (Browser interface, HTTP/cookie/session, deeper psql)

Milestone 3 is now closed (see Slice 11: first-class DNS, `dig`/`nslookup`, and the full Intel auto-recording panel). The next unmet roadmap gate is Milestone 4: a general-purpose Browser app, an HTTP route/cookie/session model, and deeper PostgreSQL `psql` support. Glasshouse already exercises a bounded slice of this (raw `curl` against a couple of routes, one `psql` query), but there's no general-purpose Browser app yet, and HTTP sessions/cookies aren't modeled as first-class state the way DNS and SSH sessions now are.

Scope:

1. Add a Browser app (`app/red/page.tsx` or a dedicated tab) that renders HTTP responses instead of raw `curl` text output, and model HTTP sessions/cookies as engine state so login flows, authenticated routes, and session expiry can be scripted into scenarios.
2. Deepen `psql`: multiple tables/joins, more realistic query errors, and scenario-declared schemas beyond the single-table lookups Glasshouse currently uses.
3. Add acceptance coverage for a scenario that requires navigating multiple authenticated HTTP routes (not just one `curl`) and a `psql` scenario with a non-trivial query.
4. Re-validate the Milestone 4 exit condition against the new Browser/HTTP/psql surfaces once built.

Separately, and not blocking the above, Milestone 2's exit condition still needs a human playtest pass (a fresh tester walking Act 0 → Act I and explaining current host/user/files/processes/IP-host-service relationships unaided) — the acceptance-test suite proves the content is completable, not that it teaches successfully.

## Session memory

**2026-09-19 decision:** Realistic interaction Slices 7 and 8 are complete, but the expanded canonical roadmap supersedes the earlier direct move to PvP authority. Close the remaining Milestone 2–4 requirements and Milestones 8–10 before treating Multiplayer Alpha as the active product phase.

**2026-09-19 update:** Act 0 (`First Shift`, `The Printer`, `Locked Out`) and Act I (`Where Did the Website Go?`, `Service Unavailable`, `Wrong Network`, `The New Server`) are built and pass acceptance tests, closing Milestone 2's content requirement. DNS is only alias-based and Intel auto-recording is only partially built, so Milestone 3 is not fully closed. The immediate implementation priority is first-class DNS + the full Intel panel, per the scope above.

**2026-09-20 update:** Slice 11 (first-class DNS + full Intel auto-recording) is complete, closing Milestone 3. `ScenarioDefinition.aliases` was fully retired in favor of `dnsRecords` (A/CNAME records with depth-limited chain resolution via `resolveDns()`), all 15 scenario files were migrated, and `dig`/`nslookup` were added as real terminal commands emitting `DNS_QUERY` telemetry and driving a new `dns` discovery-trigger kind. `Where Did the Website Go?` now requires an explicit `dig` query before the rest of the investigation, and a new `intel.test.ts` proves Intel auto-populates HOSTS/CREDENTIALS/NETWORKS/RELATIONSHIPS from Glasshouse's existing discovery/session data alone, with a dedicated Intel tab added to `app/red/page.tsx`. `tsc`, `yarn test` (2 pre-existing unrelated failures only), and `yarn build` all pass. The immediate implementation priority is now Milestone 4 (Browser app, HTTP/cookie/session model, deeper `psql`), per the scope above.
