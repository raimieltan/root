<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ROOT canonical plan

At the beginning of every task in this repository, read
`docs/ROOT_CANONICAL_PLAN.md` before planning, reviewing, or changing code.

Treat that document as the authoritative product, simulation, architecture,
UX, and roadmap reference for ROOT. Keep implementation decisions aligned with
it, and check the relevant sections again whenever a task changes scope. If a
user explicitly requests a deviation, follow the request and call out the
deviation rather than silently changing the product direction.

`docs/ROOT-POC.md` is historical POC guidance. Where it differs from the
canonical plan, `docs/ROOT_CANONICAL_PLAN.md` wins.

# ROOT canonical story

Before writing or reviewing mission/campaign content (operations, briefs,
narrative beats, characters, evidence, Case Board entries), read
`docs/story/canon-story.md`. Treat it as the authoritative narrative
reference — tone, recurring characters, THREAD-17, the Halloway vendor
thread, and act-by-act story beats. Keep new missions' story content aligned
with it. If the user explicitly requests a deviation, follow the request and
call out the deviation rather than silently changing the story direction.

# ROOT visual styles

Before planning, reviewing, or implementing any UI edit, read
`docs/ui/VISUAL_STYLES.md` in addition to the canonical plan. This includes
changes to layouts, components, styling, typography, color, icons, motion,
responsive behavior, accessibility, and visual assets.

Treat `docs/ui/VISUAL_STYLES.md` as the authoritative production design
reference for ROOT/OS and its Red Team, Blue Team, Career Hub, mission, replay,
login/boot, and internal client interfaces. Keep UI decisions aligned with its
visual principles and canonical visual test. If the user explicitly requests a
deviation, follow the request and call out the deviation rather than silently
changing ROOT's visual direction.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).


## Skills

For any UI, UX, layout, styling, responsive, accessibility, or visual design task, read and follow:

/skills/frontend-design/SKILL.md

Use it before planning, reviewing, or implementing frontend changes. Keep decisions aligned with the skill and the project's existing visual rules. If the user explicitly requests a deviation, follow the request.