**# ROOT — Canonical Product Plan**

**## 1. Product Definition**

ROOT is a browser-native cybersecurity RPG, immersive simulation, investigation game, and competitive strategy game built around realistic but fully simulated computer systems.

The player operates through a fictional security operating environment called **\*\*ROOT/OS\*\***.

ROOT is not primarily about memorizing commands, collecting hacking gear, increasing arbitrary stats, or pressing an “exploit” button.

ROOT is about understanding:

\* networks

\* machines

\* users

\* identities

\* permissions

\* credentials

\* services

\* applications

\* trust relationships

\* processes

\* files

\* security controls

\* logs

\* evidence

\* business impact

The central question behind every mechanic is:

*> Did the player understand the system well enough to make the right decision?*

ROOT should always remain a **\*\*game first and a cybersecurity course second\*\***.

The educational value should emerge through gameplay rather than lectures.

\---

**# 2. Core Fantasy**

ROOT delivers two primary fantasies.

**## Red Team Fantasy**

*> I understand this environment well enough to find a path through it that the defenders did not anticipate.*

The player:

\* investigates the organization

\* discovers infrastructure

\* identifies relationships

\* gains access

\* escalates privileges

\* moves laterally

\* establishes persistence

\* reaches protected objectives

\* manages the evidence they create

**## Blue Team Fantasy**

*> I understand the evidence well enough to determine what is happening before the attacker completes their objective.*

The player:

\* monitors telemetry

\* identifies anomalies

\* investigates events

\* correlates evidence

\* forms hypotheses

\* identifies compromised identities and systems

\* contains the attacker

\* removes persistence

\* restores services

\* balances security against operational impact

Red and Blue operate against the **\*\*same underlying simulation\*\***.

This is one of ROOT's defining features.

\---

**# 3. Core Design Pillars**

**## 3.1 Knowledge Is Power**

Progress comes primarily from player understanding.

A veteran is dangerous because they recognize relationships a beginner does not.

Example:

A beginner sees:

\`\`\`text

root  backup-sync

\`\`\`

A veteran asks:

\`\`\`text

Who controls its configuration?

What does the service trust?

Who can modify those inputs?

When does the service restart?

\`\`\`

ROOT should reward this style of reasoning.

\---

**## 3.2 Everything Leaves Evidence**

Every meaningful action produces simulation events.

Examples:

\`\`\`text

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

\`\`\`

These events can power:

\* Red feedback

\* Blue telemetry

\* detection rules

\* alerts

\* replay

\* scoring

\* post-operation analysis

\* learning systems

There should be no fake separation between “game events” and “security events.”

They should be the same underlying truth.

\---

**## 3.3 Information Is Asymmetric**

No participant sees everything during an operation.

Red knows:

\* their sessions

\* their discoveries

\* their credentials

\* their actions

\* some evidence indicators

Blue knows:

\* monitored infrastructure

\* available telemetry

\* alerts

\* legitimate business context

\* some attacker activity

Neither sees full truth.

After an operation, ROOT reveals:

\`\`\`text

RED VIEW

BLUE VIEW

FULL TRUTH

\`\`\`

This post-operation reconstruction is a flagship feature.

\---

**## 3.4 Multiple Solutions**

ROOT should gradually move away from single-scripted attack paths.

An objective should define:

\`\`\`text

WHAT must happen

\`\`\`

rather than always:

\`\`\`text

HOW it must happen

\`\`\`

Example objective:

\`\`\`text

Retrieve PROJECT\_ATLAS.pdf.

\`\`\`

Possible routes might eventually include:

\`\`\`text

WEB-01

→ DEV-01

→ FIN-APP

→ FIN-DB

\`\`\`

or:

\`\`\`text

VPN compromise

→ employee identity

→ FILE-01

→ backup credential

→ BACKUP-01

→ FIN-DB

\`\`\`

Different paths should create different evidence.

\---

**## 3.5 Defense Has Consequences**

Blue Team must not win by shutting down everything.

Response actions affect business operations.

Example:

\`\`\`text

Isolate FIN-APP

Security:

Attacker access disrupted.

Business:

Finance application unavailable.

Active legitimate sessions terminated.

\`\`\`

Blue gameplay should therefore involve:

\`\`\`text

security risk

vs

operational risk

\`\`\`

\---

**## 3.6 The Simulation Comes First**

ROOT should be developed as:

*> a cybersecurity simulation engine with games and scenarios built on top*

rather than:

*> a collection of scripted hacking puzzles.*

New scenarios should reuse:

\* machines

\* networks

\* identities

\* permissions

\* credentials

\* services

\* vulnerabilities

\* telemetry

\* detection

\* replay

instead of requiring one-off logic.

\---

**# 4. Genre and Positioning**

ROOT should be positioned as:

**\*\*Cybersecurity Immersive Sim / Strategy / Investigation\*\***

rather than only:

**\*\*Hacking Simulator\*\***

Comparable products and adjacent references include:

\* Hacknet

\* Grey Hack

\* NITE Team 4

\* Hacker's Journey

\* Cyber Academy

\* TryHackMe

\* Hack The Box

The market gap ROOT is intended to occupy is:

*> realistic cybersecurity concepts + approachable onboarding + asymmetric Red-vs-Blue gameplay + shared simulated infrastructure + emergent stories.*

ROOT must avoid becoming:

*> TryHackMe with prettier UI.*

The differentiator is not simply realism.

The differentiator is **\*\*realistic systems producing interesting game decisions\*\***.

\---

**# 5. Target Player Types**

ROOT should support several audiences using the same underlying simulation.

**## Casual Player**

Wants:

\* visual interaction

\* understandable objectives

\* minimal command memorization

\* strong story

\* gradual learning

**## Intermediate Player**

Wants:

\* hybrid GUI + terminal

\* more independence

\* open-ended investigation

\* multiple attack paths

**## Technical Player**

Wants:

\* realistic concepts

\* command-driven interaction

\* limited hand-holding

\* meaningful systems

\* deep replayability

**## Competitive Player**

Wants:

\* Red-vs-Blue PvP

\* ranking

\* mastery

\* strategy

\* opponent adaptation

The simulation should remain the same.

Only the amount of exposed assistance changes.

\---

**# 6. Assistance Modes**

**## Casual Mode**

Visual-first.

Includes:

\* clickable systems

\* contextual explanations

\* suggested next actions

\* simplified commands

\* highlighted relationships

\* extensive documentation

Player progression:

\`\`\`text

clicking

→ recognizing

→ understanding

→ typing

\`\`\`

**## Operator Mode**

Hybrid UI + terminal.

Includes:

\* mission objective

\* docs

\* tools

\* normal interface

\* limited contextual support

No step-by-step answers.

**## Real Terminal / Black Box Mode**

Advanced mode.

Includes:

\* minimal guidance

\* terminal-heavy interaction

\* incomplete information

\* little automatic interpretation

\* larger environments

Difficulty should primarily change **\*\*information exposure\*\***, not increase artificial enemy stats.

\---

**# 7. Player Progression Structure**

ROOT separates five progression systems:

\`\`\`text

Operator Level

Designation

Proficiency

Certifications

Competitive Rank

\`\`\`

They serve different purposes.

\---

**# 8. Operator Level**

Represents time and experience within ROOT.

Suggested range:

\`\`\`text

Level 1–100

\`\`\`

XP can come from:

\* completing operations

\* optional objectives

\* challenge scenarios

\* first-time concept demonstrations

\* Red gameplay

\* Blue gameplay

\* certifications

XP should not come from command spam.

Bad:

\`\`\`text

Run nmap 500 times.

\`\`\`

Good:

\`\`\`text

Complete three different reconnaissance operations.

\`\`\`

Operator Level may unlock:

\* operations

\* challenge modes

\* tools

\* profile customization

\* certifications

\* cosmetics

It must not make commands or exploits statistically stronger.

\---

**# 9. Nodeline Designations**

Career progression:

\`\`\`text

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

\`\`\`

These are PvE/career labels.

They are separate from PvP ranking.

\---

**# 10. Knowledge Proficiency**

ROOT tracks cybersecurity understanding through demonstrated gameplay rather than command repetition or quiz scores.

Core states:

```text
Introduced
↓
Practiced
↓
Demonstrated
↓
Proficient
↓
Mastered
```

A concept advances only when the player proves they understand it in increasingly independent contexts.

Example:

```text
PORTS

