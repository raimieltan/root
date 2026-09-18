# ROOT/OS — Diegetic UI Language Guide

> Canonical reference for player-facing terminology, application naming, navigation, system copy, and in-world UI framing.
>
> Status: Production Design Reference
>
> Applies to: ROOT/OS shell, Operations Desk, Engagement Workspace, Security Operations Center, Employee Portal, After-Action Review, terminal, host tools, dialogs, notifications, training, progression, operation selection, replay/reconstruction, and all future internal applications.

---

# 1. Purpose

ROOT is a desktop/security simulator.

The interface should not describe the game to the player.

It should present the software that the player's character would plausibly be using inside the world.

The player should never feel like they are navigating:

```text
MAIN MENU
CAMPAIGN
RED TEAM MODE
BLUE TEAM MODE
CAREER HUB
REPLAY
DIFFICULTY SELECT
```

They should feel like they are sitting at a company workstation and using:

```text
OPERATIONS DESK
ENGAGEMENT WORKSPACE
SECURITY OPERATIONS CENTER
EMPLOYEE PORTAL
AFTER-ACTION REVIEW
```

This distinction is mandatory.

---

# 2. Core Principle

> **Every visible label should make sense to the employee using the system, not to the developer building the game.**

Developer concepts may remain in:

- route names
- component names
- state names
- TypeScript types
- internal docs
- scenario metadata
- debugging tools

But player-facing copy should use believable in-world terminology.

Example:

```text
DEV / CODE NAME:
Red Team

PLAYER-FACING NAME:
Engagement Workspace
```

Example:

```text
DEV / CODE NAME:
Career Hub

PLAYER-FACING NAME:
Employee Portal
```

Example:

```text
DEV / CODE NAME:
Replay

PLAYER-FACING NAME:
After-Action Review
```

---

# 3. Diegetic UI Definition

ROOT uses **diegetic UI**.

A diegetic interface is presented as software, documentation, tooling, communication, or system output that plausibly exists inside the fictional world.

The player is not looking at a game interface layered on top of the simulation.

The player is using the simulated software itself.

Good:

```text
Open Engagements
Assigned To
Clearance Required
Last Updated
Incident Status
Authentication Activity
Employee Grade
Completed Training
Case Archive
```

Bad:

```text
Missions
Quests
Unlock Level
XP Required
Blue Team Mode
Red Team Mode
Replay Mission
Difficulty: Hard
Rewards
Skill Tree
```

---

# 4. The Reality Test

Before approving any player-facing label, ask:

> **Would a real employee plausibly see this exact wording in internal software?**

If no, rewrite it.

Examples:

```text
"Campaign"
→ No.

"Operations"
→ Yes.
```

```text
"Mission"
→ Usually no.

"Engagement"
→ Yes.

"Assignment"
→ Yes.

"Task"
→ Yes.

"Case"
→ Yes.
```

```text
"Career Hub"
→ No.

"Employee Portal"
→ Yes.
```

```text
"Replay"
→ No.

"After-Action Review"
→ Yes.

"Operation Reconstruction"
→ Yes.
```

---

# 5. Player-Facing Information Architecture

ROOT/OS should present five primary in-world applications.

```text
ROOT/OS
│
├── Operations Desk
│
├── Engagement Workspace
│
├── Security Operations Center
│
├── Employee Portal
│
└── After-Action Review
```

These correspond to the game's current page architecture:

| Code / Internal Concept | Current Route | Canonical Player-Facing Application |
|---|---|---|
| Home / Campaign Selection | `app/page.tsx` | **Operations Desk** |
| Red Team Operations | `app/red/page.tsx` | **Engagement Workspace** |
| Blue Team Defense | `app/blue/page.tsx` | **Security Operations Center** |
| Career Hub | `app/career/page.tsx` | **Employee Portal** |
| Replay / Reconstruction | `app/replay/[scenarioId]/page.tsx` | **After-Action Review** |

The route names do not need to change immediately.

The visible UI does.

---

# 6. Canonical Application Names

## 6.1 Operations Desk

Window title:

```text
Operations Desk - ROOT/OS
```

Purpose:

- assigned work
- available engagements
- client work
- access requirements
- operation status
- recently completed work
- operator workload
- case history shortcuts

This replaces the game-facing concept of:

```text
Campaign
Campaign Selection
Mission Select
Operation Select
```

Preferred labels:

```text
Open Engagements
Assigned Engagements
Recent Activity
Completed Engagements
Access Requirements
Engagement Details
Client
Target Environment
Priority
Status
Assigned By
Due / Review Date
```

---

# 7. Operations Desk Mental Model

The Operations Desk should feel like a hybrid of:

- Jira
- ServiceNow
- internal consulting engagement tracker
- ticket queue
- project assignment system
- internal operations dashboard

Do not make it feel like a game campaign map.

The player should feel like they are selecting work from a real company queue.

---

# 8. Operations Desk — Suggested Layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Operations Desk - ROOT/OS                                    _ □ × │
├──────────────────────────────────────────────────────────────────────┤
│ File  View  Engagement  Tools  Help                                │
├──────────────────────────────────────────────────────────────────────┤
│ [ Refresh ] [ Open ] [ View Brief ] [ Assignments ] [ Archive ]    │
├──────────────────────┬───────────────────────────────────────────────┤
│ WORK QUEUES          │ OPEN ENGAGEMENTS                              │
│                      │                                               │
│ > Assigned to Me     │ ID       Client        Priority    Status     │
│   Available          │ ENG-1042 Meridian      Normal      Available  │
│   In Progress        │ ENG-1043 Helix         High        Assigned   │
│   Awaiting Review    │ ENG-1044 Northstar     Normal      Restricted │
│   Completed          │                                               │
│                      │                                               │
├──────────────────────┴───────────────────────────────────────────────┤
│ Selected: ENG-1042 | Clearance: C1 | Owner: Offensive Operations   │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 9. Engagement Naming

Avoid:

```text
Mission
Quest
Level
Campaign Node
Stage
Boss
Objective Reward
```

Use:

```text
Engagement
Assignment
Case
Task
Work Item
Operation
Request
Assessment
Investigation
Exercise
```

The exact term depends on context.

Recommended default:

```text
Engagement
```

Use `Operation` when the work is active and operational.

Use `Case` when it is investigative.

