# ROOT — Canonical Story

## 1. Story Purpose

ROOT is a grounded corporate cyber-thriller told through the player's career at **Nodeline Security**.

The story begins with ordinary technical work and slowly reveals that several incidents, organizations, vendors, identities, and trust relationships are connected.

The narrative should never depend on world-ending cyberfiction, superhuman hackers, or dramatic villains announcing themselves.

The story should feel:

- corporate
- restrained
- paranoid
- believable
- investigative
- personal
- morally complicated

The player should gradually move from:

```text
This is probably just another incident.
```

to:

```text
Why have I seen this before?
```

to:

```text
These incidents are connected.
```

to:

```text
What does Nodeline actually know?
```

The player should uncover the story largely through their own understanding of systems, evidence, relationships, and inconsistencies.

---

# 2. Core Narrative Principle

ROOT should not simply tell the player the truth.

The player should experience events from incomplete perspectives.

A Blue Team operation may show suspicious activity without revealing the attacker's actual goal.

A later Red Team operation may reveal why that activity occurred.

A replay may expose something both sides missed.

An old case may change the meaning of a current incident.

The story therefore uses the same principle as ROOT's gameplay:

> Understanding comes from connecting incomplete information.

The player should sometimes realize that their earlier interpretation of an incident was wrong — not because the game lied, but because they did not yet have enough information.

---

# 3. Nodeline Security

The player works for **Nodeline Security**, a cybersecurity consultancy focused on:

- security assessments
- adversary simulation
- incident response
- threat hunting
- security research

Nodeline presents itself as disciplined, evidence-driven, and professional.

Its internal culture values:

- evidence over assumptions
- controlled response
- operational awareness
- careful documentation
- understanding systems before acting

The player's primary work environment is **ROOT/OS**, Nodeline's internal cyber operations platform.

At the start of the campaign, ROOT/OS appears to be nothing more than a specialized professional workstation.

Over time, the player discovers that ROOT/OS itself has history.

---

# 4. The Player

The player joins Nodeline as a **Recruit**.

They are not an elite hacker.

They are not chosen by destiny.

They are a new operator learning how modern organizations actually work.

Their career gradually exposes them to:

```text
IT support
↓
SOC analysis
↓
Red Team operations
↓
Incident response
↓
Threat hunting
↓
Advanced investigations
```

The player's growth is both mechanical and narrative.

At the beginning, they understand individual objects:

```text
machines
users
ports
files
alerts
```

By the end, they understand:

```text
relationships
trust
identity
behavior
evidence
risk
```

The story should mirror this transformation.

---

# 5. Campaign Structure

The canonical campaign is divided into five acts.

The names below replace the earlier working structure while preserving its progression.

```text
ACT I   — NOISE
ACT II  — PATTERN
ACT III — ACCESS
ACT IV  — GHOSTS
ACT V   — ROOT
```

Each act changes not only the complexity of the gameplay, but the player's understanding of what has been happening around them.

---

# 6. ACT I — NOISE

## Theme

Everything looks unrelated.

## Player Role

Recruit / Helpdesk / Junior Operations

## Purpose

Teach the player how organizations function before asking them to understand how organizations fail.

## Tone

Normal.

Almost boring.

This is intentional.

The player should become familiar with Nodeline's routines, people, systems, and corporate culture before anything begins to feel wrong.

## Example Operations

- The Printer
- Where Did the Website Go?
- Locked Out

## Concepts

- hosts
- IP addresses
- ports
- services
- users
- authentication
- basic logs
- business systems

## Story Layer

The player deals with ordinary incidents:

- an inaccessible internal service
- an employee who cannot authenticate
- a web application outage
- a machine behaving strangely

Most issues have normal explanations.

But subtle inconsistencies begin appearing.

Examples:

- a hostname exists that does not appear in the official inventory
- an incident references a department missing from the company directory
- an authentication event happens every night at exactly the same time
- an old account appears in a current log
- a service is signed by an unfamiliar vendor

Nothing tells the player these details are important.

