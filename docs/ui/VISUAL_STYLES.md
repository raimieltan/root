# ROOT — Visual Style Guide

> Canonical visual direction for ROOT / ROOT/OS  
> Status: Production Design Reference  
> Applies to: ROOT/OS, Red Team, Blue Team, Career Hub, Mission UI, Replay, Login/Boot, Internal Client Applications

---

# 1. Visual Identity

ROOT/OS should look like:

> **A proprietary corporate workstation operating environment introduced around 2003, repeatedly upgraded internally, and eventually given an official dark theme.**

The visual language should combine:

- legacy enterprise desktop software
- Windows NT / 2000 / XP-era interaction patterns
- UNIX workstation software
- DOS utility pragmatism
- security operations tooling
- old internal corporate applications
- restrained dark-mode presentation

ROOT/OS must **not** look futuristic.

ROOT is **not**:

- neon cyberpunk
- Matrix-inspired
- green-on-black everywhere
- holographic
- glassy
- sci-fi
- a modern SaaS dashboard
- a game HUD pretending to be a hacker interface

ROOT should feel:

- corporate
- utilitarian
- technical
- dense
- rectangular
- slightly dated
- practical
- restrained
- cold
- believable
- maintained rather than redesigned
- operational
- secure
- occasionally unsettling

The player should feel like they are using a workstation maintained by an internal security department, not a fictional hacker terminal.

---

# 2. Core Visual Principle

ROOT should look:

> **10% more boring than expected.**

That is intentional.

The interface should feel like software designed to work first and look attractive second.

Normal ROOT/OS operation should appear:

- stable
- mundane
- professional
- predictable
- slightly old-fashioned
- deeply functional

This makes abnormal events more powerful:

- a compromised host
- an unknown session
- a privileged process
- corrupted data
- impossible authentication
- an unexplained service
- a rogue session
- a ROOT/OS anomaly
- a campaign-level security event

The game becomes tense because the normal environment feels believable.

---

# 3. Historical Design Fiction

ROOT/OS should feel as if its interface evolved over time.

Use this fictional visual history when making design decisions:

```text
2003
ROOT/OS begins as an internal operations environment.

2006
Window manager, network browser, terminal tools, and log utilities stabilize.

2010
Security tooling expands without redesigning the desktop shell.

2014
An official dark theme is introduced.

2018
Newer security modules are added inside the old UI framework.

2026
ROOT/OS is still actively maintained because operators know it well.
```

This explains why ROOT can contain modern security capabilities while still using:

- menu bars
- tree views
- classic tabs
- taskbars
- status bars
- old-style dialogs
- compact controls
- resizable windows
- legacy visual density

ROOT should look **maintained**, not intentionally retro.

---

# 4. Visual Composition Formula

Use this rough balance:

```text
35%  legacy corporate desktop software
25%  UNIX / workstation software
20%  enterprise security tooling
15%  Windows NT / 2000 / XP interaction language
 5%  analog / hardware imperfection
```

Do not reverse this balance.

Security should come from what the software **does**, not from visually shouting:

```text
CYBER
HACKER
NEON
TERMINAL
```

---

# 5. Reference DNA

ROOT/OS should borrow interaction ideas from:

- Windows NT 4.0
- Windows 2000
- Windows XP
- classic Control Panel utilities
- MMC-style management consoles
- GNUstep / OpenStep
- old UNIX workstations
- early Linux desktop environments
- DOS utilities
- old database clients
- old ticketing systems
- internal corporate admin software
- early-2000s antivirus consoles
- network management tools
- enterprise monitoring software

Use the references for:

- window grammar
- control density
- menu behavior
- title bars
- taskbar patterns
- toolbar patterns
- tree views
- status bars
- list views
- dialogs
- desktop structure

Do not imitate a single real operating system exactly.

ROOT/OS should feel proprietary.

---

# 6. Brand Style

## ROOT/OS

ROOT/OS is Nodeline Security's secure operations environment.

Branding should feel institutional.

Preferred treatments:

```text
ROOT/OS

ROOT/OS v4.2.1

NODELINE // OPS

NODELINE SECURITY

SECURE SYSTEMS
RELIABLE PEOPLE
```

Branding should usually appear in:

- boot screens
- login
- desktop wallpaper
- system information
- taskbar/start menu
- about dialogs
- mission documentation

Avoid oversized logos inside working applications.

The operator is working, not viewing a marketing page.

---

# 7. Desktop Philosophy

ROOT/OS is a **desktop operating environment**, not a website with panels.

The player should conceptually move through:

```text
DESKTOP
  ↓
APPLICATIONS
  ↓
WINDOWS
  ↓
TOOLS
  ↓
DIALOGS
  ↓
STATUS / OUTPUT
```

Avoid thinking in:

```text
WEB APP
  ↓
SIDEBAR
  ↓
DASHBOARD
  ↓
CARDS
  ↓
MODALS
```

Even if the implementation uses React components, the visual illusion should remain a workstation.

---

# 8. Desktop Shell

The ROOT/OS desktop may contain:

- desktop icons
- taskbar
- ROOT menu
- clock
- network status
- current privilege
- session status
- active application buttons
- subtle corporate wallpaper
- optional operator/system branding

Example:

