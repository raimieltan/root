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
  selection: Selection;
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

type FindingState = "UNKNOWN" | "SUSPECTED" | "SUPPORTED" | "CONFIRMED" | "REFUTED";

function eventAuthMethod(event: ScenarioView["events"][number]) {
  const method = event.metadata.authMethod ?? event.metadata.method ?? event.metadata.protocol;
  if (typeof method === "string") return method.toUpperCase();
  if (event.action.includes("TOKEN")) return "TOKEN";
  if (event.action.includes("SESSION")) return "SESSION";
  return "PASSWORD";
}

function eventSucceeded(event: ScenarioView["events"][number]) {
  return !event.action.includes("FAIL") && !event.action.includes("DENIED");
}

function alertEndpoints(summary: string) {
  const [source = "—", targetWithIdentity = "—"] = summary.split(" → ");
  return { source, target: targetWithIdentity.split(" as ")[0] ?? targetWithIdentity };
}

function hostRole(machine: ScenarioView["machines"][number]) {
  const services = machine.services.map((service) => service.name);
  return services.length ? services.slice(0, 2).join(", ") : machine.zone;
}

function findingState(hasEvidence: boolean, confirmed: boolean, suspected = false): FindingState {
  if (confirmed) return "CONFIRMED";
  if (hasEvidence) return "SUPPORTED";
  if (suspected) return "SUSPECTED";
  return "UNKNOWN";
}

