# ROOT — Canonical Product Plan

## 1. Product Definition

ROOT is a browser-native cybersecurity RPG, immersive simulation, investigation game, and competitive strategy game built around realistic but fully simulated computer systems.

The player operates through a fictional security operating environment called **ROOT/OS**.

ROOT is not primarily about memorizing commands, collecting hacking gear, increasing arbitrary stats, or pressing an “exploit” button.

ROOT is about understanding:

* networks
* machines
* users
* identities
* permissions
* credentials
* services
* applications
* trust relationships
* processes
* files
* security controls
* logs
* evidence
* business impact

The central question behind every mechanic is:

> Did the player understand the system well enough to make the right decision?

ROOT should always remain a **game first and a cybersecurity course second**.

The educational value should emerge through gameplay rather than lectures.

---

# 2. Core Fantasy

ROOT delivers two primary fantasies.

## Red Team Fantasy

> I understand this environment well enough to find a path through it that the defenders did not anticipate.

The player:

* investigates the organization
* discovers infrastructure
* identifies relationships
* gains access
* escalates privileges
* moves laterally
* establishes persistence
* reaches protected objectives
* manages the evidence they create

## Blue Team Fantasy

> I understand the evidence well enough to determine what is happening before the attacker completes their objective.

The player:

* monitors telemetry
* identifies anomalies
* investigates events
* correlates evidence
* forms hypotheses
* identifies compromised identities and systems
* contains the attacker
* removes persistence
* restores services
* balances security against operational impact

Red and Blue operate against the **same underlying simulation**.

This is one of ROOT's defining features.

---

# 3. Core Design Pillars

## 3.1 Knowledge Is Power

Progress comes primarily from player understanding.

A veteran is dangerous because they recognize relationships a beginner does not.

Example:

A beginner sees:

```text
root  backup-sync
```

A veteran asks:

```text
Who controls its configuration?
What does the service trust?
Who can modify those inputs?
When does the service restart?
```

ROOT should reward this style of reasoning.

---

## 3.2 Everything Leaves Evidence

Every meaningful action produces simulation events.

Examples:

```text
HostDiscovery
PortProbe
ServiceProbe
AuthenticationAttempt
AuthenticationSuccess
ProcessSpawn
SensitiveFileRead
CredentialDiscovered
ConfigModified
PrivilegeChanged
SessionCreated
LateralMovement
PersistenceInstalled
SensitiveDataAccessed
ObjectiveRetrieved
```

These events can power:

* Red feedback
* Blue telemetry
* detection rules
* alerts
* replay
* scoring
* post-operation analysis
* learning systems

There should be no fake separation between “game events” and “security events.”

They should be the same underlying truth.

---

## 3.3 Information Is Asymmetric

No participant sees everything during an operation.

Red knows:

* their sessions
* their discoveries
* their credentials
* their actions
* some evidence indicators

Blue knows:

* monitored infrastructure
* available telemetry
* alerts
* legitimate business context
* some attacker activity

Neither sees full truth.

After an operation, ROOT reveals:

```text
RED VIEW
BLUE VIEW
FULL TRUTH
```

This post-operation reconstruction is a flagship feature.

---

## 3.4 Multiple Solutions

ROOT should gradually move away from single-scripted attack paths.

An objective should define:

```text
WHAT must happen
```

rather than always:

```text
HOW it must happen
```

Example objective:

```text
Retrieve PROJECT_ATLAS.pdf.
```

Possible routes might eventually include:

```text
WEB-01
→ DEV-01
→ FIN-APP
→ FIN-DB
```

or:

```text
VPN compromise
→ employee identity
→ FILE-01
→ backup credential
→ BACKUP-01
→ FIN-DB
```

Different paths should create different evidence.

---

## 3.5 Defense Has Consequences

Blue Team must not win by shutting down everything.

Response actions affect business operations.

Example:

```text
Isolate FIN-APP

Security:
Attacker access disrupted.

Business:
Finance application unavailable.
Active legitimate sessions terminated.
```

Blue gameplay should therefore involve:

```text
security risk
vs
operational risk
```

---

## 3.6 The Simulation Comes First

ROOT should be developed as:

> a cybersecurity simulation engine with games and scenarios built on top

rather than:

> a collection of scripted hacking puzzles.

New scenarios should reuse:

* machines
* networks
* identities
* permissions
* credentials
* services
* vulnerabilities
* telemetry
* detection
* replay

instead of requiring one-off logic.

---

# 4. Genre and Positioning

ROOT should be positioned as:

**Cybersecurity Immersive Sim / Strategy / Investigation**

rather than only:

**Hacking Simulator**

Comparable products and adjacent references include:

* Hacknet
* Grey Hack
* NITE Team 4
* Hacker's Journey
* Cyber Academy
* TryHackMe
* Hack The Box

The market gap ROOT is intended to occupy is:

> realistic cybersecurity concepts + approachable onboarding + asymmetric Red-vs-Blue gameplay + shared simulated infrastructure + emergent stories.

ROOT must avoid becoming:

> TryHackMe with prettier UI.

The differentiator is not simply realism.

The differentiator is **realistic systems producing interesting game decisions**.

---

# 5. Target Player Types

ROOT should support several audiences using the same underlying simulation.

## Casual Player

Wants:

* visual interaction
* understandable objectives
* minimal command memorization
* strong story
* gradual learning

## Intermediate Player

Wants:

* hybrid GUI + terminal
* more independence
* open-ended investigation
* multiple attack paths

## Technical Player

Wants:

* realistic concepts
* command-driven interaction
* limited hand-holding
* meaningful systems
* deep replayability

## Competitive Player

Wants:

* Red-vs-Blue PvP
* ranking
* mastery
* strategy
* opponent adaptation

The simulation should remain the same.

Only the amount of exposed assistance changes.

---

# 6. Assistance Modes

## Casual Mode

Visual-first.

Includes:

* clickable systems
* contextual explanations
* suggested next actions
* simplified commands
* highlighted relationships
* extensive documentation

Player progression:

```text
clicking
→ recognizing
→ understanding
→ typing
```

## Operator Mode

Hybrid UI + terminal.

Includes:

* mission objective
* docs
* tools
* normal interface
* limited contextual support

No step-by-step answers.

## Real Terminal / Black Box Mode

Advanced mode.

Includes:

* minimal guidance
* terminal-heavy interaction
* incomplete information
* little automatic interpretation
* larger environments

Difficulty should primarily change **information exposure**, not increase artificial enemy stats.

---

# 7. Player Progression Structure

ROOT separates five progression systems:

```text
Operator Level
Designation
Proficiency
Certifications
Competitive Rank
```

They serve different purposes.

---

# 8. Operator Level

Represents time and experience within ROOT.

Suggested range:

```text
Level 1–100
```

XP can come from:

* completing operations
* optional objectives
* challenge scenarios
* first-time concept demonstrations
* Red gameplay
* Blue gameplay
* certifications

XP should not come from command spam.

Bad:

```text
Run nmap 500 times.
```

Good:

```text
Complete three different reconnaissance operations.
```

Operator Level may unlock:

* operations
* challenge modes
* tools
* profile customization
* certifications
* cosmetics

It must not make commands or exploits statistically stronger.

---

# 9. Nodeline Designations

Career progression:

```text
Recruit
↓
Junior Operator
↓
Operator
↓
Specialist
↓
Senior Specialist
↓
Veteran
```

These are PvE/career labels.

They are separate from PvP ranking.

---

# 10. Knowledge Proficiency

ROOT tracks concepts based on demonstrated gameplay.

Core states:

```text
Introduced
Practiced
Demonstrated
Proficient
Mastered
```

Potential competency categories:

## Networking

* Host Discovery
* Ports
* Services
* Routing
* Segmentation
* Network Trust

## Identity

* Authentication
* Credentials
* Authorization
* Service Accounts
* Session Management

## Offensive

* Reconnaissance
* Initial Access
* Privilege Escalation
* Lateral Movement
* Persistence
* Exfiltration

## Defensive

* Log Analysis
* Alert Investigation
* Detection
* Threat Hunting
* Containment
* Incident Response
* Recovery

The system should infer proficiency from meaningful behaviors rather than quiz scores alone.

---

# 11. Certifications

Nodeline may provide fictional certifications.

Examples:

```text
NRO-1
Network Reconnaissance Operator

NOO-1
Offensive Operations

NPE-1
Privilege Escalation Specialist

NTH-1
Threat Hunter

NIR-1
Incident Responder
```

Certifications should unlock:

* special operations
* profile recognition
* challenge scenarios

They should not provide stat bonuses.

---

# 12. Competitive Ranking

Red and Blue receive separate competitive rankings.

Example:

```text
Unranked
Bronze
Silver
Gold
Platinum
Diamond
Master
Elite
```

A player may therefore have:

```text
Red Rank:
Diamond III

Blue Rank:
Gold I
```

This encourages specialization.

Competitive outcome should matter most for rating.

Performance analytics may separately measure:

## Red

* objective completion
* time to access
* time to objective
* evidence generated
* attack path
* persistence
* sessions maintained

## Blue

* objective prevented
* detection time
* containment time
* business uptime
* false positives
* persistence removed
* compromised hosts

---

# 13. ROOT/OS

ROOT/OS is the player's fictional security workstation.

It should serve as:

* the main UI
* the narrative interface
* the player's tool environment
* the Red platform
* the Blue platform

ROOT/OS should not look like modern consumer software.

The canonical visual direction is:

> corporate security software from an alternate 2003–2012 timeline.

Influences:

* UNIX workstations
* corporate internal software
* SOC dashboards
* intelligence interfaces
* CCTV / surveillance tools
* old enterprise portals
* restrained Mr. Robot-style paranoia