```text
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  [Workstation]                                             │
│                                                            │
│  [Operations]                                              │
│                                                            │
│  [Databases]                                               │
│                                                            │
│  [Reports]                                                 │
│                                                            │
│                                                            │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ [R/] Menu │ Network Map │ Alert Queue │ Console │ LAN ● │ │
└────────────────────────────────────────────────────────────┘
```

The desktop should feel useful even when no window is open.

---

# 9. ROOT Menu

ROOT/OS should use a start-menu-style launcher.

Example:

```text
ROOT/OS
────────────────────────────
Security Operations       >
System Tools              >
Network Tools             >
Administration            >
Accessories               >
────────────────────────────
Settings
Help & Documentation
────────────────────────────
Lock Session
Log Out...
```

Secondary menus may expose:

```text
Alert Queue
Network Browser
Log Viewer
Incident Manager
Packet Analyzer
Vulnerability Scanner
Remote Access
Credential Manager
Report Generator
```

The menu should feel like a system launcher, not an RPG menu.

---

# 10. Primary Color System

ROOT/OS dark mode should be neutral.

Dark mode does **not** mean:

```text
black + neon green
```

The environment should use:

- charcoal
- blue-gray
- neutral gray
- muted steel
- restrained corporate blue
- semantic state colors

## Foundation

```css
--root-desktop: #1E2226;

--root-bg-0: #171A1D;
--root-bg-1: #1D2023;
--root-bg-2: #24282C;
--root-bg-3: #2B3035;

--root-window: #292D31;
--root-window-alt: #24282C;
--root-panel: #202427;
--root-panel-raised: #2D3237;
--root-input: #181B1E;

--root-titlebar: #343A40;
--root-titlebar-active: #3D4853;
--root-titlebar-inactive: #2A2F34;
```

Avoid pure black except for terminal interiors.

---

# 11. Border System

Legacy software should use visible border hierarchy.

```css
--root-border-dark: #101214;
--root-border-mid: #4F565C;
--root-border-light: #747C82;
--root-border-soft: #373D42;
```

Use beveled edges where appropriate.

Default control:

```css
border-top: 1px solid var(--root-border-light);
border-left: 1px solid var(--root-border-light);
border-right: 1px solid var(--root-border-dark);
border-bottom: 1px solid var(--root-border-dark);
```

Pressed control:

```css
border-top: 1px solid var(--root-border-dark);
border-left: 1px solid var(--root-border-dark);
border-right: 1px solid var(--root-border-light);
border-bottom: 1px solid var(--root-border-light);
```

Do not exaggerate the bevel.

ROOT should feel corporate, not skeuomorphic.

---

# 12. Text Colors

```css
--root-text-primary: #D6D9DB;
--root-text-secondary: #A9AFB3;
--root-text-muted: #747C82;
--root-text-disabled: #5D6368;

--root-text-terminal: #CDD2D5;
```

Avoid pure white for large areas.

---

# 13. Corporate Accent

The main UI accent should be muted blue.

```css
--root-blue-100: #B4C5D5;
--root-blue-300: #89A3BA;
--root-blue-500: #607E99;
--root-blue-700: #445D73;
--root-blue-muted: #394A59;
```

Use for:

- active window borders
- selected rows
- focused inputs
- links
- active navigation
- current host selection
- Blue Team identity
- neutral operational emphasis

Do not glow it.

---

# 14. Green

Green is semantic.

```css
--root-green-100: #B4D7B6;
--root-green-300: #8FB793;
--root-green-500: #6E9E73;
--root-green-700: #4B7250;
```

Use only for:

- healthy systems
- active sessions
- successful commands
- valid authentication
- completed objectives
- online services
- secure status

Do not use green as generic decoration.

---

# 15. Amber

Amber represents:

- uncertainty
- investigation
- degraded state
- caution
- partial knowledge
- suspicious behavior

```css
--root-amber-100: #D7C598;
--root-amber-300: #C0A66D;
--root-amber-500: #A88B53;
--root-amber-700: #79643D;
```

---

# 16. Red

Red represents confirmed danger.

```css
--root-red-100: #D9AAAA;
--root-red-300: #C87E7E;
--root-red-500: #A95F5F;
--root-red-700: #7A4343;
```

Use for:

- compromised systems
- critical alerts
- blocked events
- hostile activity
- failed containment
- critical business impact
- Red Team identity

Do not make Red Team screens red everywhere.

---

# 17. Team Color Language

## Red Team

```css
--team-red: #A95F5F;
--team-red-soft: #6D4242;
```

Red identifies:

- offensive activity
- attack events
- hostile traces
- Red View
- offensive objectives

## Blue Team

```css
--team-blue: #607E99;
--team-blue-soft: #445D73;
```

Blue identifies:

- SOC navigation
- investigations
- defensive context
- Blue View

## Full Truth

```css
--truth-green: #6E9E73;
```

Use only for:

- reconstruction
- full-truth replay
- verified event correlation

---

# 18. Typography Philosophy

ROOT/OS should not use monospace everywhere.

Use **sans serif for operating-system chrome** and **monospace for technical data**.

That distinction helps terminals and logs feel more authentic.

---

# 19. Sans Serif Role

Use sans serif for:

- title bars
- menus
- buttons
- dialogs
- navigation
- property labels
- system settings
- ordinary application chrome
- mission prose
- help content
- corporate messages