// ---------------------------------------------------------------- Dashboard
export function Dashboard({ view, onSelect, onNavigate, selection, reviewed, dismissed, now }: ModuleProps) {
  const [expandedEventId, setExpandedEventId] = useState<string>();
  const blueStatus = view.blueStatus;
  const elapsedSeconds = view.scenario.startedAt ? Math.max(0, Math.floor((now - new Date(view.scenario.startedAt).getTime()) / 1000)) : blueStatus?.responseWindow.elapsedSeconds ?? 0;
  const priorityAlerts = view.alerts.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);
  const timeline = view.events.slice(-60).reverse();
  const hosts = view.machines.filter((m) => m.zone !== "EXTERNAL");
  const authEvents = view.events.filter((e) => e.category === "AUTH").slice(-25).reverse();
  const suspiciousConnectionIds = new Set(
    view.investigation.filter((route) => route.status !== "CONTAINED").flatMap((route) => route.evidence.connections.map((c) => c.id)),
  );
  const investigationEvents = view.events.filter((event) => !["SYSTEM", "SIMULATION"].includes(event.category));
  const routeEvidence = view.investigation.flatMap((route) => [
    ...route.evidence.hosts,
    ...route.evidence.identities,
    ...route.evidence.processes,
    ...route.evidence.connections.map((connection) => connection.id),
  ]);
  const activePersistence = hosts.flatMap((host) => host.persistence.filter((artifact) => artifact.active));
  const databaseEvents = investigationEvents.filter((event) => event.category === "DATABASE" || event.action.includes("DATABASE") || event.target?.includes("DB"));
  const exfiltrationEvents = investigationEvents.filter((event) => event.action.includes("OBJECTIVE") || event.action.includes("EXFIL") || event.action.includes("SENSITIVE_DATA"));
  const backupHosts = hosts.filter((host) => host.hostname.includes("BACKUP") || host.services.some((service) => service.name.toLowerCase().includes("backup")));
  const findings: Array<{ id: string; label: string; state: FindingState; detail: string }> = [
    { id: "application-chain", label: "Suspicious application chain", state: findingState(view.investigation.some((route) => route.evidence.processes.length > 0), view.investigation.some((route) => route.status === "SUPPORTED" && route.evidence.processes.length > 0), view.alerts.length > 0), detail: `${view.investigation.reduce((count, route) => count + route.evidence.processes.length, 0)} processes linked` },
    { id: "compromised-identity", label: "Compromised identity", state: findingState(view.investigation.some((route) => route.evidence.identities.length > 0), view.investigation.some((route) => route.status === "SUPPORTED" && route.evidence.identities.length > 0)), detail: `${new Set(view.investigation.flatMap((route) => route.evidence.identities)).size} identities implicated` },
    { id: "persistence", label: "Persistence mechanism", state: findingState(activePersistence.length > 0, activePersistence.length > 0), detail: `${activePersistence.length} active artifacts` },
    { id: "lateral-movement", label: "Lateral movement", state: findingState(suspiciousConnectionIds.size > 0, view.events.some((event) => event.action === "LATERAL_MOVEMENT"), view.connections.length > 0), detail: `${suspiciousConnectionIds.size} relevant connections` },
    { id: "database-access", label: "Database access", state: findingState(databaseEvents.length > 0, databaseEvents.some((event) => ["HIGH", "CRITICAL"].includes(event.severity))), detail: `${databaseEvents.length} database events` },
    { id: "exfiltration", label: "Exfiltration evidence", state: findingState(exfiltrationEvents.length > 0, view.objectiveRetrieved), detail: view.objectiveRetrieved ? "Protected objective accessed" : `${exfiltrationEvents.length} transfer indicators` },
    { id: "backup-trust", label: "Backup trust", state: backupHosts.length === 0 ? "REFUTED" : findingState(backupHosts.some(hostNeedsAttention), backupHosts.some((host) => host.state === "COMPROMISED"), backupHosts.length > 0), detail: backupHosts.length ? `${backupHosts.length} backup assets mapped` : "No backup dependency mapped" },
  ];

  return (
    <div className="soc-dashboard" style={{ gridColumn: "1 / -1" }}>
      <div className="soc-dash-col soc-dash-left">
        <section className="panel soc-mission">
          <header className="panel-title">INCIDENT SUMMARY</header>
          <div className="data-list">
            <dl className="inspector-fields">
              <div><dt>Operation</dt><dd>{view.operation.name}</dd></div>
              <div><dt>Status</dt><dd>{view.scenario.state}</dd></div>
              <div><dt>Elapsed</dt><dd>{formatWindow(elapsedSeconds)}</dd></div>
              <div><dt>Objective</dt><dd>{view.operation.briefing.blue}</dd></div>
            </dl>
          </div>
        </section>

        <section className="panel soc-alerts">
          <header className="panel-title">PRIORITY ALERTS <button type="button" className="link-button" onClick={() => onNavigate("alerts")}>View all alerts →</button></header>
          <div className="campaign-table">
            <table>
              <thead><tr><th>Time</th><th>Sev</th><th>Detection</th><th>Source</th><th>Target</th><th>Status</th></tr></thead>
              <tbody>
                {priorityAlerts.map((alert) => {
                  const state = dismissed.has(alert.id) ? "DISMISSED" : reviewed.has(alert.id) ? "REVIEWED" : "NEW";
                  const endpoints = alertEndpoints(alert.summary);
                  return (
                    <tr key={alert.id} aria-selected={selection?.kind === "alert" && selection.id === alert.id} className={`${state === "NEW" ? "row-suspicious " : ""}${selection?.kind === "alert" && selection.id === alert.id ? "selected" : ""}`} onClick={() => onSelect({ kind: "alert", id: alert.id })} onDoubleClick={() => onNavigate("alerts", { kind: "alert", id: alert.id })}>
                      <td>{alert.timestamp.slice(11, 19)}</td>
                      <td><span className={`sev-pill sev-${alert.severity.toLowerCase()}`}>{alert.severity}</span></td>
                      <td>{alert.title}<small className="table-subline">{alert.ruleId}</small></td>
                      <td>{endpoints.source}</td>
                      <td>{endpoints.target}</td>
                      <td>{state}</td>
                    </tr>
                  );
                })}
                {!priorityAlerts.length && <tr><td colSpan={6}>No detection rules have fired.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel soc-dash-fill">
          <header className="panel-title">INCIDENT TIMELINE <button type="button" className="link-button" onClick={() => onNavigate("reports")}>View full timeline →</button></header>
          <div className="campaign-table">
            <table>
              <thead><tr><th>Time</th><th>Type / Event</th><th>Source</th><th>Target</th><th>Severity</th></tr></thead>
              <tbody>
                {timeline.map((event) => {
                  const expanded = expandedEventId === event.id;
                  const selected = selection?.kind === "evidence" && selection.id === event.id;
                  return [
                    <tr key={event.id} aria-selected={selected} aria-expanded={expanded} className={selected ? "selected" : undefined} onClick={() => { onSelect({ kind: "evidence", id: event.id }); setExpandedEventId(expanded ? undefined : event.id); }}>
                      <td>{event.timestamp.slice(11, 19)}</td>
                      <td><span className="row-expander">{expanded ? "−" : "+"}</span> {event.category} / {event.action.replaceAll("_", " ")}</td>
                      <td>{event.source ?? "—"}</td>
                      <td>{event.target ?? "—"}</td>
                      <td><span className={`sev-pill sev-${event.severity.toLowerCase()}`}>{event.severity}</span></td>
                    </tr>,
                    expanded && (
                      <tr key={`${event.id}-detail`} className="timeline-detail">
                        <td colSpan={5}>Identity: {event.userId ?? "—"} · Event ID: {event.id} · {Object.keys(event.metadata).length ? Object.entries(event.metadata).slice(0, 4).map(([key, value]) => `${key}=${String(value)}`).join(" · ") : "No additional metadata"}</td>
                      </tr>
                    ),
                  ];
                })}
                {!timeline.length && <tr><td colSpan={5}>No telemetry recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="soc-dash-col soc-dash-center">
        <section className="panel">
          <header className="panel-title">BUSINESS IMPACT <button type="button" className="link-button" onClick={() => onNavigate("services")}>Open Services →</button></header>
          <div className="data-list">
            {view.availability.services.map((service) => {
              const sessions = view.sessions.filter((s) => service.hosts.includes(s.machine)).length;
              const connections = view.connections.filter((connection) => service.hosts.includes(connection.source) || service.hosts.includes(connection.target)).length;
              const containmentImpact = view.investigation.flatMap((route) => route.businessImpact).find((impact) => impact.name === service.name)?.impact;
              return (
                <div key={service.name} className="soc-impact-row">
                  <div>
                    <button type="button" className="link-button" onClick={() => onNavigate("services", { kind: "service", id: service.name })}>{service.name}</button>
                    <small>DEP: {service.hosts.join(", ") || "No mapped hosts"}</small>
                    <small title={containmentImpact}>{containmentImpact ? "CONTAINMENT AFFECTS SERVICE" : "NO MODELED CONTAINMENT IMPACT"}</small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`state-pill state-${service.state.toLowerCase()}`}>{service.state}</span>
                    <small>{sessions} sess · {connections} conn</small>
                  </div>
                </div>
              );
            })}
            {!view.availability.services.length && <p>No business services mapped for this operation.</p>}
          </div>
        </section>

        <section className="panel">
          <header className="panel-title">INVESTIGATION PROGRESS</header>
          <div className="data-list soc-checklist">
            {findings.map((finding) => (
              <div key={finding.id} className="soc-checklist-row" title={finding.detail} onClick={() => onNavigate("incidents")}>
                <span><b>{finding.label}</b><small>{finding.detail}</small></span>
                <span className={`soc-checklist-status ${finding.state.toLowerCase()}`}>{finding.state}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <header className="panel-title">ACTIVE HOSTS <button type="button" className="link-button" onClick={() => onNavigate("hosts")}>Open Hosts →</button></header>
          <div className="campaign-table">
            <table>
              <thead><tr><th>Host</th><th>Role</th><th>IP</th><th>Status</th><th>Alerts</th><th>Contain</th></tr></thead>
              <tbody>
                {hosts.map((machine) => {
                  const alertCount = view.alerts.filter((alert) => alert.summary.includes(machine.hostname)).length;
                  return (
                    <tr key={machine.id} aria-selected={selection?.kind === "host" && selection.id === machine.id} className={`${hostNeedsAttention(machine) ? "row-suspicious " : ""}${selection?.kind === "host" && selection.id === machine.id ? "selected" : ""}`} onClick={() => onSelect({ kind: "host", id: machine.id })}>
                      <td>{machine.hostname}</td>
                      <td title={machine.services.map((service) => service.name).join(", ")}>{hostRole(machine)}</td>
                      <td>{machine.ip}</td>
                      <td><span className={`state-pill state-${machine.state.toLowerCase()}`}>{machine.state}</span></td>
                      <td>{alertCount || "—"}</td>
                      <td>{machine.state === "ISOLATED" ? "ISOLATED" : "OPEN"}</td>
                    </tr>
                  );
                })}
                {!hosts.length && <tr><td colSpan={6}>No internal hosts discovered.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel soc-dash-fill">
          <header className="panel-title">AUTHENTICATION ACTIVITY <button type="button" className="link-button" onClick={() => onNavigate("auth")}>Open Authentication →</button></header>
          <div className="campaign-table">
            <table>
              <thead><tr><th>Time</th><th>Identity</th><th>Source</th><th>Destination</th><th>Method</th><th>Result</th><th>Flag</th></tr></thead>
              <tbody>
                {authEvents.map((event) => {
                  const success = eventSucceeded(event);
                  const suspicious = !success || ["HIGH", "CRITICAL"].includes(event.severity) || routeEvidence.includes(event.userId ?? "");
                  return (
                    <tr
                      key={event.id}
                      aria-selected={selection?.kind === "identity" && selection.id === event.userId}
                      className={`${suspicious ? "row-suspicious " : ""}${selection?.kind === "identity" && selection.id === event.userId ? "selected" : ""}`}
                      onClick={() => { if (event.userId) onSelect({ kind: "identity", id: event.userId }); }}
                    >
                      <td>{event.timestamp.slice(11, 19)}</td>
                      <td>{event.userId ?? "—"}</td>
                      <td>{event.source ?? "—"}</td>
                      <td>{event.target ?? "—"}</td>
                      <td>{eventAuthMethod(event)}</td>
                      <td className={!success ? "red-text" : undefined}>{success ? "SUCCESS" : "FAILURE"}</td>
                      <td>{suspicious ? "SUSP" : "—"}</td>
                    </tr>
                  );
                })}
                {!authEvents.length && <tr><td colSpan={7}>No authentication telemetry yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel soc-dash-fill">
          <header className="panel-title">NETWORK ACTIVITY <button type="button" className="link-button" onClick={() => onNavigate("network")}>Open Network →</button></header>
          <div className="campaign-table">
            <table>
              <thead><tr><th>Source</th><th>Destination</th><th>Protocol</th><th>Port</th><th>State</th><th>Flag</th></tr></thead>
              <tbody>
                {view.connections.map((connection) => (
                  <tr key={connection.id} aria-selected={selection?.kind === "connection" && selection.id === connection.id} className={`${suspiciousConnectionIds.has(connection.id) ? "row-suspicious " : ""}${selection?.kind === "connection" && selection.id === connection.id ? "selected" : ""}`} onClick={() => onSelect({ kind: "connection", id: connection.id })}>
                    <td>{connection.source}</td>
                    <td>{connection.target}</td>
                    <td>{connection.protocol.toUpperCase()}</td>
                    <td>{connection.port}</td>
                    <td className={connection.allowed ? undefined : "red-text"}>{connection.allowed ? "ALLOWED" : "BLOCKED"}</td>
                    <td>{suspiciousConnectionIds.has(connection.id) ? "SUSP" : "—"}</td>
                  </tr>
                ))}
                {!view.connections.length && <tr><td colSpan={6}>No observed connections.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
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
