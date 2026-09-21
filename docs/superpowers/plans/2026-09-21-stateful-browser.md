# Stateful Browser and Application Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Browser a first-class, stateful client of ROOT's authoritative HTTP simulation and prove a discoverable authenticated application flow.

**Architecture:** Add structured HTTP metadata to `CommandResult`, derive it inside `SimulationEngine`, expose actor-owned HTTP sessions in `ScenarioView`, and render only a safe declarative subset in Browser. Terminal and Browser continue sharing `/api/sim/command`, ensuring one rules engine and one telemetry stream.

**Tech Stack:** TypeScript, React Client Components, Next.js App Router route handlers, Prisma, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-21-stateful-browser-design.md`

## Global Constraints

- No arbitrary HTML injection or script execution.
- Browser and Terminal must use the same simulation engine and command route.
- Cookie sessions stay distinct from shell/database sessions.
- Preserve ROOT/OS's compact legacy enterprise visual language.
- Follow the user's explicit implement-first, verify-last workflow for this slice.

## Review Focus

- Relative links/forms must remain scoped to the current simulated host.
- Failed authentication must not mint or display a cookie session.
- Browser login must not switch the active shell session.
- Web-worker responses that do create shell sessions must update shared Red state.
- Blue invalidation must remove cookie access as well as terminal credentials/sessions.

---

### Task 1: Structured HTTP protocol result

**Files:**
- Modify: `lib/simulation/types.ts`
- Modify: `lib/simulation/engine.ts`
- Test: `lib/simulation/the-new-server.acceptance.test.ts`

**Interfaces:**
- Produces: `SimulatedHttpResponse`, `SimulatedHttpSession`, and `CommandResult.httpResponse`.
- Consumes: existing `CurlIntent`, `HttpSession`, and engine route behavior.

- [ ] Add the structured response/session types.
- [ ] Parse status, headers, and body from existing route output without changing terminal text.
- [ ] Attach the target's active actor-owned HTTP session after each resolved HTTP response.
- [ ] Cover unauthorized, invalid-login, login, authenticated, and web-worker results.

### Task 2: Discoverable declarative page controls

**Files:**
- Create: `app/red/browser-document.ts`
- Modify: `lib/simulation/scenarios/the-new-server.ts`
- Modify: `lib/simulation/scenarios/validate.ts`
- Test: `app/red/browser-document.test.ts`

**Interfaces:**
- Produces: `parseBrowserDocument(body, currentUrl)` returning safe links and forms.
- Consumes: structured HTTP body and the scenario's bounded HTML subset.

- [ ] Implement safe anchor/form/input/select extraction and relative URL resolution.
- [ ] Reject cross-host and unsupported schemes during resolution.
- [ ] Publish the New Server login/account controls on its landing response.
- [ ] Extend validation so declared login routes have fields and discoverable public controls.

### Task 3: Shared state and cookie-session lifecycle

**Files:**
- Modify: `lib/simulation/state.ts`
- Modify: `app/sim-types.ts`
- Modify: `lib/simulation/blue.ts`
- Test: `lib/simulation/the-new-server.acceptance.test.ts`

**Interfaces:**
- Produces: `ScenarioView.httpSessions` and Blue identity invalidation of matching HTTP sessions.
- Consumes: existing actor, user, machine, and response-action models.

- [ ] Include actor-owned HTTP sessions in scenario state.
- [ ] Remove matching sessions on password reset/account disable.
- [ ] Verify invalidation removes the view entry and makes `/account` unauthorized.

### Task 4: ROOT/OS Browser client

**Files:**
- Modify: `app/red/browser.tsx`
- Modify: `app/red/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/browser/campaign.spec.ts`

**Interfaces:**
- Consumes: `CommandResult.httpResponse`, `parseBrowserDocument`, `ScenarioView.httpSessions`, shared `TerminalState` setter.
- Produces: safe link/form navigation, session inspector, and shared state propagation.

- [ ] Refactor request submission behind one `open(target, method, data)` path.
- [ ] Render status/header/body panes, safe controls, and visible cookie sessions.
- [ ] Propagate new sessions, context, path, discoveries, and refresh callbacks exactly as Terminal does.
- [ ] Add keyboard labels, busy/error states, and compact responsive styling.

### Task 5: Regression closure and roadmap sync

**Files:**
- Modify: `lib/simulation/first-shift.acceptance.test.ts` or initialization code only if root cause proves product behavior is wrong.
- Modify: `docs/REALISTIC_INTERACTION_PROGRESS.md`
- Modify: `graphify-out/*`

**Interfaces:**
- Consumes: completed Browser and HTTP behavior.
- Produces: a green focused suite/build and an accurate progress checkpoint.

- [ ] Diagnose the First Shift `INTERNET`/`OPS-01` mismatch without weakening the assertion.
- [ ] Run focused engine, browser parser, campaign, and Playwright tests.
- [ ] Run TypeScript, production build, `git diff --check`, and `graphify update .`.
- [ ] Record Slice 13 completion and Slice 14 delivery accurately in the progress checkpoint.

