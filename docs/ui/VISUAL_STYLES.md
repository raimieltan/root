# ROOT — Visual Styles Guide

> Canonical visual direction for ROOT / ROOT/OS  
> Status: Production Design Reference  
> Applies to: ROOT/OS, Red Team, Blue Team, Career Hub, Mission UI, Replay, Login/Boot, Internal Client Applications

---

# 1. Visual Identity

ROOT should look like:

> **Mr. Robot meets neglected enterprise software meets a UNIX workstation meets a late-night SOC.**

The interface must feel like software built for security operators rather than a game pretending to be hacker software.

ROOT is **not** neon cyberpunk.

ROOT should feel:

- corporate
- technical
- restrained
- slightly dated
- dense
- cold
- believable
- operational
- monitored
- secure
- occasionally unsettling

The player should feel like they are using an internal security workstation at 03:00 in a quiet office.

---

# 2. Core Visual Principle

ROOT should always look **10% more boring than expected**.

That is intentional.

The normal interface should look stable, professional, and utilitarian.

This makes abnormal events more powerful:

- a compromised host
- an unknown session
- a new privileged process
- a corrupted file
- an impossible authentication
- a ROOT/OS system anomaly
- a campaign-level security event

The game becomes unsettling because the normal environment feels believable.

---

# 3. Visual Composition Formula

Use the following rough balance:

```text
50%  Enterprise security software
30%  UNIX / terminal culture
15%  Surveillance / intelligence workstation
 5%  Analog imperfection / glitch
```

Do not reverse this balance.

ROOT should not become a glitch-art interface with security terminology layered on top.

---

# 4. Brand Style

## ROOT/OS

ROOT/OS is Nodeline Security's secure operations environment.

It should feel like:

- internal company software
- purpose-built security tooling
- hardened workstation software
- a platform with years of internal development history

The branding should be minimal.

Preferred branding treatment:

```text
ROOT/OS
ROOT/OS v1.4.7
NODELINE // OPS
NODELINE SECURITY
```

Avoid oversized logos inside operational screens.

The user is working, not viewing a marketing site.

---

# 5. Primary Color System

## 5.1 Foundation

```css
--root-bg-0: #06090A;
--root-bg-1: #090D0F;
--root-bg-2: #0D1316;
--root-bg-3: #12191D;

--root-panel: #0A1013;
--root-panel-raised: #0D1519;

--root-border-soft: #1A2A31;
--root-border: #23404B;
--root-border-strong: #315767;
```

The interface should never use pure black everywhere.

Subtle differences between dark surfaces create hierarchy without modern cards or shadows.

---

## 5.2 Text

```css
--root-text-primary: #D7E0E4;
--root-text-secondary: #93A7B0;
--root-text-muted: #657A84;
--root-text-disabled: #3E5058;

--root-text-terminal: #C9D5D8;
```

Avoid pure white except for very small/high-emphasis elements.

---

## 5.3 Operational Blue

Blue-gray is ROOT's main corporate UI accent.

```css
--root-blue-100: #A6D5EB;
--root-blue-300: #6DB7DA;
--root-blue-500: #3D8FB8;
--root-blue-700: #245B76;
--root-blue-muted: #294954;
```

Use for:

- active navigation
- selected panels
- links
- neutral information
- infrastructure
- interface focus
- Blue Team identity

---

## 5.4 Phosphor Green

Green represents healthy, valid, successful, or active states.

```css
--root-green-100: #A6F7C0;
--root-green-300: #70E795;
--root-green-500: #36CF68;
--root-green-700: #1A7F3B;
```

Use for:

- successful commands
- healthy systems
- active sessions
- valid authentication
- secure status
- completed objectives
- Full Truth replay selection

Do not use green as generic decoration.

---

## 5.5 Amber

Amber represents uncertainty, investigation, degradation, or caution.

```css
--root-amber-100: #F6D98A;
--root-amber-300: #E9B94F;
--root-amber-500: #CC8F25;
--root-amber-700: #7D5619;
```

Use for:

- suspicious activity
- investigation
- medium severity
- degraded service
- warnings
- incomplete knowledge

---

## 5.6 Red

Red is reserved for confirmed danger.

```css
--root-red-100: #FFB0B0;
--root-red-300: #F06B6B;
--root-red-500: #D74848;
--root-red-700: #7D2525;
```

Use for:

- compromised systems
- critical alerts
- blocked/denied security events
- Red Team identity
- confirmed hostile activity
- failed containment
- severe business impact

Do not use red for harmless validation errors unless necessary.