Recommended:

- Tahoma-like UI typography
- IBM Plex Sans
- Arial
- Inter
- Geist Sans

Preferred visual target:

```css
font-family: "IBM Plex Sans", Tahoma, Arial, sans-serif;
```

---

# 20. Monospace Role

Use monospace for:

- terminal
- logs
- timestamps
- hostnames
- IP addresses
- process IDs
- ports
- credentials
- command output
- file paths
- service names
- forensic data
- security event metadata

Recommended:

- IBM Plex Mono
- JetBrains Mono
- Consolas
- Geist Mono

```css
font-family: "IBM Plex Mono", Consolas, monospace;
```

---

# 21. Type Scale

ROOT should use compact typography.

```css
--text-2xs: 10px;
--text-xs: 11px;
--text-sm: 12px;
--text-md: 13px;
--text-lg: 14px;
--text-xl: 16px;
--text-2xl: 20px;
--text-display: 26px;
```

Most application UI should sit between:

```text
11px–13px
```

Large typography should be uncommon.

ROOT is workstation software.

---

# 22. Title Bars

Every major application window should have a visible title bar.

Examples:

```text
Network Browser - ROOT/OS

Alert Queue - ROOT/OS

Incident Workspace - ROOT/OS

Command Console - ROOT/OS

Host Inspector - DC-01

Evidence Viewer - INC-2024-1187
```

Titlebar structure:

```text
┌───────────────────────────────────────┐
│ ▣ Network Browser - ROOT/OS    _ □ × │
└───────────────────────────────────────┘
```

Rules:

- 24–28px high
- visible active/inactive state
- square corners
- compact window controls
- no giant title text
- minimal gradients allowed
- no glow
- no transparency

---

# 23. Menu Bars

Applications should use real menu bars where appropriate.

Example:

```text
File   Edit   View   Host   Tools   Help
```

Other useful patterns:

```text
File   Filters   Actions   View   Help

File   View   Tools   Tasks   Help

File   Edit   Search   Options   Help
```

Menus reinforce the workstation illusion.

Do not hide every action behind icons.

---

# 24. Toolbars

Use classic toolbar rows.

Example:

```text
[ Scan ] [ Add Host ] | [ Credentials ] [ Ping ] [ Remote ] [ Open Log ]
```

Rules:

- 24–30px tall
- small icons
- clear text labels
- separators between groups
- rectangular buttons
- restrained hover states

Toolbar actions should feel like utility software.

---

# 25. Buttons

Buttons should resemble enterprise desktop controls.

Examples:

```text
[ Authenticate ]

[ Investigate ]

[ Acknowledge ]

[ Create Ticket ]

[ Open Console ]

[ Cancel ]
```

Rules:

- rectangular
- 24–30px tall
- subtle bevel
- minimal radius
- readable labels
- no pill shapes
- no large gradients
- no glow

Primary action may use:

- stronger border
- slightly lighter fill
- selected blue state

Danger actions may use muted red.

---

# 26. Inputs

Inputs should look like workstation fields.

Example:

```text
Operator ID:
┌─────────────────────────────┐
│ j.dawson                    │
└─────────────────────────────┘
```

Rules:

- dark fill
- visible border
- blue focus state
- 22–28px tall
- square corners
- subtle inset appearance
- monospace for technical values

---

# 27. Tabs

Use classic tab controls.

Example:

```text
┌──────────┬───────────┬────────────┬─────────────┐
│ General  │ Services  │ Processes  │ Credentials │
└──────────┴───────────┴────────────┴─────────────┘
```

The selected tab should appear visually connected to the content pane.

Avoid modern underline-only tab bars.

---

# 28. Checkboxes and Radio Buttons

Use visible conventional controls.

Examples:

```text
☑ Show offline hosts

☐ Include archived events

◉ Automatic
○ Manual
```

Controls should remain recognizable without relying on modern minimalist styling.

---

# 29. Dropdowns

Dropdowns should look like desktop combo boxes.

Example:

```text
View:
┌───────────────────────┬───┐
│ Active Incidents      │ ▼ │
└───────────────────────┴───┘
```

Do not use oversized modern selects.

---

# 30. Tree Views

Tree views are a major ROOT primitive.

Use for:

- network topology
- file systems
- host groups
- mission assets
- organization hierarchy
- registry-like structures
- tool navigation

Example:

```text
▾ Network
  ▾ Corporate
    ▸ HQ
    ▸ Branch
    ▾ Servers
      ▸ Database
      ▸ Application
      ▸ File
  ▸ Workstations
  ▸ Network Devices
```

Use visible expansion indicators.

---

# 31. Tables and List Views

Tables are one of the strongest ROOT UI primitives.

Use for:

- logs
- alerts
- credentials
- sessions
- services
- processes
- evidence
- incidents
- hosts
- tickets
- files

Example:

```text
HOST      IP ADDRESS      TYPE          STATUS      LAST SEEN
DEV-01    10.10.1.21      Workstation   Online      19:06
FIN-DB    10.10.4.10      Database      Online      19:05
WEB-01    10.10.2.10      Web Server    Degraded    18:52
```

Rows:

- 24–30px
- thin separators
- visible selection
- compact typography
- semantic state color only where useful

Avoid excessive zebra striping.

---

# 32. Scrollbars