Introduced:
Tutorial explains that services listen on ports.

Practiced:
Player inspects a host with guided assistance.

Demonstrated:
Player independently identifies a useful service from scan output.

Proficient:
Player uses service exposure to form a correct attack or defense hypothesis in a new operation.

Mastered:
Player repeatedly applies the concept across unfamiliar networks without guidance.
```

The Knowledge Tracker should record concepts, not commands.

Running `nmap` does not prove Network Reconnaissance proficiency.

Correctly interpreting reachable hosts, ports, services, segmentation, and trust does.

---

**## 10.1 Canonical Cybersecurity Knowledge Domains**

ROOT's long-term learning model is organized around ten reusable domains.

**### Computing / Operating Systems**

* files and directories
* users and groups
* permissions
* processes
* services
* environment variables
* command-line navigation
* system configuration

**### Networking**

* IP addressing
* subnets
* ports
* TCP and UDP
* DNS
* routing
* reachability
* NAT concepts
* firewalls
* segmentation
* network trust

**### Web Systems**

* HTTP requests and responses
* methods
* headers
* cookies
* sessions
* APIs
* authentication flows
* authorization
* common application misconfiguration

**### Databases**

* database hosts
* connection strings
* users and roles
* schemas
* tables
* SQL queries
* application credentials
* database permissions

**### Identity and Enterprise Access**

* authentication
* authorization
* human users
* groups
* service accounts
* machine identities
* tokens
* SSH keys
* credential scope
* role and trust relationships
* enterprise-directory concepts

**### Offensive Security**

* reconnaissance
* enumeration
* initial access
* credential discovery
* privilege escalation
* lateral movement
* persistence
* objective access
* evidence / OPSEC awareness

**### Defensive Security**

* telemetry
* log analysis
* alert investigation
* correlation
* threat hunting
* containment
* remediation
* recovery
* business availability

**### Network and Packet Analysis**

* connections
* DNS activity
* TCP flows
* HTTP traffic
* protocol relationships
* packet filtering
* source / destination reasoning

**### Cloud and Modern Infrastructure**

Long-term domain:

* IAM
* cloud identities
* virtual networks
* security groups
* storage permissions
* secrets
* hosted services
* containers
* cloud logging

**### Security Reasoning**

Cross-domain competency:

* form hypotheses
* test hypotheses
* distinguish evidence from assumptions
* map relationships
* understand trust
* predict consequences
* reconstruct incidents
* make decisions under incomplete information

Security Reasoning is the highest-order proficiency in ROOT.

---

**## 10.2 Player Learning Milestones**

ROOT should move a player through the same broad development path as practical cybersecurity training while remaining a game.

```text
M0 — Computer User
Understands files, users, processes, permissions, and basic terminal navigation.

M1 — Network Observer
Understands hosts, IPs, ports, services, DNS, routing, and reachability.

M2 — System Operator
Can navigate Linux-like systems, inspect configuration, logs, processes, and services.

M3 — Application Investigator
Understands HTTP, web applications, authentication, sessions, APIs, and databases.

M4 — Security Analyst
Can interpret vulnerabilities, credentials, permissions, trust, and evidence.

M5 — Red Operator
Can independently enumerate an environment and develop an attack path.

M6 — Blue Operator
Can investigate telemetry, correlate activity, contain compromise, and preserve business function.

M7 — Enterprise Operator
Can reason across multiple networks, identities, service accounts, trust relationships, and segmented systems.

M8 — Advanced Operator
Can solve unfamiliar environments without prescribed commands or routes.

M9 — Security Architect / Specialist
Can model attack paths, detections, controls, and systemic security tradeoffs.
```

The key transition is:

```text
What command should I run?
```

becoming:

```text
What do I know?
What do I not know?
What systems exist?
What identities exist?
What trusts what?
What evidence supports my hypothesis?
What action gives me the most useful information?
```

ROOT should explicitly design toward this transition.

---

**## 10.3 Learning Through Interfaces**

The same concept should be learnable through multiple ROOT/OS interfaces.

Example: authentication.

Red may encounter it through:

* `ssh`
* web login forms
* database credentials
* API tokens
* session cookies

Blue may encounter the same concept through:

* authentication logs
* source-host relationships
* failed-login patterns
* unusual successful logins
* session revocation

The underlying simulation concept is shared.

The interface changes.

---

**# 11. Certifications**

Nodeline may provide fictional certifications.

Examples:

\`\`\`text

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

\`\`\`

Certifications should unlock:

\* special operations

\* profile recognition

\* challenge scenarios

They should not provide stat bonuses.

\---

**# 12. Competitive Ranking**

Red and Blue receive separate competitive rankings.

Example:

\`\`\`text

Unranked

Bronze

Silver

Gold

Platinum

Diamond

Master

Elite

\`\`\`

A player may therefore have:

\`\`\`text

Red Rank:

Diamond III

Blue Rank:

Gold I

\`\`\`

This encourages specialization.

Competitive outcome should matter most for rating.

Performance analytics may separately measure:

**## Red**

\* objective completion

\* time to access

\* time to objective

\* evidence generated

\* attack path

\* persistence

\* sessions maintained

**## Blue**

\* objective prevented

\* detection time

\* containment time

\* business uptime

\* false positives

\* persistence removed

\* compromised hosts

\---

**# 13. ROOT/OS**

ROOT/OS is the player's fictional security workstation.

It should serve as:

\* the main UI

\* the narrative interface

\* the player's tool environment

\* the Red platform

\* the Blue platform

ROOT/OS should not look like modern consumer software.

The canonical visual direction is:

*> corporate security software from an alternate 2003–2012 timeline.*

Influences:

\* UNIX workstations

\* corporate internal software

\* SOC dashboards

\* intelligence interfaces

\* CCTV / surveillance tools

\* old enterprise portals

\* restrained Mr. Robot-style paranoia

Avoid:

\* neon cyberpunk

\* Matrix rain

\* giant glowing skulls

\* excessive RGB

\* constant visual glitches

The internal visual formula should roughly be:

\`\`\`text

50% enterprise software

30% terminal / UNIX culture

15% surveillance / intelligence workstation

5% analog imperfection / glitch

\`\`\`

\---

**# 14. ROOT/OS Applications**

Canonical application list:

**## Core**

\* Terminal

\* Network Map

\* Files

\* Browser

\* Mission

\* Sessions

\* Credentials

\* Intel

\* Processes

**## Blue**

\* Logs

\* SIEM

\* Alerts

\* Incident Workspace

\* Authentication Viewer

\* Response Actions

\* Service Availability

**## Supporting**

\* Mail

\* Toolbox

\* Documentation

\* Knowledge Tracker

\* Case Board

\* Replay

\* Operator Profile

\---

**# 15. Core Screens**

Full product UI includes:

\* Boot Screen

\* Login / Operator Authentication

\* Operator Profile

\* Career Hub

\* Mission Select

\* Case Board

\* ROOT/OS Desktop

\* Terminal

\* Network Map

\* Browser

\* Files

\* Mail

\* Credentials

\* Sessions

\* Intel

\* Logs / SIEM

\* Processes

\* Toolbox

\* Incident Workspace

\* Knowledge Tracker

\* Post-Mission Debrief

\* Reconstruction

\* PvP Lobby

\* Red Match UI

\* Blue Match UI

\* Match Results

\* Private Match

\* Settings

\* Assistance Level

\* Tutorial / Concept Library

\---

**# 16. Terminal**

The ROOT terminal is a bounded Unix-like interaction layer over the authoritative simulation.

It should resemble real tools closely enough that knowledge transfers, but it must not attempt to recreate an entire operating system.

Canonical principle:

> Simulate the reason a command works, not merely the command string.

A command is parsed into a simulation intention.

```text
PLAYER INPUT
    ↓
