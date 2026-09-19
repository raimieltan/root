# ROOT — Audio Design Document

## 1. Purpose

Audio in ROOT should make the simulated computer environment feel physical, functional, tense, and believable.

The goal is not to create a cinematic "hacker" soundtrack. Audio should support:

* system awareness
* player feedback
* tension
* information discovery
* environmental storytelling
* Red vs. Blue situational awareness
* immersion in ROOT/OS
* recognition of important system events

Players should eventually recognize certain events through sound alone.

---

# 2. Audio Identity

ROOT should sound like an old professional workstation operating inside a corporate environment.

Primary influences:

* late 1990s / early 2000s operating systems
* server rooms
* CRT monitors
* mechanical keyboards
* old office PCs
* network appliances
* enterprise software
* analog electronics
* understated industrial ambience
* surveillance equipment
* corporate training software

Avoid excessive:

* cyberpunk synthesizers
* EDM
* glitch spam
* sci-fi hologram sounds
* exaggerated movie hacking sounds
* constant alarms
* futuristic UI effects

The world should feel outdated, functional, slightly uncomfortable, and authentic.

---

# 3. Core Audio Principles

## Functional Before Cinematic

Most sounds should communicate something useful.

A player should be able to understand:

> Something changed.

before necessarily understanding:

> What changed?

Examples:

* new host discovered
* authentication succeeded
* authentication failed
* suspicious activity detected
* new evidence obtained
* connection established
* process terminated
* service unavailable

---

## Low Audio Density

ROOT is information-heavy.

Audio should never compete with:

* terminal reading
* logs
* SIEM events
* packet inspection
* case analysis

Most UI sounds should therefore be short and quiet.

Silence is an intentional part of the sound design.

---

## Consistency

Actions belonging to the same system family should share an audible identity.

Example:

```text
SSH connection
Database connection
HTTP connection
Remote shell
```

All could share a subtle "connection established" audio motif while retaining small variations.

---

# 4. ROOT/OS Base Soundscape

ROOT/OS should have an extremely subtle persistent background layer.

Possible elements:

* PC fan
* CRT electrical hum
* distant server ventilation
* hard drive activity
* occasional relay click
* electrical transformer hum
* fluorescent light buzz

These sounds should be extremely quiet.

The player should notice them more when nothing else is happening.

The operating system should feel like a physical machine sitting on a desk.

---

# 5. Boot Sequence

ROOT/OS boot audio establishes the game's identity.

Example sequence:

```text
POWER BUTTON

low electrical click

fan spin-up

hard-drive seek

monitor activation hum

BIOS beep

short silence

ROOT/OS boot tone
```

The ROOT boot sound should be memorable but restrained.

Avoid large orchestral or cinematic intros.

The feeling should be:

> "This machine has started."

rather than:

> "The hero has entered cyberspace."

---

# 6. Desktop UI Audio

Desktop interactions use quiet mechanical sounds.

## Window Open

Short mechanical click.

## Window Close

Slightly lower-pitched click.

## Minimize

Soft downward mechanical movement.

## Maximize

Short expansion sound.

## Application Launch

Subtle disk activity followed by a confirmation click.

Applications should occasionally have slightly different launch textures.

Example:

```text
Terminal
dry relay click

Network Map
soft scanning pulse

Mail
office notification tone

Packet Viewer
short radio/static texture

SIEM
low electronic chirp
```

---

# 7. Terminal Audio

The terminal should be one of the most recognizable audio environments in ROOT.

## Typing

Keyboard sounds should be subtle.

Possible keyboard profile:

* older mechanical office keyboard
* slightly inconsistent key sounds
* louder Enter key
* distinct Backspace
* subtle Spacebar

Typing audio should be optional or volume-controlled.

---

## Command Execution

Pressing Enter produces a small terminal confirmation sound.

Do not play sounds for every line of output.

Sounds should primarily indicate system events.

Example:

```text
$ ssh admin@FIN-SRV-02
```

Audio sequence:

```text
keyboard Enter

brief network connection tone

authentication prompt tone
```

---

# 8. Authentication Audio

Authentication is extremely important in ROOT.

Different states should have clearly distinguishable sounds.

## Authentication Request

Short neutral tone.

Meaning:

> Credentials are required.

---

## Successful Authentication

Soft ascending two-note sound.

Meaning:

> Access granted.

This should become highly recognizable.

---

## Failed Authentication

Short muted downward tone.

No dramatic buzzer.

Meaning:

> Access rejected.

---

## Privilege Change

Example:

```text
sudo
su
role elevation
token escalation
```

Sound:

Low mechanical click followed by a subtle higher confirmation tone.

Privilege changes should feel important.

---

# 9. Network Discovery Audio

Network reconnaissance should have restrained scanning feedback.

Example command:

```text
nmap 10.40.2.0/24
```

Do not produce radar-style movie sounds.

Instead:

```text
scan begins

quiet periodic network pulses

host discovered

service discovered
```

Host discovery could use:

```text
short dry ping
```

Port discovery:

```text
smaller tick
```

Critical service discovery:

```text
slightly deeper confirmation tone
```

Example:

```text
22/tcp SSH
5432/tcp PostgreSQL
443/tcp HTTPS
```

Important discoveries should feel noticeable without becoming arcade rewards.

---

# 10. Network Map

The Network Map should have its own subtle audio identity.

Possible sounds:

Host appears:

```text
digital click
```

Connection discovered:

```text
short electrical trace
```

New subnet discovered:

```text
low expansion pulse
```

Host goes offline:

```text
faint disconnect tone
```

Host becomes compromised:

```text
muted state-change sound
```

---

# 11. Browser Audio

The ROOT browser represents internal corporate websites and applications.

Audio should resemble older desktop browsers.

Possible events:

Page request:

```text
quiet relay click
```

Page loaded:

```text
small confirmation tone
```

Connection error:

```text
short muted failure tone
```

Authentication required:

```text
neutral prompt tone
```

Unexpected discovery:

```text
subtle information cue
```

Example:

Discovering:

```text
portal.meridian.test
```

should produce a small discovery sound when it becomes known to the player.

---

# 12. Mail Application

Email represents both storytelling and intelligence.

New mail:

Classic office-style notification.

Important security message:

Slightly lower version of the notification.

Mission-critical message:

Two short tones.

Do not use dramatic emergency sounds unless the situation genuinely warrants them.

---

# 13. Files Application

Possible audio:

Folder open:

```text
soft mechanical click
```

File open:

```text
paper-like digital click
```

File copied:

```text
short disk activity
```

File deleted:

```text
muted mechanical drop
```

Hidden file discovered:

```text
subtle discovery tone
```

Sensitive file found:

```text
low information cue
```

---

# 14. Database Audio

Database interaction should feel distinct from ordinary shell activity.

Example:

```text
psql -h FIN-DB -U svc_finance -d finance
```

Connection:

```text
network connection tone
database activation click
```

Query execution:

```text
small mechanical tick
```

Successful result:

No sound unless something important occurs.

Sensitive information discovered:

Subtle evidence cue.

Query error:

Short low tone.

Database actions should remain mostly quiet because query output is already information-dense.

---

# 15. Packet Viewer

Packet inspection can use extremely subtle radio/electrical textures.

Possible background:

* occasional static
* faint network chatter
* tiny clicks representing packets

Do not generate sound for every packet.

Instead, dynamically increase activity when network traffic becomes dense.

Filters may briefly reduce the soundscape.

This allows audio to reinforce:

> The network became quieter because I filtered the traffic.

---

# 16. SIEM / Log Viewer

Blue Team audio must avoid becoming alarm fatigue.

Security events should have severity levels.

## Informational

Almost silent.

Optional soft tick.

## Low Severity

Single quiet notification.

## Medium Severity

Distinct two-tone alert.

## High Severity

Short warning tone.

## Critical

Rare and unmistakable alarm.

Critical alerts should be uncommon.

If everything sounds urgent, nothing feels urgent.

---

# 17. Blue Team Audio

Blue Team audio should emphasize detection and investigation.

Key sounds:

* alert generated
* host becomes suspicious
* identity anomaly detected
* authentication failure spike
* suspicious process
* suspicious network connection
* evidence added
* hypothesis updated
* containment initiated
* containment successful
* containment failed

Blue Team should feel like working inside an operational security center.

The audio should reinforce:

> Something happened somewhere in the environment.

rather than automatically revealing exactly what happened.

---

# 18. Red Team Audio

Red Team audio should emphasize access and discovery.

Important sound states:

* host discovered
* service discovered
* credentials discovered
* authentication succeeded
* authentication failed
* shell obtained
* privileged access obtained
* sensitive file discovered
* database accessed
* lateral movement completed
* objective evidence found

The most rewarding Red Team sounds should accompany knowledge and access rather than arbitrary progression.

---

# 19. Suspicion System

Suspicion should have an audio layer.

However, the game should not provide a literal "danger meter" through sound.

Instead, subtle environmental changes occur.

Low suspicion:

```text
normal machine ambience
```

Moderate suspicion:

```text
slightly stronger server hum
occasional distant notification
```

High suspicion:

```text
slightly increased alert activity
more frequent system sounds
subtle low-frequency tension layer
```

Critical suspicion:

```text
occasional SOC warning sounds
network disruptions
machine activity
```

This communicates pressure without becoming supernatural.

---

# 20. Evidence Audio

Evidence is one of ROOT's central resources.

Evidence obtained:

```text
short mechanical confirmation
```

Important evidence:

```text
confirmation + subtle low tone
```

Evidence connected:

```text
two related clicks
```

Contradictory evidence:

```text
soft negative tone
```

Case Board discovery:

```text
brief information cue
```

Avoid collectible-style reward sounds.

Evidence should feel like:

> You learned something meaningful.

---

# 21. Knowledge Tracker

Knowledge progression:

```text
Introduced
Practiced
Demonstrated
Mastered
```

Each stage can extend the same audio motif.

Introduced:

```text
single quiet tone
```

Practiced:

```text
two-note version
```

Demonstrated:

```text
three-note version
```

Mastered:

```text
complete motif
```

This subtly teaches players to associate the sound with growing understanding.

---

# 22. Mission Audio

Mission audio should remain minimal.

Mission received:

Short system notification.

Objective updated:

Quiet confirmation.

Major objective completed:

Short restrained success tone.

Mission completed:

Slightly longer ROOT/OS success motif.

Mission failed:

Low neutral shutdown tone.

Failure should not sound humiliating.

The player should be encouraged to understand what happened.

---

# 23. Post-Operation Reconstruction

The post-operation Red / Blue / Full Truth reconstruction is one of ROOT's strongest audio opportunities.

During timeline replay:

Each event can produce its original sound.

Example:

```text
22:14:03 SSH login
22:14:17 file accessed
22:14:29 database connection
22:15:05 SIEM alert
22:15:43 containment
```

As the timeline moves forward, these sounds reconstruct the operation.

Different perspectives could emphasize different sound layers.

### Red View

Highlights:

* discovery
* access
* credential use
* lateral movement

### Blue View

Highlights:

* telemetry
* alerts
* investigation
* containment

### Full Truth

Both sound layers play together.

The player literally hears how both sides experienced the same incident differently.

---

# 24. Corporate Environment Audio

ROOT missions should occasionally include environmental corporate sounds.

Examples:

* office HVAC
* fluorescent lights
* printer activity
* desk phone ringing
* distant conversation
* keyboard typing
* server room ventilation
* elevator chime
* intercom announcement

These should primarily appear during narrative moments or desktop idle states.

---

# 25. Music Philosophy

Music should be sparse.

Most gameplay should use environmental ambience instead.

Music may appear during:

* mission introduction
* major narrative scenes
* escalating incidents
* operation conclusion
* important story revelations

Music style:

* minimal electronic
* industrial ambient
* analog synth
* dark corporate ambience
* tape texture
* restrained percussion
* low drones

Avoid constant music during technical investigation.

Silence allows players to think.

---

# 26. Narrative Music Layers

Music can dynamically react to simulation state.

Example layers:

```text
Layer 1
ambient drone

Layer 2
subtle pulse

Layer 3
mechanical percussion

Layer 4
tension texture
```

Possible triggers:

```text
suspicion rises
Blue begins investigation
Red gains privileged access
critical evidence discovered
containment begins
```

Transitions should be gradual.

Players should not immediately understand the simulation state simply because the soundtrack changed.

---

# 27. Diegetic vs Non-Diegetic Audio

ROOT should favor diegetic audio.

Diegetic:

```text
system notifications
computer fans
terminal sounds
office sounds
server sounds
alarms
device activity
```

Non-diegetic:

```text
music
mission success motif
major narrative stingers
```

The majority of gameplay audio should feel like it originates from the simulated environment.

---

# 28. Audio Information Hierarchy

Priority:

```text
1 Critical system information
2 Player action feedback
3 Security alerts
4 Discovery
5 Environment
6 Music
```

Important information must never be masked by music.

---

# 29. Accessibility

Players should be able to play ROOT without depending exclusively on audio.

Every important sound must have a visual equivalent.

Audio settings:

```text
Master Volume
UI Volume
Terminal Volume
Alert Volume
Environment Volume
Music Volume
Voice Volume
```

Additional options:

```text
Mute typing sounds
Reduce alert intensity
Mono audio
Visual sound indicators
Reduce sudden sounds
```

---

# 30. Dynamic Range

ROOT should avoid extremely loud transient sounds.

The game will often be played:

* with headphones
* late at night
* during long sessions

Audio should therefore maintain controlled dynamic range.

Critical alarms may be louder than normal UI sounds but should never be painful or startling.

---

# 31. Audio Event Naming Convention

Implementation events should follow a predictable naming format.

Example:

```text
ui.window.open
ui.window.close

terminal.command.submit
terminal.command.error

auth.prompt
auth.success
auth.failure

network.scan.start
network.host.discovered
network.service.discovered

db.connection.success
db.query.error

security.alert.low
security.alert.medium
security.alert.high
security.alert.critical

evidence.discovered
evidence.connected

knowledge.introduced
knowledge.practiced
knowledge.demonstrated
knowledge.mastered

mission.updated
mission.completed
mission.failed
```