Use `Exercise` when it is training.

---

# 10. Engagement IDs

Use believable identifiers.

Examples:

```text
ENG-1042
OPS-2318
IR-2026-041
SEC-1187
REQ-4021
EX-019
```

Avoid:

```text
MISSION-01
LEVEL-03
BOSS-05
STAGE-2
```

---

# 11. Engagement Status Vocabulary

Recommended statuses:

```text
Available
Assigned
In Progress
Awaiting Review
Pending Client
Pending Approval
Blocked
Restricted
Completed
Closed
Cancelled
Archived
```

Avoid:

```text
Unlocked
Locked
Cleared
Beaten
Finished Level
Failed Mission
```

When access is unavailable, prefer:

```text
Access Restricted
Clearance Required
Prerequisite Required
Not Assigned
Approval Required
Training Required
```

---

# 12. Access Requirements

Game progression should be expressed as workplace access.

Bad:

```text
LOCKED
Requires Level 15
Complete Mission 4
Collect 5 Intel Files
```

Good:

```text
ACCESS RESTRICTED

Requirements:
☑ NRO-1 certification
☑ Clearance C2
☐ Advanced Network Operations qualification
☐ Supervisor approval
```

Or:

```text
Access unavailable.

Required:
- Employee Grade O-2
- Clearance C2
- ENG-1038 completion
```

The underlying mechanics may still be level-based.

The UI should present them as organizational requirements.

---

# 13. Difficulty Must Be Diegetic

Do not expose:

```text
Difficulty
Easy
Normal
Hard
Guided Mode
Operator Mode
```

unless the context is explicitly a training simulation.

For real engagements, frame assistance as workflow or support configuration.

Recommended:

```text
Workflow Mode

◉ Assisted
○ Standard
```

Alternative:

```text
Operator Support

◉ Advisory Enabled
○ Independent
```

Alternative:

```text
Guidance

◉ Analyst Support
○ Self-Directed
```

Descriptions:

```text
ASSISTED
Contextual guidance, procedural reminders, and additional analyst notes are available.

STANDARD
Standard operating information only. No contextual guidance is provided.
```

Never imply enemies become artificially stronger or weaker because of "difficulty."

---

# 14. Rewards Must Be Diegetic

Avoid prominent:

```text
+1200 XP
+500 Credits
Rare Reward
Rank Points
```

Translate progression into plausible workplace outcomes.

Examples:

```text
Engagement closed successfully.

Performance record updated.
Competency assessment updated.
Training credit recorded.
Clearance review progress updated.
```

If numeric XP must remain internally:

```text
Professional Development
6,450 / 10,000
```

or:

```text
Operator Development Score
6,450
```

Do not celebrate it like an RPG reward screen.

---

# 15. Engagement Workspace

Canonical title:

```text
Engagement Workspace - ROOT/OS
```

This is the player-facing form of the internal `Red Team` page.

Do not visibly label it:

```text
Red Team
Red Team Operations
Attack Mode
Offense Mode
```

unless a believable internal organizational context specifically requires the term.

The workspace should feel like offensive security tooling used during an authorized engagement.

---

# 16. Engagement Workspace — Primary Areas

Recommended areas:

```text
Engagement Brief
Tasking
Operator Console
Network Map
Credential Findings
Host Details
Activity Summary
Evidence / Artifacts
Case Notes
```

The interface should communicate that the operator is performing assigned security work.

---

# 17. MissionPanel Rename

Internal component:

```text
MissionPanel
```

Player-facing label:

```text
Engagement Brief
```

Tabs may be:

```text
Brief
Tasking
Notes
Evidence
```

Do not show:

```text
MISSION PANEL
MISSION OBJECTIVES
MISSION HINTS
```

---

# 18. Engagement Brief

Example:

```text
ENG-1042 — Black Orchard

Client:
Helix Biotech

Engagement Type:
External Security Assessment

Scope:
Research Network / Seattle Facility

Authorized Window:
20:00–04:00 UTC

Tasking:
Establish initial access to the authorized environment.
Identify reachable internal systems.
Assess access controls protecting research infrastructure.

Restrictions:
Do not disrupt production services.
Do not modify customer data.
Do not access out-of-scope hosts.
```

This is much stronger than:

```text
MISSION OBJECTIVE:
Hack the server.
```

---

# 19. Tasking Instead of Objectives

`Objectives` can be used in formal documents, but `Tasking` is preferred for the operational UI.

Recommended:

```text
Tasking
```

Examples:

```text
[ ] Establish authorized foothold
[ ] Identify internal network segments
[ ] Validate domain access
[ ] Collect requested evidence
[ ] Complete engagement notes
```

Avoid:

```text
MAIN OBJECTIVE
BONUS OBJECTIVE
SIDE QUEST
```

---

# 20. Guidance / Hint System

Game hints must look like analyst support.

Do not label:

```text
Hint
Tutorial Hint
Guided Mode Hint
```

Prefer:

```text
Analyst Note
Procedure Note
Reference
Suggested Next Step
Support Guidance
```

Example:

```text
ANALYST NOTE

The exposed VPN service may accept domain credentials.
Review collected account material before attempting additional access.
```

In Standard mode, these notes may simply not appear.

---

# 21. Hypotheses

`Competing Hypotheses` is acceptable because it resembles real analytical methodology.

Preferred variants:

```text
Working Hypotheses
Analytical Hypotheses
Current Assessment
Possible Access Paths
```

Example:

```text
WORKING HYPOTHESES

○ H1 — Credential reuse
○ H2 — Exposed remote-access service
○ H3 — Third-party access
○ H4 — Misconfigured internal service
```

Evidence may be attached as:

```text
E-01
E-02
E-03
```

This is strongly diegetic.

---

# 22. OPSEC / Detection Mechanics

Avoid game meters like:

```text
STEALTH: 73%
DETECTION METER
ENEMY ALERT LEVEL
```

Use plausible operational language.

Recommended:

```text
Activity Summary

Network Activity       Elevated
Authentication Noise   Low
Endpoint Artifacts     Moderate
Security Attention     Unknown
```

Alternative:

```text
Exposure Indicators
```

States:

```text
Nominal
Low
Moderate
Elevated
High
Unknown
```

Do not guarantee what defenders know unless the player has evidence.

---

