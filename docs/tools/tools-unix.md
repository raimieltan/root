# ROOT Realistic Interaction Layer Specification

**Status:** Proposed
**Product:** ROOT / ROOT/OS
**Scope:** Terminal, service interaction, credentials, simulated tools, assistance modes, scenario authoring, and simulation integration

---

# 1. Purpose

ROOT should simulate recognizable real-world computer and security interactions without attempting to recreate complete operating systems, applications, or network infrastructure.

Players should interact with systems through familiar interfaces such as:

```text
ssh
psql
curl
nmap
ping
dig
smbclient
```

rather than abstract gameplay commands such as:

```text
hack
exploit
privesc
breach
```

The simulation should model the underlying relationships between:

```text
Machines
Services
Networks
Identities
Credentials
Permissions
Files
Processes
Applications
Data
Trust relationships
Telemetry
Security controls
```

The player's actions interact with these systems through recognizable tools.

ROOT therefore follows the principle:

> **Emulate interfaces, not operating systems. Simulate relationships, not software internals.**

---

# 2. Core Design Goal

The player should succeed because they understand the simulated environment.

Success should come from reasoning such as:

```text
I found PostgreSQL credentials.

I discovered a PostgreSQL service.

The service is reachable from my current machine.

The credentials authenticate successfully.

The identity has access to useful tables.

Those tables contain information relevant to my objective.
```

Not:

```text
I found the database password.

The game unlocked "Database Access."
```

ROOT should make credentials, identities, services, permissions, and trust relationships meaningful components of the simulation rather than collectible puzzle keys.

---

# 3. Product Principle

The ROOT terminal is not:

> A collection of cybersecurity-themed commands.

It is:

> **A simulated Unix/security workstation through which players interact with fictional systems using bounded versions of recognizable real-world interfaces.**

ROOT is not expected to fully implement:

* Linux
* SSH
* PostgreSQL
* Nmap
* Wireshark
* SMB
* DNS
* Bash
* real networking
* real virtual machines

Instead, ROOT implements only the portions of these systems required to express gameplay concepts.

---

# 4. Primary Architecture

Player commands should be translated into simulation actions.

```text
PLAYER INPUT
      │
      ▼
Terminal / Tool Interface
      │
      ▼
Command Parser
      │
      ▼
Tool Adapter
      │
      ▼
Simulation Action
      │
      ▼
Server-Authoritative World State
      │
      ├── Machines
      ├── Services
      ├── Identities
      ├── Credentials
      ├── Permissions
      ├── Network Rules
      ├── Files
      ├── Processes
      └── Security Controls
      │
      ▼
Simulation Result
      │
      ├── State Changes
      ├── Events
      ├── Telemetry
      ├── Evidence
      └── Business Impact
      │
      ▼
Tool-Specific Output Formatter
      │
      ▼
PLAYER OUTPUT
```

The terminal itself must never become the authority on whether an action succeeds.

The simulation engine remains authoritative.

---

# 5. Example: SSH

Player enters:

```text
ssh deploy@DEV-01
```

The SSH adapter parses the command into something conceptually equivalent to:

```text
ConnectToService {
    sourceMachine: OPS-01
    targetMachine: DEV-01
    serviceType: SSH
    username: deploy
}
```

If password authentication is required, ROOT transitions the terminal into an authentication state:

```text
deploy@DEV-01's password:
```

After the player enters a password, the simulation evaluates:

```text
Can OPS-01 reach DEV-01?
Is DEV-01 online?
Is SSH running?
Is the SSH port reachable?
Does the deploy identity exist?
Is password authentication enabled?
Does the supplied credential match?
Is the account active?
Is the identity allowed to authenticate through SSH?
Has Blue Team isolated DEV-01?
Has Blue Team disabled deploy?
Are other security controls active?
```

The simulation then returns a result.

Success might produce:

