# Graph Report - root  (2026-09-18)

## Corpus Check
- 40 files · ~354,246 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 270 nodes · 417 edges · 19 communities (15 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54d35c4a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Gameplay UI Screens
- Build Toolchain Dependencies
- Runtime App Dependencies
- TypeScript Configuration
- Simulation API Domain
- Terminal Simulation Engine
- Detection Replay API
- Event Driven Design Docs
- Package Scripts
- Scenario Initialization
- Visual Design System
- App Layout Fonts
- Glasshouse Reconstruction
- Generic UI Icons
- Next.js Vercel Branding
- ESLint Configuration
- Next.js Configuration
- PostCSS Configuration

## God Nodes (most connected - your core abstractions)
1. `SimulationEngine` - 27 edges
2. `TerminalState` - 18 edges
3. `compilerOptions` - 16 edges
4. `prisma` - 7 edges
5. `include` - 7 edges
6. `parseMetadata()` - 6 edges
7. `getScenarioView()` - 6 edges
8. `scripts` - 6 edges
9. `ReplayClient()` - 5 edges
10. `RootChrome()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Wordmark Asset` --conceptually_related_to--> `Next.js Bootstrap Instructions`  [INFERRED]
  public/next.svg → README.md
- `Vercel Mark Asset` --conceptually_related_to--> `Next.js Bootstrap Instructions`  [INFERRED]
  public/vercel.svg → README.md
- `POST()` --calls--> `SimulationEngine`  [EXTRACTED]
  app/api/sim/command/route.ts → lib/simulation/engine.ts
- `GET()` --calls--> `getScenarioView()`  [EXTRACTED]
  app/api/sim/state/route.ts → lib/simulation/state.ts
- `Career and Operations Portal Mockup` --implements--> `Dense Operational Layout`  [INFERRED]
  docs/ui/ChatGPT Image Sep 18, 2026, 12_05_09 AM (3).png → docs/ui/VISUAL_STYLES.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared Simulation Model** — docs_root_canonical_plan_shared_simulation, docs_root_canonical_plan_everything_leaves_evidence, docs_root_canonical_plan_post_operation_reconstruction [EXTRACTED 1.00]
- **ROOT Operational UI Reference Set** — docs_ui_chatgpt_image_sep_18_2026_12_05_06_am_1_red_operations_workspace, docs_ui_chatgpt_image_sep_18_2026_12_05_09_am_4_blue_soc_workspace, docs_ui_chatgpt_image_sep_18_2026_12_05_10_am_5_reconstruction_workspace [INFERRED 0.95]

## Communities (19 total, 3 thin omitted)

### Community 0 - "Gameplay UI Screens"
Cohesion: 0.09
Nodes (18): BlueTeamPage(), proficiency, MissionPanel(), stages, suggestions, NetworkMap(), apps, Line (+10 more)

### Community 1 - "Build Toolchain Dependencies"
Cohesion: 0.06
Nodes (31): concurrently, eslint, eslint-config-next, devDependencies, concurrently, eslint, eslint-config-next, @playwright/test (+23 more)

### Community 2 - "Runtime App Dependencies"
Cohesion: 0.06
Nodes (31): dotenv, lucide-react, next, dependencies, dotenv, lucide-react, next, pg (+23 more)

### Community 3 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "Simulation API Domain"
Cohesion: 0.10
Nodes (17): POST(), POST(), POST(), POST(), globalForPrisma, prisma, advanceBlueScenario(), aiCommands (+9 more)

### Community 5 - "Terminal Simulation Engine"
Cohesion: 0.30
Nodes (4): SimulationEngine, CommandResult, SimulationEvent, TerminalState

### Community 6 - "Detection Replay API"
Cohesion: 0.24
Nodes (11): GET(), alertsFromEvents(), AlertView, detectionForAction(), DetectionRule, detectionRules, EventLike, parseMetadata() (+3 more)

### Community 7 - "Event Driven Design Docs"
Cohesion: 0.18
Nodes (12): Repository Agent Rules, Canonical Plan Precedence, Graphify-First Codebase Navigation, Claude Agent Rules Reference, Local PostgreSQL Service, Action to Replay Pipeline, Everything Leaves Evidence, Shared Authoritative Simulation (+4 more)

### Community 8 - "Package Scripts"
Cohesion: 0.18
Nodes (10): name, packageManager, private, scripts, build, dev, lint, start (+2 more)

### Community 9 - "Scenario Initialization"
Cohesion: 0.15
Nodes (20): GET(), ReplayPageProps, emptySnapshot, formatElapsed(), ReplayClient(), ReplayPayload, KeyDecision, normalizeReplayEvent() (+12 more)

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
- **111 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `proficiency`, `stages` (+106 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 129 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime App Dependencies` to `Package Scripts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Build Toolchain Dependencies` to `Package Scripts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `detectionForAction()` connect `Detection Replay API` to `Scenario Initialization`, `Simulation API Domain`, `Terminal Simulation Engine`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _111 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Gameplay UI Screens` be split into smaller, more focused modules?**
  _Cohesion score 0.09475806451612903 - nodes in this community are weakly interconnected._
- **Should `Build Toolchain Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Runtime App Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._