This makes it easier to connect audio to the event-driven simulation.

---

# 32. Event-Driven Audio Architecture

ROOT's audio system should subscribe to simulation events.

Example:

```text
Simulation Event

AUTHENTICATION_SUCCEEDED
        ↓
Audio Event Resolver
        ↓
Determine Context

SSH?
Database?
Web login?
Local machine?

        ↓
Select Sound Family
        ↓
Play Variation
```

Example event:

```json
{
  "type": "AUTHENTICATION_SUCCEEDED",
  "service": "SSH",
  "host": "FIN-SRV-02",
  "identity": "svc_backup"
}
```

Audio resolver:

```text
auth.success.ssh
```

This keeps gameplay logic separate from sound implementation.

---

# 33. Sound Variation

Frequently triggered sounds should use variations.

Example:

```text
keyboard.enter.01
keyboard.enter.02
keyboard.enter.03

ui.click.01
ui.click.02
ui.click.03
```

Small pitch and volume variations can also prevent repetition.

Avoid obvious randomization.

Sounds should still belong to the same family.

---

# 34. Audio Occlusion / Context

When different ROOT/OS applications are active, audio emphasis may change.

Example:

Packet Viewer active:

```text
network ambience slightly louder
desktop ambience slightly quieter
```

Terminal active:

```text
keyboard and terminal sounds emphasized
```

SIEM active:

```text
alerts slightly clearer
```

Browser active:

```text
network ambience reduced
UI sounds emphasized
```

---

# 35. Voice Design

ROOT should avoid excessive voiced dialogue.

Most communication should occur through:

* email
* chat
* logs
* documents
* tickets
* system messages

Voice may be used selectively for:

* corporate training videos
* voicemail
* intercepted recordings
* security announcements
* emergency broadcasts
* narrative moments

This makes recorded voices feel significant.

---

# 36. Corporate Training Audio

Training materials can intentionally sound slightly outdated.

Characteristics:

* compressed voice
* cheap microphone
* corporate background music
* awkward pauses
* old instructional video tone

Example:

> "Welcome to Meridian Information Systems security orientation."

This supports ROOT's corporate atmosphere.

---

# 37. Failure Audio Philosophy

ROOT should avoid arcade failure sounds.

Bad outcomes should sound operational.

Examples:

Connection lost:

```text
network disconnect tone
```

Account locked:

```text
authentication denial tone
```

Host isolated:

```text
network cutoff sound
```

Service crashed:

```text
mechanical shutdown
```

Mission failure:

```text
quiet ROOT system tone
```

The environment failed.

The game did not "punish" the player with an arcade buzzer.

---

# 38. Audio Progression

Early game audio should be simpler.

Beginner:

Important events are slightly more audible.

Veteran:

Less unnecessary feedback.

Real Terminal Mode:

Minimal UI confirmation.

Difficulty therefore changes information exposure rather than creating louder or more dramatic audio.

---

# 39. Signature ROOT Sounds

ROOT should eventually develop several immediately recognizable sounds.

Recommended signature sounds:

```text
ROOT boot tone

authentication success

authentication failure

host discovered

security alert

evidence discovered

privileged access

mission complete

ROOT shutdown
```

These sounds become part of the identity of the game.

---

# 40. Audio Production Priority

## Phase 1 — Core Interaction

Create:

* desktop clicks
* terminal typing
* command submit
* authentication
* application launch
* network discovery
* errors
* notifications

---

## Phase 2 — Gameplay Systems

Add:

* SIEM alerts
* packet viewer
* evidence
* knowledge progression
* database interactions
* remote access
* suspicion system

---

## Phase 3 — Environmental Audio

Add:

* office ambience
* server rooms
* computer hardware
* electrical ambience
* corporate environments

---

## Phase 4 — Music

Create:

* ROOT/OS ambience
* operation tension layers
* narrative themes
* mission completion
* Full Truth reconstruction theme

---

## Phase 5 — Narrative Audio

Add:

* voicemail
* recordings
* training videos
* broadcasts
* major story dialogue

---

# 41. Desired Player Experience

ROOT's audio should gradually teach players the sound of the simulated environment.

Eventually, an experienced player may hear:

```text
connection tone

authentication success

two security alerts

network disconnect
```

and immediately understand:

> Someone authenticated remotely, Blue detected something, and the host may have been isolated.

That is the ultimate goal of ROOT's audio system.

Audio becomes another interface for understanding the simulation.

---

# Core Audio Philosophy

ROOT should not sound like hacking.

ROOT should sound like computers, networks, offices, security systems, and people quietly operating infrastructure.

The tension comes from understanding what those sounds mean.