Avoid:

* neon cyberpunk
* Matrix rain
* giant glowing skulls
* excessive RGB
* constant visual glitches

The internal visual formula should roughly be:

```text
50% enterprise software
30% terminal / UNIX culture
15% surveillance / intelligence workstation
5% analog imperfection / glitch
```

---

# 14. ROOT/OS Applications

Canonical application list:

## Core

* Terminal
* Network Map
* Files
* Browser
* Mission
* Sessions
* Credentials
* Intel
* Processes

## Blue

* Logs
* SIEM
* Alerts
* Incident Workspace
* Authentication Viewer
* Response Actions
* Service Availability

## Supporting

* Mail
* Toolbox
* Documentation
* Knowledge Tracker
* Case Board
* Replay
* Operator Profile

---

# 15. Core Screens

Full product UI includes:

* Boot Screen
* Login / Operator Authentication
* Operator Profile
* Career Hub
* Mission Select
* Case Board
* ROOT/OS Desktop
* Terminal
* Network Map
* Browser
* Files
* Mail
* Credentials
* Sessions
* Intel
* Logs / SIEM
* Processes
* Toolbox
* Incident Workspace
* Knowledge Tracker
* Post-Mission Debrief
* Reconstruction
* PvP Lobby
* Red Match UI
* Blue Match UI
* Match Results
* Private Match
* Settings
* Assistance Level
* Tutorial / Concept Library

---

# 16. Terminal

Terminal commands should simulate useful concepts rather than recreate an entire OS.

Initial production command surface:

## General

```text
help
clear
history
man
```

## System

```text
whoami
hostname
id
uname
env
```

## Files

```text
pwd
ls
cd
cat
find
grep
```

## Networking

```text
ip
ping
traceroute
nmap
curl
ssh
nc
```

## Processes

```text
ps
```

## Credentials

```text
john
```

## Exploitation

```text
msfconsole
```

## ROOT-Specific

```text
sessions
creds
intel
map
objectives
tools
```

The terminal should remain readable and understated.

No fake Hollywood output.

---

# 17. Tool Families

ROOT may eventually include simulated equivalents or concepts inspired by:

* Nmap
* Metasploit
* John the Ripper
* Hashcat
* Wireshark
* Burp Suite
* Gobuster / Dirsearch
* Nikto
* Hydra
* Netcat
* SIEM platforms
* EDR/process viewers

These must remain bounded inside the fictional simulation.

Tools should expose information.

The player should provide interpretation.

Tools should not be generic:

```text
HACK
```

buttons.

---

# 18. Network Simulation

The network model supports:

* hosts
* IP addresses
* subnets
* zones
* ports
* protocols
* services
* routing
* reachability
* firewall rules
* segmentation
* trust relationships
* connection blocking
* isolation

Different vantage points can reveal different infrastructure.

Example:

External scan:

```text
22 SSH
443 HTTPS
```

Internal scan:

```text
22 SSH
443 HTTPS
8080 HTTP
9000 backup-sync
```

This allows the game to teach:

> what you can see depends on where you are.

---

# 19. Machine Model

A simulated machine contains:

```text
id
hostname
ip
zone
os
users
groups
services
files
processes
sessions
permissions
connections
securityControls
vulnerabilities
credentials
persistence
```

Server state is authoritative.

Clients never directly mutate simulation state.

---

# 20. Identity System

Supported identity types may include:

* human users
* service accounts
* administrator accounts
* application identities
* machine identities

Associated security concepts:

* passwords
* hashes
* tokens
* API keys
* SSH keys
* groups
* roles
* sessions
* permissions

Identity should eventually be as strategically important as machines.

---

# 21. Credentials

Credentials are first-class simulation objects.

Potential properties:

```text
username
type
origin
knownScope
privilege
validity
machine
application
```

Example:

```text
Credential:
deploy

Type:
Deployment Token

Found:
WEB-01:/var/www/meridian/app.conf

Known Scope:
DEV-01

Status:
Valid
```

---

# 22. Filesystem

Filesystems contain meaningful but bounded structures.

Examples:

* application configs
* logs
* scripts
* user files
* backups
* secrets
* service configuration
* temporary files
* target documents

Files should often reveal relationships.

Example:

```text
/etc/backup-sync.conf
```

can reveal:

```text
service runs as root
deploy may modify config
```

That creates a privilege-escalation opportunity through reasoning.

---

# 23. Processes

Processes expose:

```text
PID
User
Parent Process
Command
Start Time
Host
```

Red uses processes to understand machine behavior.

Blue uses processes to identify abnormal execution.

---

# 24. Sessions

A session includes:

```text
actor
machine
user
privilege
source machine
creation time
active state
```

Session != access.

Access != persistence.

This distinction should become strategically important.

---

# 25. Privilege Model

Per-machine access levels:

```text
none
guest
user
service
admin
root
```

