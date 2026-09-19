"use client";
import { useState } from "react";
import type { ScenarioView } from "../sim-types";
import { formatWindow, hostNeedsAttention, processRisk, type ModuleId, type ReadStatus, type Selection } from "./soc-state";

type RespondFn = (action: string, extras?: Record<string, unknown>) => void | Promise<void>;

export type ModuleProps = {
  view: ScenarioView;
  active: boolean;
  respond: RespondFn;
  onSelect: (selection: Selection) => void;
  onNavigate: (module: ModuleId, selection?: Selection) => void;
  reviewed: Set<string>;
  dismissed: Set<string>;
  pinnedEvidence: string[];
  onPinEvidence: (id: string) => void;
  status: (token: string) => ReadStatus;
  markSeen: (token: string) => void;
  markReviewed: (token: string) => void;
  now: number;
};

function DISMISS_REASONS() {
  return ["False positive", "Expected behavior", "Duplicate", "Benign administrative activity", "Other"];
}

// ---------------------------------------------------------------- Dashboard
export function Dashboard({ view, onSelect, onNavigate, reviewed, dismissed, now }: ModuleProps) {
  const blueStatus = view.blueStatus;
  const elapsedSeconds = view.scenario.startedAt ? Math.max(0, Math.floor((now - new Date(view.scenario.startedAt).getTime()) / 1000)) : blueStatus?.responseWindow.elapsedSeconds ?? 0;
  const priorityAlerts = view.alerts.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);
  const timeline = view.events.slice(-14).reverse();
  const degraded = view.availability.services.filter((service) => service.state !== "HEALTHY");

  return (
    <>
      <section className="panel soc-mission min-h-22">
        <header className="panel-title">INCIDENT SUMMARY</header>
        <div className="data-list">
          <dl className="inspector-fields">
            <div><dt>Operation</dt><dd>{view.operation.name}</dd></div>
            <div><dt>Status</dt><dd>{view.scenario.state}</dd></div>
            <div><dt>Elapsed</dt><dd>{formatWindow(elapsedSeconds)}</dd></div>
            <div><dt>Objective</dt><dd>{view.operation.briefing.blue}</dd></div>
          </dl>
          {degraded.length > 0 && (
            <p className="impact-preview">
              <b>BUSINESS IMPACT //</b>{" "}
              {degraded.map((service) => (
                <button key={service.name} type="button" className="link-button" onClick={() => onNavigate("services", { kind: "service", id: service.name })}>
                  {service.name}: {service.state}
                </button>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, " · ", el], [] as React.ReactNode[])}
            </p>
          )}
        </div>
      </section>

      <div className="soc-col-left">
        <section className="panel soc-alerts min-h-26">
          <header className="panel-title">PRIORITY ALERTS <button type="button" className="link-button" onClick={() => onNavigate("alerts")}>View all alerts →</button></header>
          <div className="campaign-table">
            <table>
              <thead><tr><th>Time</th><th>Sev</th><th>Alert</th><th>Source → Target</th><th>Status</th></tr></thead>
              <tbody>
                {priorityAlerts.map((alert) => (
                  <tr key={alert.id} onClick={() => onSelect({ kind: "alert", id: alert.id })} onDoubleClick={() => onNavigate("alerts", { kind: "alert", id: alert.id })}>
                    <td>{alert.timestamp.slice(11, 19)}</td>
                    <td><span className={`sev-pill sev-${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                    <td>{alert.title}</td>
                    <td>{alert.summary}</td>
                    <td>{dismissed.has(alert.id) ? "DISMISSED" : reviewed.has(alert.id) ? "REVIEWED" : "NEW"}</td>
                  </tr>
                ))}
                {!priorityAlerts.length && <tr><td colSpan={5}>No detection rules have fired.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel min-h-40">
          <header className="panel-title">INCIDENT TIMELINE <button type="button" className="link-button" onClick={() => onNavigate("reports")}>View full timeline →</button></header>
          <div className="data-list">
            {timeline.map((event) => (
              <p key={event.id}>{event.timestamp.slice(11, 19)} <b>{event.action}</b> {event.source ?? "—"} → {event.target ?? "—"}</p>
            ))}
            {!timeline.length && <p>No telemetry recorded yet.</p>}
          </div>
        </section>
      </div>

      <div className="soc-col-right">
        <section className="panel min-h-24">
          <header className="panel-title">BUSINESS IMPACT <button type="button" className="link-button" onClick={() => onNavigate("services")}>Open Services →</button></header>
          <div className="data-list">
            {view.availability.services.map((service) => (
              <p key={service.name}>
                <button type="button" className="link-button" onClick={() => onNavigate("services", { kind: "service", id: service.name })}>{service.name}</button>{" "}
                <b>{service.state}</b>
              </p>
            ))}
          </div>
        </section>

        <section className="panel min-h-30">
          <header className="panel-title">INVESTIGATION PROGRESS</header>
          <div className="data-list">
            {view.investigation.map((route) => (
              <p key={route.id}>{route.name} <b>{route.status}</b></p>
            ))}
            {!view.investigation.length && <p>No attack routes modeled for this operation.</p>}
          </div>
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Alert Queue
export function AlertQueue({ view, active, respond, onSelect, reviewed, dismissed, onPinEvidence, markReviewed }: ModuleProps) {
  const [severity, setSeverity] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [dismissing, setDismissing] = useState<string>("");
  const [reason, setReason] = useState(DISMISS_REASONS()[0]);

  const alerts = view.alerts.filter((alert) => {
    if (severity && alert.severity !== severity) return false;
    const state = dismissed.has(alert.id) ? "DISMISSED" : reviewed.has(alert.id) ? "REVIEWED" : "NEW";
    if (statusFilter && state !== statusFilter) return false;
    if (query && !`${alert.title} ${alert.summary}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <section className="panel soc-events min-h-60" style={{ gridColumn: "1 / -1" }}>
      <header className="panel-title">ALERT QUEUE</header>
      <div className="campaign-filters">
        <label>Severity
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All</option>
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {["NEW", "REVIEWED", "DISMISSED"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Search
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="hostname, identity, title" />
        </label>
      </div>
      <div className="campaign-table">
        <table>
          <thead><tr><th>Time</th><th>Sev</th><th>Alert</th><th>Source → Target</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {alerts.map((alert) => {
              const state = dismissed.has(alert.id) ? "DISMISSED" : reviewed.has(alert.id) ? "REVIEWED" : "NEW";
              return (
                <tr key={alert.id} onClick={() => onSelect({ kind: "alert", id: alert.id })}>
                  <td>{alert.timestamp.slice(11, 19)}</td>
                  <td><span className={`sev-pill sev-${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                  <td>{alert.title}</td>
                  <td>{alert.summary}</td>
                  <td>{state}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button type="button" disabled={!active || state !== "NEW"} onClick={() => { onPinEvidence(alert.evidenceEventId ?? alert.id); void respond("ALERT_REVIEWED", { evidenceIds: [alert.id] }); markReviewed(`alert:${alert.id}`); }}>Review</button>
                    <button type="button" disabled={!active} onClick={() => onPinEvidence(alert.evidenceEventId ?? alert.id)}>Pin</button>
                    {dismissing === alert.id ? (
                      <>
                        <select value={reason} onChange={(e) => setReason(e.target.value)}>
                          {DISMISS_REASONS().map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button type="button" disabled={!active} onClick={() => { void respond("DISMISS_ALERT", { evidenceIds: [alert.id], reason }); setDismissing(""); }}>Confirm</button>
                      </>
                    ) : (
                      <button type="button" disabled={!active || state === "DISMISSED"} onClick={() => setDismissing(alert.id)}>Dismiss</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!alerts.length && <tr><td colSpan={6}>No alerts match the current filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Incidents
export function Incidents({ view, active, respond, onSelect }: ModuleProps) {
  const [routeId, setRouteId] = useState("");
  const route = view.investigation.find((r) => r.id === routeId) ?? view.investigation[0];
  const alternates = view.investigation.filter((r) => r.id !== route?.id && r.status !== "CONTAINED");

  return (
    <section className="panel min-h-60" style={{ gridColumn: "1 / -1" }}>
      <header className="panel-title">INCIDENTS // ATTACK ROUTE HYPOTHESES</header>
      <div className="data-list">
        <div className="incident-route-tabs" role="tablist">
          {view.investigation.map((r) => (
            <button key={r.id} type="button" role="tab" className={route?.id === r.id ? "active" : ""} onClick={() => setRouteId(r.id)}>{r.name} {"// "}{r.status}</button>
          ))}
        </div>

        {route && (
          <article className={`evidence-chain ${route.status.toLowerCase()}`}>
            <header><b>{route.name}</b><span>{route.status}</span></header>
            <p>{route.hypothesis}</p>
            <dl>
              <div><dt>HOSTS</dt><dd>{route.evidence.hosts.map((host) => (
                <button key={host} type="button" className="link-button" onClick={() => onSelect({ kind: "host", id: view.machines.find((m) => m.hostname === host)?.id ?? "" })}>{host}</button>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, " → ", el], [] as React.ReactNode[])}</dd></div>
              <div><dt>IDENTITY</dt><dd>{route.evidence.identities.map((id) => (
                <button key={id} type="button" className="link-button" onClick={() => onSelect({ kind: "identity", id })}>{id}</button>
              )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ", ", el], [] as React.ReactNode[])}</dd></div>
              <div><dt>PROCESS</dt><dd>{route.evidence.processes.join(", ") || "No process evidence"}</dd></div>
              <div><dt>TIMELINE</dt><dd>{route.evidence.timeline.slice(-3).map((e) => `${e.timestamp.slice(11, 19)} ${e.action}`).join(" · ") || "Awaiting telemetry"}</dd></div>
            </dl>
            <p className="uncertainty"><b>UNCERTAINTY //</b> {route.uncertainty}</p>
          </article>
        )}

        {route && (
          <div className="containment-plan">
            <b>CONTAINMENT PLAN</b>
            <p>Choose a link that interrupts this route. Blocking a link can degrade the named business service; isolating a host is broader.</p>
            {route.evidence.connections.map((connection) => (
              <article key={connection.id}>
                <b>{connection.source} → {connection.target}:{connection.port}</b>
                <p>{connection.allowed
                  ? `Blocks ${route.name}. ${alternates.length ? `${alternates.map((r) => r.name).join(" and ")} remain viable.` : "No known alternate route remains viable."}`
                  : `${route.name} is interrupted at this link.`}</p>
                <p className="impact-preview">Business impact: {route.businessImpact.map((s) => `${s.name} — ${s.impact}`).join(" ") || "No mapped business service."}</p>
                <button type="button" disabled={!active || !connection.allowed} onClick={() => void respond("BLOCK_CONNECTION", { connectionId: connection.id })}>
                  {connection.allowed ? `Block link — contain ${route.name}` : "Link blocked"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Hosts
export function Hosts({ view, onSelect }: ModuleProps) {
  return (
    <section className="panel min-h-60" style={{ gridColumn: "1 / -1" }}>
      <header className="panel-title">HOSTS</header>
      <div className="campaign-table">
        <table>
          <thead><tr><th>Host</th><th>Zone</th><th>State</th><th>Risk</th><th>Last Seen</th></tr></thead>
          <tbody>
            {view.machines.filter((m) => m.zone !== "EXTERNAL").map((machine) => {
              const topRisk = machine.processes.reduce<"LOW" | "MEDIUM" | "HIGH">((acc, process) => {
                const risk = processRisk(process);
                return risk === "HIGH" || acc === "HIGH" ? "HIGH" : risk === "MEDIUM" || acc === "MEDIUM" ? "MEDIUM" : "LOW";
              }, "LOW");
              const lastEvent = view.events.filter((e) => e.source === machine.hostname || e.target === machine.hostname).at(-1);
              return (
                <tr key={machine.id} onClick={() => onSelect({ kind: "host", id: machine.id })}>
                  <td>{machine.hostname}</td>
                  <td>{machine.zone}</td>
                  <td><span className={`state-pill state-${machine.state.toLowerCase()}`}>{machine.state}</span></td>
                  <td><span className={`risk-pill risk-${(hostNeedsAttention(machine) ? "high" : topRisk.toLowerCase())}`}>{hostNeedsAttention(machine) ? "HIGH" : topRisk}</span></td>
                  <td>{lastEvent ? lastEvent.timestamp.slice(11, 19) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Network
export function Network({ view, onSelect }: ModuleProps) {
  const zones = ["EXTERNAL", "DMZ", "INTERNAL", "FINANCE"];
  return (
    <>
      <section className="panel min-h-30" style={{ gridColumn: "1 / -1" }}>
        <header className="panel-title">NETWORK TOPOLOGY</header>
        <div className="data-list network-topology">
          {zones.map((zone) => {
            const hosts = view.machines.filter((m) => m.zone === zone);
            if (!hosts.length) return null;
            return (
              <div key={zone} className="topology-zone">
                <b>{zone}</b>
                <div className="topology-hosts">
                  {hosts.map((host) => (
                    <button key={host.id} type="button" className={`topology-node state-${host.state.toLowerCase()}`} onClick={() => onSelect({ kind: "host", id: host.id })}>{host.hostname}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="panel min-h-40" style={{ gridColumn: "1 / -1" }}>
        <header className="panel-title">CONNECTIONS</header>
        <div className="campaign-table">
          <table>
            <thead><tr><th>Source</th><th>Target</th><th>Port</th><th>State</th></tr></thead>
            <tbody>
              {view.connections.map((connection) => (
                <tr key={connection.id} onClick={() => onSelect({ kind: "connection", id: connection.id })}>
                  <td>{connection.source}</td>
                  <td>{connection.target}</td>
                  <td>{connection.port}</td>
                  <td>{connection.allowed ? "ALLOWED" : "BLOCKED"}</td>
                </tr>
              ))}
              {!view.connections.length && <tr><td colSpan={4}>No observed connections.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Authentication
export function Authentication({ view, onSelect }: ModuleProps) {
  const authEvents = view.events.filter((e) => e.category === "AUTH").slice().reverse();
  return (
    <section className="panel min-h-60" style={{ gridColumn: "1 / -1" }}>
      <header className="panel-title">AUTHENTICATION / SESSIONS</header>
      <div className="campaign-table">
        <table>
          <thead><tr><th>Time</th><th>Identity</th><th>Source → Target</th><th>Action</th><th>Result</th></tr></thead>
          <tbody>
            {authEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.timestamp.slice(11, 19)}</td>
                <td>{event.userId ? <button type="button" className="link-button" onClick={() => onSelect({ kind: "identity", id: event.userId! })}>{event.userId}</button> : "—"}</td>
                <td>{event.source ?? "—"} → {event.target ?? "—"}</td>
                <td>{event.action}</td>
                <td>{event.action.includes("FAILED") ? "FAILED" : "SUCCESS"}</td>
              </tr>
            ))}
            {!authEvents.length && <tr><td colSpan={5}>No authentication telemetry yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Services
export function Services({ view, onSelect }: ModuleProps) {
  return (
    <section className="panel min-h-40" style={{ gridColumn: "1 / -1" }}>
      <header className="panel-title">BUSINESS SERVICES</header>
      <div className="campaign-table">
        <table>
          <thead><tr><th>Service</th><th>State</th><th>Dependencies</th></tr></thead>
          <tbody>
            {view.availability.services.map((service) => (
              <tr key={service.name} onClick={() => onSelect({ kind: "service", id: service.name })}>
                <td>{service.name}</td>
                <td><span className={`state-pill state-${service.state.toLowerCase()}`}>{service.state}</span></td>
                <td>{service.hosts.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Evidence
export function Evidence({ view, active, respond, pinnedEvidence, onSelect }: ModuleProps) {
  const [finding, setFinding] = useState("");
  const [findingStatus, setFindingStatus] = useState("HYPOTHESIS");
  const eventEvidence = pinnedEvidence.map((id) => view.events.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => Boolean(e));
  const findings = view.events.filter((e) => e.action === "INCIDENT_FINDING");

  return (
    <>
      <section className="panel min-h-40" style={{ gridColumn: "1 / -1" }}>
        <header className="panel-title">EVIDENCE ({eventEvidence.length} pinned)</header>
        <div className="data-list">
          {eventEvidence.map((event, index) => (
            <article key={event.id}>
              <b>[{String(index + 1).padStart(2, "0")}] {event.action}</b>
              <p>{event.source ?? "—"} → {event.target ?? "—"}</p>
              <p>{event.timestamp.slice(11, 19)}</p>
              <button type="button" className="link-button" onClick={() => onSelect({ kind: "evidence", id: event.id })}>View snapshot →</button>
            </article>
          ))}
          {!eventEvidence.length && <p>No evidence pinned yet. Pin telemetry from Alerts, Hosts, Network, or Authentication.</p>}
        </div>
      </section>

      <section className="panel min-h-30" style={{ gridColumn: "1 / -1" }}>
        <header className="panel-title">FINDINGS</header>
        <div className="data-list">
          <label>Finding
            <textarea value={finding} onChange={(e) => setFinding(e.target.value)} maxLength={2000} />
          </label>
          <label>Status
            <select value={findingStatus} onChange={(e) => setFindingStatus(e.target.value)}>
              {["HYPOTHESIS", "SUPPORTED", "CONFIRMED", "REJECTED"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button type="button" disabled={!active || !pinnedEvidence.length || !finding.trim()} onClick={() => void respond("INCIDENT_FINDING", { evidenceIds: pinnedEvidence, finding, status: findingStatus })}>Record finding</button>

          {findings.slice().reverse().map((event) => (
            <article key={event.id}>
              <b>{String(event.metadata.status)}</b>
              <p>{String(event.metadata.finding)}</p>
              <small>{Array.isArray(event.metadata.evidenceIds) ? event.metadata.evidenceIds.length : 0} linked observations</small>
            </article>
          ))}
          {!findings.length && <p>No findings recorded yet.</p>}
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- Playbooks
const PLAYBOOKS = [
  { id: "web", title: "Suspicious Web Activity", checks: ["Review the originating web request", "Inspect any spawned process on the target host", "Review identity activity on the host", "Check outbound connections from the host"] },
  { id: "lateral", title: "Lateral Movement", checks: ["Identify the source and destination hosts", "Review authentication events for the identity used", "Check for new sessions or persistence on the destination", "Consider blocking the connecting link"] },
  { id: "credential", title: "Credential Compromise", checks: ["Review recent authentication failures for the identity", "Check where the identity has active sessions", "Reset the credential or disable the account", "Terminate any active sessions"] },
];

export function Playbooks({ view, active, respond }: ModuleProps) {
  return (
    <section className="panel min-h-60" style={{ gridColumn: "1 / -1" }}>
      <header className="panel-title">PLAYBOOKS</header>
      <div className="data-list">
        {PLAYBOOKS.map((playbook) => (
          <article key={playbook.id}>
            <b>{playbook.title}</b>
            <ul>
              {playbook.checks.map((check) => <li key={check}>{check}</li>)}
            </ul>
            <div className="response-grid">
              <button type="button" disabled={!active} onClick={() => {
                const hosts = view.machines.filter((m) => m.zone !== "EXTERNAL");
                hosts.forEach((host) => void respond("INSPECT_PROCESS", { targetId: host.id }));
              }}>Collect process lists</button>
              <button type="button" disabled={!active} onClick={() => {
                const hosts = view.machines.filter((m) => m.zone !== "EXTERNAL");
                hosts.forEach((host) => void respond("INSPECT_HOST", { targetId: host.id }));
              }}>Collect host telemetry</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Reports
export function Reports({ view, pinnedEvidence }: ModuleProps) {
  const findings = view.events.filter((e) => e.action === "INCIDENT_FINDING");
  const analystActions = view.events.filter((e) => e.category === "SYSTEM" && e.action !== "ALERT_REVIEWED");
  return (
    <section className="panel min-h-60" style={{ gridColumn: "1 / -1" }}>
      <header className="panel-title">INCIDENT REPORT</header>
      <div className="data-list">
        <dl className="inspector-fields">
          <div><dt>Operation</dt><dd>{view.operation.name}</dd></div>
          <div><dt>Status</dt><dd>{view.scenario.state}</dd></div>
          <div><dt>Availability</dt><dd>{view.availability.percent}%</dd></div>
          <div><dt>Evidence pinned</dt><dd>{pinnedEvidence.length}</dd></div>
          <div><dt>Findings recorded</dt><dd>{findings.length}</dd></div>
          <div><dt>Analyst actions</dt><dd>{analystActions.length}</dd></div>
        </dl>
        <p><b>TIMELINE</b></p>
        {view.events.slice().reverse().map((event) => (
          <p key={event.id}>{event.timestamp.slice(11, 19)} {event.action} {event.source ?? "—"} → {event.target ?? "—"}</p>
        ))}
      </div>
    </section>
  );
}