---

# 6. Team Color Language

ROOT has strong Red/Blue asymmetry.

## Red Team

Primary identity:

```css
--team-red: #D74848;
--team-red-soft: #7D2525;
```

Do not make the entire Red interface red.

Red should identify:

- team
- attack events
- offensive objectives
- hostile traces
- Red View replay mode

## Blue Team

Primary identity:

```css
--team-blue: #3D8FB8;
--team-blue-soft: #245B76;
```

Used for:

- SOC navigation
- investigations
- defensive context
- Blue View replay mode

## Full Truth

```css
--truth-green: #36CF68;
```

Used exclusively for reconstruction/full-truth states.

---

# 7. Typography

ROOT should use two distinct typography roles.

## 7.1 Monospace

Use for:

- terminal
- logs
- alerts
- timestamps
- hostnames
- IP addresses
- process information
- credentials
- technical labels
- tables
- command output

Recommended:

- IBM Plex Mono
- JetBrains Mono
- Geist Mono
- Berkeley Mono-like typefaces where licensing permits

Default:

```css
font-family: "IBM Plex Mono", "JetBrains Mono", monospace;
```

---

## 7.2 Sans Serif

Use for:

- mission narratives
- corporate messages
- long-form reports
- internal email
- onboarding
- story documents
- help content

Recommended:

- IBM Plex Sans
- Inter
- Geist Sans

---

# 8. Type Scale

ROOT should use compact typography.

```css
--text-2xs: 10px;
--text-xs: 11px;
--text-sm: 12px;
--text-md: 13px;
--text-lg: 15px;
--text-xl: 18px;
--text-2xl: 22px;
--text-display: 28px;
```

Most operational UI should sit between 11px and 14px.

Large typography should be uncommon.

This is workstation software, not a marketing landing page.

---

# 9. Text Treatments

## Primary panel title

```text
NETWORK MAP  //  MERIDIAN DYNAMICS
```

Style:

- uppercase
- monospace
- 12–13px
- medium weight
- muted blue-gray

## System metadata

```text
UTC  2026-09-18  03:14:22
```

Style:

- 10–11px
- monospace
- secondary text

## Critical status

```text
COMPROMISED
```

Style:

- uppercase
- red
- small border
- no giant banner

---

# 10. Layout Philosophy

ROOT interfaces should feel dense but organized.

Use:

- columns
- split panes
- tables
- tab bars
- narrow headers
- toolbars
- status bars

Avoid:

- floating cards
- giant empty areas
- large rounded containers
- oversized modern dashboard metrics

ROOT should resemble a workstation.

---

# 11. Grid System

Recommended base:

```text
4px base unit
```

Common spacing:

```text
4px
8px
12px
16px
20px
24px
32px
```

Operational screens should usually use:

```text
8px–12px internal spacing
12px–16px panel gaps
```

Do not over-pad tables.

---

# 12. Border Radius

Keep almost everything square.

```css
--radius-xs: 1px;
--radius-sm: 2px;
--radius-md: 4px;
```

4px should be considered large for ROOT.

Avoid pill-shaped UI except for extremely small state indicators.

---

# 13. Borders

Borders are more important than shadows.

Default:

```css
border: 1px solid var(--root-border);
```

Focused:

```css
border-color: var(--root-blue-500);
```

Critical:

```css
border-color: var(--root-red-500);
```

Healthy:

```css
border-color: var(--root-green-700);
```

---

# 14. Shadows

Use almost no traditional shadows.

Allowed:

```css
box-shadow:
  inset 0 1px rgba(255,255,255,0.02),
  0 0 12px rgba(61,143,184,0.04);
```

Avoid floating SaaS-style depth.

Hierarchy should primarily come from:

- borders
- background shifts
- labels
- spacing

---

# 15. Panels

Canonical panel anatomy:

```text
┌─ PANEL TITLE // CONTEXT ─────────────── [ + ][ × ] ┐
│                                                    │
│                                                    │
│                     CONTENT                        │
│                                                    │
│                                                    │
├────────────────────────────────────────────────────┤
│ STATUS / CONTROLS / CONTEXT                        │
└────────────────────────────────────────────────────┘
```

Panel header:

- 30–36px
- subtle dark gradient allowed
- uppercase or title-case monospace
- 1px bottom border

---

# 16. Navigation

Use persistent workstation navigation.

Preferred desktop layout:

```text
┌──────────────────────────────────────────────┐
│ ROOT/OS | NODELINE // OPS | UTC | SECURE    │
├───────┬──────────────────────────────────────┤
│       │                                      │
│ NAV   │             WORKSPACE                │
│       │                                      │
├───────┴──────────────────────────────────────┤
│ SESSION | USER | PRIVILEGE | NETWORK | OPSEC│
└──────────────────────────────────────────────┘
```

Navigation icons should be geometric and technical.

Avoid playful consumer icons.

---

# 17. Icons

Preferred style:

- outlined
- 1–1.5px stroke
- geometric
- simple
- no emoji
- minimal fills

Good icon families:

- terminals
- network nodes
- folders
- servers
- shields
- databases
- logs
- process trees
- radar
- alerts

Icons should support labels rather than replace them.

---

# 18. Status Indicators

Small circular indicators are acceptable.

```text
● healthy
● suspicious
● compromised
● offline
```

Recommended sizes:

```text
6px–8px
```

Do not turn status indicators into giant badges.

---

# 19. Buttons

Buttons should resemble enterprise software controls.

Default:

```text
[ AUTHENTICATE → ]
[ INVESTIGATE ]
[ REVOKE SESSION ]
```

Style:

- rectangular
- 1px border
- uppercase / monospace
- subtle hover
- restrained color

Primary neutral:

```css
border: var(--root-blue-500);
color: var(--root-blue-100);
```

Danger:

```css
border: var(--root-red-500);
color: var(--root-red-300);
```

No glossy gradients.

---

# 20. Inputs

Text fields should look like secure workstation inputs.

Example:

```text
OPERATOR ID
┌──────────────────────────────┐
│ deploy                       │
└──────────────────────────────┘
```

Style:

- dark fill
- clear 1px border
- blue focus
- no large radius
- monospace for technical values

---

# 21. Tables

Tables are a major ROOT UI primitive.

Use for:

- logs
- alerts
- credentials
- sessions
- processes
- services
- files
- incidents

Preferred structure:

```text
TIME       HOST     USER     EVENT         DETAILS
16:24:03   DEV-01   deploy   AUTH_SUCCESS  SSH login
```

Rows:

- 28–34px
- subtle separators
- hover highlight
- state color only where meaningful

Avoid zebra striping unless density requires it.

---

# 22. Terminal Style

The terminal is the cleanest visual area in ROOT.

Background:

```css
#050809
```

Text:

```css
#C9D5D8
```

Prompt accents:

```text
root        red
deploy      green
hostname    blue-gray
path        white
```

Example:

```text
deploy@DEV-01:~$ ps aux

USER      PID   COMMAND
root      441   /usr/bin/backup-sync
deploy    892   /bin/bash

deploy@DEV-01:~$ _
```

Rules:

- no constant glitch
- no giant ASCII banners
- minimal bloom
- subtle cursor glow allowed
- terminal output must remain readable

---

# 23. Network Map Style

The map should resemble an infrastructure engineering diagram.

Use:

- rectangular nodes
- thin orthogonal lines
- clear zones
- hostnames
- IP addresses
- service summaries

Example:

```text
INTERNET
   │
EDGE-FW
   │
 ┌─┴─────┐
WEB-01  VPN-01
   │
 DEV-01
   │
FIN-APP
   │
 FIN-DB
```

Avoid:

- holographic spheres
- 3D flying nodes
- neon webs
- excessive particle effects

---

# 24. Node Design

Example:

```text
┌───────────────┐
│ ▣ DEV-01   ●  │
│ 10.20.20.10   │
│ SSH | MYSQL   │
└───────────────┘
```

Possible state borders:

```text
Unknown      muted gray
Discovered   blue-gray
Reachable    blue
Accessed     green
Compromised  red
Suspicious   amber
Offline      gray
Isolated     dashed border
```

---

# 25. Red Team Operational UI

The Red interface should feel like:

- offensive operations tooling
- technical investigation
- minimal game HUD

Prioritize:

- terminal
- network map
- sessions
- credentials
- mission
- intel

Avoid displaying gamey metrics like:

```text
HACKING POWER: 83
STEALTH: +22
```

If OPSEC information is shown, use realistic abstraction:

```text
NETWORK ACTIVITY     ELEVATED
AUTHENTICATION       LOW
ENDPOINT ARTIFACTS   MODERATE
```

---

# 26. Blue Team / SOC UI

Blue should look more corporate and information-dense.

Recommended layout:

```text
ALERT QUEUE
│
├── LIVE EVENTS / SIEM
│
└── HOST + INCIDENT CONTEXT
```

Blue uses:

- denser tables
- more filters
- more timelines
- more metadata
- more amber/red state language

