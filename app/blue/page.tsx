"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import RootChrome from "@/app/ui/root-chrome";
import { useOperation } from "@/app/use-operation";
import { alertEventForSeverity } from "@/lib/audio/catalog";
import { playAudio } from "@/lib/audio/audio-system";
import Inspector from "./inspector";
import {
  AlertQueue,
  Authentication,
  Dashboard,
  Evidence,
  Hosts,
  Incidents,
  Network,
  Playbooks,
  Reports,
  Services,
} from "./modules";
import {
  formatWindow,
  highestSeverityColor,
  hostNeedsAttention,
  selectionToken,
  useReadState,
  type ModuleId,
  type Selection,
} from "./soc-state";

const NAV: Array<{ id: ModuleId; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "alerts", label: "Alert Queue" },
  { id: "incidents", label: "Incidents" },
  { id: "hosts", label: "Hosts" },
  { id: "network", label: "Network" },
  { id: "auth", label: "Authentication" },
  { id: "services", label: "Services" },
  { id: "evidence", label: "Evidence" },
  { id: "playbooks", label: "Playbooks" },
  { id: "reports", label: "Reports" },
];

export default function BlueTeamPage() {
  const { ids, view, refresh, error, setError, retry } = useOperation("BLUE");

  const [running, setRunning] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  const [module, setModule] = useState<ModuleId>("dashboard");
  const [selection, setSelection] = useState<Selection>(undefined);
  const [pinnedEvidence, setPinnedEvidence] = useState<string[]>([]);
  const [now, setNow] = useState(0);
  const knownAlerts = useRef<Set<string> | undefined>(undefined);
  const priorScenarioState = useRef<string | undefined>(undefined);

  const { status, markSeen, markReviewed } = useReadState(ids?.scenarioId);

  function onSelect(next: Selection) {
    setSelection(next);
    const token = selectionToken(next);
    if (token) markSeen(token);
  }

  function onNavigate(nextModule: ModuleId, nextSelection?: Selection) {
    setModule(nextModule);
    if (nextSelection) onSelect(nextSelection);
  }

  function onPinEvidence(id: string) {
    setPinnedEvidence((items) => (items.includes(id) ? items : [...items, id]));
    markSeen(`evidence:${id}`);
  }

  async function advance() {
    if (!ids || busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const response = await fetch("/api/sim/blue/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids),
      });
      if (!response.ok) throw new Error("Unable to advance simulation");
      await refresh();
    } catch (reason) {
      setError(String(reason));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  useEffect(() => {
    if (!running || view?.scenario.state !== "ACTIVE") return;
    const timer = window.setInterval(() => void advance(), 12000);
    return () => window.clearInterval(timer);
  }, [running, view?.scenario.state, ids]);

  useEffect(() => {
    if (view?.scenario.state !== "ACTIVE") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs the wall clock, an external system, on entering ACTIVE
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [view?.scenario.state]);

  useEffect(() => {
    if (!view) return;
    const nextIds = new Set(view.alerts.map((alert) => alert.id));
    if (knownAlerts.current) {
      const newest = [...view.alerts].reverse().find((alert) => !knownAlerts.current?.has(alert.id));
      if (newest) void playAudio(alertEventForSeverity(newest.severity));
    }
    knownAlerts.current = nextIds;
  }, [view]);

  useEffect(() => {
    const nextState = view?.scenario.state;
    if (priorScenarioState.current === "ACTIVE" && nextState && nextState !== "ACTIVE") void playAudio(nextState === "COMPLETED" ? "mission.completed" : "mission.failed");
    priorScenarioState.current = nextState;
  }, [view?.scenario.state]);

  async function respond(action: string, extras: Record<string, unknown> = {}) {
    if (!ids || busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const response = await fetch("/api/sim/blue/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ids, action, ...extras }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Response failed");
      setError("");
      await refresh();
    } catch (reason) {
      setError(String(reason));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const reviewed = useMemo(() => new Set(
    (view?.events ?? [])
      .filter((event) => event.action === "ALERT_REVIEWED")
      .flatMap((event) => (event.metadata.evidenceIds as string[] | undefined) ?? []),
  ), [view?.events]);

  const dismissed = useMemo(() => new Set(
    (view?.events ?? [])
      .filter((event) => event.action === "ALERT_DISMISSED")
      .flatMap((event) => (event.metadata.evidenceIds as string[] | undefined) ?? []),
  ), [view?.events]);

  const badges = useMemo(() => {
    if (!view) return {} as Record<ModuleId, { count?: number; color?: "gray" | "amber" | "red"; text?: string }>;
    const openAlerts = view.alerts.filter((alert) => !reviewed.has(alert.id) && !dismissed.has(alert.id));
    const activeRoutes = view.investigation.filter((route) => route.status !== "CONTAINED");
    const hostsNeeding = view.machines.filter((machine) => machine.zone !== "EXTERNAL" && hostNeedsAttention(machine));
    const suspiciousConnections = new Set(activeRoutes.flatMap((route) => route.evidence.connections.map((c) => c.id)));
    const identitiesNeeding = new Set(activeRoutes.flatMap((route) => route.evidence.identities));
    const degradedServices = view.availability.services.filter((service) => service.state !== "HEALTHY");
    const unseenEvidence = pinnedEvidence.filter((id) => status(`evidence:${id}`) === "NEW");
    return {
      dashboard: {},
      alerts: { count: openAlerts.length, color: highestSeverityColor(openAlerts.map((a) => a.severity)) },
      incidents: { count: activeRoutes.length },
      hosts: { count: hostsNeeding.length },
      network: { count: suspiciousConnections.size },
      auth: { count: identitiesNeeding.size },
      services: degradedServices.length ? { text: "!", color: degradedServices.some((s) => s.state === "OFFLINE") ? "red" : "amber" } : {},
      evidence: { count: unseenEvidence.length },
      playbooks: {},
      reports: {},
    } as Record<ModuleId, { count?: number; color?: "gray" | "amber" | "red"; text?: string }>;
  }, [view, reviewed, dismissed, pinnedEvidence, status]);

  if (!ids || !view) {
    return (
      <main className="loading-screen">
        <p role={error ? "alert" : undefined}>{error || "Connecting defensive telemetry…"}</p>
        {error && <button type="button" onClick={retry}>Retry connection</button>}
        <Link href="/">Return to operations</Link>
      </main>
    );
  }

  const active = view.scenario.state === "ACTIVE";
  const blueStatus = view.blueStatus;
  const elapsedSeconds = view.scenario.startedAt ? Math.max(0, Math.floor((now - new Date(view.scenario.startedAt).getTime()) / 1000)) : blueStatus?.responseWindow.elapsedSeconds ?? 0;
  const responseRemaining = blueStatus ? Math.max(0, blueStatus.responseWindow.limitSeconds - elapsedSeconds) : 0;

  const moduleProps = {
    view, active, respond, onSelect, onNavigate, selection, reviewed, dismissed,
    pinnedEvidence, onPinEvidence, status, markSeen, markReviewed, now,
  };

  return (
    <RootChrome context="blue" active="soc" tone="blue" title={`${view.operation.organization} · ${view.operation.presentation.caseId}`} operator="stan.tan" privilege="SOC ANALYST">
      <div className="soc-application">
        <nav className="soc-nav" aria-label="Security Operations Center sections">
          {NAV.map((item) => {
            const badge = badges[item.id];
            return (
              <button key={item.id} type="button" className={module === item.id ? "active" : ""} onClick={() => setModule(item.id)}>
                {item.label}
                {(badge?.count ? badge.count > 0 : Boolean(badge?.text)) && (
                  <span className={`nav-badge nav-badge-${badge?.color ?? "gray"}`}>{badge?.text ?? badge?.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="soc-main">
          <div className="incident-header">
            <button type="button" className="link-button incident-name" onClick={() => setModule("dashboard")}>
              {view.operation.name} <span className="incident-badge">{view.scenario.state}</span>
            </button>

            {blueStatus && (
              <span className="response-window" title="Time remaining before the response window closes">
                TIME REMAINING {formatWindow(responseRemaining)}
              </span>
            )}

            <button type="button" className="link-button" onClick={() => setModule("alerts")}>
              ALERTS <b>{view.alerts.length}</b>
            </button>
            <button type="button" className="link-button" onClick={() => setModule("alerts")}>
              REVIEWED <b>{blueStatus?.alertsReviewed ?? 0}/{view.alerts.length}</b>
            </button>
            <button type="button" className="link-button" onClick={() => setModule("incidents")}>
              CONTAINED <b>{blueStatus?.containedHypotheses ?? 0}/{view.investigation.length}</b>
            </button>
            <button type="button" className="link-button" onClick={() => setModule("services")}>
              AVAILABILITY <b className={view.availability.percent >= 80 ? "avail-good" : view.availability.percent >= 40 ? "avail-degraded" : "avail-bad"}>{view.availability.percent}%</b>
            </button>

            <button type="button" disabled={!active || pending} onClick={() => setRunning((current) => !current)}>
              {running ? "Pause Operation" : "Resume Operation"}
            </button>
            <button type="button" disabled={!active || pending} onClick={() => void advance()}>Poll now</button>
          </div>

          {error && <p className="workspace-error" role="alert">{error}</p>}
          {pending && <p className="workspace-status" role="status">Synchronizing evidence and simulation state…</p>}
          {blueStatus?.lastResponse && (
            <p className="response-feedback" role="status">
              LAST RESPONSE // {blueStatus.lastResponse.action.replaceAll("_", " ")} · {blueStatus.lastResponse.availability}% AVAILABILITY
              {blueStatus.lastResponse.businessImpact.length > 0 && ` · ${blueStatus.lastResponse.businessImpact.join(" ")}`}
            </p>
          )}

          <div className={`soc-workspace${module === "dashboard" ? " soc-workspace-dashboard" : ""}`}>
            <fieldset className="soc-fieldset" disabled={pending} aria-busy={pending}>
              <div className="soc-grid campaign-soc">
                {module === "dashboard" && <Dashboard {...moduleProps} />}
                {module === "alerts" && <AlertQueue {...moduleProps} />}
                {module === "incidents" && <Incidents {...moduleProps} />}
                {module === "hosts" && <Hosts {...moduleProps} />}
                {module === "network" && <Network {...moduleProps} />}
                {module === "auth" && <Authentication {...moduleProps} />}
                {module === "services" && <Services {...moduleProps} />}
                {module === "evidence" && <Evidence {...moduleProps} />}
                {module === "playbooks" && <Playbooks {...moduleProps} />}
                {module === "reports" && <Reports {...moduleProps} />}
              </div>
            </fieldset>

            <Inspector
              view={view}
              selection={selection}
              onSelect={onSelect}
              respond={respond}
              active={active}
              pinnedEvidence={pinnedEvidence}
              onPinEvidence={onPinEvidence}
              status={status}
              markReviewed={markReviewed}
            />
          </div>

          {!active && (
            <div className="operation-result">
              <strong>
                {view.scenario.state === "COMPLETED" ? "INCIDENT CONTAINED" : view.objectiveRetrieved ? "PROTECTED ASSET ACCESSED" : "AVAILABILITY REQUIREMENT MISSED"}
              </strong>
              <Link className="primary-button" href={`/replay/${ids.scenarioId}?actor=${ids.actorId}`}>Open After-Action Review</Link>
            </div>
          )}
        </div>
      </div>
    </RootChrome>
  );
}