Later enterprise scenarios may add higher-level organization roles.

Privilege is never a universal player stat.

---

# 26. Privilege Escalation

Privilege escalation is a core ROOT mechanic.

Potential categories:

* local privilege escalation
* credential escalation
* service-account abuse
* role escalation
* network privilege escalation
* enterprise escalation

Potential causes:

* writable privileged configuration
* service misconfiguration
* scheduled task trust
* exposed credentials
* excessive group permissions
* environment configuration
* overprivileged accounts
* credential reuse
* trust relationships

The player should usually understand:

> Why does this escalate privileges?

not merely:

> Which exploit button gives root?

---

# 27. Reconnaissance

Recon systems include:

* DNS discovery
* host discovery
* service discovery
* port scanning
* technology identification
* route discovery
* user discovery
* application discovery

Recon should open possibilities rather than fill an arbitrary completion meter.

---

# 28. Initial Access

Possible simulated weaknesses:

* weak credential
* exposed secret
* web misconfiguration
* exposed service
* credential reuse
* excessive trust
* remote-access misconfiguration
* application authorization flaw

The first versions should remain game-oriented instead of simulating real CVEs.

---

# 29. Lateral Movement

Movement depends on:

* reachability
* credentials
* trust
* permissions
* service availability
* firewall rules

Example:

```text
WEB-01
↓
DEV-01
↓
FIN-APP
↓
FIN-DB
```

Each movement should produce evidence.

---

# 30. Persistence

Initial persistence:

```text
Remote Agent
```

Properties may include:

```text
owner
privilege
beacon interval
active state
process artifact
startup artifact
outbound connection
```

Later simulated persistence systems may include:

* scheduled tasks
* startup services
* application hooks
* persistent credentials

Persistence should provide actual strategic value.

Example:

Blue revokes SSH session.

Without persistence:

```text
Access lost.
```

With persistence:

```text
Agent reconnects.
New session available.
```

---

# 31. Advanced Simulated Malware Systems

Long-term gameplay may include fictional, simulation-bounded versions of:

* RATs
* trojans
* worms
* ransomware
* botnets
* keyloggers
* credential stealers
* web shells
* reverse shells
* rootkits
* loaders
* backdoors

These are game systems, not real-world malware tooling.

Possible gameplay properties:

* beacon rate
* privilege
* persistence
* disk footprint
* process visibility
* network behavior
* command latency
* evidence generated
* detection exposure

These systems are not MVP scope.

---

# 32. Scripting

Advanced players may eventually automate operations.

Possible in-game APIs:

```text
root.hosts()
root.scan(host)
root.logs(filter)
root.sessions()
```

Possible scripting uses:

* recon automation
* log parsing
* session management
* custom workflows
* Blue detection logic

Scripting should create recognizable operator styles.

It must not be required for beginner content.

---

# 33. Security Event Model

Every meaningful action produces events containing approximately:

```text
id
timestamp
actor
source
target
user
category
action
visibility
severity
metadata
```

Categories:

```text
network
auth
process
filesystem
web
privilege
persistence
system
```

The Event Bus is the backbone of ROOT.

---

# 34. Detection Engine

Detections operate on real simulation events.

Example rules:

## Port Scan

Pattern:

```text
multiple connection attempts
same source
short time window
```

## Suspicious Web Activity

Pattern:

```text
unexpected request behavior
followed by server process creation
```

## Privileged Configuration Modification

Pattern:

```text
non-root identity
modifies privileged service configuration
```

## Unusual Internal Login

Pattern:

```text
valid credential
unusual source
new host relationship
```

## Sensitive Finance Access

Pattern:

```text
finance system access
unexpected source
```

Detections should be explainable.

---

# 35. Red OPSEC

ROOT should not secretly depend on a simple stealth meter.

Under the hood:

```text
evidence
→ detections
→ Blue investigation
```

The Red UI may summarize current exposure:

```text
Network Activity:
Elevated

Authentication Noise:
Moderate

Endpoint Evidence:
Low
```

But Blue still decides what events mean.

---

# 36. Blue Investigation Loop

Canonical Blue loop:

```text
Observe
↓
Notice anomaly
↓
Investigate
↓
Correlate evidence
↓
Form hypothesis
↓
Confirm compromise
↓
Contain
↓
Recover
```

Blue should feel like investigation rather than whack-a-mole.

---

# 37. Incident Workspace

Blue can group evidence into incidents.

Example:

```text
INC-2041

Possible DEV-01 Compromise

Evidence:

WEB-01 → DEV-01
deploy authentication

/etc/backup-sync.conf
modified by deploy

root backup-sync child process

Status:
Investigating
```

---

# 38. Blue Response Actions

Initial set:

```text
Inspect Host
Inspect User
Inspect Process
Revoke Session
Reset Password
Block Connection
Isolate Host
Restore Host
Increase Monitoring
Remove Persistence
```

Expanded later:

```text
Disable Identity
Stop Process
Quarantine File
Restart Service
Block Source
```

Each response mutates the same simulation state.

---

# 39. Business Availability

Business services may include:

```text
Web Portal
Developer Services
Finance Application
Finance Database
Email
Authentication
Payroll
Backups
```

States:

```text
healthy
degraded
offline
```

Containment may reduce attacker access while harming availability.

---

# 40. Intel System

ROOT/OS should automatically record meaningful discoveries.

Example:

```text
HOSTS

WEB-01
DEV-01
FIN-APP

CREDENTIALS

deploy
svc_web

NETWORKS

10.10.10.0/24
10.20.10.0/24

RELATIONSHIPS

WEB-01 → DEV-01
FIN-APP → FIN-DB
```

This avoids forcing players to maintain external notes.

---

# 41. Network Map

Red node states:

```text
Unknown
Discovered
Reachable
Accessed
Compromised
Isolated
Offline
```

Blue node states:

```text
Healthy
Suspicious
Investigating
Compromised
Contained
Offline
```

Red and Blue may view the same host differently.

---

# 42. Objectives

Possible Red objectives:

* retrieve file
* gain privileged access
* reach restricted network
* establish persistence
* demonstrate access
* compromise identity

Possible Blue objectives:

* prevent data theft
* identify compromised systems
* contain attacker
* protect business service
* remove persistence
* reconstruct attack path

---

# 43. Mission Constraints

Examples:

```text
Do not disrupt production.
Do not access HR.
Maintain >90% availability.
Remain within authorized network scope.
Do not modify financial records.
```

Constraints create strategic decisions.

---

# 44. Post-Operation Reconstruction

Mandatory.

Modes:

```text
RED VIEW
BLUE VIEW
FULL TRUTH
```

Timeline should include:

* actions
* state changes
* sessions
* detections
* alerts
* Blue responses
* attacker movement
* business impact
* objective events

Production version may include:

* timeline scrubber
* network map over time
* session timeline
* evidence timeline
* alert timeline
* attack path visualization
* missed opportunities
* key decisions

---

# 45. After-Action Report

Example:

```text
OPERATION GLASSHOUSE

Result:
RED SUCCESS

Duration:
23:41

Initial Access:
04:17

Root Access:
11:04

Detected:
16:43

Objective:
22:52

Persistence:
YES
```

More important than raw scores:

```text
KEY DECISION

You authenticated from WEB-01 to DEV-01
using the deploy identity.

Blue observed the login,
but did not investigate the unusual
machine relationship.
```

This is where ROOT becomes educational without turning into a lesson.

---

# 46. Campaign World

The player works for:

**Nodeline Security**

Nodeline is a cybersecurity consultancy focused on:

* security assessments
* adversary simulation
* incident response
* threat hunting
* research

ROOT/OS is Nodeline's internal cyber operations platform.

---

# 47. Player Role

The player joins Nodeline as a new operator.

They are not defined only as a hacker.

They progress through both offensive and defensive work.

Early career:

```text
Recruit
↓
Junior Operator
```

Later:

```text
Red Operations
Incident Response
Threat Hunting
Advanced Assessments
```

---

# 48. Campaign Structure

Canonical campaign arc:

## Act I — Helpdesk / Orientation

Player learns basic systems.

Potential missions:

* The Printer
* Where Did the Website Go?
* Locked Out

Concepts:

* IP
* host
* port
* service
* users
* basic logs

---

## Act II — SOC

Defensive fundamentals.

Potential missions:

* The Strange Login
* False Alarm
* Something Is Calling Home
* The Quiet One
* Friday Night

Concepts:

* authentication
* logs
* anomalies
* processes
* incident investigation

---

## Act III — Red Team

Offensive operations.

Potential missions:

* The Front Door
* The Forgotten Server
* The Trust Problem
* Valid User

Concepts:

* recon
* access
* credentials
* privilege escalation
* lateral movement

---

## Act IV — Incident Response

Larger breaches.

Potential missions:

* No One Knows
* Ghost Account
* The Backup
* Night Shift

Concepts:

* persistence
* containment
* business impact
* recovery

---

## Act V — The Breach

Connected story.

Potential missions:

* Inside
* Who Are They?
* Cut the Lights
* ROOT

The player discovers that some previous incidents are connected.

The story should remain grounded rather than immediately becoming world-ending cyberfiction.

---

# 49. Story Tone

The tone should be:

* corporate
* technical
* restrained
* paranoid
* believable
* investigative

Story delivery should primarily use:

* internal emails
* incident reports
* chat
* case files
* logs
* intelligence reports
* voicemail transcripts
* corporate portals

Avoid excessive cinematic interruptions.

---

# 50. Operation Glasshouse

Canonical early Red operation.

Client:

```text
Meridian Dynamics
```

Organization:

fictional logistics technology company.

Objective:

```text
Retrieve PROJECT_ATLAS.pdf
from FIN-DB.
```

