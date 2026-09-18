# Graph Report - root  (2026-09-18)

## Corpus Check
- 59 files · ~611,861 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 333 nodes · 696 edges · 19 communities (14 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ad580217`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- career/page.tsx
- devDependencies
- dependencies
- TypeScript Configuration
- campaign.test.ts
- SimulationEngine
- index.ts
- Event Driven Design Docs
- replay-client.tsx
- Visual Design System
- App Layout Fonts
- Glasshouse Reconstruction
- Generic UI Icons
- Next.js Vercel Branding
- ESLint Configuration
- Next.js Configuration
- PostCSS Configuration

## God Nodes (most connected - your core abstractions)
1. `SimulationEngine` - 34 edges
2. `TerminalState` - 20 edges
3. `getDefinitionForScenario()` - 16 edges
4. `compilerOptions` - 16 edges
5. `prisma` - 11 edges
6. `ScenarioDefinition` - 11 edges
7. `readRuns()` - 10 edges
8. `businessAvailability()` - 10 edges
9. `parseMetadata()` - 10 edges
10. `summarizeReplay()` - 9 edges

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
- **ROOT Operational UI Reference Set** — docs_ui_chatgpt_image_sep_18_2026_12_05_06_am_1_red_operations_workspace, docs_ui_chatgpt_image_sep_18_2026_12_05_09_am_4_blue_soc_workspace, docs_ui_chatgpt_image_sep_18_2026_12_05_10_am_5_reconstruction_workspace [INFERRED 0.95]

## Communities (19 total, 3 thin omitted)

### Community 0 - "career/page.tsx"
Cohesion: 0.09
Nodes (32): BlueTeamPage(), formatWindow(), CareerPage(), completeExercise(), proficiencyLabel, Home(), MissionPanel(), NetworkMap() (+24 more)

### Community 1 - "devDependencies"
Cohesion: 0.06
Nodes (31): concurrently, eslint, eslint-config-next, devDependencies, concurrently, eslint, eslint-config-next, @playwright/test (+23 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (41): dotenv, lucide-react, next, dependencies, dotenv, lucide-react, next, pg (+33 more)

### Community 3 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "campaign.test.ts"
Cohesion: 0.10
Nodes (32): POST(), POST(), POST(), POST(), GET(), globalForPrisma, prisma, businessAvailability() (+24 more)

### Community 5 - "SimulationEngine"
Cohesion: 0.28
Nodes (5): SimulationEngine, reachable(), CommandResult, SimulationEvent, TerminalState

### Community 6 - "index.ts"
Cohesion: 0.18
Nodes (18): commonDetections, discover(), external, file(), host(), identity(), link(), Machine (+10 more)

### Community 7 - "Event Driven Design Docs"
Cohesion: 0.18
Nodes (12): Repository Agent Rules, Canonical Plan Precedence, Graphify-First Codebase Navigation, Claude Agent Rules Reference, Local PostgreSQL Service, Action to Replay Pipeline, Everything Leaves Evidence, Shared Authoritative Simulation (+4 more)

### Community 9 - "replay-client.tsx"
Cohesion: 0.12
Nodes (25): GET(), ReplayPageProps, emptySnapshot, formatElapsed(), ReplayClient(), ReplayPayload, attackPathFromEvents(), identifyRoute() (+17 more)

### Community 10 - "Visual Design System"
Cohesion: 0.33
Nodes (6): Boot and Authentication Workspace Mockup, Career and Operations Portal Mockup, Dense Operational Layout, Restrained Enterprise Workstation Aesthetic, Semantic Operational Color System, Broken Unstyled Career Page Screenshot

### Community 11 - "App Layout Fonts"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 12 - "Glasshouse Reconstruction"
Cohesion: 0.40
Nodes (5): Knowledge Is Power, Operation Glasshouse, Red Blue Truth Reconstruction, Red Operations Workspace Mockup, Post-Operation Reconstruction Mockup

### Community 13 - "Generic UI Icons"
Cohesion: 0.67
Nodes (3): File Icon Asset, Globe Icon Asset, Window Icon Asset

### Community 14 - "Next.js Vercel Branding"
Cohesion: 0.67
Nodes (3): Next.js Wordmark Asset, Vercel Mark Asset, Next.js Bootstrap Instructions

## Knowledge Gaps
- **112 isolated node(s):** `proficiencyLabel`, `geistSans`, `geistMono`, `metadata`, `apps` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 131 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SimulationEngine` connect `SimulationEngine` to `campaign.test.ts`, `index.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `proficiencyLabel`, `geistSans`, `geistMono` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `career/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08603145235892692 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._