Scrollbars should be visible.

Do not hide them until hover.

ROOT should feel like dense desktop software.

Scrollbar styling should be:

- narrow but obvious
- square
- dark neutral
- low-contrast
- mechanically consistent

---

# 33. Split Panes

Resizable split panes are strongly encouraged.

Example:

```text
┌───────────────┬──────────────────────────────┐
│ Host Tree     │ Host Details                 │
│               │                              │
│               │                              │
│               │                              │
└───────────────┴──────────────────────────────┘
```

Use for:

- navigation + content
- incident list + details
- network map + inspector
- log list + event detail
- file browser + preview

---

# 34. Status Bars

Applications should often include status bars.

Example:

```text
42 hosts | 39 online | 1 degraded | 2 offline
```

Other examples:

```text
Subnets: 4 | Hosts: 42 | Selected: DC-01

Session: SECURE | Privilege: OPERATOR | Network: ONLINE

Events: 218 | Filtered: 34 | Last refresh: 19:06:12
```

Status bars should reinforce system-state awareness.

---

# 35. Taskbar

The ROOT/OS taskbar should remain visible during most desktop gameplay.

Example:

```text
[R/] Menu │ Network Map │ Alert Queue │ Command Console │ LAN ● │ 19:06
```

Recommended items:

- ROOT menu
- active windows
- network indicator
- audio indicator if needed
- privilege/session state
- date/time

Avoid modern centered-dock styling.

---

# 36. Desktop Icons

Desktop icons may include:

```text
Workstation
Operations
Databases
Reports
Archive
Tools
```

Icons should feel like classic system icons:

- small
- readable
- slightly dimensional
- restrained
- practical

Avoid glossy app-store icon styling.

---

# 37. Icon Style

Preferred:

- 16px
- 20px
- 24px
- simple
- technical
- slightly old-fashioned
- minimal anti-aliasing feel
- subtle fills allowed
- no emoji

Useful icon families:

- terminal
- network
- folders
- workstation
- server
- database
- logs
- process tree
- magnifier
- warning
- key
- lock
- report
- printer
- drive
- console

Icons support text labels rather than replace them.

---

# 38. Dialogs

Dialogs should feel like classic desktop software.

Examples:

```text
Confirm Session Termination

The selected remote session will be disconnected.

[ Terminate ] [ Cancel ]
```

or:

```text
Connection Failed

Unable to establish a secure channel to DEV-01.

Error: AUTH_NEGOTIATION_FAILED

[ Retry ] [ Details... ] [ Close ]
```

Use:

- clear title
- concise body
- conventional buttons
- technical details where appropriate

Avoid giant centered web modals.

---

# 39. Property Windows

Host/entity details should often use property-dialog structure.

Example:

```text
Host Properties - DC-01

[ General ] [ Services ] [ Processes ] [ Credentials ] [ Logs ]

Hostname:      DC-01
IP Address:    10.10.3.10
OS:            Windows Server 2019
Role:          Domain Controller
Status:        Online
```

This is preferable to modern cards.

---

# 40. Terminal Style

The terminal should be visually simpler than the rest of ROOT.

Background:

```css
#060708
```

Text:

```css
#CDD2D5
```

Prompt accents may use:

```text
root        muted red
operator    muted green
hostname    muted blue
path        pale gray
```

Example:

```text
root@ops:~$ ping 10.10.3.10

PING 10.10.3.10 (10.10.3.10) 56(84) bytes of data.
64 bytes from 10.10.3.10: icmp_seq=1 ttl=128 time=0.3 ms
64 bytes from 10.10.3.10: icmp_seq=2 ttl=128 time=0.4 ms

root@ops:~$ _
```

Rules:

- no neon bloom
- no giant ASCII banner
- no constant scanline effect
- no Matrix rain
- no fake typing delays for everything
- terminal output must remain readable

---

# 41. Network Map Style

The network map should resemble:

- infrastructure diagrams
- network engineering tools
- old topology software
- enterprise network consoles

Use:

- rectangular nodes
- orthogonal connectors
- subnet boxes
- host labels
- IP addresses
- simple device icons
- status dots
- thin grid background

Example:

```text
              INTERNET
                 │
               FW-01
                 │
             CORE-SW-01
        ┌────────┼────────┐
        │        │        │
       DEV      CORP     FIN
        │        │        │
      DEV-01    DC-01    FIN-DB
```

Avoid:

- 3D nodes
- orbiting icons
- particle effects
- glowing neon webs
- holograms

---

# 42. Network Node Design

Example:

```text
┌────────────────────┐
│ ▣ DC-01        ●   │
│ 10.10.3.10          │
│ Domain Controller   │
└────────────────────┘
```

Possible states:

```text
Unknown      gray
Discovered   muted blue
Reachable    blue
Accessed     green
Compromised  red
Suspicious   amber
Offline      gray
Isolated     dashed border
```

---

# 43. Host Inspector

A host inspector should look like system-management software.

Recommended structure:

```text
┌ HOST INSPECTOR - DC-01 ──────────────────────────────┐
│ DC-01                          Windows Server 2019    │
│ ● Online                      Domain Controller      │
├───────────────────────────────────────────────────────┤
│ General | Services | Processes | Credentials | Logs  │
├───────────────────────┬───────────────────────────────┤
│ Host Information      │ Status                        │
│ Hostname: DC-01       │ Reachability: Online          │
│ IP: 10.10.3.10        │ Firewall: Enabled             │
│ Domain: CORP.LOCAL    │ Patching: 12 pending          │
├───────────────────────┼───────────────────────────────┤
│ Key Services          │ Open Sessions                 │
│ ...                   │ ...                           │
└───────────────────────┴───────────────────────────────┘
```

Avoid turning each section into floating cards.

---

# 44. Alert Queue

The Alert Queue should feel like:

- SIEM software
- old enterprise monitoring tools
- incident-management software

Recommended structure:

```text
TIME      SEVERITY   HOST      EVENT                    STATUS
19:04     CRITICAL   RPT-01    Host unreachable         OPEN
18:57     HIGH       WEB-01    High CPU usage           INVESTIGATE
18:43     HIGH       VPN-01    Multiple failed logins   INVESTIGATE
```

Selected alert details should appear in a lower pane or side pane.

Avoid giant alert cards.

---

# 45. Incident Workspace

Incident response should be dense.

Recommended layout:

```text
INCIDENT LIST
│
├── INCIDENT DETAILS
│   ├── timeline
│   ├── evidence
│   ├── notes
│   └── containment
│
└── CONTEXT / ACTIONS
```

Suggested windows:

- Incident Workspace
- Evidence Viewer
- Log Viewer
- Host Inspector
- Timeline
- Containment Dialog

The experience should feel procedural, not cinematic.

---

# 46. Red Team Operational UI

Red Team should feel like offensive operations tooling.

Prioritize:

- terminal
- host browser
- network map
- sessions
- credentials
- mission notes
- tools
- logs
- process inspection

Avoid gamey metrics like:

```text
HACKING POWER: 83
STEALTH: +22
```

Prefer:

```text
NETWORK ACTIVITY      ELEVATED
AUTHENTICATION NOISE  LOW
ENDPOINT ARTIFACTS    MODERATE
```

Use red only where the activity itself is hostile or offensive.

---

# 47. Blue Team / SOC UI

Blue Team should feel more corporate and information-dense.

Use:

- alert queues
- incident tables
- event timelines
- host details
- process trees
- filters
- evidence
- notes
- ticketing
- containment controls

Blue Team should feel like investigative software.

The UI should reward careful reading.

---

# 48. Alerts

Avoid:

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

# 49. Severity System

```text
INFO      gray
LOW       muted blue
MEDIUM    amber
HIGH      orange/amber-red
CRITICAL  red
```

Suggested:

```css
--severity-info: #747C82;
--severity-low: #607E99;
--severity-medium: #A88B53;
--severity-high: #B57450;
--severity-critical: #A95F5F;
```

Color should never be the only indication.

---

# 50. Boot Screen

The boot experience should feel institutional.

Possible sequence:

```text
ROOT/OS SECURE OPERATIONS ENVIRONMENT

Initializing kernel modules........ [ OK ]
Checking hardware integrity........ [ OK ]
Loading network interfaces......... [ OK ]
Mounting encrypted volumes......... [ OK ]
Applying security policies......... [ OK ]
Starting audit subsystem........... [ OK ]

Secure session state............... [ READY ]
Login service...................... [ ONLINE ]
```

Rules:

- minimal animation
- no cyberpunk boot graphics
- no giant ASCII skull
- no Matrix text
- no neon

---

# 51. Login Screen

The login screen should feel like:

- secure corporate access
- domain authentication
- hardened workstation software

Recommended structure:

```text
SECURE AUTHENTICATION

Operator ID:
[________________________]

Password:
[________________________]

Domain / Session Type:
[ ROOT                  ▼ ]

This system is for authorized use only.
All access is monitored and logged.

[ AUTHENTICATE ] [ CANCEL ]
```

Optional supporting panel:

```text
System Initialization
Kernel modules        [ OK ]
Network interfaces    [ OK ]
Encrypted volumes     [ OK ]
Security policies     [ OK ]
Audit subsystem       [ OK ]
```

---

# 52. Mission Brief Style

Mission briefs should look like consulting/security engagement documents.

Example:

```text
NODELINE SECURITY
OFFENSIVE OPERATIONS

ENGAGEMENT
OPERATION GLASSHOUSE

CLIENT
MERIDIAN DYNAMICS

CLASSIFICATION
NODELINE INTERNAL
```

Use:

- metadata
- thin rules
- section headings
- small labels
- ordinary document typography

Do not style missions like RPG quest cards.

---

# 53. Corporate Client Applications

Client applications should look distinct from ROOT/OS while still belonging to the same world.

Examples:

- employee portal
- HR application
- finance database
- helpdesk
- old wiki
- ticketing system
- inventory app
- internal webmail
- timekeeping software
- building access console

Visual characteristics:

- corporate blue/gray
- white or dark legacy themes depending on client
- old tables
- small gradients
- inconsistent spacing
- older iconography
- obvious forms
- less polished interaction

These systems should feel maintained over years.

---

# 54. Career Hub

Career Hub may be slightly more polished than operational applications.

It may include:

- operator profile
- designation
- level
- Red rank
- Blue rank
- proficiency
- certifications
- available operations
- internal messages

Still use ROOT/OS visual grammar.

Avoid modern RPG character-sheet styling.