They simply exist.

The player may not even notice them.

That is acceptable.

---

# 7. ACT II — PATTERN

## Theme

Coincidences begin repeating.

## Player Role

Junior SOC Analyst / Defensive Operator

## Purpose

Teach the player to distinguish between normal behavior, suspicious behavior, and confirmed compromise.

## Example Operations

- The Strange Login
- False Alarm
- Something Is Calling Home
- The Quiet One
- Friday Night

## Concepts

- authentication anomalies
- process behavior
- telemetry
- evidence correlation
- incident investigation
- false positives
- containment

## Story Layer

The player now has access to more telemetry and more client environments.

They start seeing recurring details across organizations that should have nothing to do with one another.

Examples:

```text
svc_backup
svc_deploy
vendor-sync
relay-04
```

A retired service account authenticates successfully.

A monitoring agent communicates outside normal business hours.

A certificate chain appears in two unrelated companies.

A support tool is installed where nobody remembers approving it.

At this stage, every observation still has a plausible explanation.

The game should never immediately label these details as conspiracy evidence.

The player must decide whether they matter.

## Key Narrative Principle

The player begins asking:

> Why have I seen this before?

---

# 8. ACT III — ACCESS

## Theme

Seeing the same world from the attacker's side changes what earlier evidence meant.

## Player Role

Red Team Operator

## Purpose

Recontextualize earlier incidents by allowing the player to interact with the same kinds of systems from an offensive perspective.

## Example Operations

- Operation Glasshouse
- Operation Nightshift
- Operation Dead Drop
- The Front Door
- The Forgotten Server
- The Trust Problem
- Valid User

## Concepts

- reconnaissance
- credentials
- service authentication
- privilege relationships
- lateral movement
- segmentation
- persistence
- evidence generation

## Story Layer

Red Team work exposes trust relationships that were invisible during defensive investigations.

An account previously dismissed as routine may turn out to have access across multiple environments.

A strange internal service may belong to a vendor integration.

An authentication event the player ignored earlier may reveal the exact mechanism an attacker could use to move laterally.

The campaign should repeatedly recontextualize previous evidence.

Example:

During an earlier Blue operation, the player sees:

```text
User: svc_deploy
Source: WEB-01
Destination: DEV-01
Result: SUCCESS
```

It appears unusual but not conclusive.

Much later, during a Red operation, the player discovers that the same style of deployment account is over-trusted across several systems.

Now the earlier event means something different.

The story should create moments where the player thinks:

> I saw this before. I just didn't understand it yet.

---

# 9. The Vendor Thread

A recurring enterprise technology vendor becomes one of the campaign's central connections.

The canonical working name is:

# Halloway Systems

Halloway is deliberately boring.

It provides enterprise infrastructure such as:

- backup agents
- monitoring software
- remote support tooling
- identity synchronization
- deployment services
- authentication middleware

Halloway products are common enough that seeing them is not automatically suspicious.

This is important.

Halloway should initially feel like background infrastructure.

Over time, the player discovers that its integrations created extensive trust relationships between organizations, systems, service accounts, and management infrastructure.

The central problem is not necessarily that Halloway deliberately created a malicious backdoor.

The deeper problem is that its ecosystem created a **transitive trust network**.

Someone discovered how to exploit that network.

That actor has been moving quietly through connected organizations for years.

---

# 10. THREAD-17

Nodeline assigns the recurring activity an internal investigation identifier:

```text
THREAD-17
```

THREAD-17 is not a hacker alias.

It is not intended to sound dramatic.

It is simply a case designation.

For much of the campaign, nobody knows what THREAD-17 actually represents.

Possible interpretations include:

- one attacker
- a coordinated group
- a criminal organization
- an intelligence service
- a contractor
- several unrelated actors incorrectly grouped together
- activity originating from compromised infrastructure

The game should resist confirming the answer too early.

Different Nodeline personnel may hold different hypotheses.

Some may doubt that THREAD-17 represents a single actor at all.

---

# 11. ACT IV — GHOSTS

