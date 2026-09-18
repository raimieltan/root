# Graph Report - root  (2026-09-18)

## Corpus Check
- 75 files · ~586,294 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 670 nodes · 1159 edges · 44 communities (36 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `765b3676`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- red/page.tsx
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
- root-os.tsx
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
- career/page.tsx
- root-chrome.tsx
- replay-client.tsx
- 92. Canonical Taxonomy
- 109. Canonical Page Copy
- 66. Page Mapping
- 6. Canonical Application Names
- Broken Unstyled Career Page Screenshot
- readRuns
- Operation Glasshouse — Discovery Graph
- layout.tsx

## God Nodes (most connected - your core abstractions)
1. `SimulationEngine` - 41 edges
2. `TerminalState` - 26 edges
3. `getDefinitionForScenario()` - 16 edges
4. `compilerOptions` - 16 edges
5. `ScenarioDefinition` - 15 edges
6. `prisma` - 12 edges
7. `readRuns()` - 10 edges
8. `businessAvailability()` - 10 edges
9. `parseMetadata()` - 10 edges
10. `getScenarioView()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Wordmark Asset` --conceptually_related_to--> `Next.js Bootstrap Instructions`  [INFERRED]
  public/next.svg → README.md
- `Vercel Mark Asset` --conceptually_related_to--> `Next.js Bootstrap Instructions`  [INFERRED]
  public/vercel.svg → README.md
- `POST()` --calls--> `advanceBlueScenario()`  [EXTRACTED]
  app/api/sim/blue/advance/route.ts → lib/simulation/blue.ts
- `POST()` --calls--> `respondToAttack()`  [EXTRACTED]
  app/api/sim/blue/respond/route.ts → lib/simulation/blue.ts
- `POST()` --calls--> `SimulationEngine`  [EXTRACTED]
  app/api/sim/command/route.ts → lib/simulation/engine.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared Simulation Model** — docs_root_canonical_plan_shared_simulation, docs_root_canonical_plan_everything_leaves_evidence, docs_root_canonical_plan_post_operation_reconstruction [EXTRACTED 1.00]

## Communities (44 total, 6 thin omitted)

### Community 0 - "red/page.tsx"
Cohesion: 0.14
Nodes (13): MissionPanel(), NetworkMap(), apps, Credential, navItems, RedTeamPage(), Line, Props (+5 more)

### Community 1 - "devDependencies"
Cohesion: 0.05
Nodes (41): concurrently, eslint, eslint-config-next, devDependencies, concurrently, eslint, eslint-config-next, @playwright/test (+33 more)

### Community 2 - "dependencies"
Cohesion: 0.06
Nodes (31): dotenv, lucide-react, next, dependencies, dotenv, lucide-react, next, pg (+23 more)

### Community 3 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "engine.ts"
Cohesion: 0.08
Nodes (45): POST(), POST(), POST(), POST(), GET(), GET(), globalForPrisma, prisma (+37 more)

### Community 5 - "SimulationEngine"
Cohesion: 0.27
Nodes (5): SimulationEngine, reachable(), parseTerminalInput(), CommandResult, TerminalState

### Community 6 - "index.ts"
Cohesion: 0.16
Nodes (25): commonDetections, discover(), external, file(), host(), identity(), link(), Machine (+17 more)

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

### Community 11 - "root-os.tsx"
Cohesion: 0.17
Nodes (6): engagementId(), Home(), RootPane(), RootTable(), RootTabs(), RootTree()

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
Cohesion: 0.11
Nodes (17): 1. Structured tool intents and terminal context, 2. Declarative Glasshouse application route, 3. Unix investigation commands, 4. Prompted SSH and PostgreSQL authentication, 5. Scenario content and migrations, 6. First-class credentials and Credentials application, 7. Legacy generic attack shortcuts retired, Deliberately still present (+9 more)

### Community 33 - "career/page.tsx"
Cohesion: 0.33
Nodes (10): CareerPage(), completeExercise(), proficiencyLabel, campaignProgress(), LocalRun, readTraining(), saveTraining(), TrainingModule (+2 more)

### Community 34 - "root-chrome.tsx"
Cohesion: 0.16
Nodes (8): BlueTeamPage(), formatWindow(), appInfo, RootChrome(), Section, shortcuts, Tone, RootWindow()

### Community 35 - "replay-client.tsx"
Cohesion: 0.22
Nodes (13): emptySnapshot, ReplayPayload, KeyDecision, ReplayEvent, ReplayLens, ReplayScenario, ReplaySnapshot, ReplaySummary (+5 more)

### Community 36 - "92. Canonical Taxonomy"
Cohesion: 0.25
Nodes (8): 92. Canonical Taxonomy, Artifact, Engagement, Evidence, Exercise, Finding, Incident, Task

### Community 37 - "109. Canonical Page Copy"
Cohesion: 0.33
Nodes (6): 109. Canonical Page Copy, After-Action Review, Employee Portal, Engagement Workspace, Operations Desk, Security Operations Center

### Community 41 - "readRuns"
Cohesion: 0.33
Nodes (6): ReplayPageProps, formatElapsed(), ReplayClient(), useOperation(), readRuns(), saveRun()

### Community 42 - "Operation Glasshouse — Discovery Graph"
Cohesion: 0.29
Nodes (6): Application chain, Backup-trust chain, Operation Glasshouse — Discovery Graph, PostgreSQL and objective, Public boundary, Semantic event graph

### Community 43 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **386 isolated node(s):** `proficiencyLabel`, `geistSans`, `geistMono`, `metadata`, `apps` (+381 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 420 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SimulationEngine` connect `SimulationEngine` to `engine.ts`, `index.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `proficiencyLabel`, `geistSans`, `geistMono` to the rest of the system?**
  _386 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `red/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._