---

# 55. Ranking UI

Rank presentation should remain restrained.

Example:

```text
RED RANK
PLATINUM II

BLUE RANK
GOLD I
```

Small geometric insignia are acceptable.

Avoid:

- giant animated emblems
- fantasy crests
- metallic rarity effects
- glowing borders

---

# 56. Replay / Reconstruction

Replay should resemble forensic reconstruction software.

Modes:

```text
[ RED VIEW ] [ BLUE VIEW ] [ FULL TRUTH ]
```

Color identity:

```text
Red View    muted red
Blue View   muted blue
Full Truth  muted green
```

Primary elements:

- event timeline
- network path
- process relationships
- evidence summary
- session history
- decision analysis
- replay controls

Avoid cinematic HUD styling.

---

# 57. Progress Indicators

Progress bars should look utilitarian.

Example:

```text
Saving evidence package...

[██████████████░░░░░░] 68%
```

Use for:

- file transfer
- scan
- report export
- evidence collection
- session setup
- service restart

Do not animate excessively.

---

# 58. Loading States

Prefer:

```text
Querying directory...

Resolving host...

Loading event history...

Contacting service...

Waiting for response...
```

over modern skeleton-card loading.

A small marquee progress bar is acceptable.

---

# 59. Error States

Errors should be procedural.

Example:

```text
REMOTE SESSION ERROR

The connection to FIN-DB was terminated.

Reason:
Authentication token expired.

Error code:
AUTH-SESSION-041

[ Reauthenticate ] [ Close ]
```

Do not use giant red full-screen error art.

---

# 60. Tooltips

Tooltips should resemble system hints.

Rules:

- small
- rectangular
- slight border
- short delay
- neutral dark background
- no oversized rich cards

---

# 61. Context Menus

Context menus are encouraged.

Examples:

```text
Open
Inspect
Ping
Trace Route
Open Console
Copy Address
──────────────
Isolate Host
```

Context menus strengthen the desktop-software illusion.

---

# 62. Selection Language

Selected rows/items should use:

```css
background: #3E5870;
color: #F1F3F4;
```

Inactive selection may use:

```css
background: #394047;
color: #D4D7D9;
```

Do not use luminous selection glows.

---

# 63. Focus Language

Focused controls may use:

- a 1px muted blue border
- subtle inset highlight
- classic dotted focus rectangle where appropriate

Avoid thick modern focus rings unless accessibility mode requires them.

---

# 64. Layout Philosophy

ROOT interfaces should feel dense but organized.

Use:

- columns
- split panes
- tables
- menu bars
- toolbars
- tree views
- classic tabs
- status bars
- dialogs
- property windows
- overlapping windows where appropriate

Avoid:

- giant empty areas
- floating cards
- large rounded containers
- glassmorphism
- massive KPI tiles
- mobile dashboard layouts

---

# 65. Grid System

Base unit:

```text
4px
```

Common spacing:

```text
4px
6px
8px
12px
16px
20px
24px
32px
```

Operational screens usually use:

```text
4–8px control spacing
6–12px panel padding
8–12px pane gaps
```

Do not over-pad tables.

---

# 66. Border Radius

ROOT should be almost square.

```css
--radius-0: 0px;
--radius-xs: 1px;
--radius-sm: 2px;
```

4px should be rare.

Pills should be avoided except for tiny state markers when truly necessary.

---

# 67. Shadows

Use minimal shadows.

Windows may use:

```css
box-shadow:
  1px 1px 0 rgba(0,0,0,0.45),
  4px 6px 18px rgba(0,0,0,0.28);
```

Do not use:

- blurred floating-card shadows
- neon glow
- giant ambient shadows

Hierarchy should come from:

- borders
- titlebars
- panes
- window stacking
- background shifts

---

# 68. Motion

Motion should be functional.

Allowed:

- window open/close
- menu open
- row insertion
- progress movement
- node discovery
- alert arrival
- cursor blink
- terminal text
- panel resize
- replay timeline

Avoid:

- springs
- bounce
- elastic cards
- floating UI
- constant pulsing
- dramatic zooms

---

# 69. Animation Timing

```css
--motion-fast: 80ms;
--motion-normal: 130ms;
--motion-slow: 200ms;
```

Use:

- linear
- simple ease-out

ROOT should feel mechanical.

---

# 70. CRT / Analog Effects

Analog effects are optional and extremely subtle.

Allowed:

```text
scanline opacity: 0.01–0.025
noise opacity:    0.005–0.015
bloom:            nearly none
```

Effects should never reduce readability.

Users should be able to disable them.

---

# 71. Glitch Rules

Glitch effects are narrative punctuation.

Use only for:

- boot anomalies
- corrupted files
- compromised display output
- unauthorized ROOT/OS activity
- impossible timestamps
- campaign reveals
- connection instability

Possible effects:

- one-frame horizontal displacement
- duplicated terminal row
- brief character corruption
- cursor lock
- timestamp desync
- short graphical corruption

Do not glitch ordinary navigation.

---

# 72. Photography

Use real-world imagery sparingly.

Good:

- server rooms
- industrial facilities
- office buildings
- CCTV stills
- ID photos
- security cameras
- badge scans
- hardware racks
- night exterior shots

Avoid:

- hooded hackers
- glowing keyboards
- anonymous masks
- binary rain
- cyberpunk cityscapes

---

# 73. Environmental Art Direction

ROOT should communicate a world beyond the workstation without becoming a 3D game.

Use:

- CCTV stills
- asset photos
- building diagrams
- employee IDs
- scanned documents
- network diagrams
- evidence screenshots
- incident photos
- corporate records

These should appear inside applications, not as decorative wallpaper everywhere.

---

# 74. Sound-Adjacent Visual Feedback

Visual feedback should be restrained.

Successful authentication:

```text
status changes to AUTHENTICATED
small green indicator
```

Critical alert:

```text
thin red row highlight
no full-screen flash
```

Session loss:

```text
taskbar/network state changes
brief dialog
```

Objective completion:

```text
small status update
timeline/log entry
```

---

# 75. Accessibility

ROOT must remain readable.

Required:

- scalable text
- high contrast mode
- reduced motion
- reduced CRT effects
- keyboard navigation
- visible focus
- non-color state indicators
- readable semantic labels
- screen-reader labels where practical

Color must never be the only state cue.

Use:

```text
● COMPROMISED
```

not only:

```text
●
```

---

# 76. Responsive Behavior

Primary target:

```text
Desktop
1440×900 and above
```

Recommended design canvas:

```text
1920×1080
```

Minimum operational width:

```text
1280px
```

At lower widths:

- side panes collapse
- details move into tabs
- tables retain horizontal scrolling
- terminal remains usable
- windows may maximize automatically

Do not redesign ROOT into mobile cards.

Mobile is not an initial production target.

---

# 77. Window Behavior

ROOT/OS windows may support:

- drag
- resize
- minimize
- maximize
- close
- snap
- focus
- overlap
- taskbar restore

Important:

Window behavior must remain predictable.

Do not simulate bad desktop UX for nostalgia.

---

# 78. Window Layering

Use visual stacking carefully.

Typical hierarchy:

```text
Desktop
  ↓
Main Application
  ↓
Inspector / Utility Window
  ↓
Dialog
  ↓
Context Menu / Tooltip
```

Too many overlapping windows at once becomes unreadable.

Use them deliberately.

---

# 79. Canonical Desktop Applications

Suggested built-in applications:

```text
Network Browser
Network Map
Alert Queue
Incident Manager
Log Viewer
Evidence Viewer
Command Console
Packet Analyzer
Credential Manager
Remote Access
Process Explorer
Service Manager
Report Generator
Mission Brief
Operator Profile
System Settings
Help & Documentation
```

Each application should have recognizable purpose and structure.

---

# 80. Application Chrome

Canonical application structure:

```text
┌──────────────────────────────────────────────┐
│ ▣ APP TITLE - ROOT/OS                 _ □ × │
├──────────────────────────────────────────────┤
│ File  Edit  View  Tools  Help                │
├──────────────────────────────────────────────┤
│ [ toolbar actions ]                          │
├───────────────┬──────────────────────────────┤
│ NAV / TREE    │ WORKSPACE                    │
│               │                              │
│               │                              │
├───────────────┴──────────────────────────────┤
│ STATUS / SESSION / SELECTION                 │
└──────────────────────────────────────────────┘
```

This should be the default mental model.

---

# 81. Desktop Wallpaper

Wallpaper should be extremely restrained.

Options:

- plain dark blue-gray
- very subtle texture
- faded ROOT/OS logo
- faint Nodeline branding
- institutional slogan
- barely visible geometric grid

Avoid:

- glowing gradients
- sci-fi imagery
- cyberpunk scenes
- bright abstract art

The wallpaper should disappear behind work.

---

# 82. Visual Imperfection

ROOT should not feel perfectly designed.

Allow small intentional inconsistencies:

- one utility uses older iconography
- one dialog has tighter spacing
- one legacy tool uses older labels
- one client app uses a different gray
- some menus use title case while older modules use sentence case

The system should feel evolved.

Do not create random inconsistency everywhere.

---

# 83. Modern Features Inside Legacy Chrome

Modern capabilities are allowed.

Examples:

- live threat intelligence
- process correlation
- timeline reconstruction
- attack-path visualization
- network telemetry
- automated triage
- replay reconstruction

But they should be presented inside legacy workstation grammar.

The technology may be modern.

The shell should remain conservative.

---

# 84. What Makes ROOT Feel Like ROOT

ROOT identity should come from:

- institutional branding
- serious system language
- desktop applications
- realistic workflows
- dense information
- precise technical states
- classic window grammar
- muted colors
- context-aware status
- believable security tooling

Not from:

- neon
- glitch
- hacker clichés
- cinematic effects

---

# 85. Recommended CSS Variables