```text
Last login: Fri Sep 18 14:22:04

deploy@DEV-01:~$
```

Failure might produce:

```text
Permission denied, please try again.
```

or:

```text
ssh: connect to host DEV-01 port 22: No route to host
```

The output should reflect the actual simulated cause of failure.

---

# 6. Terminal Contexts

ROOT should support multiple terminal contexts.

A context determines:

* available commands
* command parser
* prompt format
* history
* session state
* connection state
* output formatting

Example contexts:

```text
ROOT/OS Shell
SSH Session
PostgreSQL Session
SMB Session
DNS Tool
Web/API Tool
Packet Analysis Tool
Specialized Security Tools
```

Example prompt transitions:

```text
root@ops:~$
```

SSH:

```text
deploy@DEV-01:~$
```

PostgreSQL:

```text
finance=>
```

A future specialized security console might use:

```text
tool >
```

The player should feel that they have entered a different system rather than merely issuing another global command.

---

# 7. Context Architecture

Each terminal context should have its own handler.

```text
TerminalSession
    │
    ├── UnixShellHandler
    │
    ├── SSHHandler
    │
    ├── PostgresHandler
    │
    ├── SMBHandler
    │
    ├── DNSHandler
    │
    └── SpecializedToolHandler
```

Conceptually:

```ts
interface TerminalContext {
  type: ContextType;
  prompt: string;
  handleInput(input: string): SimulationIntent;
}
```

The terminal should not contain one enormous parser capable of understanding every command in ROOT.

---

# 8. Unix-Like Shell

ROOT should provide a deliberately bounded Unix-like environment.

Initial commands should include:

```text
pwd
ls
cd
cat
grep
find
whoami
id
hostname
env
ps
ip
ping
ssh
curl
nmap
```

Potential later commands:

```text
scp
dig
host
traceroute
nc
smbclient
```

These commands exist because they expose useful simulation concepts.

For example:

```text
whoami
```

teaches identity.

```text
id
```

teaches groups and permissions.

```text
ps
```

teaches processes.

```text
env
```

can expose application configuration.

```text
ip
```

teaches network interfaces.

```text
nmap
```

teaches service discovery.

```text
curl
```

teaches application/API interactions.

```text
ssh
```

teaches remote authentication.

---

# 9. Unix Non-Goals

ROOT should not initially attempt to implement complete Unix behavior.

The following should remain outside the initial scope unless gameplay later requires them:

```text
vim
nano
full bash scripting
shell expansion
job control
real process scheduling
package managers
full POSIX filesystem behavior
full chmod semantics
full sudo implementation
arbitrary binaries
arbitrary executable files
```

Features such as:

```text
pipes
redirection
awk
sed
```

should only be added if they improve gameplay rather than merely increasing terminal authenticity.

---

# 10. Filesystem Simulation

Each simulated machine may contain a virtual filesystem.

Example:

```text
/
├── home/
│   └── deploy/
├── etc/
│   ├── hosts
│   └── backup-sync.conf
├── opt/
│   └── backup/
│       └── run.sh
└── var/
    └── www/
        └── app/
            └── .env
```

Files should be simulation entities rather than actual host filesystem files.

Suggested structure:

```ts
FileEntity {
  id
  machineId
  path
  ownerIdentityId
  groupId
  permissions
  content
  classification
  tags
  visibilityRules
}
```

Commands such as:

```text
ls
cat
find
grep
cd
```

operate against this model.

---

# 11. Services as First-Class Simulation Objects

Services should become one of the foundational ROOT simulation primitives.

A machine might contain:

```text
DEV-01
├── SSH :22
├── HTTP :8080
└── backup-sync

FIN-DB
└── PostgreSQL :5432
```

Suggested service model:

```ts
Service {
  id
  machineId
  type
  name
  port
  protocol

  state

  authenticationMethods
  allowedIdentities
  permissions

  networkExposure
  dataResources

  banner
  versionMetadata

  telemetryProfile
}
```

