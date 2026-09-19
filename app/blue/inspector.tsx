"use client";
import { useState } from "react";
import type { ScenarioView } from "../sim-types";
import { hostNeedsAttention, processRisk, type ReadStatus, type Selection } from "./soc-state";

type RespondFn = (action: string, extras?: Record<string, unknown>) => void | Promise<void>;

export default function Inspector({
  view,
  selection,
  onSelect,
  respond,
  active,
  pinnedEvidence,
  onPinEvidence,
  status,
  markReviewed,
}: {
  view: ScenarioView;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  respond: RespondFn;
  active: boolean;
  pinnedEvidence: string[];
  onPinEvidence: (id: string) => void;
  status: (token: string) => ReadStatus;
  markReviewed: (token: string) => void;
}) {
  if (!selection) {
    const attentionHosts = view.machines.filter((machine) => machine.zone !== "EXTERNAL" && hostNeedsAttention(machine));
    const activeRoutes = view.investigation.filter((route) => route.status !== "CONTAINED");
    const activeIdentities = [...new Set(activeRoutes.flatMap((route) => route.evidence.identities))];
    const recentEvidence = view.events.slice(-5).reverse();
    const priorityAlerts = view.alerts
      .filter((alert) => alert.severity === "HIGH" || alert.severity === "CRITICAL")
      .slice(0, 5);

    return (
      <aside className="soc-inspector panel">
        <header className="panel-title">CONTEXTUAL INSPECTOR</header>
        <div className="data-list">
          <p className="eyebrow">CURRENT INCIDENT</p>
          <dl className="inspector-fields">
            <div><dt>Operation</dt><dd>{view.operation.name}</dd></div>
            <div><dt>State</dt><dd>{view.scenario.state}</dd></div>
            <div><dt>Open routes</dt><dd>{activeRoutes.length} of {view.investigation.length}</dd></div>
          </dl>

          <p className="eyebrow">AFFECTED ASSETS</p>
          {attentionHosts.map((host) => (
            <p key={host.id}>
              <button type="button" className="link-button" onClick={() => onSelect({ kind: "host", id: host.id })}>{host.hostname}</button>{" "}
              <span className={`state-pill state-${host.state.toLowerCase()}`}>{host.state}</span>
            </p>
          ))}
          {!attentionHosts.length && <p>No assets currently require attention.</p>}

          <p className="eyebrow">ACTIVE IDENTITIES</p>
          {activeIdentities.map((id) => (
            <p key={id}><button type="button" className="link-button" onClick={() => onSelect({ kind: "identity", id })}>{id}</button></p>
          ))}
          {!activeIdentities.length && <p>No identities implicated in open routes.</p>}

          <p className="eyebrow">LATEST EVIDENCE</p>
          {recentEvidence.map((event) => (
            <p key={event.id}>
              <button type="button" className="link-button" onClick={() => onSelect({ kind: "evidence", id: event.id })}>
                {event.timestamp.slice(11, 19)} {event.action.replaceAll("_", " ")}
              </button>
            </p>
          ))}
          {!recentEvidence.length && <p>No telemetry recorded yet.</p>}

          <p className="eyebrow">RECOMMENDED TARGETS</p>
          {priorityAlerts.map((alert) => (
            <p key={alert.id}>
              <button type="button" className="link-button" onClick={() => onSelect({ kind: "alert", id: alert.id })}>{alert.title}</button>{" "}
              <span className={`sev-pill sev-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
            </p>
          ))}
          {!priorityAlerts.length && <p>No high-priority alerts pending review.</p>}
        </div>
      </aside>
    );
  }

  if (selection.kind === "host") return <HostInspector view={view} id={selection.id} onSelect={onSelect} respond={respond} active={active} onPinEvidence={onPinEvidence} />;
  if (selection.kind === "process") return <ProcessInspector view={view} id={selection.id} hostId={selection.hostId} onSelect={onSelect} respond={respond} active={active} onPinEvidence={onPinEvidence} />;
  if (selection.kind === "connection") return <ConnectionInspector view={view} id={selection.id} onSelect={onSelect} respond={respond} active={active} onPinEvidence={onPinEvidence} />;
  if (selection.kind === "identity") return <IdentityInspector view={view} id={selection.id} onSelect={onSelect} respond={respond} active={active} onPinEvidence={onPinEvidence} />;
  if (selection.kind === "service") return <ServiceInspector view={view} id={selection.id} onSelect={onSelect} />;
  if (selection.kind === "alert") return <AlertInspector view={view} id={selection.id} onSelect={onSelect} respond={respond} active={active} onPinEvidence={onPinEvidence} status={status} markReviewed={markReviewed} />;
  if (selection.kind === "evidence") return <EvidenceInspector view={view} id={selection.id} pinnedEvidence={pinnedEvidence} />;
  return null;
}

function Frame({ title, tag, children }: { title: string; tag?: string; children: React.ReactNode }) {
  return (
    <aside className="soc-inspector panel">
      <header className="panel-title">
        {title}
        {tag && <span>{tag}</span>}
      </header>
      <div className="data-list">{children}</div>
    </aside>
  );
}

function relatedAlerts(view: ScenarioView, hostname: string) {
  return view.alerts.filter((alert) => alert.summary.includes(hostname));
}

function HostInspector({ view, id, onSelect, respond, active, onPinEvidence }: {
  view: ScenarioView; id: string; onSelect: (s: Selection) => void; respond: RespondFn; active: boolean; onPinEvidence: (id: string) => void;
}) {
  const [tab, setTab] = useState<"overview" | "processes" | "network" | "identity" | "evidence">("overview");
  const machine = view.machines.find((m) => m.id === id);
  if (!machine) return <Frame title="HOST">Host no longer available.</Frame>;
  const connections = view.connections.filter((c) => c.source === machine.hostname || c.target === machine.hostname);
  const sessions = view.sessions.filter((s) => s.machine === machine.hostname);
  const alerts = relatedAlerts(view, machine.hostname);
  const events = view.events.filter((e) => e.source === machine.hostname || e.target === machine.hostname);

  return (
    <aside className="soc-inspector panel">
      <header className="panel-title">
        {machine.hostname}
        <span className={`state-pill state-${machine.state.toLowerCase()}`}>{machine.state}</span>
      </header>
      <nav className="inspector-tabs">
        {(["overview", "processes", "network", "identity", "evidence"] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
        ))}
      </nav>
      <div className="data-list">
        {tab === "overview" && (
          <>
            <dl className="inspector-fields">
              <div><dt>Hostname</dt><dd>{machine.hostname}</dd></div>
              <div><dt>IP</dt><dd>{machine.ip}</dd></div>
              <div><dt>Zone</dt><dd>{machine.zone}</dd></div>
              <div><dt>OS</dt><dd>{machine.os}</dd></div>
              <div><dt>Availability</dt><dd>{machine.availability}</dd></div>
              <div><dt>State</dt><dd>{machine.state}</dd></div>
            </dl>
            <div className="response-grid">
              <button type="button" disabled={!active || machine.state === "ISOLATED"} onClick={() => void respond("ISOLATE_HOST", { targetId: machine.id })}>Isolate host</button>
              <button type="button" disabled={!active} onClick={() => void respond("RESTORE_HOST", { targetId: machine.id })}>Restore host</button>
              <button type="button" disabled={!active} onClick={() => void respond("REMOVE_PERSISTENCE", { targetId: machine.id })}>Remove persistence</button>
            </div>
            <p><b>RELATED ALERTS ({alerts.length})</b></p>
            {alerts.map((alert) => (
              <p key={alert.id}><button type="button" className="link-button" onClick={() => onSelect({ kind: "alert", id: alert.id })}>{alert.title}</button></p>
            ))}
            {!alerts.length && <p>No alerts reference this host.</p>}
          </>
        )}

        {tab === "processes" && (
          <table className="inspector-table">
            <thead><tr><th>Process</th><th>PID</th><th>User</th><th>Risk</th><th /></tr></thead>
            <tbody>
              {machine.processes.map((process) => {
                const risk = processRisk(process);
                return (
                  <tr key={process.id}>
                    <td><button type="button" className="link-button" onClick={() => onSelect({ kind: "process", id: process.id, hostId: machine.id })}>{process.name}</button></td>
                    <td>{process.pid}</td>
                    <td>{process.runningAs}</td>
                    <td><span className={`risk-pill risk-${risk.toLowerCase()}`}>{risk}</span></td>
                    <td>
                      <button type="button" disabled={!active} onClick={() => onPinEvidence(`process:${process.id}`)}>Pin</button>
                      <button type="button" disabled={!active} onClick={() => void respond("TERMINATE_PROCESS", { targetId: machine.id, processId: process.id })}>Terminate</button>
                    </td>
                  </tr>
                );
              })}
              {!machine.processes.length && <tr><td colSpan={5}>No observed processes.</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "network" && (
          <>
            {connections.map((connection) => (
              <p key={connection.id}>
                <button type="button" className="link-button" onClick={() => onSelect({ kind: "connection", id: connection.id })}>
                  {connection.source} → {connection.target}:{connection.port}
                </button>{" "}
                {connection.allowed ? "ALLOWED" : "BLOCKED"}
              </p>
            ))}
            {!connections.length && <p>No observed connections.</p>}
          </>
        )}

        {tab === "identity" && (
          <>
            {sessions.map((session) => (
              <p key={session.id}>
                <button type="button" className="link-button" onClick={() => onSelect({ kind: "identity", id: session.user })}>{session.user}</button>{" "}
                {"// "}{session.privilege}
              </p>
            ))}
            {!sessions.length && <p>No active sessions on this host.</p>}
          </>
        )}

        {tab === "evidence" && (
          <>
            {events.slice(-15).reverse().map((event) => (
              <p key={event.id}>
                {event.timestamp.slice(11, 19)} {event.action}{" "}
                <button type="button" disabled={!active} onClick={() => onPinEvidence(event.id)}>Pin</button>
              </p>
            ))}
            {!events.length && <p>No telemetry recorded for this host.</p>}
          </>
        )}
      </div>
    </aside>
  );
}

function ProcessInspector({ view, id, hostId, onSelect, respond, active, onPinEvidence }: {
  view: ScenarioView; id: string; hostId: string; onSelect: (s: Selection) => void; respond: RespondFn; active: boolean; onPinEvidence: (id: string) => void;
}) {
  const machine = view.machines.find((m) => m.id === hostId);
  const process = machine?.processes.find((p) => p.id === id);
  if (!machine || !process) return <Frame title="PROCESS">Process no longer available.</Frame>;
  const risk = processRisk(process);
  return (
    <Frame title={process.name} tag={risk}>
      <dl className="inspector-fields">
        <div><dt>PID</dt><dd>{process.pid}</dd></div>
        <div><dt>User</dt><dd>{process.runningAs}</dd></div>
        <div><dt>Command line</dt><dd>{process.commandLine ?? "—"}</dd></div>
        <div><dt>Host</dt><dd><button type="button" className="link-button" onClick={() => onSelect({ kind: "host", id: machine.id })}>{machine.hostname}</button></dd></div>
      </dl>
      <div className="response-grid">
        <button type="button" disabled={!active} onClick={() => onPinEvidence(`process:${process.id}`)}>Pin as evidence</button>
        <button type="button" disabled={!active} onClick={() => void respond("TERMINATE_PROCESS", { targetId: machine.id, processId: process.id })}>Terminate process</button>
      </div>
      {risk !== "LOW" && <p className="impact-preview">Terminating an unrecognized process may interrupt a legitimate service if it supports one — confirm before acting on unclear evidence.</p>}
    </Frame>
  );
}

function ConnectionInspector({ view, id, onSelect, respond, active, onPinEvidence }: {
  view: ScenarioView; id: string; onSelect: (s: Selection) => void; respond: RespondFn; active: boolean; onPinEvidence: (id: string) => void;
}) {
  const connection = view.connections.find((c) => c.id === id);
  if (!connection) return <Frame title="CONNECTION">Connection no longer available.</Frame>;
  const dependentServices = view.availability.services.filter((service) => service.hosts.includes(connection.target));
  const events = view.events.filter((e) => e.source === connection.source && e.target === connection.target);
  return (
    <Frame title={`${connection.source} → ${connection.target}`} tag={connection.allowed ? "ALLOWED" : "BLOCKED"}>
      <dl className="inspector-fields">
        <div><dt>Port</dt><dd>{connection.port}</dd></div>
        <div><dt>Source</dt><dd><button type="button" className="link-button" onClick={() => onSelect({ kind: "host", id: view.machines.find((m) => m.hostname === connection.source)?.id ?? "" })}>{connection.source}</button></dd></div>
        <div><dt>Target</dt><dd><button type="button" className="link-button" onClick={() => onSelect({ kind: "host", id: view.machines.find((m) => m.hostname === connection.target)?.id ?? "" })}>{connection.target}</button></dd></div>
        <div><dt>First observed</dt><dd>{events[0]?.timestamp.slice(11, 19) ?? "—"}</dd></div>
        <div><dt>Last observed</dt><dd>{events.at(-1)?.timestamp.slice(11, 19) ?? "—"}</dd></div>
      </dl>
      {dependentServices.length > 0 && (
        <div className="impact-preview">
          <b>BUSINESS DEPENDENCIES</b>
          {dependentServices.map((service) => <p key={service.name}>{service.name} — {service.impact}</p>)}
        </div>
      )}
      <div className="response-grid">
        <button type="button" disabled={!active} onClick={() => onPinEvidence(connection.id)}>Pin evidence</button>
        {connection.allowed
          ? <button type="button" disabled={!active} onClick={() => void respond("BLOCK_CONNECTION", { connectionId: connection.id })}>Block connection</button>
          : <button type="button" disabled={!active} onClick={() => void respond("UNBLOCK_CONNECTION", { connectionId: connection.id })}>Unblock connection</button>}
      </div>
    </Frame>
  );
}

function IdentityInspector({ view, id, onSelect, respond, active, onPinEvidence }: {
  view: ScenarioView; id: string; onSelect: (s: Selection) => void; respond: RespondFn; active: boolean; onPinEvidence: (id: string) => void;
}) {
  const sessions = view.sessions.filter((s) => s.user === id);
  const events = view.events.filter((e) => e.userId === id);
  const knownHosts = [...new Set(sessions.map((s) => s.machine))];
  const affectedServices = view.availability.services.filter((service) => knownHosts.some((host) => service.hosts.includes(host)));
  return (
    <Frame title={id}>
      <dl className="inspector-fields">
        <div><dt>Active sessions</dt><dd>{sessions.length}</dd></div>
        <div><dt>Known hosts</dt><dd>{knownHosts.map((host) => (
          <button key={host} type="button" className="link-button" onClick={() => onSelect({ kind: "host", id: view.machines.find((m) => m.hostname === host)?.id ?? "" })}>{host}</button>
        )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ", ", el], [] as React.ReactNode[])}</dd></div>
      </dl>
      {affectedServices.length > 0 && (
        <div className="impact-preview">
          <b>DEPENDENT SERVICES</b>
          <p>Resetting or disabling this identity may interrupt: {affectedServices.map((s) => s.name).join(", ")}</p>
        </div>
      )}
      <div className="response-grid">
        <button type="button" disabled={!active} onClick={() => void respond("RESET_PASSWORD", { username: id })}>Reset credential</button>
        <button type="button" disabled={!active} onClick={() => void respond("DISABLE_ACCOUNT", { username: id })}>Disable account</button>
        {sessions.map((session) => (
          <button key={session.id} type="button" disabled={!active} onClick={() => void respond("REVOKE_SESSION", { sessionId: session.id })}>Terminate session on {session.machine}</button>
        ))}
      </div>
      <p><b>AUTHENTICATION HISTORY</b></p>
      {events.slice(-10).reverse().map((event) => (
        <p key={event.id}>{event.timestamp.slice(11, 19)} {event.action} {event.source ?? "—"} → {event.target ?? "—"} <button type="button" disabled={!active} onClick={() => onPinEvidence(event.id)}>Pin</button></p>
      ))}
      {!events.length && <p>No recorded authentication history.</p>}
    </Frame>
  );
}

function ServiceInspector({ view, id, onSelect }: { view: ScenarioView; id: string; onSelect: (s: Selection) => void }) {
  const service = view.availability.services.find((s) => s.name === id);
  if (!service) return <Frame title="SERVICE">Service no longer available.</Frame>;
  return (
    <Frame title={service.name} tag={service.state}>
      <p>{service.impact}</p>
      <p><b>DEPENDENT HOSTS</b></p>
      {service.hosts.map((host) => (
        <p key={host}><button type="button" className="link-button" onClick={() => onSelect({ kind: "host", id: view.machines.find((m) => m.hostname === host)?.id ?? "" })}>{host}</button></p>
      ))}
    </Frame>
  );
}

function AlertInspector({ view, id, onSelect, respond, active, onPinEvidence, status, markReviewed }: {
  view: ScenarioView; id: string; onSelect: (s: Selection) => void; respond: RespondFn; active: boolean; onPinEvidence: (id: string) => void; status: (t: string) => ReadStatus; markReviewed: (t: string) => void;
}) {
  const alert = view.alerts.find((a) => a.id === id);
  if (!alert) return <Frame title="ALERT">Alert no longer available.</Frame>;
  return (
    <Frame title={alert.title} tag={alert.severity}>
      <dl className="inspector-fields">
        <div><dt>Rule</dt><dd>{alert.ruleId}</dd></div>
        <div><dt>Time</dt><dd>{alert.timestamp.slice(11, 19)}</dd></div>
        <div><dt>Summary</dt><dd>{alert.summary}</dd></div>
        <div><dt>Status</dt><dd>{status(`alert:${alert.id}`)}</dd></div>
      </dl>
      <p>{alert.rationale}</p>
      <div className="response-grid">
        <button type="button" disabled={!active} onClick={() => { onPinEvidence(alert.evidenceEventId ?? alert.id); void respond("ALERT_REVIEWED", { evidenceIds: [alert.id] }); markReviewed(`alert:${alert.id}`); }}>Review and pin</button>
        <button type="button" disabled={!active} onClick={() => void respond("DISMISS_ALERT", { evidenceIds: [alert.id], reason: "Benign administrative activity" })}>Dismiss</button>
      </div>
      {alert.evidenceEventId && <p><button type="button" className="link-button" onClick={() => onSelect({ kind: "evidence", id: alert.evidenceEventId! })}>View source telemetry →</button></p>}
    </Frame>
  );
}

function EvidenceInspector({ view, id, pinnedEvidence }: { view: ScenarioView; id: string; pinnedEvidence: string[] }) {
  const event = view.events.find((e) => e.id === id);
  if (!event) return <Frame title="EVIDENCE">Original telemetry unavailable.</Frame>;
  return (
    <Frame title={event.action} tag={pinnedEvidence.includes(id) ? "PINNED" : undefined}>
      <dl className="inspector-fields">
        <div><dt>Timestamp</dt><dd>{event.timestamp.slice(11, 19)}</dd></div>
        <div><dt>Category</dt><dd>{event.category}</dd></div>
        <div><dt>Source → Target</dt><dd>{event.source ?? "—"} → {event.target ?? "—"}</dd></div>
        <div><dt>Identity</dt><dd>{event.userId ?? "—"}</dd></div>
      </dl>
      <p><b>ORIGINAL CONTEXT (SNAPSHOT)</b></p>
      <pre className="evidence-raw">{JSON.stringify(event.metadata, null, 2)}</pre>
    </Frame>
  );
}