# 23. Terminal

Canonical player-facing name:

```text
Operator Console
```

or:

```text
Command Console
```

Window title examples:

```text
Operator Console - DC-01
Command Console - ROOT/OS
Remote Shell - DEV-01
```

The terminal itself should remain authentic.

Do not add game-specific instructions inside the terminal unless they are represented as actual system tools.

---

# 24. Network Map

`Network Map` is already believable.

Other acceptable terms:

```text
Topology
Network Topology
Infrastructure Map
Asset Map
```

Labels should remain technical:

```text
Discovered
Reachable
Authenticated
Unresponsive
Isolated
Unknown
```

Avoid:

```text
Unlocked Node
Enemy Node
Boss Server
Level Area
```

---

# 25. CredentialsPanel

Internal component:

```text
CredentialsPanel
```

Preferred visible title:

```text
Credential Findings
```

Alternative:

```text
Collected Credentials
Credential Artifacts
Account Findings
```

Recommended columns:

```text
Account
Material
Type
Source
Validation
Last Used
Actions
```

Validation states:

```text
Valid
Invalid
Unverified
Expired
Locked
```

---

# 26. Host Inspection

Use:

```text
Host Details
Host Inspector
Endpoint Details
System Details
```

Recommended tabs:

```text
Summary
Files
Processes
Services
Sessions
Event Logs
Network
Accounts
Registry
```

Avoid game abstractions.

The host should look like a real machine being inspected.

---

# 27. Security Operations Center

Canonical title:

```text
Security Operations Center - ROOT/OS
```

This is the player-facing form of the internal Blue Team page.

Do not expose:

```text
Blue Team
Defense Mode
Defender View
```

Use real SOC terminology.

---

# 28. SOC Primary Areas

Recommended:

```text
Alert Queue
Active Detections
Event Search
Authentication Activity
Endpoint Inspection
Incident Workspace
Response Actions
Service Availability
Evidence
Case Notes
```

The player should feel like a SOC analyst.

---

# 29. Alert Queue

Use real alert language.

Recommended columns:

```text
Time
Severity
Host
User
Rule
Event
Source
Status
Assigned To
```

Statuses:

```text
New
Open
Investigating
Monitoring
Contained
Resolved
Closed
Suppressed
```

Avoid:

```text
Enemy Detected
Attack Found
Hacker Spotted
```

---

# 30. Authentication Analysis

Preferred title:

```text
Authentication Activity
```

Tabs:

```text
Recent Logons
Failed Attempts
Suspicious Sessions
Account Status
Privileged Access
```

Use believable authentication records.

Example:

```text
TIME       USER       SOURCE       DESTINATION   METHOD   RESULT
18:24:17   j.smith    10.10.5.23  SRV-APP-01    RDP      Success
18:18:02   unknown    203.0.113.45 SRV-APP-01    RDP      Failed
```

---

# 31. Response Controls

Preferred title:

```text
Response Actions
```

Buttons may include:

```text
[ Isolate Host ]
[ Disable Account ]
[ Block Address ]
[ Collect Evidence ]
[ Terminate Session ]
[ Open Incident ]
```

Do not say:

```text
COUNTERATTACK
DEFEND
USE ABILITY
```

---

# 32. Incident Workspace

Canonical title:

```text
Incident Workspace
```

This is already realistic.

Recommended structure:

```text
Incident
Timeline
Evidence
Notes
Containment
Related Activity
```

Example:

```text
INC-2026-1187

Status:
Investigating

Category:
Suspicious Process Execution

Assigned To:
j.smith

Affected Host:
SRV-APP-01

Priority:
P1
```

---

# 33. DataPanel

Internal component:

```text
DataPanel
```

Do not expose `DataPanel` as a generic visible title.

The visible title should describe the content.

Examples:

```text
System Information
Recent Files
Process Activity
Network Connections
Event History
Browser Artifacts
Related Accounts
Service State
```

Component names are not UI names.

---

# 34. Employee Portal

Canonical title:

```text
Employee Portal - Nodeline Security
```

or:

```text
Employee Portal - ROOT/OS
```

This replaces:

```text
Career Hub
Character Profile
Progression
Skill Screen
```

The player should feel like they are viewing internal HR/training software.

---

# 35. Employee Portal Mental Model

Combine:

- HR self-service portal
- internal LMS
- certification tracker
- employee profile
- competency matrix
- clearance/access records
- performance history

Recommended sections:

```text
Profile
Employment
Training
Certifications
Competencies
Clearance & Access
Performance
Assignments
Documents
```

---

# 36. Player Level

Avoid:

```text
Level 12
XP
Next Level
```

Preferred in-world representations:

```text
Employee Grade
Operator Grade
Role Grade
Professional Level
Designation
```

Example:

```text
Designation:
Security Operator II

Employee Grade:
O-2
```

If the underlying system still needs a numeric level, convert it through a mapping.

Example:

```text
Internal level 1–4
→ Associate Operator

Internal level 5–9
→ Security Operator I

Internal level 10–14
→ Security Operator II

Internal level 15–19
→ Senior Security Operator

Internal level 20+
→ Principal Operator
```

Exact mapping may change.

The important point is that the player sees an employment structure.

---

# 37. XP

Do not prominently show:

```text
XP: 6,450 / 10,000
```

Preferred:

```text
Development Progress
```

or:

```text
Professional Development
```

or:

```text
Competency Progress
```

Example:

```text
Professional Development
6,450 / 10,000
```

A progress bar is acceptable inside the Employee Portal.

It should look like HR/training software, not a game HUD.

---

# 38. Skills

Avoid:

```text
Skill Tree
Hacking Skill
Defense Skill
+5 Exploitation
```

Use:

```text
Competencies
Proficiencies
Qualifications
Capability Ratings
```

Examples:

```text
Network Analysis        Proficient
Endpoint Investigation  Advanced
Authentication          Proficient
Web Assessment          Developing
Incident Response       Qualified
```

If numerical values exist internally, translate them into ratings.

Possible scale:

```text
Unassessed
Developing
Qualified
Proficient
Advanced
Expert
```

---

# 39. Certifications

Certifications are naturally diegetic.

Examples:

```text
NRO-1
Network Reconnaissance Operator

NIR-1
Network Incident Responder
```

Display:

```text
Issued
Expires
Status
Training Requirement
Assessment Result
```