Possible states:

```text
RUNNING
STOPPED
DEGRADED
BLOCKED
ISOLATED
```

Tools interact with services rather than directly with machines.

Examples:

```text
ssh       → SSH service
psql      → PostgreSQL service
curl      → HTTP/HTTPS service
smbclient → SMB service
nmap      → discovers exposed services
```

---

# 12. PostgreSQL Simulation

ROOT should provide a PostgreSQL-flavored interaction layer rather than implementing PostgreSQL itself.

Example connection:

```text
psql -h FIN-DB -U svc_finance -d finance
```

or:

```text
psql postgresql://svc_finance@FIN-DB:5432/finance
```

ROOT may then request:

```text
Password:
```

Successful connection:

```text
psql (ROOT simulated PostgreSQL)
SSL connection established.

Type "\?" for help.

finance=>
```

---

# 13. Supported PostgreSQL Commands

Initial meta commands:

```text
\dt
\d <table>
\q
\?
```

Initial SQL functionality should focus primarily on read interactions.

Examples:

```sql
SELECT * FROM documents;
```

```sql
SELECT filename, classification FROM documents;
```

```sql
SELECT * FROM users WHERE role = 'finance';
```

ROOT does not require a complete SQL implementation.

A constrained SQL parser can transform:

```sql
SELECT filename FROM documents;
```

into something conceptually equivalent to:

```text
QueryDatabase {
    database: finance
    table: documents
    columns: [filename]
}
```

---

# 14. Database Simulation Model

Suggested structure:

```ts
DatabaseService {
  serviceId
  databases[]
}
```

```ts
Database {
  id
  name
  tables[]
}
```

```ts
DatabaseTable {
  id
  name
  columns[]
  rows[]
  permissions[]
}
```

Permissions might include:

```text
SELECT
INSERT
UPDATE
DELETE
ADMIN
```

Player access should depend on the authenticated database identity.

Example:

```text
svc_finance

finance.documents → SELECT
finance.users     → SELECT
finance.audit_log → DENIED
```

---

# 15. Credentials as First-Class Objects

Credentials must not function merely as unlock flags.

A credential should represent actual authentication material.

Example:

```ts
Credential {
  id

  type: "PASSWORD"

  username: "svc_finance"
  secret: "meridian-prod-42"

  discoveredAt
  discoveredFrom

  knownScopes[]
  metadata
}
```

Other credential types may eventually include:

```text
PASSWORD
SSH_KEY
API_TOKEN
SESSION_TOKEN
DATABASE_CONNECTION_STRING
SERVICE_ACCOUNT
```

---

# 16. Credential Usage

The player should be able to try credentials against systems.

The game may know that:

```text
svc_finance / meridian-prod-42
```

works against:

```text
FIN-DB PostgreSQL
```

but the player should still perform the authentication.

The same credential could potentially work against:

```text
FIN-DB SSH
```

if credential reuse exists.

This allows emergent gameplay.

The player learns:

```text
credential
    ↓
identity
    ↓
service
    ↓
permissions
    ↓
data / capability
```

instead of:

```text
credential
    ↓
unlock door
```

---

# 17. Credentials Application

ROOT's Credentials application should act as an investigation aid, not an automatic access system.

Example entry:

```text
svc_finance

Type:
Password

Found:
WEB-01:/var/www/app/.env

Associated service:
PostgreSQL

Known host:
FIN-DB

Secret:
••••••••••••••••

[Reveal]
[Copy]
[Use]
```

Depending on assistance mode, **Use** could:

* open the terminal
* prefill part of the command
* generate the command
* provide only connection metadata

The simulation remains identical regardless of UI assistance.

---

# 18. No Generic `privesc`

The player-facing command:

```text
privesc
```

should be removed from the long-term design.

Privilege escalation should instead emerge from relationships in the simulated machine.

Example:

```text
deploy@DEV-01:~$ whoami
deploy
```

```text
deploy@DEV-01:~$ id
uid=1002(deploy) gid=1002(deploy) groups=deploy,backup
```

```text
deploy@DEV-01:~$ ps
USER    PID    COMMAND

root    814    /usr/local/bin/backup-sync
```

The player investigates:

```text
cat /etc/backup-sync.conf
```

and discovers:

```text
script=/opt/backup/run.sh
run_as=root
```

They inspect:

```text
ls -l /opt/backup/run.sh
```

and discover that their current identity has some meaningful relationship with the resource.

The simulation should model the relationship responsible for the privilege boundary change.

Internally ROOT may still have an event such as:

```text
PRIVILEGE_ESCALATION
```

but it should describe an outcome rather than a player command.

---

# 19. No Generic `exploit`

The same rule applies to:

```text
exploit
```

The player should interact with the relevant interface.

For HTTP:

```text
curl https://portal.meridian.test/api/profile
```

The player might discover:

```text
/api/admin/export
```

and investigate the application's authorization behavior.

The gameplay concept becomes:

```text
identity
+
request
+
authorization policy
+
application behavior
```

rather than:

```text
machine has vulnerability

→ type exploit

→ machine compromised
```

ROOT may internally classify an interaction as:

```text
EXPLOIT_VULNERABILITY
```

but the player-facing action should remain concrete.

---

# 20. Tool Philosophy

ROOT tools should represent recognizable real-world categories.

Examples:

| System / Concept     | ROOT Interface                 |
| -------------------- | ------------------------------ |
| Remote shell         | `ssh`                          |
| PostgreSQL           | `psql`                         |
| HTTP / API           | `curl` / Web Inspector         |
| Service discovery    | `nmap`                         |
| DNS                  | `dig`                          |
| Network connectivity | `ping`                         |
| File shares          | `smbclient`                    |
| Packet traffic       | Packet Viewer                  |
| Running processes    | Process Monitor / `ps`         |
| Logs                 | Log Viewer / SIEM              |
| Files                | Files application / Unix shell |

Not every interaction needs to happen through the terminal.

ROOT/OS applications can provide richer interfaces while using the exact same simulation actions.

---

# 21. Packet Viewer / Wireshark-Inspired Tool

ROOT should eventually include a Packet Viewer inspired by packet-analysis tools.

It should not reproduce every feature of Wireshark.

The simulation should provide synthetic traffic generated from actual world events.

Example:

```text
12:04:11.024  DEV-01     → FIN-DB     TCP 5432
12:04:11.037  FIN-DB     → DEV-01     PostgreSQL
12:04:15.821  DEV-01     → AUTH-01    HTTPS
```

Possible filters:

```text
host == FIN-DB
port == 5432
protocol == postgres
source == DEV-01
```

The packet viewer should reveal relationships between systems.

---

# 22. Simulation-Generated Telemetry

Every relevant player or AI action should be capable of generating telemetry.

Example SSH authentication:

```text
Player enters:

ssh deploy@DEV-01
```

Possible generated events:

```text
NETWORK_CONNECTION_ATTEMPT

SSH_AUTHENTICATION_ATTEMPT

SSH_AUTHENTICATION_SUCCESS

USER_SESSION_CREATED

PROCESS_STARTED
```

These events feed Blue Team systems.

For example:

```text
SIEM
EDR
Authentication Logs
Network Telemetry
Process Monitor
Alert Queue
```

Red Team and Blue Team therefore operate on the same underlying simulation.

---

# 23. Shared Red / Blue State

A Red Team action should naturally affect Blue Team visibility.

Example:

```text
Red:
ssh deploy@DEV-01
```

may produce:

```text
Blue:
Successful remote authentication

Identity:
deploy

Source:
OPS-01

Destination:
DEV-01
```

If Blue disables `deploy`, a later Red action:

```text
ssh deploy@DEV-01
```