```css
:root {
  /* Desktop */
  --desktop: #1E2226;

  /* Surfaces */
  --bg-0: #171A1D;
  --bg-1: #1D2023;
  --bg-2: #24282C;
  --bg-3: #2B3035;

  --window: #292D31;
  --window-alt: #24282C;
  --panel: #202427;
  --panel-raised: #2D3237;
  --input: #181B1E;

  /* Title bars */
  --titlebar: #343A40;
  --titlebar-active: #3D4853;
  --titlebar-inactive: #2A2F34;

  /* Borders */
  --border-dark: #101214;
  --border-mid: #4F565C;
  --border-light: #747C82;
  --border-soft: #373D42;

  /* Text */
  --text-primary: #D6D9DB;
  --text-secondary: #A9AFB3;
  --text-muted: #747C82;
  --text-disabled: #5D6368;

  /* Accent */
  --blue: #607E99;
  --blue-light: #89A3BA;
  --blue-dark: #445D73;
  --selection: #3E5870;

  /* Semantic states */
  --green: #6E9E73;
  --green-light: #8FB793;

  --amber: #A88B53;
  --amber-light: #C0A66D;

  --red: #A95F5F;
  --red-light: #C87E7E;

  /* Severity */
  --severity-info: #747C82;
  --severity-low: #607E99;
  --severity-medium: #A88B53;
  --severity-high: #B57450;
  --severity-critical: #A95F5F;

  /* Geometry */
  --radius-0: 0px;
  --radius-xs: 1px;
  --radius-sm: 2px;

  /* Spacing */
  --space-1: 4px;
  --space-1-5: 6px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Motion */
  --motion-fast: 80ms;
  --motion-normal: 130ms;
  --motion-slow: 200ms;
}
```

---

# 86. Recommended Component Naming

Core shell:

```text
RootDesktop
RootTaskbar
RootStartMenu
RootWindow
RootWindowTitlebar
RootWindowControls
RootMenuBar
RootToolbar
RootStatusBar
RootContextMenu
RootDialog
```

Controls:

```text
RootButton
RootInput
RootSelect
RootCheckbox
RootRadio
RootTabs
RootTable
RootTree
RootListView
RootProgressBar
RootScrollbar
RootSplitter
```

Operational components:

```text
TerminalView
NetworkMap
NetworkNode
HostInspector
AlertQueue
AlertRow
IncidentWorkspace
IncidentTimeline
EvidenceViewer
LogViewer
ProcessTable
ServiceTable
CredentialRow
SessionRow
MissionBrief
OperatorProfile
ReplayTimeline
```

Keep visual logic centralized.

Do not create one-off styling for every screen.

---

# 87. Do

Use:

- dark neutral surfaces
- square windows
- visible title bars
- classic menu bars
- small toolbar icons
- compact typography
- status bars
- taskbar
- tree views
- split panes
- tables
- dialogs
- clear selected states
- subtle bevels
- muted corporate blue
- restrained semantic color
- dense information
- technical metadata
- realistic terminology
- visible scrollbars
- ordinary desktop controls

---

# 88. Do Not

Avoid:

- neon green theme
- dark green wash
- purple cyberpunk
- glowing borders
- Matrix rain
- holographic panels
- glassmorphism
- excessive blur
- giant rounded cards
- modern SaaS dashboards
- floating metric cards
- pill-heavy UI
- gradient-heavy backgrounds
- huge alert banners
- giant typography
- flashy rarity colors
- constant glitch
- fake technical gibberish
- sci-fi HUD crosshairs
- 3D network holograms
- giant animated logos
- mobile-first card layouts

---

# 89. Screen-Specific Visual Priorities

## Boot / Login

Primary feeling:

```text
secure
controlled
restricted
institutional
```

Visual references:

- domain login
- workstation authentication
- system initialization
- old corporate secure workstation

## Desktop

Primary feeling:

```text
workstation
familiar
functional
maintained
```

## Network Browser

Primary feeling:

```text
administration
inventory
topology
control
```

## Red Operations

Primary feeling:

```text
precision
access
investigation
control
```

## Blue SOC

Primary feeling:

```text
information pressure
triage
ambiguity
procedure
```

## Incident Workspace

Primary feeling:

```text
evidence
correlation
containment
documentation
```

## Replay

Primary feeling:

```text
forensics
reconstruction
clarity
understanding
```

## Career Hub

Primary feeling:

```text
internal company portal
professional development
operator identity
```

---

# 90. Canonical Visual Test

Before approving a UI screen, ask:

1. Does this look like software an operator could actually use?
2. Does it look like desktop software rather than a website?
3. Does it feel maintained rather than designed yesterday?
4. Could it plausibly have existed in an older form 15 years ago?
5. Is the information hierarchy obvious?
6. Is color communicating state rather than decoration?
7. Is green being used semantically rather than aesthetically?
8. Does the screen work without glow?
9. Are classic controls doing useful work?
10. Does the screen feel corporate rather than cinematic?
11. Does the UI support real workflows rather than game-like stats?
12. Is abnormal activity noticeable because normal activity is restrained?
13. Could an IT administrator recognize the interaction patterns?
14. Does the screen feel like part of ROOT/OS rather than a generic cyber dashboard?

If several answers are no, the design is drifting.

---

# 91. Final Visual Principle

ROOT should not look like:

> **a video game's idea of hacking.**

ROOT should look like:

> **a serious proprietary corporate workstation environment that happens to be the interface to a game.**

The operating-system shell should feel:

> **Windows NT / XP-era enterprise software + UNIX workstation + DOS utility pragmatism + modern security functionality, presented in a restrained dark mode.**

The security theme comes from:

- the workflows
- the data
- the terminology
- the consequences
- the systems being operated

—not from neon.

The ideal reaction is not:

> "Cool hacker UI."

It is:

> "This looks like some weird internal security software I could actually imagine a company using."

That is the target.