Statuses:

```text
Current
Expiring
Expired
Pending
Not Held
Revoked
```

---

# 40. Training

Use:

```text
Assigned Training
Training Catalog
Practical Exercise
Assessment
Simulation
Course
Qualification Exercise
```

Avoid:

```text
Tutorial Mission
Training Level
Practice Stage
```

Training is one place where explicit simulator language is acceptable if the player is canonically using a training simulator.

Example:

```text
Practical Exercise
EX-019 — Authentication Investigation

Environment:
Simulated

Assessment:
Scored

Attempts:
2
```

---

# 41. Clearance

Clearance is a strong diegetic progression mechanism.

Use:

```text
Clearance & Access
```

Example:

```text
Current Clearance:
C2

Environment Access:
Corporate      Authorized
Restricted     Authorized
Client Secure  Conditional
Government     Not Authorized
```

Clearance changes may unlock content without ever saying "content unlocked."

---

# 42. Performance

Use workplace language.

Possible metrics:

```text
Engagement Quality
Procedure Compliance
Evidence Quality
Incident Handling
Reporting
Operational Discipline
```

Avoid fantastical stats.

Example:

```text
Latest Review

Engagement Quality       Exceeds Expectations
Procedure Compliance     Meets Expectations
Evidence Quality         Exceeds Expectations
Operational Discipline  Meets Expectations
```

---

# 43. Rank

If PvP or competitive ranking exists, distinguish it from employment grade.

Internal game concept:

```text
Red Rank
Blue Rank
```

Player-facing possibilities:

```text
Offensive Qualification
Defensive Qualification
Operational Rating
SOC Rating
Assessment Tier
```

Only use explicit "Red" or "Blue" if those are established in-world department names.

Prefer discipline names.

Example:

```text
Offensive Operations Rating
Platinum II

Incident Response Rating
Gold I
```

This is still somewhat gamified, so keep it inside employee development or formal assessment contexts.

---

# 44. After-Action Review

Canonical title:

```text
After-Action Review - ROOT/OS
```

This replaces:

```text
Replay
Replay Viewer
Mission Replay
```

Alternative titles:

```text
Operation Reconstruction
Case Reconstruction
Engagement Review
```

`After-Action Review` should be the primary navigation label.

`Operation Reconstruction` can be the tool inside it.

---

# 45. Completed Engagements

Do not call past runs:

```text
Replays
Saved Runs
Run History
```

Prefer:

```text
Completed Engagements
Case Archive
Operation Archive
Review Archive
Activity History
```

Opening one launches:

```text
After-Action Review
```

---

# 46. Reconstruction Views

Avoid:

```text
Red View
Blue View
Full Truth
```

These are understandable as dev concepts but too game-facing.

Preferred:

```text
Operator Activity
Defensive Response
Correlated View
```

Alternative:

```text
Operator Timeline
Security Timeline
Verified Reconstruction
```

Recommended canonical set:

```text
[ OPERATOR ACTIVITY ]
[ DEFENSIVE RESPONSE ]
[ CORRELATED VIEW ]
```

Meanings:

```text
OPERATOR ACTIVITY
Shows information and actions available to the operator during the engagement.

DEFENSIVE RESPONSE
Shows monitoring, investigation, and response activity performed by defenders.

CORRELATED VIEW
Combines available records into the reconstructed sequence of events.
```

---

# 47. Missed Opportunities

`Missed Opportunities` can sound gamey depending on presentation.

Preferred depending on context:

```text
Alternative Actions
Unselected Paths
Unresolved Indicators
Missed Indicators
Review Findings
```

For offensive decision analysis:

```text
Alternative Actions
```

For defensive analysis:

```text
Missed Indicators
```

---

# 48. Score

Avoid:

```text
Score: 8,450
Grade: A+
3 Stars
```

unless this is explicitly an assessment/training environment.

For real engagements prefer:

```text
Outcome:
Objectives Met

Review Status:
Completed

Assessment:
Satisfactory
```

Possible performance classifications:

```text
Exceptional
Strong
Satisfactory
Needs Review
Unsatisfactory
```

Use carefully and only where an employer plausibly evaluates work.

---

# 49. Failure

Do not display:

```text
MISSION FAILED
GAME OVER
YOU LOST
```

Use context.

Examples:

```text
ENGAGEMENT CLOSED

Primary tasking was not completed within the authorized window.
```

```text
SESSION TERMINATED

The target environment is no longer reachable.
```

```text
ASSESSMENT INCOMPLETE

Required evidence was not collected.
```

```text
INCIDENT OUTCOME

Containment was unsuccessful.
```

Consequences should be communicated through records and workflow.

---

# 50. Success

Avoid:

```text
MISSION COMPLETE!
VICTORY!
YOU WIN!
```

Use:

```text
ENGAGEMENT COMPLETE

Required tasking has been completed.
The engagement is ready for review.
```

or:

```text
CASE CLOSED

Containment actions completed.
Final documentation is available.
```

or:

```text
ASSESSMENT COMPLETE

Results have been recorded in your training profile.
```

---

# 51. Notifications

Notifications should sound like workplace software.

Good:

```text
ENG-1042 has been assigned to you.

New evidence added to INC-1187.

Supervisor review completed.

NRO-1 certification expires in 30 days.

SRV-APP-01 changed state: Degraded.

Incident INC-1187 has been updated.
```

Bad:

```text
NEW MISSION UNLOCKED!

LEVEL UP!

NEW QUEST!

RARE REWARD EARNED!
```

---

# 52. Email / Messaging

Story delivery should often use internal communication.

Possible applications:

```text
Mail
Messages
Operations Notices
Team Chat
Announcements
```

Example:

```text
From: Maya Chen <m.chen@nodeline.internal>
To: j.smith@nodeline.internal
Subject: ENG-1042 scope update

Client approved the additional subnet.
I've updated the engagement record and scope notes.
```

This is more immersive than a narrator popup.

---

# 53. Story Delivery

Prefer story through:

- tickets
- emails
- alerts
- system logs
- employee records
- engagement briefs
- incident notes
- documents
- chat messages
- audit entries
- evidence
- calendar events
- service notices

Avoid external game narration whenever the same information can exist naturally inside the workstation.

---

# 54. Tutorials

Tutorials should be presented as:

```text
New Employee Orientation
Assigned Training
Procedure Guide
Analyst Note
Knowledge Base
Help & Documentation
```

Example:

```text
KB-1007
Using the Network Browser

The Network Browser displays hosts discovered within the currently authorized environment...
```

This teaches mechanics without breaking the simulation.

---

# 55. Tooltips

Tooltips may explain controls, but should remain professional.

Good:

```text
Isolate the selected endpoint from managed network segments.
```

Bad:

```text
Use this button to stop the hacker!
```

---

# 56. Empty States

Avoid generic game empty states.

Good:

```text
No open incidents match the current filters.
```

```text
No credentials have been recorded for this engagement.
```

```text
No completed engagements are available for review.
```

```text
No training has been assigned.
```

Bad:

```text
Nothing here yet!
Start playing to unlock content.
```

---

# 57. Lock States

Avoid padlock-heavy game presentation.

Preferred:

```text
Access Restricted
```

Details:

```text
This engagement requires C2 clearance and NRO-1 certification.
```

or:

```text
Not Assigned

This environment is not currently available to your account.
```

The UI should explain organizational restrictions.

---

# 58. Navigation

Recommended primary application labels:

```text
Operations Desk
Engagement Workspace
SOC Console
Employee Portal
After-Action Review
```

Short taskbar labels may be:

```text
Operations
Engagement
SOC
Employee
Review
```

Alternative application list:

```text
Operations
Remote Ops
Security
Personnel
Archive
```

But named applications are preferred because they feel like actual software.

---

# 59. ROOT Menu

Suggested ROOT/OS launcher:

```text
ROOT/OS
────────────────────────────
Operations Desk
Engagement Workspace
Security Operations Center
────────────────────────────
Employee Portal
After-Action Review
────────────────────────────
System Tools              >
Administration            >
Accessories               >
────────────────────────────
Settings
Help & Documentation
────────────────────────────
Lock Workstation
Log Out...
```

Avoid:

```text
Campaign
Red Team
Blue Team
Career
Replay
```

---

# 60. Desktop Icons

Good desktop shortcuts:

```text
Operations
SOC Console
Employee Portal
Case Archive
Network Browser
Reports
Documents
```

Do not create:

```text
Play
Campaign
PvP
Career
Replay
```

---

# 61. Internal Organizational Language

ROOT/OS belongs to Nodeline Security.

Suggested internal departments:

```text
Operations
Offensive Operations
Security Operations
Incident Response
Threat Analysis
Engineering
Training & Development
Compliance
Administration
```

These names may appear where organizationally appropriate.

Example:

```text
Owner:
Offensive Operations
```

This is different from putting a giant:

```text
RED TEAM
```

label on the screen.

---

# 62. When "Red Team" Is Allowed

"Red Team" is not forbidden as a phrase.

It is forbidden as lazy game-mode labeling.

It may appear naturally in:

```text
Department:
Red Team Services

Engagement Type:
Red Team Assessment

Certification:
Red Team Operator Qualification
```

if Nodeline actually uses that terminology.

But the application itself should still be:

```text
Engagement Workspace
```

not:

```text
RED TEAM MODE
```

---

# 63. When "Blue Team" Is Allowed

Same principle.

It may appear in:

```text
Training Course:
Blue Team Fundamentals
```

or:

```text
Department:
Blue Team Operations
```

if canonically appropriate.

But the real application should use:

```text
Security Operations Center
Incident Workspace
Alert Queue
```

---

# 64. Game Concepts vs World Concepts

Use this translation table as a canonical reference.

| Game Concept | Player-Facing World Concept |
|---|---|
| Campaign | Operations / Work Queue |
| Mission | Engagement / Assignment |
| Mission Select | Operations Desk |
| Quest | Task / Work Item |
| Objective | Tasking / Requirement |
| Side Objective | Additional Tasking |
| Red Team | Offensive Operations / Engagement Workspace |
| Blue Team | Security Operations / SOC |
| Career Hub | Employee Portal |
| Character Profile | Employee Profile |
| Level | Employee Grade / Designation |
| XP | Professional Development |
| Skill | Competency |
| Skill Tree | Competency Framework |
| Training Mission | Practical Exercise |
| Unlock | Authorization / Access |
| Locked | Access Restricted |
| Difficulty | Workflow / Support Mode |
| Guided Mode | Assisted Workflow |
| Operator Mode | Standard Workflow |
| Replay | After-Action Review |
| Replay Library | Case Archive / Completed Engagements |
| Red View | Operator Activity |
| Blue View | Defensive Response |
| Full Truth | Correlated View |
| Score | Assessment / Outcome |
| Reward | Performance / Training Credit |
| Inventory | Evidence / Artifacts / Tools depending on context |
| Loot | Collected Artifacts |
| Enemy | Hostile Activity / Threat Actor / Unauthorized User |
| Boss | Critical System / High-Value Asset if applicable |
| Health | Service State / Availability depending on context |
| Stealth Meter | Exposure Indicators |
| Detection Meter | Security Attention / Detection Evidence |
| Game Over | Session / Engagement Outcome |

---

# 65. Component Mapping

Current architecture:

```text
RootChrome
Terminal
NetworkMap
MissionPanel
ReplayClient
RootLayout
DataPanel
CredentialsPanel
```

Recommended player-facing terminology:

| Internal Component | Visible Meaning |
|---|---|
| `RootChrome` | ROOT/OS Desktop / Shell |
| `Terminal` | Operator Console / Command Console |
| `NetworkMap` | Network Map |
| `MissionPanel` | Engagement Brief |
| `ReplayClient` | Operation Reconstruction |
| `RootLayout` | No visible label |
| `DataPanel` | Context-specific title |
| `CredentialsPanel` | Credential Findings |

Internal component names do not need to match visible labels.

---

# 66. Page Mapping

## `app/page.tsx`

Internal role:

```text
Home / Campaign Selection
```

Visible application:

```text
Operations Desk
```

Primary sections:

```text
Assigned to Me
Open Engagements
Engagement Details
Access Requirements
Recent Activity
Completed Engagements
```

---

# 67. `app/red/page.tsx`

Internal role:

```text
Red Team Operations
```

Visible application:

```text
Engagement Workspace
```

Primary sections:

```text
Engagement Brief
Tasking
Operator Console
Network Map
Credential Findings
Host Details
Activity Summary
Case Notes
```

---

# 68. `app/blue/page.tsx`

Internal role:

```text
Blue Team Defense
```

Visible application:

```text
Security Operations Center
```

Primary sections:

```text
Alert Queue
Authentication Activity
Endpoint Inspection
Response Actions
Service Availability
Incident Workspace
Evidence
```

---

# 69. `app/career/page.tsx`

Internal role:

```text
Career Hub
```

Visible application:

```text
Employee Portal
```

Primary sections:

```text
Profile
Employment
Competencies
Training
Certifications
Clearance & Access
Performance
Assignments
```

---

# 70. `app/replay/[scenarioId]/page.tsx`

Internal role:

```text
Replay / Reconstruction
```

Visible application:

```text
After-Action Review
```

Primary sections:

```text
Operation Summary
Operator Activity
Defensive Response
Correlated View
Event Timeline
Evidence
Alternative Actions
Review Findings
```

---

# 71. RootChrome Direction

The global shell should stop feeling like navigation for a web application.

It should feel like the ROOT/OS desktop.

The shell may contain:

```text
desktop shortcuts
taskbar
ROOT menu
clock
network state
session state
current user
open application buttons
system notifications
```

Avoid permanent giant game navigation if normal desktop application switching can replace it.

---

# 72. Operator Identity

The shell may display:

```text
Operator:
j.smith

Designation:
Security Operator II

Clearance:
C2

Workstation:
RPT-01

Network:
Online
```

This reinforces the fiction.

Avoid:

```text
Player:
Sean

Level:
12

XP:
6450
```

---

# 73. Time and Date

Use system formatting.

Examples:

```text
2026-09-18 21:14
```

or:

```text
18 Sep 2026 21:14
```

Operational logs should use precise timestamps.

Example:

```text
2026-09-18 21:14:33
```

Avoid game-world clocks unless the simulation explicitly uses them.

---

# 74. System Messages

Good:

```text
Connection established.

Credentials validated.

Host did not respond.

Access denied.

Evidence package created.

Incident record updated.

Session expired.

Service unavailable.
```

Bad:

```text
SUCCESS!
HACK COMPLETE!
NEW AREA UNLOCKED!
```

---

# 75. Button Language

Prefer verbs that a real tool would use.

Good:

```text
Open
Inspect
Refresh
Assign
Acknowledge
Escalate
Contain
Isolate
Export
Collect
Connect
Authenticate
Terminate
Review
Submit
Close
Archive
```

Avoid game verbs:

```text
Play
Start Mission
Accept Quest
Claim Reward
Retry Level
Continue Campaign
```

---

# 76. Dialog Language

Example:

```text
Close Engagement

ENG-1042 will be marked complete and submitted for review.

Required evidence:
4 items

Open notes:
0

[ Submit for Review ] [ Cancel ]
```

Not:

```text
COMPLETE MISSION?

Are you sure you want to finish this level?

[ YES ] [ NO ]
```

---

# 77. Training vs Live Work

The UI must distinguish live work from training through believable system labels.

Examples:

```text
Environment:
Client

Environment:
Internal Lab

Environment:
Training Simulation
```

or:

```text
Engagement Class:
Production

Exercise Class:
Simulation
```

This lets tutorials and practice exist naturally.

---

# 78. Simulation Language

When the player is actually inside a training environment, more explicit training language is allowed.

Example:

```text
TRAINING ENVIRONMENT

This exercise uses simulated infrastructure.
Actions do not affect production systems.
```

This is still diegetic because the employee is using company training software.

---

# 79. Progression Without Breaking Immersion

Progression should be visible through:

- new assignments
- higher clearance
- new certifications
- improved designation
- competency changes
- access to advanced tools
- supervisor messages
- training completion
- performance review changes

The game does not need to tell the player:

```text
YOU LEVELED UP
```

Instead:

```text
EMPLOYEE PROFILE UPDATED

Designation:
Security Operator II

Effective:
2026-09-18

Additional access has been provisioned.
```

That is far more immersive.

---

# 80. Unlock Events

Bad:

```text
NEW MISSION UNLOCKED
```

Good:

```text
ACCESS UPDATED

Your account has been authorized for C2 client environments.

2 additional engagements are now available.
```

or:

```text
ASSIGNMENT AVAILABLE

ENG-1121 has been added to your available work queue.
```

---

# 81. Certification Completion

Bad:

```text
CERTIFICATION UNLOCKED!
+500 XP
```

Good:

```text
TRAINING RECORD UPDATED

NRO-1
Network Reconnaissance Operator

Status:
Current

Issued:
2026-09-18

Certification has been added to your employee record.
```

---

# 82. Promotion

Bad:

```text
LEVEL UP!
LEVEL 15
```

Good:

```text
PERSONNEL RECORD UPDATED

Designation:
Senior Security Operator

Grade:
O-3

Effective:
2026-10-01

New access groups will be provisioned automatically.
```

---

# 83. Operation Completion

Recommended flow:

```text
ENGAGEMENT TASKING COMPLETE
        ↓
SUBMIT FOR REVIEW
        ↓
ENGAGEMENT CLOSED / REVIEWED
        ↓
EMPLOYEE / PERFORMANCE RECORD UPDATED
        ↓
AFTER-ACTION REVIEW AVAILABLE
```

No game-results screen is required.

---

# 84. Case Archive

Recommended application/section:

```text
Case Archive
```

Contents:

```text
Engagements
Incidents
Training Exercises
Reports
Evidence Packages
After-Action Reviews
```

This can replace a conventional replay library.

---

# 85. Reports

Reports are highly useful for diegetic delivery.

Examples:

```text
Engagement Report
Incident Report
Evidence Summary
Authentication Review
Host Assessment
After-Action Report
Training Assessment
```

Reports can carry:

- narrative
- performance feedback
- consequences
- missed evidence
- recommendations
- progression

without breaking the simulation.

---

# 86. After-Action Report

Example:

```text
AFTER-ACTION REPORT

Engagement:
ENG-1042

Client:
Helix Biotech

Outcome:
Primary tasking completed

Review Findings:
- Initial access established within authorized scope.
- Internal movement generated elevated authentication activity.
- One unnecessary service interaction increased endpoint visibility.
- Required evidence was collected.

Recommendations:
- Reduce repeated authentication attempts.
- Review artifact cleanup procedure.
```