could produce:

```text
Permission denied.
Account disabled.
```

If Blue isolates `DEV-01`:

```text
ssh: connect to host DEV-01 port 22: No route to host
```

The terminal output therefore reflects shared world state rather than predetermined script branches.

---

# 24. Scenario Authoring Model

Scenarios should not define fixed success paths.

Avoid:

```ts
if (playerUsedSvcFinance) {
  unlockFinDb();
}
```

Prefer:

```text
FIN-DB exists.

FIN-DB runs PostgreSQL.

PostgreSQL accepts svc_finance.

svc_finance has SELECT permission on documents.

documents contains PROJECT_ATLAS records.
```

The player's route emerges from the world's configuration.

---

# 25. Scenario Building Blocks

Scenario authors should construct operations using reusable primitives.

Primary primitives:

```text
Machine
Network
Service
Identity
Credential
Permission
File
Process
Application
Database
Data Resource
Trust Relationship
Security Control
Telemetry Rule
Objective
```

Example:

```text
WEB-01
    │
    ├── HTTP
    │
    └── filesystem
           │
           └── .env
                 │
                 └── credential: svc_finance
                              │
                              ▼
FIN-DB
    │
    └── PostgreSQL
           │
           └── finance database
                  │
                  └── documents table
                           │
                           └── PROJECT_ATLAS
```

The operation can emerge from these relationships without hardcoding:

```text
WEB-01 → FIN-DB → objective
```

as a special scripted route.

---

# 26. Assistance Modes

All assistance modes must interact with the exact same simulation.

The difference is how much ROOT helps the player express an action.

---

# 27. Casual Mode

Casual Mode may automate syntax.

Example discovery:

```text
PostgreSQL Service

FIN-DB
Port 5432

Known credential:
svc_finance
```

ROOT may display:

```text
[Connect to database]
```

Clicking it can visibly execute:

```text
psql -h FIN-DB -U svc_finance -d finance
```

ROOT may allow the player to select the known credential instead of manually typing it.

Casual players therefore still see what action is being performed.

---

# 28. Guided Mode

Guided Mode may suggest commands without automatically running them.

Example:

```text
PostgreSQL detected on FIN-DB.

Known credential:
svc_finance

Suggested command:

psql -h FIN-DB -U svc_finance -d finance
```

The player runs the command.

---

# 29. Operator Mode

Operator Mode exposes the information but removes command suggestions.

Example:

```text
FIN-DB
5432/tcp
PostgreSQL

Credential discovered:
svc_finance
```

The player is expected to know that PostgreSQL can be accessed using `psql`.

---

# 30. Veteran / Black Box Mode

Veteran Mode significantly reduces interpretation and hints.

Example discovery:

```text
FIN-DB

5432/tcp open
```

The player must determine:

* what the service probably is
* which tool interacts with it
* which identity may authenticate
* which credentials to try
* why accessing it matters

The simulation itself remains unchanged.

---

# 31. Assistance Rule

ROOT should follow one strict principle:

> **Casual Mode may automate syntax, but it must never automate reasoning.**

Assistance may help with:

* command syntax
* formatting connection strings
* selecting known hosts
* selecting known credentials
* tool discovery
* explaining command arguments
* recalling previously discovered information

Assistance should not tell the player:

```text
Use this password on FIN-DB to reach the objective.
```

unless such guidance is explicitly part of an introductory tutorial.

---

# 32. Unified Action Model

Terminal commands and graphical actions should translate into identical simulation intents.

Operator:

```text
psql -h FIN-DB -U svc_finance -d finance
```

Casual:

```text
[Connect using svc_finance]
```

Both should resolve to something equivalent to:

```ts
ConnectToService({
  sourceMachineId: "OPS-01",
  targetMachineId: "FIN-DB",
  serviceId: "postgres-fin-db",
  identityId: "svc_finance",
  authenticationMethod: "PASSWORD"
});
```