## Theme

The player's own organization becomes part of the investigation.

## Player Role

Incident Responder / Threat Hunter / Senior Operator

## Purpose

Turn the player's attention inward without reducing Nodeline to a simple evil corporation.

## Example Operations

- No One Knows
- Ghost Account
- The Backup
- Night Shift

## Concepts

- persistence
- long-term compromise
- containment
- recovery
- historical evidence
- business impact
- attribution uncertainty

## Story Layer

The player begins discovering inconsistencies inside Nodeline itself.

Examples:

- an archived case is missing documents
- a timeline changed after an incident was closed
- an operator investigated Halloway years before the current campaign
- a former employee account remains active
- an internal system appears in client telemetry
- an old investigation references THREAD-17 before the player's current case supposedly began
- access to certain historical cases requires clearance the player did not know existed

The player now faces a fundamental problem:

> Nodeline is both the organization conducting the investigation and the source of much of the information the player relies upon.

This introduces uncertainty without requiring Nodeline to be secretly evil.

Different employees may have withheld information for different reasons:

- client confidentiality
- legal exposure
- active investigations
- national security concerns
- protection of sources
- professional disagreement
- self-preservation

The player should not immediately know which explanation is correct.

---

# 12. ROOT/OS as a Narrative Device

ROOT/OS itself becomes part of the mystery.

Early in the game it is simply the player's workstation.

Later, the player encounters references to previous versions:

```text
ROOT/OS 1.8
ROOT/OS 2.4
ROOT/OS 3.1
ROOT/OS 3.4
```

Old screenshots, reports, archived interfaces, or recovered systems may expose fields that the current version no longer displays.

Example:

An older event record may contain:

```text
source_operator
case_origin
reviewed_by
collection_method
```

while the modern interface surfaces only:

```text
timestamp
source
target
action
```

The discovery should not automatically mean that Nodeline maliciously hid information.

Interfaces change.

Policies change.

Privacy rules change.

Legal requirements change.

But the player is forced to ask:

> What information does my tool choose to show me?

This turns ROOT/OS from a passive user interface into part of the story's theme of incomplete information.

---

# 13. Canonical Recurring Characters

## Mara Voss — Director of Operations

Mara is calm, controlled, professional, and extremely competent.

She becomes one of the player's earliest senior mentors.

Her philosophy:

> Evidence first. Interpretation second.

Mara believes operators are most dangerous when they become emotionally attached to a theory.

Later, the player discovers that she has withheld information related to older incidents.

Her reasons should remain ambiguous for a significant portion of the story.

She should never become a cartoon villain.

---

## Daniel Kade — Senior Red Operator

Daniel is an experienced offensive operator.

He is more informal than most of Nodeline and often challenges official assumptions.

His recurring principle:

> Systems rarely fail alone. Assumptions fail first.

Daniel becomes increasingly interested in connections between client environments.

Other employees begin to think he is forcing unrelated incidents into a single theory.

Eventually Daniel leaves Nodeline.

The official explanation is resignation.

Several weeks later, activity appears associated with his old operator identity.

Whether Daniel is responsible should remain uncertain.

---

## Lena Ortiz — SOC Lead

Lena is the player's primary defensive mentor.

She is skeptical, disciplined, and resistant to premature attribution.

Her recurring principle:

> Suspicious is not compromised.

Lena acts as a counterweight to paranoia.

When other characters begin connecting everything to THREAD-17, Lena demands evidence.

She should frequently be correct.

This prevents the narrative from rewarding conspiracy thinking without proof.

---

## Elias Ward — Founder of Nodeline Security

Elias appears only occasionally during the early campaign.

The player mostly encounters him through:

- internal company messages
- archived talks
- policy documents
- historical incident reports

Later, the player learns that Nodeline was founded in the aftermath of a major historical breach.

ROOT/OS began as an internal tool designed to reconstruct that incident.

This connects the company's origin to the central campaign mystery.

---

# 14. Optional Evidence

Not every important story detail should be mandatory.