This is a diegetic equivalent of a game score screen.

---

# 87. Hidden Game Systems

The following may exist internally without being shown directly:

```text
XP
level
scenario unlock flags
difficulty coefficients
score
rank MMR
AI awareness state
detection probability
reward multipliers
tutorial flags
```

Expose their consequences, not necessarily their raw game-system names.

Example:

```text
internal:
detection = 78

visible:
Security Attention: Elevated
```

---

# 88. Data Honesty

Diegetic UI does not mean lying to the player.

The UI must still communicate important gameplay state.

Translate it into credible language rather than hiding it.

Bad design:

```text
Hide detection entirely because "real software wouldn't show it."
```

Better:

```text
Expose observable indicators:

Authentication Noise    Elevated
Endpoint Artifacts      Moderate
Network Activity        High
Defender Response       Unknown
```

The player still receives actionable feedback.

---

# 89. No Omniscient UI

ROOT should not reveal information the operator could not plausibly know.

Example:

Bad:

```text
Enemy Detection: 73%
Blue Team is investigating you.
```

Better:

```text
Observed:
- EDR connection established
- Authentication failures increased
- Host policy changed
- Session terminated remotely

Assessment:
Possible security response
```

The player infers defender behavior from evidence.

---

# 90. No Game Narrator

Avoid floating text like:

```text
The defender has noticed your attack.
```

Prefer:

```text
ALERT

Remote session terminated by administrator.
```

or:

```text
SYSTEM EVENT

Firewall policy updated.
Outbound route unavailable.
```

The world communicates through systems.

---

# 91. Terminology Consistency

Once a canonical term is selected, use it consistently.

For example:

Always:

```text
Engagement
```

Do not alternate randomly between:

```text
Mission
Job
Quest
Operation
Assignment
```

unless those terms represent genuinely different concepts.

Recommended taxonomy:

```text
Engagement
= client-authorized offensive/security work

Incident
= defensive security case

Exercise
= training activity

Task
= unit of required work

Case
= record grouping investigation/evidence

Operation
= active operational activity or broader event

Assignment
= work assigned to an employee
```

---

# 92. Canonical Taxonomy

## Engagement

A scoped piece of authorized external or internal security work.

Example:

```text
ENG-1042
Helix Biotech External Assessment
```

## Incident

A defensive investigation record.

Example:

```text
INC-1187
Suspicious Process Execution
```

## Exercise

A controlled training activity.

Example:

```text
EX-019
Authentication Investigation
```

## Task

A specific required action inside an engagement, incident, or exercise.

## Evidence

Collected records/artifacts supporting a conclusion.

## Finding

A documented security issue or analytical result.

## Artifact

A file, credential, process record, event, packet capture, or other technical item.

---

# 93. Player-Facing Navigation — Canonical

Recommended:

```text
Operations Desk
Engagement Workspace
SOC Console
Employee Portal
After-Action Review
```

If space is limited:

```text
Operations
Engagement
SOC
Employee
Review
```

Do not use:

```text
Home
Campaign
Red
Blue
Career
Replay
```

in the main in-world UI.

---

# 94. Sidebar Example

```text
OPERATIONS

> Operations Desk
  Engagement Workspace
  SOC Console

PERSONNEL

  Employee Portal
  Training
  Certifications

RECORDS

  Case Archive
  After-Action Review
  Reports
```

This works if ROOT/OS uses a persistent navigation sidebar.

A desktop/start-menu approach is still preferred when practical.

---

# 95. App Window Titles

Canonical examples:

```text
Operations Desk - ROOT/OS
Engagement Workspace - ROOT/OS
Security Operations Center - ROOT/OS
Employee Portal - Nodeline Security
After-Action Review - ROOT/OS
Network Browser - ROOT/OS
Host Inspector - DC-01
Operator Console - DEV-01
Credential Findings - ENG-1042
Incident Workspace - INC-1187
Evidence Viewer - INC-1187
```

---

# 96. Breadcrumbs

Use organizational breadcrumbs.

Good:

```text
Operations > ENG-1042 > Brief
```

```text
Security Operations > INC-1187 > Evidence
```

```text
Employee Portal > Training > NRO-1
```

Bad:

```text
Campaign > Level 3 > Mission
```

---

# 97. URL / Route Names

Current routes may remain:

```text
/red
/blue
/career
/replay
```

because they are implementation details.

Future refactoring may use:

```text
/operations
/engagement
/soc
/employee
/review
```

but this is not required for diegetic correctness.

What matters most is visible UI.

---

# 98. Internal Code Naming

It is acceptable to keep:

```text
MissionPanel
ReplayClient
red
blue
career
```

inside the codebase if changing them creates unnecessary churn.

However, new components should preferably use domain terminology.

Examples:

```text
EngagementBrief
OperationsDesk
SocConsole
EmployeePortal
AfterActionReview
CredentialFindings
HostInspector
IncidentWorkspace
```

---

# 99. Copy Tone

ROOT copy should be:

- concise
- procedural
- professional
- specific
- technical
- unemotional
- believable
- restrained

Avoid:

- hype
- gamer slang
- dramatic narration
- jokes during serious operations
- fake hacker language
- cinematic wording

---

# 100. Good Copy Examples

```text
Access denied.
The current account is not authorized for this resource.
```

```text
Host unreachable.
Last successful response: 18:43:12.
```

```text
Incident updated.
2 related events were added.
```

```text
Credential validation failed.
The account may be disabled, expired, or incorrect.
```

```text
Evidence collection complete.
Package ID: EVP-1042-07.
```

---

# 101. Bad Copy Examples

```text
ACCESS DENIED, HACKER!
```

```text
You triggered the alarm!
```

```text
Awesome! You found a password!
```

```text
Mission unlocked!
```

```text
Blue Team spotted you!
```

```text
Critical hit!
```

---

# 102. Color and Diegesis

Colors should describe system state.

Examples:

```text
Green
healthy / active / valid / successful

Amber
uncertain / suspicious / degraded / pending

Red
confirmed danger / failed / blocked / critical

Blue
selection / navigation / neutral operational context

Gray
inactive / unknown / informational
```

Do not use color as a game faction skin.