COMMAND PARSER
    ↓
TOOL / SERVICE ADAPTER
    ↓
SIMULATION ACTION
    ↓
AUTHORITATIVE WORLD STATE
    ↓
EVENTS + RESULT
    ↓
TERMINAL OUTPUT
```

Example:

```text
ssh deploy@DEV-01
```

is not a scripted success response.

The simulation evaluates:

```text
Does DEV-01 exist?
Is it reachable from the current vantage point?
Is SSH listening?
Does deploy exist?
Was an appropriate credential supplied?
Is the credential valid for this scope?
Does policy allow authentication?
What session is created?
What events and telemetry are generated?
```

Initial production command surface:

**## General**

```text
help
clear
history
man
```

**## System**

```text
whoami
hostname
id
uname
env
```

**## Files**

```text
pwd
ls
cd
cat
find
grep
```

**## Networking**

```text
ip
ping
traceroute
nslookup
dig
nmap
curl
ssh
nc
```

**## Processes / Services**

```text
ps
systemctl
```

**## Database**

```text
psql
```

Inside the PostgreSQL-like shell, the first useful surface may include:

```text
\l
\c
\dt
\d
SELECT
```

Only the SQL grammar required by authored scenarios needs to exist initially.

**## ROOT-Specific**

```text
sessions
creds
intel
map
objectives
tools
```

Commands such as `msfconsole`, password crackers, directory scanners, or advanced exploitation frameworks should only be introduced when they represent a meaningful simulation concept. They must never become generic win buttons.

The terminal should remain readable and understated.

No fake Hollywood output.

---

**# 17. Tool and Service Adapters**

ROOT should model recognizable cybersecurity interfaces as bounded adapters into the same simulation.

Initial families:

* Unix-like shell
* SSH
* HTTP / `curl`
* DNS
* Nmap-style reconnaissance
* PostgreSQL-style database shell
* ROOT/OS Files
* ROOT/OS Processes
* ROOT/OS Network Map
* ROOT/OS Logs / SIEM

Later families may include:

* Wireshark-inspired Packet Viewer
* Burp-inspired request inspector
* directory discovery tools
* password auditing tools
* Windows command / PowerShell-inspired interfaces
* SMB-like services
* enterprise directory / Active Directory-inspired interfaces
* cloud consoles / CLIs
* container tooling

Every adapter follows the same rule:

```text
TOOL INPUT
    ↓
SIMULATION QUESTION OR ACTION
    ↓
WORLD STATE
    ↓
SECURITY EVENTS
    ↓
TOOL-SPECIFIC OUTPUT
```

Example:

```text
nmap 10.20.0.15
```

should derive results from:

```text
current network position
+ routing
+ firewall rules
+ target machine state
+ listening services
+ service visibility
```

not from a hard-coded mission response.

---

**## 17.1 Bounded Realism**

ROOT does not implement full Linux, PostgreSQL, Nmap, Wireshark, Active Directory, AWS, or other real platforms.

It implements the smallest believable subset required to support transferable reasoning and interesting decisions.

Example PostgreSQL scope:

```text
connect
list databases
change database
list tables
describe table
simple SELECT queries
role / permission checks
query logging
```

Example packet-analysis scope:

```text
source
destination
protocol
port
DNS query
TCP connection
HTTP request
selected payload metadata
```

Example enterprise-identity scope:

```text
users
groups
service accounts
roles
machine relationships
credential scope
login rights
resource permissions
trust edges
```

Depth is added when scenarios need it, not because the real product contains it.

---

**## 17.2 No Abstract Cyber Buttons**

Avoid generic interactions such as:

```text
HACK
EXPLOIT
PRIVESC
BREACH DATABASE
```

when a more meaningful interaction can express the concept.

Prefer:

```text
ssh deploy@DEV-01
psql -h FIN-DB -U svc_finance -d finance
curl -X POST portal.meridian.test/legacy-upload --data upload=archive
grep RUN_HOOK /etc/backup-sync.conf
```

However, beginner assistance must explain newly introduced syntax and context before expecting independent use.

A player should never be required to guess an unexplained literal such as a database name, POST body, hidden hostname, or command flag.

Discovery must be possible through the simulated world.

---

**## 17.3 Assistance Is Translation, Not Different Rules**

Casual, Operator, and Black Box modes use the same simulation.

Example:

```text
Casual:
[Connect to DEV-01 as deploy]

Operator:
Suggested syntax: ssh <user>@<host>