This prevents ROOT from becoming separate Casual and Operator games.

There is only:

> **one simulation with multiple ways to express intent.**

---

# 33. Internal Simulation Actions

Internally, ROOT may use generic actions.

Examples:

```text
CONNECT_TO_SERVICE
AUTHENTICATE
OPEN_SESSION
QUERY_DATABASE
READ_FILE
LIST_DIRECTORY
ENUMERATE_SERVICE
SEND_HTTP_REQUEST
RESOLVE_HOSTNAME
CREATE_PROCESS
ACCESS_RESOURCE
MODIFY_RESOURCE
```

These should remain engine abstractions.

Players interact with interfaces such as:

```text
ssh
psql
curl
ls
cat
```

instead.

---

# 34. Command Adapter Pattern

Each supported tool should translate syntax into simulation intents.

Example architecture:

```text
Terminal
   │
   ├── ssh adapter
   ├── psql adapter
   ├── curl adapter
   ├── nmap adapter
   ├── ping adapter
   ├── dig adapter
   └── unix adapter
```

Suggested interface:

```ts
interface ToolAdapter {
  canHandle(input: string, context: TerminalContext): boolean;

  parse(
    input: string,
    context: TerminalContext
  ): SimulationIntent;

  formatResult(
    result: SimulationResult
  ): TerminalOutput;
}
```

This allows ROOT to add tools incrementally.

---

# 35. Session Model

Interactive tools should create session objects.

Example SSH session:

```ts
Session {
  id

  type: "SSH"

  sourceMachineId
  targetMachineId

  identityId

  authenticatedAt

  state
}
```

PostgreSQL:

```ts
Session {
  id

  type: "POSTGRES"

  sourceMachineId
  targetServiceId

  identityId

  databaseId

  state
}
```

The current terminal context references the active session.

---

# 36. Session Lifecycle

Possible states:

```text
CONNECTING
AUTHENTICATING
ACTIVE
FAILED
TERMINATED
INTERRUPTED
```

Sessions may become invalid because of world changes.

Examples:

```text
Blue isolates host.

Account disabled.

Service stopped.

Network rule changed.

Machine shut down.
```

The terminal should react accordingly.

---

# 37. Identity and Permission Model

Identity should be distinct from credentials.

Example:

```text
Identity:
svc_finance
```

may have:

```text
Credentials:
Password credential A

Permissions:
PostgreSQL finance.documents SELECT
PostgreSQL finance.users SELECT
```

Credentials answer:

> Can I prove I am this identity?

Permissions answer:

> What can this identity do after authentication?

This distinction should be fundamental to ROOT.

---

# 38. Trust Relationships

ROOT should explicitly model trust.

Examples:

```text
SSH accepts identity X.

Database accepts identity Y.

Application trusts service account Z.

Machine A can reach network B.

Identity A can assume role B.

Service A authenticates against AUTH-01.
```

These relationships create gameplay.

As players progress, they should learn to think in graphs:

```text
Identity
   │
Credential
   │
Service
   │
Permission
   │
Resource
```

and:

```text
Machine
   │
Network
   │
Service
   │
Machine
```

---

# 39. Tool Availability

Tools should exist as part of the player's ROOT/OS environment.

Possible initial workstation tools:

```text
Terminal
Network Map
Files
Credentials
Intel
Mission
```

Expanded version:

```text
Terminal
Network Map
Files
Credentials
Web Inspector
Packet Viewer
Process Monitor
Log Viewer / SIEM
Case Board
Toolbox
Knowledge Tracker
```

The graphical tools should not bypass the simulation.

They are alternate views over the same data.

---

# 40. Command Discovery

ROOT should make command learning part of progression.

Possible mechanisms:

```text
help
man
tool --help
autocomplete
command history
suggested commands
Knowledge Tracker
contextual hints
```

Example:

```text
ssh --help
```