Initial known information:

```text
portal.meridian.test
```

Primary POC path:

```text
Recon
↓
WEB-01
↓
Initial Access
↓
Read Application Configuration
↓
Discover Deploy Credential
↓
DEV-01
↓
Privilege Escalation
↓
Discover Finance Route
↓
FIN-APP
↓
Credential Access
↓
FIN-DB
↓
PROJECT_ATLAS.pdf
```

---

# 51. Meridian Initial Network

POC version:

```text
                    INTERNET
                       │
                    EDGE-FW
                       │
              ┌────────┴────────┐
              │                 │
           WEB-01             VPN-01
              │
           INTERNAL
              │
      ┌───────┴────────┐
      │                │
   DEV-01           FIN-APP
                       │
                    FIN-DB
                       │
                   BACKUP-01
```

Expanded MVP may add:

```text
MAIL-01
APP-01
DEV-02
FILE-01
MON-01
```

Not every machine should be vulnerable.

Some exist only for:

* information
* business function
* alternate routes
* decoys
* background context

---

# 52. Expanded MVP Scenario Set

Initial larger MVP should contain approximately three meaningful operations.

## Operation Glasshouse

Focus:

* fundamentals
* Red path
* privilege escalation
* finance pivot

## Operation Nightshift

Focus:

* authentication
* credential reuse
* persistence
* identity

## Operation Dead Drop

Focus:

* segmentation
* multiple routes
* pivoting
* evidence management

Each scenario should support:

```text
Guided Red
Operator Red
Blue
```

Target total first-play content:

```text
3–6 hours
```

---

# 53. PvP

Primary competitive mode:

```text
1 Red
vs
1 Blue
```

Both players operate in the same organization.

Example:

Red:

```text
Retrieve sensitive financial intelligence.
```

Blue:

```text
Prevent unauthorized extraction.
Maintain >80% business availability.
```

Neither sees the other's information directly.

Post-match:

```text
RED VIEW
BLUE VIEW
FULL TRUTH
```

---

# 54. Team PvP

Long-term:

```text
2v2
3v3
```

Suggested soft roles:

Red:

* Recon / Initial Access
* Internal Operator
* Persistence / Objective

Blue:

* SOC Analyst
* Threat Hunter
* Incident Responder

Roles should not hard-lock actions.

---

# 55. Unranked Modes

Unranked should exist before ranked.

Possible modes:

* Red vs Blue
* Practice
* Private Match
* Cyber Heist / Co-op
* Challenge Operations

---

# 56. Challenge Operations

Veteran content.

Example:

```text
WEEKLY OPERATION

BLACK BOX

No map.
No hints.
No suggested commands.

Objective:
Locate ACQUISITION_PLAN.pdf.

Restriction:
Do not cause service outage.

Time:
45 minutes.
```

Possible leaderboards:

* fastest completion
* lowest evidence
* fastest containment
* highest uptime

---

# 57. Scenario Architecture

Scenarios should eventually be data-driven.

Potential operation definition:

```text
organization
network
machines
users
services
files
credentials
vulnerabilities
securityControls
objectives
restrictions
redStartState
blueStartState
aiProfile
timeLimit
```

New content should rarely require new simulation code.

---

# 58. Internal Content Authoring Tools

Long-term internal editor:

* Network Builder
* Machine Editor
* User Editor
* File Editor
* Service Editor
* Credential Editor
* Vulnerability Editor
* Detection Editor
* Objective Editor
* AI Path Editor
* Scenario Validator

This is essential for sustainable content production.

---

# 59. Technical Architecture

Recommended structure:

```text
ROOT CLIENT
    │
    ▼
ACTION API / GATEWAY
    │
    ▼
SIMULATION ENGINE
    │
    ├── Network
    ├── Machines
    ├── Identity
    ├── Credentials
    ├── Permissions
    ├── Sessions
    ├── Processes
    ├── Files
    ├── Vulnerabilities
    └── Persistence
    │
    ▼
STATE STORE
    │
    ▼
EVENT BUS
   / | \
  /  |  \
RED BLUE TRUTH
     │
     ▼
DETECTION ENGINE
     │
     ▼
ALERTS
     │
     ▼
EVENT STORE
     │
     ▼
REPLAY
```

All meaningful actions are server-authoritative.

---

# 60. Action Model

Clients submit intentions.

Example:

```ts
{
  type: "SCAN_HOST",
  targetMachineId: "web-01"
}
```

Server determines:

* whether target is known
* whether target is reachable
* what information is returned
* what events are emitted
* what Blue can observe
* whether detection rules trigger
* how state changes

The client must never decide success.

---

# 61. Recommended Stack

Initial recommendation:

```text
Frontend
Next.js
React
TypeScript

Simulation Server
Node.js
TypeScript

Transport
HTTP
WebSockets

Database
PostgreSQL

ORM
Prisma
```

Early POC may run entirely in memory.

