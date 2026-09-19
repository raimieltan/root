# Graph Report - root  (2026-09-20)

## Corpus Check
- 100 files · ~629,258 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 920 nodes · 1735 edges · 56 communities (45 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1dd39f41`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- root-chrome.tsx
- devDependencies
- dependencies
- TypeScript Configuration
- engine.ts
- SimulationEngine
- index.ts
- Repository Agent Rules
- tools-unix.md
- DIEGETIC-UI.md
- Dense Operational Layout
- Frontend Design
- Operation Glasshouse
- Generic UI Icons
- Next.js Vercel Branding
- ESLint Configuration
- Next.js Configuration
- PostCSS Configuration
- 44. MVP Tool Set
- 46. Player Progression
- 47. Scenario Design Standard
- canon-story.md
- 23. Story Rules
- 6. ACT I — NOISE
- 7. ACT II — PATTERN
- 11. ACT IV — GHOSTS
- 8. ACT III — ACCESS
- 17. ACT V — ROOT
- 20. Meaning of the Title
- 13. Canonical Recurring Characters
- Delivered vertical slices
- blue/page.tsx
- AUDIO_DESIGN.md
- 92. Canonical Taxonomy
- 109. Canonical Page Copy
- 66. Page Mapping
- 6. Canonical Application Names
- Broken Unstyled Career Page Screenshot
- career/page.tsx
- Operation Glasshouse — Discovery Graph
- 16. SIEM / Log Viewer
- 40. Audio Production Priority
- 6. Desktop UI Audio
- 8. Authentication Audio
- 23. Post-Operation Reconstruction
- 3. Core Audio Principles
- 7. Terminal Audio
- ROOT — Audio Design Document
- tools.ts
- red/page.tsx
- inspector.tsx
- RootAudioSystem
- BlueTeamPage

## God Nodes (most connected - your core abstractions)
1. `SimulationEngine` - 55 edges
2. `TerminalState` - 38 edges
3. `ScenarioDefinition` - 23 edges
4. `prisma` - 19 edges
5. `getScenarioView()` - 18 edges
6. `getDefinitionForScenario()` - 16 edges
7. `dns()` - 16 edges
8. `compilerOptions` - 16 edges
9. `playAudio()` - 15 edges
10. `initializeScenario()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Wordmark Asset` --conceptually_related_to--> `Next.js Bootstrap Instructions`  [INFERRED]
  public/next.svg → README.md
- `Vercel Mark Asset` --conceptually_related_to--> `Next.js Bootstrap Instructions`  [INFERRED]
  public/vercel.svg → README.md
- `runCheck()` --calls--> `playAudio()`  [EXTRACTED]
  app/ui/audio-control.tsx → lib/audio/audio-system.ts
- `LoginScreen()` --calls--> `playAudio()`  [EXTRACTED]
  app/ui/root-chrome.tsx → lib/audio/audio-system.ts
- `POST()` --calls--> `advanceBlueScenario()`  [EXTRACTED]
  app/api/sim/blue/advance/route.ts → lib/simulation/blue.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared Simulation Model** — docs_root_canonical_plan_shared_simulation, docs_root_canonical_plan_everything_leaves_evidence, docs_root_canonical_plan_post_operation_reconstruction [EXTRACTED 1.00]

## Communities (56 total, 8 thin omitted)

### Community 0 - "root-chrome.tsx"
Cohesion: 0.11
Nodes (23): AudioControlPanel(), runCheck(), AudioVisualIndicator(), MIXER_CHANNELS, useRootAudio(), appInfo, LoginScreen(), Section (+15 more)

### Community 1 - "devDependencies"
Cohesion: 0.06
Nodes (31): concurrently, eslint, eslint-config-next, devDependencies, concurrently, eslint, eslint-config-next, @playwright/test (+23 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (41): dotenv, lucide-react, next, dependencies, dotenv, lucide-react, next, pg (+33 more)

### Community 3 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "engine.ts"
Cohesion: 0.06
Nodes (58): POST(), POST(), POST(), POST(), GET(), GET(), ReplayPageProps, emptySnapshot (+50 more)

### Community 5 - "SimulationEngine"
Cohesion: 0.25
Nodes (5): SimulationEngine, reachable(), CommandResult, SimulationEvent, TerminalState

### Community 6 - "index.ts"
Cohesion: 0.09
Nodes (43): commonDetections, discover(), dns(), external, file(), host(), identity(), link() (+35 more)

### Community 7 - "Repository Agent Rules"
Cohesion: 0.20
Nodes (11): Repository Agent Rules, Canonical Plan Precedence, Graphify-First Codebase Navigation, Claude Agent Rules Reference, Local PostgreSQL Service, Action to Replay Pipeline, Everything Leaves Evidence, Shared Authoritative Simulation (+3 more)

### Community 8 - "tools-unix.md"
Cohesion: 0.04
Nodes (50): 10. Filesystem Simulation, 11. Services as First-Class Simulation Objects, 12. PostgreSQL Simulation, 13. Supported PostgreSQL Commands, 14. Database Simulation Model, 15. Credentials as First-Class Objects, 16. Credential Usage, 17. Credentials Application (+42 more)

### Community 9 - "DIEGETIC-UI.md"
Cohesion: 0.02
Nodes (110): 100. Good Copy Examples, 101. Bad Copy Examples, 102. Color and Diegesis, 103. Icons and Diegesis, 104. Story Events, 105. Horror / Mystery Without Breaking UI, 106. LLM Implementation Rule, 107. LLM Naming Checklist (+102 more)

### Community 10 - "Dense Operational Layout"
Cohesion: 0.67
Nodes (3): Dense Operational Layout, Restrained Enterprise Workstation Aesthetic, Semantic Operational Color System

### Community 11 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground your designs in the subject matter, More on writing in design, Process: plan, review against the brief, build, critique, Restraint and self-critique

### Community 12 - "Operation Glasshouse"
Cohesion: 0.67
Nodes (3): Knowledge Is Power, Operation Glasshouse, Red Blue Truth Reconstruction

### Community 13 - "Generic UI Icons"
Cohesion: 0.67
Nodes (3): File Icon Asset, Globe Icon Asset, Window Icon Asset

### Community 14 - "Next.js Vercel Branding"
Cohesion: 0.67
Nodes (3): Next.js Wordmark Asset, Vercel Mark Asset, Next.js Bootstrap Instructions

### Community 20 - "44. MVP Tool Set"
Cohesion: 0.29
Nodes (7): 44. MVP Tool Set, Database, Network, Remote Access, Supporting ROOT/OS Apps, Unix, Web

### Community 21 - "46. Player Progression"
Cohesion: 0.33
Nodes (6): 46. Player Progression, Stage 1, Stage 2, Stage 3, Stage 4, Stage 5

### Community 22 - "47. Scenario Design Standard"
Cohesion: 0.50
Nodes (4): 1. What does the player observe?, 2. What relationship can they infer?, 3. What concrete interaction can they perform?, 47. Scenario Design Standard

### Community 23 - "canon-story.md"
Cohesion: 0.10
Nodes (19): 10. THREAD-17, 12. ROOT/OS as a Narrative Device, 14. Optional Evidence, 15. The Case Board, 16. Moral Ambiguity, 18. Nodeline's Role in the Final Act, 19. Final Narrative Question, 1. Story Purpose (+11 more)

### Community 24 - "23. Story Rules"
Cohesion: 0.25
Nodes (8): 23.1 No Cartoon Villains, 23.2 No Omniscient Hacker Fantasy, 23.3 Technical Events Must Matter, 23.4 Normality Creates Tension, 23.5 Evidence Before Revelation, 23.6 Not Everything Is Connected, 23.7 The Player Is Not the Center of the Universe, 23. Story Rules

### Community 25 - "6. ACT I — NOISE"
Cohesion: 0.25
Nodes (8): 6. ACT I — NOISE, Concepts, Example Operations, Player Role, Purpose, Story Layer, Theme, Tone

### Community 26 - "7. ACT II — PATTERN"
Cohesion: 0.25
Nodes (8): 7. ACT II — PATTERN, Concepts, Example Operations, Key Narrative Principle, Player Role, Purpose, Story Layer, Theme

### Community 27 - "11. ACT IV — GHOSTS"
Cohesion: 0.29
Nodes (7): 11. ACT IV — GHOSTS, Concepts, Example Operations, Player Role, Purpose, Story Layer, Theme

### Community 28 - "8. ACT III — ACCESS"
Cohesion: 0.29
Nodes (7): 8. ACT III — ACCESS, Concepts, Example Operations, Player Role, Purpose, Story Layer, Theme

### Community 29 - "17. ACT V — ROOT"
Cohesion: 0.33
Nodes (6): 17. ACT V — ROOT, Player Role, Possible Operations, Purpose, Story Layer, Theme

### Community 30 - "20. Meaning of the Title"
Cohesion: 0.33
Nodes (6): 20. Meaning of the Title, Personal Meaning, Root Access, Root Cause, Root of the Incident, Root of Trust

### Community 31 - "13. Canonical Recurring Characters"
Cohesion: 0.40
Nodes (5): 13. Canonical Recurring Characters, Daniel Kade — Senior Red Operator, Elias Ward — Founder of Nodeline Security, Lena Ortiz — SOC Lead, Mara Voss — Director of Operations

### Community 32 - "Delivered vertical slices"
Cohesion: 0.09
Nodes (21): 10. Act 0 orientation and Act I network/service missions, 1. Structured tool intents and terminal context, 2. Declarative Glasshouse application route, 3. Unix investigation commands, 4. Prompted SSH and PostgreSQL authentication, 5. Scenario content and migrations, 6. First-class credentials and Credentials application, 7. Legacy generic attack shortcuts retired (+13 more)

### Community 34 - "blue/page.tsx"
Cohesion: 0.14
Nodes (24): alertEndpoints(), AlertQueue(), Authentication(), Dashboard(), DISMISS_REASONS(), eventAuthMethod(), eventSucceeded(), Evidence() (+16 more)

### Community 35 - "AUDIO_DESIGN.md"
Cohesion: 0.06
Nodes (34): 10. Network Map, 11. Browser Audio, 12. Mail Application, 13. Files Application, 14. Database Audio, 15. Packet Viewer, 17. Blue Team Audio, 18. Red Team Audio (+26 more)

### Community 36 - "92. Canonical Taxonomy"
Cohesion: 0.25
Nodes (8): 92. Canonical Taxonomy, Artifact, Engagement, Evidence, Exercise, Finding, Incident, Task

### Community 37 - "109. Canonical Page Copy"
Cohesion: 0.33
Nodes (6): 109. Canonical Page Copy, After-Action Review, Employee Portal, Engagement Workspace, Operations Desk, Security Operations Center

### Community 41 - "career/page.tsx"
Cohesion: 0.09
Nodes (23): CareerPage(), completeExercise(), proficiencyLabel, geistMono, geistSans, metadata, engagementId(), Home() (+15 more)

### Community 42 - "Operation Glasshouse — Discovery Graph"
Cohesion: 0.29
Nodes (6): Application chain, Backup-trust chain, Operation Glasshouse — Discovery Graph, PostgreSQL and objective, Public boundary, Semantic event graph

### Community 43 - "16. SIEM / Log Viewer"
Cohesion: 0.33
Nodes (6): 16. SIEM / Log Viewer, Critical, High Severity, Informational, Low Severity, Medium Severity

### Community 44 - "40. Audio Production Priority"
Cohesion: 0.33
Nodes (6): 40. Audio Production Priority, Phase 1 — Core Interaction, Phase 2 — Gameplay Systems, Phase 3 — Environmental Audio, Phase 4 — Music, Phase 5 — Narrative Audio

### Community 45 - "6. Desktop UI Audio"
Cohesion: 0.33
Nodes (6): 6. Desktop UI Audio, Application Launch, Maximize, Minimize, Window Close, Window Open

### Community 46 - "8. Authentication Audio"
Cohesion: 0.40
Nodes (5): 8. Authentication Audio, Authentication Request, Failed Authentication, Privilege Change, Successful Authentication

### Community 47 - "23. Post-Operation Reconstruction"
Cohesion: 0.50
Nodes (4): 23. Post-Operation Reconstruction, Blue View, Full Truth, Red View

### Community 48 - "3. Core Audio Principles"
Cohesion: 0.50
Nodes (4): 3. Core Audio Principles, Consistency, Functional Before Cinematic, Low Audio Density

### Community 49 - "7. Terminal Audio"
Cohesion: 0.67
Nodes (3): 7. Terminal Audio, Command Execution, Typing

### Community 51 - "tools.ts"
Cohesion: 0.08
Nodes (34): BLUE_RESPONSE_ACTIONS, handlers, result(), unavailable(), argsOf(), AuthenticationIntent, commandOf(), createToolAdapterRegistry() (+26 more)

### Community 52 - "red/page.tsx"
Cohesion: 0.13
Nodes (16): MissionPanel(), NetworkMap(), apps, Credential, navItems, RedTeamPage(), Line, Props (+8 more)

### Community 53 - "inspector.tsx"
Cohesion: 0.19
Nodes (8): HostInspector(), Inspector(), ProcessInspector(), relatedAlerts(), RespondFn, Hosts(), hostNeedsAttention(), processRisk()

### Community 55 - "BlueTeamPage"
Cohesion: 0.22
Nodes (7): BlueTeamPage(), onNavigate(), onSelect(), highestSeverityColor(), selectionToken(), useReadState(), alertEventForSeverity()

## Knowledge Gaps
- **488 isolated node(s):** `RespondFn`, `RespondFn`, `ModuleProps`, `FindingState`, `NAV` (+483 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 549 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SimulationEngine` connect `SimulationEngine` to `tools.ts`, `engine.ts`, `index.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `TerminalState` connect `SimulationEngine` to `tools.ts`, `engine.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `ScenarioDefinition` connect `index.ts` to `engine.ts`, `SimulationEngine`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `RespondFn`, `RespondFn`, `ModuleProps` to the rest of the system?**
  _488 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `root-chrome.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._