does not need to reproduce the real SSH manual.

It might show only ROOT-supported syntax:

```text
Usage:

ssh USER@HOST
ssh -i KEY USER@HOST
```

This clearly communicates that ROOT supports a bounded implementation.

---

# 41. Unsupported Syntax

ROOT must handle unsupported functionality gracefully.

Example:

```text
ssh -L 8080:internal:80 deploy@DEV-01
```

If forwarding is not implemented:

```text
ROOT ssh: option '-L' is not supported in this simulation.
```

The game should avoid pretending the command worked.

Likewise:

```text
psql --some-complex-real-world-option
```

may respond:

```text
This psql option is not available in ROOT.
```

---

# 42. Realism Boundary

ROOT should optimize for:

```text
Conceptual authenticity
Recognizable syntax
Consistent system behavior
Meaningful relationships
Transferable knowledge
Good gameplay
```

not:

```text
Perfect protocol implementation
Perfect operating-system emulation
Perfect command compatibility
Real exploit execution
Full VM realism
```

The question for every feature should be:

> Does implementing this teach or enable an interesting system interaction?

If not, it probably does not belong in ROOT.

---

# 43. Security and Isolation

ROOT should remain entirely simulation driven.

Player commands must never directly:

* run host system binaries
* connect to arbitrary external systems
* execute arbitrary shell commands
* access the server filesystem
* create real network connections based on player input

Commands should be parsed into bounded simulation actions.

For example:

```text
ssh deploy@DEV-01
```

must never result in:

```text
child_process.exec("ssh deploy@DEV-01")
```

It should become a simulation action.

The same applies to:

```text
curl
psql
nmap
ping
dig
```

---

# 44. MVP Tool Set

Recommended realistic interaction MVP:

### Unix

```text
pwd
ls
cd
cat
grep
find
whoami
id
hostname
env
ps
```

### Network

```text
ping
ip
nmap
```

### Remote Access

```text
ssh
```

### Web

```text
curl
```

### Database

```text
psql
```

### Supporting ROOT/OS Apps

```text
Network Map
Credentials
Files
Mission
Intel
```

This already provides substantially deeper gameplay than generic:

```text
exploit
privesc
```

---

# 45. Phase Two Tools

After the simulation model proves itself:

```text
dig
host
scp
smbclient
Packet Viewer
Web Inspector
Process Monitor
Log Viewer
```

Potential later additions should be driven by scenario needs rather than tool-count targets.

---

# 46. Player Progression

ROOT should deliberately move players through the following progression:

```text
Clicking
    ↓
Recognizing
    ↓
Understanding
    ↓
Typing
    ↓
Combining
    ↓
Reasoning
```

Example PostgreSQL progression:

### Stage 1

Player clicks:

```text
Connect to database
```

ROOT displays:

```text
psql -h FIN-DB -U svc_finance -d finance
```

### Stage 2

ROOT gives the command but asks the player to run it.

### Stage 3

ROOT gives:

```text
PostgreSQL
FIN-DB
svc_finance
```

Player constructs the command.

### Stage 4

ROOT gives:

```text
FIN-DB
5432/tcp
```

Player recognizes PostgreSQL.

### Stage 5

Player recognizes database access as only one relationship inside a larger system.

---

# 47. Scenario Design Standard

Every scenario interaction should answer three questions:

### 1. What does the player observe?

Example:

```text
5432/tcp open
```

### 2. What relationship can they infer?

Example:

```text
FIN-DB appears to expose PostgreSQL.
```

### 3. What concrete interaction can they perform?

Example:

```text
psql -h FIN-DB -U svc_finance -d finance
```

Avoid interactions where the answer to #3 is:

```text
exploit
```

or:

```text
privesc
```

---

# 48. Scenario Validation Rule

A well-authored ROOT scenario should ideally remain solvable because of simulation relationships rather than because the scenario contains hidden script conditions.