The UI should make investigation feel like detective work.

---

# 27. Alerts

Never show:

```text
!!! HACKER DETECTED !!!
```

Prefer:

```text
RULE
PRIV-SVC-CONFIG-01

SEVERITY
HIGH

HOST
DEV-01

USER
deploy

EVENT
Privileged service configuration modified.
```

Professional language creates stronger tension.

---

# 28. Severity System

```text
INFO      gray
LOW       blue
MEDIUM    amber
HIGH      orange/amber-red
CRITICAL  red
```

Suggested:

```css
--severity-info: #657A84;
--severity-low: #3D8FB8;
--severity-medium: #D39B36;
--severity-high: #E36C3A;
--severity-critical: #D74848;
```

---

# 29. Mission Brief Style

Mission briefs should look like consulting/security engagement documentation.

Example:

```text
NODELINE SECURITY
OFFENSIVE OPERATIONS

ENGAGEMENT
OPERATION GLASSHOUSE

CLIENT
Meridian Dynamics

CLASSIFICATION
NODELINE INTERNAL
```

Use:

- strong spacing hierarchy
- small metadata labels
- thin rules
- controlled typography

Do not style missions like RPG quest cards.

---

# 30. Corporate Client UI

Client web apps should feel deliberately different from ROOT/OS.

Examples:

- Meridian employee portal
- HR portal
- finance dashboard
- old internal wiki
- ticket system

Visual characteristics:

- older layouts
- corporate blues/grays
- dated tables
- small gradients
- inconsistent spacing
- legacy iconography

These systems should feel maintained over years.

---

# 31. Career Hub

Career UI can be slightly more polished than operational screens.

Includes:

- operator profile
- designation
- level
- Red rank
- Blue rank
- proficiency
- certifications
- available operations

Still use ROOT/OS visual language.

Avoid turning the Career Hub into a modern RPG character sheet.

---

# 32. Ranking UI

Rank elements should remain restrained.

Example:

```text
RED RANK
PLATINUM II

BLUE RANK
GOLD I
```

Small geometric rank marks are acceptable.

Avoid:

- giant animated emblems
- excessive metallic effects
- fantasy badges

---

# 33. Replay / Reconstruction

Replay has three major modes.

```text
[ RED VIEW ] [ BLUE VIEW ] [ FULL TRUTH ]
```

Color identity:

```text
Red View    red
Blue View   blue
Full Truth  green
```

Replay should resemble forensic reconstruction software.

Primary elements:

- event timeline
- network path
- decision analysis
- evidence summary
- session history
- replay controls

---

# 34. Motion

Motion should be restrained and functional.

Allowed:

- 100–180ms hover transitions
- panel resize
- data row insertion
- node discovery
- alert arrival
- route reveal
- cursor blinking
- terminal typing
- replay timeline movement

Avoid:

- spring animations
- elastic panels
- floating UI
- large zoom transitions
- constant pulsing

---

# 35. Animation Timing

```css
--motion-fast: 90ms;
--motion-normal: 140ms;
--motion-slow: 220ms;
```

Use linear or simple ease-out curves.

ROOT should feel mechanical, not playful.

---

# 36. CRT / Analog Effects

Effects should be extremely subtle.

Allowed:

```css
scanline-opacity: 0.02–0.04
noise-opacity: 0.01–0.02
bloom: minimal
```

Never compromise readability.

Users should be able to disable these effects completely.

---

# 37. Glitch Rules

Glitch effects are narrative punctuation.

Use only for:

- boot anomalies
- corrupted data
- connection failure
- unauthorized ROOT/OS activity
- campaign-level reveals

Possible effects:

- one-frame horizontal displacement
- character corruption
- cursor lock
- timestamp desync
- brief phosphor trail
- duplicated terminal row

Do not glitch normal navigation.

---

# 38. Images and Photography

When corporate/client imagery is needed:

Use:

- office buildings
- server rooms
- industrial sites
- night exteriors
- surveillance-camera-like compositions
- cold fluorescent environments

Avoid:

- hooded hacker stock photos
- binary rain
- anonymous masks
- glowing keyboards
- cyberpunk cityscapes

---

# 39. Environmental Art Direction

ROOT should communicate a world beyond the workstation without becoming a 3D game.

Use visual fragments:

- building photographs
- badge scans
- corporate ID photos
- CCTV snapshots
- diagrams
- asset photos
- internal documents

This strengthens immersion while keeping the game browser-native.

---

# 40. Sound-Adjacent Visual Feedback