Operations should contain optional evidence that observant players may discover before the main narrative explains its significance.

Example:

During Operation Glasshouse, the primary objective may remain:

```text
Retrieve PROJECT_ATLAS.pdf.
```

But the player may discover:

```text
/var/log/vendor-sync.log
```

containing:

```text
halloway-relay-04
```

The game does not immediately react.

No cinematic plays.

No objective changes.

Several operations later, the same relay appears again.

ROOT/OS Intel may then display:

```text
Previously observed:
Operation Glasshouse
Meridian Dynamics
```

This creates recognition rather than exposition.

---

# 15. The Case Board

The Case Board becomes both a gameplay system and a narrative system.

Early campaign:

```text
MERIDIAN DYNAMICS
└── suspicious deploy account
```

Later:

```text
MERIDIAN DYNAMICS
      │
      ├── Halloway agent
      │
NORTHSTAR LOGISTICS
      │
      ├── same signing certificate
      │
VANTA FINANCIAL
      │
      └── same service identity pattern
```

The board should visually reflect the player's changing understanding of the campaign.

Some connections are confirmed.

Some remain hypotheses.

Some are disproven.

The game should clearly distinguish among them.

---

# 16. Moral Ambiguity

ROOT should frequently present technically understandable decisions without an obvious moral answer.

Examples:

A client conceals a breach because disclosure may destroy the company.

Nodeline's legal team says the engagement does not authorize disclosure.

The player knows customer information was accessed.

---

A hospital scheduling platform may be compromised.

Isolating it would probably stop attacker movement.

It would also disrupt patient scheduling.

---

A client authorizes a Red Team assessment against employees without informing them.

The operation is contractually legitimate.

The player may still find the situation uncomfortable.

---

An organization asks Nodeline to preserve an attacker session for intelligence gathering rather than immediately removing it.

Waiting creates risk.

Removing it destroys visibility.

These situations should reinforce one of ROOT's central ideas:

```text
security risk
vs
operational risk
vs
human consequences
```

---

# 17. ACT V — ROOT

## Theme

The real vulnerability was never one machine.

It was trust.

## Player Role

Senior Operator / Investigator

## Purpose

Bring together the campaign's major technical, organizational, and personal threads.

## Possible Operations

- Inside
- Who Are They?
- Cut the Lights
- ROOT

## Story Layer

The player finally reconstructs the larger campaign.

Halloway Systems created widely deployed infrastructure that connected:

- organizations
- identities
- service accounts
- management systems
- authentication systems
- monitoring infrastructure
- backup systems

Over time, these integrations created trust relationships that nobody fully understood.

THREAD-17 learned to navigate those relationships.

The attacker did not need to compromise every company independently.

They exploited the connections between them.

The player realizes that many earlier incidents were fragments of the same larger campaign.

Some were genuine THREAD-17 activity.

Some were unrelated.

Some were incorrectly attributed.

Some were missed entirely.

---

# 18. Nodeline's Role in the Final Act

Nodeline discovered parts of the pattern years before the player joined.

There was no single organizational response.

Different people wanted different things.

Some wanted immediate disclosure.

Some wanted more evidence.

Some wanted to quietly monitor the actor.

Some feared legal consequences.

Some feared that exposing the trust network would reveal Nodeline's own clients and methods.

Some believed maintaining visibility into THREAD-17 was more valuable than forcing the actor underground.

The conflict inside Nodeline therefore becomes philosophical rather than simply heroic versus corrupt.

The player must understand:

- what Nodeline knew
- when it knew it
- what decisions were made
- who made them
- what consequences followed

---

# 19. Final Narrative Question

The final campaign should not be about stopping a countdown timer.

It should revolve around understanding the truth of the system.

The final questions are:

> Who trusted whom?

> Why did that trust exist?

> Who understood the consequences?

> Who benefited from keeping the relationship intact?

> When did Nodeline first realize what was happening?

> What did Nodeline choose to do with that knowledge?

And finally:

> What should happen now that the player understands the full picture?

---

# 20. Meaning of the Title