Black Box:
$ _
```

All three resolve to the same authentication action, world-state mutation, and security events.

---

**# 18. Network Simulation**

The network model supports:

\* hosts

\* IP addresses

\* subnets

\* zones

\* ports

\* protocols

\* services

\* routing

\* reachability

\* firewall rules

\* segmentation

\* trust relationships

\* connection blocking

\* isolation

Different vantage points can reveal different infrastructure.

Example:

External scan:

\`\`\`text

22 SSH

443 HTTPS

\`\`\`

Internal scan:

\`\`\`text

22 SSH

443 HTTPS

8080 HTTP

9000 backup-sync

\`\`\`

This allows the game to teach:

*> what you can see depends on where you are.*

\---

**# 19. Machine Model**

A simulated machine contains:

\`\`\`text

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

\`\`\`

Server state is authoritative.

Clients never directly mutate simulation state.

\---

**# 20. Identity System**

Supported identity types may include:

\* human users

\* service accounts

\* administrator accounts

\* application identities

\* machine identities

Associated security concepts:

\* passwords

\* hashes

\* tokens

\* API keys

\* SSH keys

\* groups

\* roles

\* sessions

\* permissions

Identity should eventually be as strategically important as machines.

\---

**# 21. Credentials**

Credentials are first-class simulation objects.

Potential properties:

\`\`\`text

username

type

origin

knownScope

privilege

validity

machine

application

\`\`\`

Example:

\`\`\`text

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

\`\`\`

\---

**# 22. Filesystem**

Filesystems contain meaningful but bounded structures.

Examples:

\* application configs

\* logs

\* scripts

\* user files

\* backups

\* secrets

\* service configuration

\* temporary files

\* target documents

Files should often reveal relationships.

Example:

\`\`\`text

/etc/backup-sync.conf

\`\`\`

can reveal:

\`\`\`text

service runs as root

deploy may modify config

\`\`\`

That creates a privilege-escalation opportunity through reasoning.

\---

**# 23. Processes**

Processes expose:

\`\`\`text

PID

User

Parent Process

Command

Start Time

Host

\`\`\`

Red uses processes to understand machine behavior.

Blue uses processes to identify abnormal execution.

\---

**# 24. Sessions**

A session includes:

\`\`\`text

actor

machine

user

privilege

source machine

creation time

active state

\`\`\`

Session != access.

Access != persistence.

This distinction should become strategically important.

\---

**# 25. Privilege Model**

Per-machine access levels:

\`\`\`text

none

guest

user

service

admin

root

\`\`\`

Later enterprise scenarios may add higher-level organization roles.

Privilege is never a universal player stat.

\---

**# 26. Privilege Escalation**

Privilege escalation is a core ROOT mechanic.

Potential categories:

\* local privilege escalation

\* credential escalation

\* service-account abuse

\* role escalation

\* network privilege escalation

\* enterprise escalation

Potential causes:

\* writable privileged configuration

\* service misconfiguration

\* scheduled task trust

\* exposed credentials

\* excessive group permissions

\* environment configuration

\* overprivileged accounts

\* credential reuse

\* trust relationships

The player should usually understand:

*> Why does this escalate privileges?*

not merely:

*> Which exploit button gives root?*

\---

**# 27. Reconnaissance**

Recon systems include:

\* DNS discovery

\* host discovery

\* service discovery

\* port scanning

\* technology identification

\* route discovery

\* user discovery

\* application discovery

Recon should open possibilities rather than fill an arbitrary completion meter.

\---

**# 28. Initial Access**

Possible simulated weaknesses:

\* weak credential

\* exposed secret

\* web misconfiguration

\* exposed service

\* credential reuse

\* excessive trust

\* remote-access misconfiguration

\* application authorization flaw

The first versions should remain game-oriented instead of simulating real CVEs.

\---

**# 29. Lateral Movement**

Movement depends on:

\* reachability

\* credentials

\* trust

\* permissions

\* service availability

\* firewall rules

Example:

\`\`\`text

WEB-01

↓

DEV-01

↓

FIN-APP

↓

FIN-DB

\`\`\`

Each movement should produce evidence.

\---

**# 30. Persistence**

Initial persistence:

\`\`\`text

Remote Agent

\`\`\`

Properties may include:

\`\`\`text

owner

privilege

beacon interval

active state

process artifact

startup artifact

outbound connection

\`\`\`

Later simulated persistence systems may include:

\* scheduled tasks

\* startup services

\* application hooks

\* persistent credentials

Persistence should provide actual strategic value.

Example:

Blue revokes SSH session.

Without persistence:

\`\`\`text

Access lost.

\`\`\`

With persistence:

\`\`\`text

Agent reconnects.

New session available.

\`\`\`

\---

**# 31. Advanced Simulated Malware Systems**

Long-term gameplay may include fictional, simulation-bounded versions of:

\* RATs

\* trojans

\* worms

\* ransomware

\* botnets

\* keyloggers

\* credential stealers

\* web shells

\* reverse shells

\* rootkits

\* loaders

\* backdoors

These are game systems, not real-world malware tooling.

Possible gameplay properties:

\* beacon rate

\* privilege

\* persistence

\* disk footprint

\* process visibility

\* network behavior

\* command latency

\* evidence generated

\* detection exposure

These systems are not MVP scope.

\---

**# 32. Scripting**

Advanced players may eventually automate operations.

Possible in-game APIs:

\`\`\`text

root.hosts()

root.scan(host)

root.logs(filter)

root.sessions()

\`\`\`

Possible scripting uses:

\* recon automation

\* log parsing

\* session management

\* custom workflows

\* Blue detection logic

Scripting should create recognizable operator styles.

It must not be required for beginner content.

\---

**# 32.1 Web and Application Simulation**

Web applications should be modeled as services with routes, methods, authentication state, authorization rules, sessions, request data, and server-side effects.

A request such as:

```text
curl -X POST portal.meridian.test/legacy-upload --data upload=archive
```

should only be useful if the player can discover:

* the hostname
* the route
* the accepted method
* relevant parameters
* what the application does with the request

The Browser and terminal `curl` command are two interfaces into the same HTTP simulation.

Important concepts:

* GET / POST and other relevant methods
* status codes
* headers
* forms
* cookies
* sessions
* APIs
* authentication
* authorization
* application configuration
* bounded vulnerability behaviors

---

**# 32.2 Database Simulation**

Databases are first-class services rather than static mission props.

Initial implementation should focus on a PostgreSQL-inspired model.

A database service may contain:

```text
host
port
databases
roles
credentials
tables
schemas
permissions
connections
query history
security logging
```

A connection attempt such as:

```text
psql -h FIN-DB -U svc_finance -d finance
```

should evaluate:

```text
network reachability
service availability
database existence
identity existence
credential validity
connection policy
role permissions
```

Database names and credentials must be discoverable through applications, configuration, documentation, logs, or other world state.

The player should never need source-code knowledge outside the game to know that a database is called `finance`.

---

**# 32.3 Packet and Connection Simulation**

ROOT does not need full packet-level networking for its core simulation.

Instead, the engine should retain enough connection metadata to render a believable Packet Viewer later.

Potential records:

```text
timestamp
source IP
source port
destination IP
destination port
protocol
connection state
DNS name
HTTP metadata
session / process association
```

This allows a Wireshark-inspired interface to teach packet and protocol reasoning without implementing a full TCP/IP stack.

---

**# 32.4 Enterprise Identity Simulation**

Long-term enterprise scenarios should extend the existing Identity System rather than bolt on a completely separate Active Directory game.

The shared identity graph may contain:

```text
human user
service account
machine identity
group
role
resource
credential
session
permission
trust edge
```

An Active Directory-inspired adapter can later expose concepts such as:

* domains
* domain users
* groups
* domain controllers
* directory queries
* Kerberos-like tickets
* NTLM-like authentication
* Group Policy-like configuration
* SMB-like resources
* service accounts

The simulation should model the relationships that matter to gameplay, not every implementation detail of Windows enterprise infrastructure.

---

**# 32.5 Cloud and Container Simulation**

Cloud is a later knowledge domain built on existing primitives:

```text
identity
network
service
resource
permission
secret
log
```

Potential cloud objects:

* accounts / projects
* IAM users and roles
* virtual networks
* instances
* storage buckets
* security groups
* serverless functions
* managed databases
* secrets
* containers

This should remain post-core scope until Linux, networking, web, databases, identity, Red, and Blue gameplay are mature.

---

**# 33. Security Event Model**

Every meaningful action produces events containing approximately:

\`\`\`text

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

\`\`\`

Categories:

\`\`\`text

network

auth

process

filesystem

web

privilege

persistence

system

\`\`\`

The Event Bus is the backbone of ROOT.

\---

**# 34. Detection Engine**

Detections operate on real simulation events.

Example rules:

**## Port Scan**

Pattern:

\`\`\`text

multiple connection attempts

same source

short time window

\`\`\`

**## Suspicious Web Activity**

Pattern:

\`\`\`text

unexpected request behavior

followed by server process creation

\`\`\`

**## Privileged Configuration Modification**

Pattern:

\`\`\`text

non-root identity

modifies privileged service configuration

\`\`\`

**## Unusual Internal Login**

Pattern:

\`\`\`text

valid credential

unusual source

new host relationship

\`\`\`

**## Sensitive Finance Access**

Pattern:

\`\`\`text

finance system access

unexpected source

\`\`\`

Detections should be explainable.

\---

**# 35. Red OPSEC**

ROOT should not secretly depend on a simple stealth meter.

Under the hood:

\`\`\`text

evidence

→ detections

→ Blue investigation

\`\`\`

The Red UI may summarize current exposure:

\`\`\`text

Network Activity:

Elevated

Authentication Noise:

Moderate

Endpoint Evidence:

Low

\`\`\`

But Blue still decides what events mean.

\---

**# 36. Blue Investigation Loop**

Canonical Blue loop:

\`\`\`text

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

\`\`\`

Blue should feel like investigation rather than whack-a-mole.

\---

**# 37. Incident Workspace**

Blue can group evidence into incidents.

Example:

\`\`\`text

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

\`\`\`

\---

**# 38. Blue Response Actions**

Initial set:

\`\`\`text

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

\`\`\`

Expanded later:

\`\`\`text

Disable Identity

Stop Process

Quarantine File

Restart Service

Block Source

\`\`\`

Each response mutates the same simulation state.

\---

**# 39. Business Availability**

Business services may include:

\`\`\`text

Web Portal

Developer Services

Finance Application

Finance Database

Email

Authentication

Payroll

Backups

\`\`\`

States:

\`\`\`text

healthy

degraded

offline

\`\`\`

Containment may reduce attacker access while harming availability.

\---

**# 40. Intel System**

ROOT/OS should automatically record meaningful discoveries.

Example:

\`\`\`text

HOSTS

WEB-01

DEV-01

FIN-APP

CREDENTIALS

deploy

svc\_web

NETWORKS

10.10.10.0/24

10.20.10.0/24

RELATIONSHIPS

WEB-01 → DEV-01

FIN-APP → FIN-DB

\`\`\`

This avoids forcing players to maintain external notes.

\---

**# 41. Network Map**

Red node states:

\`\`\`text

Unknown

Discovered

Reachable

Accessed

Compromised

Isolated

Offline

\`\`\`

Blue node states:

\`\`\`text

Healthy

Suspicious

Investigating

Compromised

Contained

Offline

\`\`\`

Red and Blue may view the same host differently.

\---

**# 42. Objectives**

Possible Red objectives:

\* retrieve file

\* gain privileged access

\* reach restricted network

\* establish persistence

\* demonstrate access

\* compromise identity

Possible Blue objectives:

\* prevent data theft

\* identify compromised systems

\* contain attacker

\* protect business service

\* remove persistence

\* reconstruct attack path

\---

**# 43. Mission Constraints**

Examples:

\`\`\`text

Do not disrupt production.

Do not access HR.

Maintain >90% availability.

Remain within authorized network scope.

Do not modify financial records.

\`\`\`

Constraints create strategic decisions.

\---

**# 44. Post-Operation Reconstruction**

Mandatory.

Modes:

\`\`\`text

RED VIEW

BLUE VIEW

FULL TRUTH

\`\`\`

Timeline should include:

\* actions

\* state changes

\* sessions

\* detections

\* alerts

\* Blue responses

\* attacker movement

\* business impact

\* objective events

Production version may include:

\* timeline scrubber

\* network map over time

\* session timeline

\* evidence timeline

\* alert timeline

\* attack path visualization

\* missed opportunities

\* key decisions

\---

**# 45. After-Action Report**

Example:

\`\`\`text

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

\`\`\`

More important than raw scores:

\`\`\`text

KEY DECISION

You authenticated from WEB-01 to DEV-01

using the deploy identity.

Blue observed the login,

but did not investigate the unusual

machine relationship.

\`\`\`

This is where ROOT becomes educational without turning into a lesson.

\---

**# 46. Campaign World**

The player works for:

**\*\*Nodeline Security\*\***

Nodeline is a cybersecurity consultancy focused on:

\* security assessments

\* adversary simulation

\* incident response

\* threat hunting

\* research

ROOT/OS is Nodeline's internal cyber operations platform.

\---

**# 47. Player Role**

The player joins Nodeline as a new operator.

They are not defined only as a hacker.

They progress through both offensive and defensive work.

Early career:

\`\`\`text

Recruit

↓

Junior Operator

\`\`\`

Later:

\`\`\`text

Red Operations

Incident Response

Threat Hunting

Advanced Assessments

\`\`\`

\---

**# 48. Campaign Structure**

The campaign doubles as ROOT's canonical cybersecurity learning path.

It must feel like a career and unfolding story, not a syllabus.

Each act introduces new systems, then reduces assistance until the player can apply the concepts independently.

---

**## Act 0 — Nodeline Orientation**

Purpose:

Computer and ROOT/OS fundamentals.

Concepts:

* files and directories
* users
* groups
* permissions
* processes
* services
* terminal navigation
* documentation
* evidence versus assumptions

Player milestone:

```text
Can navigate ROOT/OS and a bounded Unix-like host without being told every click.
```

Potential operations:

* First Shift
* The Printer
* Locked Out

---

**## Act I — Networks and Helpdesk**

Purpose:

Understand how machines communicate before introducing offensive security.

Concepts:

* IP addresses
* hosts
* ports
* services
* DNS
* routing
* reachability
* segmentation
* SSH
* HTTP basics

Potential operations:

* Where Did the Website Go?
* Wrong Network
* Service Unavailable
* The New Server

Player milestone:

```text
Given an unfamiliar host or subnet, the player can determine what is reachable and what services are exposed.
```

---

**## Act II — SOC Foundations**

Purpose:

Teach that normal system activity creates evidence before the player becomes a capable attacker.

Concepts:

* authentication
* logs
* processes
* connections
* anomalies
* baseline behavior
* alert investigation
* correlation
* false positives

Potential operations:

* The Strange Login
* False Alarm
* Something Is Calling Home
* The Quiet One
* Friday Night

Player milestone:

```text
Can investigate an alert and explain what happened using evidence.
```

---

**## Act III — Web, Applications, and Databases**

Purpose:

Teach how modern applications connect users, HTTP services, credentials, and data stores.

Concepts:

* HTTP methods
* requests / responses
* headers
* forms
* cookies
* sessions
* APIs
* authentication versus authorization
* application configuration
* PostgreSQL-style connections
* schemas and tables
* SQL queries
* database roles

Potential operations:

* Employee Portal
* Session Expired
* The Legacy Route
* Finance Reporting

Player milestone:

```text
Can trace a user action from browser → application → identity → database.
```

---

**## Act IV — Red Operations**

Purpose:

Combine earlier knowledge into offensive investigation.

Concepts:

* reconnaissance
* enumeration
* initial access
* exposed secrets
* credential reuse
* privilege escalation
* service trust
* lateral movement
* objective access
* OPSEC

Potential operations:

* Operation Glasshouse
* The Front Door
* The Forgotten Server
* The Trust Problem
* Valid User

Player milestone:

```text
Can build an attack path from evidence rather than follow a prescribed exploit sequence.
```

---

**## Act V — Incident Response**

Purpose:

Return to defense after the player understands attacker behavior.

Concepts:

* persistence
* timeline reconstruction
* containment
* session revocation
* identity response
* host isolation
* recovery
* business impact
* root cause

Potential operations:

* No One Knows
* Ghost Account
* The Backup
* Night Shift

Player milestone:

```text
Can reconstruct and contain a multi-system compromise while preserving important services.
```

---

**## Act VI — Enterprise Identity**

Purpose:

Shift the player's mental model from machines to relationships.

Concepts:

* users and groups
* service accounts
* machine identities
* organization roles
* directory services
* credential scope
* delegated permissions
* enterprise trust
* domain-like infrastructure

Potential operations:

* New Credentials
* Service Account
* The Domain
* Who Trusts Whom?

Player milestone:

```text
Can reason about an attack or investigation as an identity-and-trust graph rather than a list of hosts.
```

---

**## Act VII — Advanced Operations / The Breach**

Purpose:

Remove most scaffolding and connect previous incidents into the main story.

Concepts:

* multi-subnet environments
* alternate attack paths
* threat hunting
* packet / connection analysis
* advanced detection
* business constraints
* incomplete information
* adversary adaptation

Potential operations:

* Inside
* Who Are They?
* Cut the Lights
* ROOT

The player discovers that earlier incidents are connected.

Player milestone:

```text
Given an unfamiliar organization and an objective, independently investigate the environment and justify each major decision.
```

This is the canonical transition from learner to operator.

---

**## Post-Campaign Specialist Tracks**

Specialist progression may branch into:

```text
Red Team / Penetration Testing
Blue Team / SOC
Incident Response / Forensics
Threat Hunting
Application Security
Enterprise Identity
Cloud Security
Security Engineering
```

Specialization changes available operations and depth, not universal combat-style stats.

---

**# 49. Story Tone**

The tone should be:

\* corporate

\* technical

\* restrained

\* paranoid

\* believable

\* investigative

Story delivery should primarily use:

\* internal emails

\* incident reports

\* chat

\* case files

\* logs

\* intelligence reports

\* voicemail transcripts

\* corporate portals

Avoid excessive cinematic interruptions.

\---

**# 50. Operation Glasshouse**

Canonical early Red operation.

Client:

\`\`\`text

Meridian Dynamics

\`\`\`

Organization:

fictional logistics technology company.

Objective:

\`\`\`text

Retrieve PROJECT\_ATLAS.pdf

from FIN-DB.

\`\`\`

Initial known information:

\`\`\`text

portal.meridian.test

\`\`\`

Primary POC path:

\`\`\`text

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

PROJECT\_ATLAS.pdf

\`\`\`

\---

**# 51. Meridian Initial Network**

POC version:

\`\`\`text

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

\`\`\`

Expanded MVP may add:

\`\`\`text

MAIL-01

APP-01

DEV-02

FILE-01

MON-01

\`\`\`

Not every machine should be vulnerable.

Some exist only for:

\* information

\* business function

\* alternate routes

\* decoys

\* background context

\---

**# 52. Expanded MVP Scenario Set**

Initial larger MVP should contain approximately three meaningful operations.

**## Operation Glasshouse**

Focus:

\* fundamentals

\* Red path

\* privilege escalation

\* finance pivot

**## Operation Nightshift**

Focus:

\* authentication

\* credential reuse

\* persistence

\* identity

**## Operation Dead Drop**

Focus:

\* segmentation

\* multiple routes

\* pivoting

\* evidence management

Each scenario should support:

\`\`\`text

Guided Red

Operator Red

Blue

\`\`\`

Target total first-play content:

\`\`\`text

3–6 hours

\`\`\`

\---

**# 53. PvP**

Primary competitive mode:

\`\`\`text

1 Red

vs

1 Blue

\`\`\`

Both players operate in the same organization.

Example:

Red:

\`\`\`text

Retrieve sensitive financial intelligence.

\`\`\`

Blue:

\`\`\`text

Prevent unauthorized extraction.

Maintain >80% business availability.

\`\`\`

Neither sees the other's information directly.

Post-match:

\`\`\`text

RED VIEW

BLUE VIEW

FULL TRUTH

\`\`\`

\---

**# 54. Team PvP**

Long-term:

\`\`\`text

2v2

3v3

\`\`\`

Suggested soft roles:

Red:

\* Recon / Initial Access

\* Internal Operator

\* Persistence / Objective

Blue:

\* SOC Analyst

\* Threat Hunter

\* Incident Responder

Roles should not hard-lock actions.

\---

**# 55. Unranked Modes**

Unranked should exist before ranked.

Possible modes:

\* Red vs Blue

\* Practice

\* Private Match

\* Cyber Heist / Co-op

\* Challenge Operations

\---

**# 56. Challenge Operations**

Veteran content.

Example:

\`\`\`text

WEEKLY OPERATION

BLACK BOX

No map.

No hints.

No suggested commands.

Objective:

Locate ACQUISITION\_PLAN.pdf.

Restriction:

Do not cause service outage.

Time:

45 minutes.

\`\`\`

Possible leaderboards:

\* fastest completion

\* lowest evidence

\* fastest containment

\* highest uptime

\---

**# 57. Scenario Architecture**

Scenarios should eventually be data-driven.

Potential operation definition:

\`\`\`text

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

\`\`\`

New content should rarely require new simulation code.

\---

**# 58. Internal Content Authoring Tools**

Long-term internal editor:

\* Network Builder

\* Machine Editor

\* User Editor

\* File Editor

\* Service Editor

\* Credential Editor

\* Vulnerability Editor

\* Detection Editor

\* Objective Editor

\* AI Path Editor

\* Scenario Validator

This is essential for sustainable content production.

\---

**# 59. Technical Architecture**

Recommended structure:

\`\`\`text

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

   / | \\

  /  |  \\

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

\`\`\`

All meaningful actions are server-authoritative.

\---

**# 60. Action Model**

Clients submit intentions.

Example:

\`\`\`ts

{

  type: "SCAN\_HOST",

  targetMachineId: "web-01"

}

\`\`\`

Server determines:

\* whether target is known

\* whether target is reachable

\* what information is returned

\* what events are emitted

\* what Blue can observe

\* whether detection rules trigger

\* how state changes

The client must never decide success.

\---

**# 61. Recommended Stack**

Initial recommendation:

\`\`\`text

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

\`\`\`

Early POC may run entirely in memory.

Later production may add:

\`\`\`text

Redis

containerized game servers

structured logging

metrics

error tracking

\`\`\`

\---

**# 62. Visual Direction**

Canonical art direction:

*> Mr. Robot meets neglected enterprise software meets UNIX workstation meets late-night SOC.*

ROOT should look slightly more boring than the player expects.

That normality makes anomalies more unsettling.

\---

**# 63. UI Palette Principles**

Use:

\* dark charcoal backgrounds

\* off-white text

\* muted phosphor green

\* amber warnings

\* restrained red

\* corporate blue-gray

Color should communicate state.

Example:

\`\`\`text

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

\`\`\`

Avoid green everywhere.

\---

**# 64. Typography**

Use monospace for:

\* terminal

\* logs

\* machine data

\* technical metadata

Use sans-serif for:

\* corporate documents

\* mail

\* mission briefs

\* reports

This separates:

\`\`\`text

system output

from

human/corporate information

\`\`\`

\---

**# 65. ROOT/OS Desktop Layout**

Possible top bar:

\`\`\`text

ROOT/OS 3.4

NODELINE // OPS

03:14:27 UTC

SECURE ●

\`\`\`

Possible launcher:

\`\`\`text

TERMINAL

NETWORK

FILES

BROWSER

INTEL

SESSIONS

LOGS

MISSION

\`\`\`

Status bar:

\`\`\`text

SESSION: deploy\@DEV-01

PRIVILEGE: USER

NETWORK: INTERNAL

OPSEC: NOMINAL

\`\`\`

The player should always understand:

\* current host

\* current user

\* current privilege

\* current session

\* known objective

\---

**# 66. Corporate UI Principles**

Client systems should look normal.

Example:

\`\`\`text

MERIDIAN DYNAMICS

Employee Access Portal

Username

Password

SIGN IN

\`\`\`

Internal systems should feel old, maintained, and believable.

This is preferable to stereotypical “hacker” interfaces.

\---

**# 67. Blue UI Direction**

Blue should look more enterprise-oriented than Red.

Example layout:

\`\`\`text

ALERTS

│

├── EVENT STREAM

│

└── HOST / IDENTITY CONTEXT

\`\`\`

Use:

\* dense tables

\* timestamps

\* filters

\* raw events

\* small charts

\* contextual panels

Alerts should remain professional.

Never:

\`\`\`text

HACKER DETECTED!!!

\`\`\`

Prefer:

\`\`\`text

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

\`\`\`

\---

**# 68. Sound Direction**

Atmosphere:

\* quiet server-room hum

\* HVAC

\* mechanical keyboard

\* CRT startup

\* disk activity

\* relay clicks

\* muted notification tones

\* distant office ambience

High-severity alerts should not sound like arcade sirens.

Small professional sounds become meaningful once the player understands them.

\---

**# 69. Glitch Direction**

Glitches should be rare.

Possible uses:

\* boot

\* corruption

\* session failure

\* unauthorized access

\* major story event

Possible effects:

\* horizontal distortion

\* single-frame text corruption

\* cursor freeze

\* character duplication

\* brief clock desync

\* phosphor trails

If everything glitches, glitches lose meaning.

\---

**# 70. Production Roadmap**

The production roadmap must validate the simulation and learning architecture before expanding the tool catalog.

---

**## Milestone 0 — Design Lock**

Deliver:

* product pillars
* terminology
* architecture
* Red loop
* Blue loop
* knowledge-domain model
* proficiency model
* assistance philosophy
* network model
* identity model
* event model
* scenario structure
* UI direction
* campaign learning path

Exit condition:

The team can explain, end to end, what happens when the player performs actions such as:

```text
nmap 10.10.10.0/24
ssh deploy@DEV-01
curl portal.meridian.test
psql -h FIN-DB -U svc_finance -d finance
```

including state checks, output, emitted events, Blue visibility, and knowledge implications.

---

**## Milestone 1 — Simulation Foundation**

Build reusable primitives:

* machines
* networks
* routing / reachability
* users / groups
* services
* files
* permissions
* credentials
* sessions
* processes
* events
* objectives

Build adapter foundation:

* action parser
* command router
* Unix-like shell adapter
* SSH adapter
* HTTP adapter

Exit condition:

A developer can use API/dev tools to:

```text
discover host
inspect services
authenticate
create session
read files
inspect process
change privilege
move laterally
retrieve objective
```

and the world produces consistent state and events.

---

**## Milestone 2 — Fundamentals Playable Prototype**

Before a full Red operation, prove that a beginner can understand the environment.

Build:

* ROOT/OS desktop shell
* Terminal
* Files
* Mission
* Documentation / Help
* Network Map
* contextual assistance

Commands / concepts:

```text
pwd ls cd cat grep find
whoami id ps env
ip ping
```

Content:

* short orientation operation
* short network / service operation

Exit condition:

A new tester can explain:

```text
current host
current user
files and permissions
processes
IP / host / service relationship
```

without developer intervention.

---

**## Milestone 3 — Network + Service Prototype**

Add:

* DNS
* ports / protocols
* service discovery
* routing
* segmentation
* firewall rules
* `nmap`
* `curl`
* `ssh`
* Intel auto-recording

Exit condition:

A tester can enter a small unfamiliar network and independently determine:

```text
what hosts exist
what is reachable
what services are exposed
which discovered information is useful
```

---

**## Milestone 4 — Application + Database Prototype**

Add:

* Browser
* HTTP route model
* forms / methods / parameters
* cookies / sessions
* application configuration
* PostgreSQL-inspired database service
* `psql`
* tables / simple SQL
* database permissions

Exit condition:

A tester can discover an application-to-database relationship entirely through in-world information and successfully connect to the database with legitimately discovered information.

No source-code searching or external walkthrough should be required.

---

**## Milestone 5 — Red Vertical Slice**

Content:

```text
Operation Glasshouse
```

Gameplay:

```text
Recon
→ Web investigation
→ Initial Access
→ Configuration / Credential Discovery
→ SSH
→ Privilege Escalation
→ Internal Discovery
→ Database Access
→ Objective
```

Build:

* Credentials UI
* Sessions
* Intel
* privilege model
* multiple meaningful clues
* Guided Mode
* Operator Mode

Exit condition:

A tester can complete Glasshouse organically without knowing hidden strings from the codebase.

Every required hostname, parameter, database name, credential, or command concept must be discoverable or previously taught.

---

**## Milestone 6 — Event / Detection / Replay**

Build:

* persistent event history
* visibility filtering
* Red view
* Blue view
* Full Truth
* detection rules
* timeline
* replay
* learning-event annotations

Exit condition:

Glasshouse can be reconstructed from all three perspectives, and the game can explain what evidence each meaningful Red action produced.

---

**## Milestone 7 — Blue Team Vertical Slice**

Build:

* SIEM
* Alerts
* Authentication Viewer
* Process Viewer
* connection / network telemetry
* Incident Workspace
* Response Actions
* Service Availability
* scripted Red AI

Exit condition:

Glasshouse is fun and understandable as both Red and Blue using the same world state and events.

---

**## Milestone 8 — ROOT MVP**

Expand reusable systems:

* 10–12 machine archetypes
* 20–30 carefully selected commands / interactions
* multiple network zones
* richer identity relationships
* PostgreSQL-style database scenarios
* multiple routes
* persistence
* evidence summaries
* business availability
* Guided Mode
* Operator Mode
* Knowledge Tracker
* proficiency progression

Content:

* Glasshouse
* Nightshift
* Dead Drop
* fundamentals / onboarding operations

Target first-play content:

```text
4–8 hours
```

Exit condition:

A new player can progress from basic host / network understanding to completing an introductory Red and Blue operation without external material.

This is officially:

**# ROOT MVP**

---

**## Milestone 9 — Learning / Content Alpha**

Target:

* 5–7 fictional organizations
* 8–12 operations
* Act 0–V learning progression
* Red variants
* Blue variants
* Training Range
* certifications
* player profile
* proficiency
* designations
* improved documentation
* concept-aware hints

Add selected deeper systems:

* packet / connection viewer foundation
* stronger web simulation
* stronger database simulation
* service accounts
* enterprise identity foundation

Target campaign length:

```text
10–15 hours
```

Exit condition:

A completely new player can progress from computer/network fundamentals to independent intermediate security reasoning without relying on outside walkthroughs.

---

**## Milestone 10 — Enterprise Operator Alpha**

Add:

* larger segmented organizations
* identity / trust graph
* groups and service accounts
* enterprise-directory-inspired adapter
* multi-hop attack paths
* richer detection correlation
* packet / connection analysis
* advanced incident reconstruction

Exit condition:

Players can solve scenarios where the important path is primarily about identity, permission, and trust rather than finding a vulnerable machine.

---

**## Milestone 11 — Multiplayer Alpha**

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

Repeated matches complete without simulation desynchronization, and both sides can reason from asymmetric information without needing artificial hidden-rule mechanics.

---

**## Milestone 12 — Beta / Early Access Candidate**

Add:

* ranked Red
* ranked Blue
* matchmaking
* competitive analytics
* advanced operations
* Veteran / Black Box scenarios
* Challenge Operations
* accessibility
* performance optimization
* crash reporting
* telemetry
* moderation / reporting

Content target:

```text
10–15 organizations
15–25 operations
multiple Red AI profiles
multiple Blue scenarios
```

Campaign:

```text
15–25 hours
```

plus replayability.

---

**## Milestone 13 — ROOT 1.0**

Target:

**### Learning Coverage**

ROOT 1.0 should provide strong playable coverage of:

* operating-system fundamentals
* networking
* Linux-like systems
* web / HTTP
* databases
* identity
* reconnaissance
* privilege / trust
* Red operations
* Blue investigation
* incident response
* enterprise identity foundations
* packet / connection reasoning

Cloud, advanced malware, full enterprise-directory depth, and deep reverse engineering are not required for 1.0.

**### Content**

* complete Nodeline campaign
* ~20+ substantial operations
* ~10–15 organizations
* Guided Mode
* Operator Mode
* Black Box / Veteran challenges
* specialist operations

**### Gameplay**

* Red
* Blue
* AI adversaries
* 1v1 PvP
* replay
* Red / Blue / Full Truth reconstruction
* progression
* proficiency
* certifications
* rankings

**### Production**

* scenario authoring tools
* knowledge tagging tools
* scenario validation for discoverability
* analytics
* accessibility
* stable backend
* production matchmaking
* polished onboarding

A 1.0 scenario should be able to declare which concepts it introduces, practices, and tests.

---

**# 71. Post-1.0 Roadmap**

Post-1.0 expansion should deepen the same simulation primitives rather than create disconnected minigames.

Potential knowledge expansions:

```text
Cloud infrastructure and IAM
Active Directory-inspired advanced enterprise identity
Windows / PowerShell-inspired systems
SMB and enterprise file services
Containers
Kubernetes-inspired orchestration
Advanced packet analysis
Application security depth
Threat intelligence
Advanced forensics
Reverse-engineering concepts
Advanced malware simulation
Security engineering / detection authoring
```

Potential game expansions:

```text
2v2
3v3
advanced scripting
procedural organizations
community scenarios
scenario editor
mod support
persistent simulated internet
```

All expansions must continue to use bounded simulation.

ROOT should not become an emulator collection.

---

**# 72. Anti-Scope-Creep List**

Do not add prematurely:

\* MMO world

\* clans

\* marketplace

\* cosmetics store

\* large procedural world

\* hundreds of commands

\* dozens of exploits

\* real malware execution

\* full Active Directory

\* Kubernetes

\* cloud simulation

\* packet-level realism

\* full scripting IDE

\* large-scale PvP

\* mobile client

The simulation core must prove itself first.

\---

**# 73. Production Gates**

Each major milestone answers one question.

\`\`\`text

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

\`\`\`

\---

**# 74. Approximate Production Timeline**

For a focused small team, a rough planning model may be:

\`\`\`text

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

\`\`\`

This is a planning framework, not a fixed commitment.

\---

**# 75. Definition of ROOT**

ROOT succeeds when a beginner can eventually move from:

\`\`\`text

What is a port?

\`\`\`

to:

\`\`\`text

Why is this service reachable from this subnet?

Why is this account authenticating from this machine?

Why can this low-privilege user modify something a root service trusts?

Why is this login technically valid but still suspicious?

What evidence will this action generate?

Can I contain this machine without destroying the client's operations?

\`\`\`

without the game simply telling them the answers.

The player should gradually stop seeing:

\`\`\`text

machines

ports

users

logs

\`\`\`

as isolated objects.

They should begin seeing:

\`\`\`text

relationships

trust

identity

behavior

evidence

risk

\`\`\`

That transformation is ROOT's real progression system.

\---

**# 75.1 Canonical Learning Principle**

ROOT should teach transferable cybersecurity thinking through gameplay.

The player should progress through:

```text
clicking
→ recognizing
→ understanding
→ typing
→ investigating
→ hypothesizing
→ independently operating
```

The final measure of learning is not whether the player memorized ROOT's commands.

It is whether they can enter an unfamiliar simulated environment and reason correctly about:

```text
systems
networks
identities
permissions
trust
services
credentials
evidence
business impact
```

A veteran ROOT player should be more capable because they understand the environment better, not because their avatar has stronger hacking statistics.

---

**# 76. Canonical Product Principle**

ROOT must never ultimately ask:

*> Did the player unlock enough hacking power?*

ROOT asks:

*> Did the player understand the system well enough to make the right decision?*

Everything else exists to support that principle.