Visual feedback should match the restrained sound design.

Examples:

Successful authentication:

```text
small green status transition
```

Critical alert:

```text
thin red row highlight
no full-screen flash
```

Session lost:

```text
status bar change
brief cursor freeze
```

Objective complete:

```text
small green operation status
timeline update
```

---

# 41. Accessibility

ROOT must remain readable despite its aesthetic.

Required:

- scalable text
- reduced CRT effects
- reduced motion
- high-contrast option
- non-color state indicators
- keyboard navigation
- visible focus states
- screen reader labels where practical

Color must never be the only indicator of state.

Example:

```text
● COMPROMISED
```

not only:

```text
●
```

---

# 42. Responsive Behavior

Primary target:

```text
desktop
1440×900 and above
```

Recommended design canvas:

```text
1920×1080
```

Minimum supported operational width:

```text
1280px
```

At lower widths:

- side panels collapse
- details move into tabs
- tables retain horizontal scrolling
- terminal remains primary

Do not redesign operational screens into mobile cards.

Mobile support is not part of the initial ROOT production direction.

---

# 43. Recommended CSS Variables

```css
:root {
  --bg-0: #06090A;
  --bg-1: #090D0F;
  --bg-2: #0D1316;
  --bg-3: #12191D;

  --panel: #0A1013;
  --panel-raised: #0D1519;

  --border-soft: #1A2A31;
  --border: #23404B;
  --border-strong: #315767;

  --text-primary: #D7E0E4;
  --text-secondary: #93A7B0;
  --text-muted: #657A84;
  --text-disabled: #3E5058;

  --blue: #3D8FB8;
  --blue-light: #6DB7DA;

  --green: #36CF68;
  --green-light: #70E795;

  --amber: #CC8F25;
  --amber-light: #E9B94F;

  --red: #D74848;
  --red-light: #F06B6B;

  --radius-xs: 1px;
  --radius-sm: 2px;
  --radius-md: 4px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --motion-fast: 90ms;
  --motion-normal: 140ms;
  --motion-slow: 220ms;
}
```

---

# 44. Component Naming Direction

Recommended reusable UI primitives:

```text
RootWindow
RootPanel
RootPanelHeader
RootTabs
RootTable
RootStatus
RootButton
RootInput
RootToolbar
RootSidebar
RootStatusBar

TerminalView
NetworkNode
NetworkLink
CredentialRow
SessionRow
EventRow
AlertRow
ProcessRow
HostContext

MissionBrief
OperatorProfile
IncidentWorkspace
ReplayTimeline
ReplayEvent
```

Keep visual logic centralized.

Do not build every screen with one-off CSS.

---

# 45. Do

Use:

- straight lines
- dense information
- small labels
- technical metadata
- real hierarchy
- restrained state color
- authentic-looking tables
- subtle terminal effects
- purposeful whitespace
- consistent timestamps
- contextual panels

---

# 46. Do Not

Avoid:

- neon purple cyberpunk
- glowing skulls
- Matrix rain
- constant green tint
- huge rounded cards
- glassmorphism
- excessive blur
- mobile-dashboard styling
- oversized RPG meters
- flashy rarity colors
- giant alert animations
- unnecessary graphs
- fake technical gibberish
- constant screen distortion

---

# 47. Screen-Specific Visual Priorities

## Boot / Login

Primary feeling:

```text
secure
controlled
restricted
institutional
```

## Career Hub

Primary feeling:

```text
professional development
operator identity
internal company portal
```

## Red Operations

Primary feeling:

```text
control
investigation
precision
```

## Blue SOC

Primary feeling:

```text
information pressure
ambiguity
triage
```

## Replay

Primary feeling:

```text
clarity
forensics
understanding
```

---

# 48. Canonical Visual Test

Before approving a UI screen, ask:

1. Does this look like software an operator could actually use?
2. Is the information hierarchy obvious?
3. Is color communicating state rather than decoration?
4. Could this screen exist without glowing neon?
5. Is the visual effect helping gameplay?
6. Does the UI look more like enterprise software than an arcade HUD?
7. Can the player understand who they are, where they are, and what state the system is in?
8. Is abnormal activity visually noticeable because normal activity is restrained?

If the answer to several of these is no, the screen is drifting away from ROOT's identity.

---

# 49. Final Visual Principle

ROOT should not look like:

> a video game's idea of hacking.

ROOT should look like:

> a serious internal security platform that happens to be the interface to a game.

The player should gradually stop thinking about the UI as a game menu and start treating ROOT/OS like their workstation.

That is the target.