Good:

```text
Credential works because the configured service accepts it.
```

Bad:

```text
Credential works because the mission script checks whether the player found Item #14.
```

Good:

```text
Player reaches a file because their identity has access.
```

Bad:

```text
File appears because Objective 3 was completed.
```

Mission scripting may still exist for:

* story beats
* dialogue
* pacing
* objectives
* tutorial guidance
* AI behavior
* environmental events

but not as the primary mechanism determining system access.

---

# 49. Example Full Interaction

Player discovers:

```text
WEB-01:/var/www/app/.env
```

Contents:

```text
DB_HOST=FIN-DB
DB_PORT=5432
DB_USER=svc_finance
DB_PASSWORD=meridian-prod-42
DB_NAME=finance
```

The credential is added to the Credentials application.

Player checks connectivity:

```text
ping FIN-DB
```

Then scans:

```text
nmap FIN-DB
```

ROOT returns:

```text
PORT      STATE   SERVICE
5432/tcp  open    postgresql
```

Player connects:

```text
psql -h FIN-DB -U svc_finance -d finance
```

ROOT asks:

```text
Password:
```

Player enters:

```text
meridian-prod-42
```

Connection succeeds:

```text
finance=>
```

Player enters:

```text
\dt
```

ROOT returns:

```text
 Schema | Name
--------+-----------------
 public | documents
 public | employees
 public | audit_events
```

Player investigates:

```sql
SELECT filename, classification FROM documents;
```

ROOT returns scenario-backed data.

Meanwhile the simulation creates:

```text
NETWORK_CONNECTION
POSTGRES_AUTH_SUCCESS
DATABASE_SESSION_CREATED
DATABASE_QUERY
```

Blue Team sees corresponding telemetry.

No mission-specific database-unlock command was required.

---

# 50. Definition of Done

The realistic interaction architecture is considered established when ROOT can support a scenario in which a player can:

1. Enumerate a host.
2. Discover a service.
3. Discover an identity or credential.
4. Authenticate through a recognizable interface.
5. Enter a service-specific context.
6. Inspect resources available to that identity.
7. Generate shared simulation events.
8. Have Blue Team observe and respond to those events.
9. Have Blue Team actions affect the player's active or future sessions.
10. Complete the objective without requiring generic `hack`, `exploit`, or `privesc` commands.

---

# 51. Architectural Rules

The following should be treated as long-term ROOT architecture rules.

**Rule 1**

> Tools express player intent. The simulation determines results.

**Rule 2**

> Services are first-class simulation objects.

**Rule 3**

> Identities and credentials are separate concepts.

**Rule 4**

> Permissions determine what authenticated identities can do.

**Rule 5**

> Credentials should be usable, not merely collectible.

**Rule 6**

> Casual Mode automates syntax, not reasoning.

**Rule 7**

> Different interfaces must resolve into the same simulation actions.

**Rule 8**

> Scenario success should emerge from relationships whenever possible.

**Rule 9**

> Player-facing interactions should be concrete rather than abstract.

**Rule 10**

> Realism stops where it stops improving gameplay or learning.

---

# 52. Final Product Direction

ROOT should ultimately feel like the player is sitting at a fictional security workstation inside a living enterprise environment.

They should gradually learn that:

```text
hosts
ports
users
passwords
files
databases
processes
logs
network traffic
permissions
```

are not isolated puzzle pieces.

They form interconnected systems.

The player's progression should therefore evolve from:

```text
"I found a password."
```

to:

```text
"This credential belongs to this identity."
```

to:

```text
"This identity authenticates to this service."
```

to:

```text
"This service gives the identity these permissions."
```

to:

```text
"Those permissions expose this resource."
```

to eventually:

```text
"I understand the trust structure of this environment."
```

That should be the foundation of ROOT's gameplay.

**ROOT does not reward players for knowing magic hacking commands.**

It rewards them for understanding systems.