The Engagement Workspace should not become red.

The SOC should not become blue.

---

# 103. Icons and Diegesis

Icons should represent real application concepts.

Good:

```text
folder
terminal
server
database
report
shield
lock
network
user
document
warning
search
clock
```

Avoid fantasy/game icons:

```text
sword
skull
rarity gem
quest marker
treasure chest
level star
```

unless an in-world client application plausibly contains them.

---

# 104. Story Events

Narrative events should appear through plausible channels.

Examples:

```text
New mail from supervisor
Unexpected account created
System time mismatch
Unauthorized session
Missing audit log
Corrupted report
Changed clearance
Internal notice
Emergency ticket
New incident assignment
```

This makes anomalies more disturbing because the surrounding software is normal.

---

# 105. Horror / Mystery Without Breaking UI

If ROOT later includes unsettling narrative events, do not suddenly turn the interface into a horror-game HUD.

Use:

```text
duplicate audit record
unknown operator session
employee account with no HR record
timestamp from the future
host that does not exist in inventory
message from disabled account
process signed by impossible authority
```

The ordinary corporate UI should remain intact.

The contradiction creates tension.

---

# 106. LLM Implementation Rule

When an LLM generates or edits ROOT UI, it must follow this rule:

> **Never expose developer/game terminology when a believable in-world enterprise term exists.**

Before generating visible text, translate the concept into terminology appropriate for:

- enterprise software
- security operations
- incident response
- consulting
- HR
- training
- internal IT
- compliance
- forensic review

---

# 107. LLM Naming Checklist

Before adding a visible label, ask:

1. Is this a developer term?
2. Is this a game-system term?
3. Would an employee see this wording?
4. Is there a normal enterprise/security equivalent?
5. Does the label reveal information the user should not know?
6. Does it match the application's role?
7. Does it match terminology already used elsewhere?
8. Does it sound like software rather than a game?

If not, rewrite it.

---

# 108. Canonical LLM Translation Examples

```text
"Mission Select"
→ "Operations Desk"
```

```text
"Start Mission"
→ "Open Engagement"
```

```text
"Mission Objectives"
→ "Tasking"
```

```text
"Mission Hints"
→ "Analyst Notes"
```

```text
"Red Team Dashboard"
→ "Engagement Workspace"
```

```text
"Blue Team Dashboard"
→ "Security Operations Center"
```

```text
"Career Hub"
→ "Employee Portal"
```

```text
"XP"
→ "Professional Development"
```

```text
"Level"
→ "Employee Grade"
```

```text
"Replay"
→ "After-Action Review"
```

```text
"Full Truth"
→ "Correlated View"
```

```text
"Mission Complete"
→ "Engagement Complete"
```

```text
"Mission Failed"
→ "Engagement Closed — Tasking Incomplete"
```

---

# 109. Canonical Page Copy

## Operations Desk

Use:

```text
Operations Desk
Assigned to Me
Open Engagements
In Progress
Awaiting Review
Completed
Access Requirements
Engagement Details
Recent Activity
```

## Engagement Workspace

Use:

```text
Engagement Workspace
Engagement Brief
Tasking
Operator Console
Network Map
Credential Findings
Host Details
Activity Summary
Case Notes
```

## Security Operations Center

Use:

```text
Security Operations Center
Alert Queue
Active Detections
Authentication Activity
Endpoint Inspection
Response Actions
Incident Workspace
Service Availability
```

## Employee Portal

Use:

```text
Employee Portal
Profile
Employment
Competencies
Training
Certifications
Clearance & Access
Performance
Assignments
```

## After-Action Review

Use:

```text
After-Action Review
Operation Summary
Operator Activity
Defensive Response
Correlated View
Event Timeline
Evidence
Alternative Actions
Review Findings
```

---

# 110. Canonical Replacement List

Do not use in player-facing production UI:

```text
Campaign
Mission Select
Red Team Mode
Blue Team Mode
Career Hub
Replay
Replay Library
Difficulty
Easy
Normal
Hard
Player Level
XP
Skill Tree
Unlock
Locked Mission
Quest
Side Quest
Loot
Reward Screen
Mission Complete
Mission Failed
Full Truth
```

Prefer:

```text
Operations
Operations Desk
Engagement Workspace
Security Operations Center
Employee Portal
After-Action Review
Case Archive
Workflow Mode
Assisted
Standard
Employee Grade
Professional Development
Competencies
Authorization
Access Restricted
Task
Additional Tasking
Artifacts
Performance Record
Engagement Complete
Tasking Incomplete
Correlated View
```

---

# 111. Canonical UX Test

Before approving a screen, ask:

1. Could this software plausibly exist inside Nodeline Security?
2. Does every label make sense to the employee using it?
3. Are we showing an application rather than a game menu?
4. Are progression systems translated into workplace systems?
5. Are task requirements presented as assignments rather than quests?
6. Are completed runs presented as records rather than replays?
7. Is defensive gameplay presented as security operations?
8. Is offensive gameplay presented as authorized engagement work?
9. Is player progression presented through employment, training, and certification?
10. Does the UI avoid omniscient game information?
11. Could the screenshot be mistaken for unusual real enterprise software?
12. If all game context were removed, would the labels still make sense?

If several answers are no, the screen is not sufficiently diegetic.

---

# 112. Final Rule

ROOT should never tell the player:

> **"You are playing the Red Team part of the campaign."**

ROOT should make the player feel:

> **"I have been assigned ENG-1042. I opened the engagement brief, connected to the authorized environment, collected credentials, and submitted the work for review."**

ROOT should never tell the player:

> **"Switch to Blue Team mode."**

ROOT should make the player feel:

> **"A critical alert entered the SOC queue. I opened INC-1187, correlated the endpoint events, isolated the host, and documented the incident."**

ROOT should never tell the player:

> **"Go to the Career Hub and level up."**

ROOT should make the player feel:

> **"My employee record now shows NRO-1 certification, C2 clearance, and Security Operator II designation."**

ROOT should never tell the player:

> **"Watch the replay."**

ROOT should make the player feel:

> **"I opened the After-Action Review and reconstructed what both sides actually observed."**

That is the target.

---

# 113. One-Sentence Canonical Direction

> **ROOT/OS is not a game interface styled like enterprise software; it is enterprise software that functions as the game interface.**