Later production may add:

```text
Redis
containerized game servers
structured logging
metrics
error tracking
```

---

# 62. Visual Direction

Canonical art direction:

> Mr. Robot meets neglected enterprise software meets UNIX workstation meets late-night SOC.

ROOT should look slightly more boring than the player expects.

That normality makes anomalies more unsettling.

---

# 63. UI Palette Principles

Use:

* dark charcoal backgrounds
* off-white text
* muted phosphor green
* amber warnings
* restrained red
* corporate blue-gray

Color should communicate state.

Example:

```text
Green:
Healthy / Successful

Amber:
Suspicious / Investigation

Red:
Confirmed compromise / Critical

Gray:
Normal data

Blue-gray:
Corporate infrastructure/navigation
```

Avoid green everywhere.

---

# 64. Typography

Use monospace for:

* terminal
* logs
* machine data
* technical metadata

Use sans-serif for:

* corporate documents
* mail
* mission briefs
* reports

This separates:

```text
system output
from
human/corporate information
```

---

# 65. ROOT/OS Desktop Layout

Possible top bar:

```text
ROOT/OS 3.4
NODELINE // OPS
03:14:27 UTC
SECURE ●
```

Possible launcher:

```text
TERMINAL
NETWORK
FILES
BROWSER
INTEL
SESSIONS
LOGS
MISSION
```

Status bar:

```text
SESSION: deploy@DEV-01
PRIVILEGE: USER
NETWORK: INTERNAL
OPSEC: NOMINAL
```

The player should always understand:

* current host
* current user
* current privilege
* current session
* known objective

---

# 66. Corporate UI Principles

Client systems should look normal.

Example:

```text
MERIDIAN DYNAMICS
Employee Access Portal

Username
Password

SIGN IN
```

Internal systems should feel old, maintained, and believable.

This is preferable to stereotypical “hacker” interfaces.

---

# 67. Blue UI Direction

Blue should look more enterprise-oriented than Red.

Example layout:

```text
ALERTS
│
├── EVENT STREAM
│
└── HOST / IDENTITY CONTEXT
```

Use:

* dense tables
* timestamps
* filters
* raw events
* small charts
* contextual panels

Alerts should remain professional.

Never:

```text
HACKER DETECTED!!!
```

Prefer:

```text
RULE:
PRIV-SVC-CONFIG-01

SEVERITY:
HIGH

HOST:
DEV-01

USER:
deploy

EVENT:
Privileged service configuration modified.
```

---

# 68. Sound Direction

Atmosphere:

* quiet server-room hum
* HVAC
* mechanical keyboard
* CRT startup
* disk activity
* relay clicks
* muted notification tones
* distant office ambience

High-severity alerts should not sound like arcade sirens.

Small professional sounds become meaningful once the player understands them.

---

# 69. Glitch Direction

Glitches should be rare.

Possible uses:

* boot
* corruption
* session failure
* unauthorized access
* major story event

Possible effects:

* horizontal distortion
* single-frame text corruption
* cursor freeze
* character duplication
* brief clock desync
* phosphor trails

If everything glitches, glitches lose meaning.

---

# 70. Production Roadmap

## Milestone 0 — Design Lock

Deliver:

* product pillars
* terminology
* architecture
* Red loop
* Blue loop
* network model
* identity model
* event model
* scenario structure
* UI direction
* campaign direction

Exit condition:

The team can describe exactly what happens when a player performs a basic action such as:

```text
ssh deploy@DEV-01
```

---

## Milestone 1 — Simulation Foundation

Build:

* machines
* users
* services
* files
* sessions
* permissions
* credentials
* network rules
* events

Testing may be API/dev-tool driven.

Exit condition:

A developer can:

```text
discover host
scan
authenticate
read files
create session
change privilege
move laterally
retrieve objective
```

and receive correct events.

---

## Milestone 2 — Red Playable Prototype

Build:

* ROOT/OS shell
* terminal
* network map
* mission
* files
* credentials
* sessions
* Intel

Commands:

```text
nmap
ssh
ls
cd
cat
ps
whoami
curl
```

Content:

```text
Operation Glasshouse
```

Exit condition:

A tester can complete:

```text
Recon
→ Initial Access
→ Credential Discovery
→ DEV-01
→ Privilege Escalation
→ Finance
→ Objective
```

without developer help.

---

## Milestone 3 — Event / Detection / Replay

Build:

* persistent event history
* visibility filtering
* Red view
* Blue view
* Full Truth
* detection rules
* timeline
* replay

Exit condition:

Glasshouse can be replayed from all three perspectives.

This is a critical validation milestone.

---

## Milestone 4 — Expanded MVP

Add:

* 10–12 machine archetypes
* 15–20 terminal commands
* Intel system
* credentials UI
* multiple routes
* persistence
* evidence summaries
* business availability
* Guided Mode
* Operator Mode
* basic progression

Content:

* Glasshouse
* Nightshift
* Dead Drop

Target:

```text
3–6 hours first-play content
```

This is officially:

# ROOT MVP

---

## Milestone 5 — Blue Team Alpha

Build:

* SIEM
* alerts
* auth viewer
* process viewer
* incident workspace
* response actions
* service availability
* scripted Red AI

Exit condition:

Glasshouse is playable as both Red and Blue.

---

## Milestone 6 — Content Alpha

Target:

* 5–7 fictional organizations
* 8–12 operations
* Red variants
* Blue variants
* campaign progression
* training range
* certifications
* player profile
* proficiency
* designations

Target campaign length:

```text
8–12 hours
```

Exit condition:

A completely new player can progress from Recruit to Operator without external learning material.

---

## Milestone 7 — Multiplayer Alpha

Build:

* accounts
* match lobbies
* authoritative match servers
* reconnect
* 1v1 Red vs Blue
* spectator foundation
* replay
* match results

Unranked first.

Exit condition:

Repeated matches complete without simulation desynchronization.

---

## Milestone 8 — Beta / Early Access Candidate

Add:

* ranked Red
* ranked Blue
* matchmaking
* competitive analytics
* advanced operations
* Veteran scenarios
* challenge modes
* accessibility
* performance optimization
* crash reporting
* telemetry
* moderation/reporting

Content target:

```text
10–15 organizations
15–20 operations
multiple Red AI profiles
multiple Blue scenarios
```

Campaign:

```text
12–20 hours
```

plus replayability.

---

## Milestone 9 — ROOT 1.0

Target:

### Content

* complete Nodeline campaign
* ~20+ operations
* ~10–15 organizations
* Guided Mode
* Operator Mode
* Veteran challenges

### Gameplay

* Red
* Blue
* AI adversaries
* 1v1 PvP
* replay
* Red/Blue/Truth reconstruction
* progression
* proficiency
* certifications
* rankings

### Production

* scenario authoring tools
* analytics
* accessibility
* stable backend
* production matchmaking
* polished onboarding

---

# 71. Post-1.0 Roadmap

Potential expansions:

```text
2v2
3v3

Advanced scripting

Packet Viewer

Cloud infrastructure

Enterprise identity

Active Directory-inspired simulation

Containers

Advanced malware simulation

More operating systems

Threat Intelligence

Advanced forensics

Procedural organizations

Community scenarios

Scenario editor

Mod support

Persistent simulated internet
```

These are explicitly **not required for MVP or 1.0 unless scope changes intentionally**.

---

# 72. Anti-Scope-Creep List

Do not add prematurely:

* MMO world
* clans
* marketplace
* cosmetics store
* large procedural world
* hundreds of commands
* dozens of exploits
* real malware execution
* full Active Directory
* Kubernetes
* cloud simulation
* packet-level realism
* full scripting IDE
* large-scale PvP
* mobile client

The simulation core must prove itself first.

---

# 73. Production Gates

Each major milestone answers one question.

```text
SIMULATION FOUNDATION

Does the world behave consistently?

↓

RED PROTOTYPE

Is investigating and attacking the network fun?

↓

REPLAY

Does an operation create an interesting story?

↓

EXPANDED MVP

Does understanding the system create meaningful choices?

↓

BLUE TEAM

Is investigating the same simulation fun?

↓

CONTENT ALPHA

Can a beginner learn through gameplay?

↓

MULTIPLAYER

Does the simulation remain coherent with opposing humans?

↓

BETA

Do players want to improve and replay operations?

↓

1.0

Does ROOT contain enough systems and content to stand as a complete game?
```

---

# 74. Approximate Production Timeline

For a focused small team, a rough planning model may be:

```text
Months 0–2
Design + Simulation Foundation

Months 2–4
Red Prototype

Months 4–6
Replay + Expanded MVP

Months 6–9
Blue + Progression + Content Tools

Months 9–12
Content Alpha

Months 12–15
Multiplayer + Beta

Months 15–18+
Early Access / 1.0 Preparation
```

This is a planning framework, not a fixed commitment.

---

# 75. Definition of ROOT

ROOT succeeds when a beginner can eventually move from:

```text
What is a port?
```

to:

```text
Why is this service reachable from this subnet?

Why is this account authenticating from this machine?

Why can this low-privilege user modify something a root service trusts?

Why is this login technically valid but still suspicious?

What evidence will this action generate?

Can I contain this machine without destroying the client's operations?
```

without the game simply telling them the answers.

The player should gradually stop seeing:

```text
machines
ports
users
logs
```

as isolated objects.

They should begin seeing:

```text
relationships
trust
identity
behavior
evidence
risk
```

That transformation is ROOT's real progression system.

---

# 76. Canonical Product Principle

ROOT must never ultimately ask:

> Did the player unlock enough hacking power?

ROOT asks:

> Did the player understand the system well enough to make the right decision?

Everything else exists to support that principle.