The title **ROOT** should have several meanings.

## Root Access

The familiar technical meaning.

Maximum privilege on a system.

## Root Cause

Understanding why an incident actually happened.

## Root of Trust

Understanding which identities, services, systems, and organizations trust one another.

## Root of the Incident

Tracing apparently unrelated events back to a common origin.

## Personal Meaning

The player's progression is ultimately about learning to look beneath individual symptoms and understand the system underneath them.

The final campaign should make all of these meanings relevant.

---

# 21. Story Delivery

ROOT should avoid excessive cinematics.

The majority of storytelling should appear naturally through the player's work.

Primary narrative surfaces:

- internal email
- chat
- incident reports
- case files
- logs
- intelligence notes
- voicemail transcripts
- corporate portals
- archived systems
- ROOT/OS history
- operation briefs
- debrief reports
- Case Board relationships
- Red/Blue/Full Truth reconstruction

Characters may communicate directly with the player, but story exposition should remain restrained.

The ideal player reaction is not:

> The game just told me the twist.

It is:

> Wait. I've seen this before.

---

# 22. Red / Blue / Full Truth as Storytelling

The reconstruction system is a core narrative device.

After major operations, the player may see:

```text
RED VIEW
BLUE VIEW
FULL TRUTH
```

These views can reveal different interpretations of the same event.

Example:

Red knows:

```text
svc_backup provided access to FILE-01.
```

Blue knows:

```text
svc_backup authenticated from an unusual source.
```

Full Truth reveals:

```text
The credential was originally exposed by a Halloway support integration six months earlier.
```

The campaign should repeatedly use reconstruction to change the meaning of events the player thought they already understood.

---

# 23. Story Rules

The following rules are canonical.

## 23.1 No Cartoon Villains

Major antagonists should have believable motives, constraints, and uncertainty around them.

## 23.2 No Omniscient Hacker Fantasy

No individual should casually control entire countries, financial systems, satellites, or infrastructure through magical hacking.

## 23.3 Technical Events Must Matter

Narrative clues should emerge from real simulation concepts whenever possible.

Examples:

- identity reuse
- trust relationships
- unexpected authentication
- persistence
- service configuration
- vendor access
- segmentation
- process behavior
- business impact

## 23.4 Normality Creates Tension

Most systems should look ordinary.

Most emails should sound corporate.

Most people should behave professionally.

The story becomes unsettling because something abnormal exists inside something normal.

## 23.5 Evidence Before Revelation

Major revelations should usually be supported by information the player could have encountered earlier.

## 23.6 Not Everything Is Connected

Some suspicious events must remain unrelated.

Some hypotheses should be wrong.

Some alerts should be false positives.

Otherwise the player learns that paranoia is always rewarded.

ROOT should reward evidence, not suspicion alone.

## 23.7 The Player Is Not the Center of the Universe

Important events happened before the player joined Nodeline.

Other operators conduct their own investigations.

Clients have their own priorities.

The world should feel like it existed before the campaign began.

---

# 24. Campaign Progression Summary

```text
ACT I — NOISE

The player learns how organizations work.
Small inconsistencies appear.

        ↓

ACT II — PATTERN

Recurring identities, vendors, and behaviors appear across unrelated incidents.

        ↓

ACT III — ACCESS

Red Team work reveals the trust relationships behind earlier evidence.

        ↓

ACT IV — GHOSTS

Historical cases and Nodeline itself become part of the investigation.

        ↓

ACT V — ROOT

The player reconstructs a long-running campaign built around transitive trust between organizations.
```

---

# 25. Canonical Story Principle

ROOT's story ultimately asks the same question as its gameplay:

> Did the player understand the system well enough to see what was really happening?

The central mystery should not be solved because the player finds a secret villain monologue.

It should be solved because the player finally understands the relationships between:

```text
people
organizations
identities
services
credentials
vendors
evidence
trust
```

The campaign begins with isolated incidents.

It ends with the player understanding the system connecting them.

That is the canonical story of ROOT.
