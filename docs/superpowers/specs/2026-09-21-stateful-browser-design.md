# Stateful Browser and Application Session Design

## Intent

Finish ROOT's Milestone 4 player experience by turning the existing Browser from a raw `curl` wrapper into a first-class view of the same authoritative HTTP simulation used by Terminal. A player must be able to inspect a page, follow declared links, submit declared forms, see scoped cookie sessions, and continue an application-to-database path without source-code knowledge or a second, simplified game model.

## Scope

This slice extends the existing engine, command API, Browser, scenario view, and declarative HTTP route definitions. It does not add general-purpose HTML execution, JavaScript, arbitrary internet access, a second HTTP backend, or a database GUI.

The New Server is the canonical cookie-session proving ground. Glasshouse remains the canonical application-to-database proving ground and must retain terminal/browser telemetry parity.

## Authoritative HTTP Result

`SimulationEngine` remains the only authority for reachability, routes, authentication, sessions, discoveries, events, and consequences. Successful and application-level failed HTTP requests return an optional structured `httpResponse` alongside the existing terminal output:

- requested URL and method;
- numeric status and reason phrase;
- ordered response headers;
- response body;
- the active simulated cookie session for the target host, if one exists.

Terminal continues rendering the existing textual output. Browser renders the structured result. Both consumers therefore produce exactly the same events and state transitions.

## Safe Page Interaction

Scenario responses may contain a deliberately tiny HTML subset: anchors, forms, inputs, selects, options, and buttons. Browser extracts only those declared controls and renders them as ROOT/OS controls. It never injects response HTML into the DOM.

Relative actions and links resolve against the current simulated host. Form submission uses URL-encoded fields and returns through the same command endpoint and engine path as Terminal `curl`.

The New Server landing response will visibly advertise `/login` and `/account` and provide a commissioning login form. This makes its cookie route discoverable rather than requiring a guessed path.

## Shared Red State

Browser consumes the active terminal session as its request source. After each request it propagates:

- new interactive sessions created by a web worker;
- context and working-directory changes returned by the engine;
- newly discovered hosts;
- a refresh of credentials, facts, objectives, and visible cookie sessions.

Cookie sessions remain distinct from shell/database sessions and never switch the active terminal host merely because a login succeeded.

## Cookie Session Visibility and Invalidation

The Red scenario view exposes actor-owned simulated HTTP sessions as host, username, cookie name, and creation time. Browser shows them in a compact cookie/session pane.

Blue password reset or account disable closes matching shell sessions, invalidates matching credentials, and removes matching HTTP sessions. A subsequent protected request returns `401`, and the Red view no longer lists that cookie.

## Visual Design

The Browser remains a dense legacy enterprise client:

- palette: desktop `#1E2226`, panel `#202427`, input `#181B1E`, selection `#3E5870`, text `#D6D9DB`, error `#C87E7E`;
- typography: existing ROOT/OS sans for chrome, existing mono for protocol details;
- square borders, compact 4–8px spacing, no cards, pills, gradients, glow, or decorative motion;
- layout: navigation toolbar, address/form workspace, document pane, narrow session inspector, bottom status line;
- keyboard-visible native controls and text labels ensure status is never color-only.

## Verification

The slice is complete when:

1. Engine tests prove structured status/header/body/session output for unauthenticated, failed-login, successful-login, and authenticated requests.
2. Parser tests prove safe extraction and relative resolution of links and forms.
3. The New Server path visibly discovers and submits login controls, persists its cookie, reaches `/account`, and loses access after Blue invalidates the identity.
4. Browser-created web-worker sessions propagate to the shared Terminal state.
5. Glasshouse still completes its application-to-database route with the same telemetry.
6. The production build passes and the existing unrelated First Shift initialization assertion is either corrected or explicitly isolated with evidence.

