"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScenarioView } from "@/app/sim-types";
import NetworkMap from "@/app/red/network-map";
import RootChrome from "@/app/ui/root-chrome";

export default function BlueTeamPage() {
  const [ids, setIds] = useState<{ scenarioId: string; actorId: string }>();
  const [view, setView] = useState<ScenarioView>();
  const [selectedHost, setSelectedHost] = useState<string>();
  const [autoAdvance, setAutoAdvance] = useState(true);

  const refresh = useCallback(async (override?: { scenarioId: string; actorId: string }) => {
    const current = override ?? ids; if (!current) return;
    const data = await fetch(`/api/sim/state?scenarioId=${current.scenarioId}&actorId=${current.actorId}`, { cache: "no-store" }).then((response) => response.json());
    if (data.success) { setView(data); setSelectedHost((selected) => selected ?? data.machines.find((machine: { hostname: string }) => machine.hostname === "WEB-01")?.id); }
  }, [ids]);

  useEffect(() => { void (async () => {
    const data = await fetch("/api/sim/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "BLUE" }) }).then((response) => response.json());
    if (data.success) { const next = { scenarioId: data.scenarioId, actorId: data.actorId }; setIds(next); sessionStorage.setItem(`root:${data.scenarioId}:actor`, data.actorId); await refresh(next); }
  })(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ids || !autoAdvance || view?.scenario.state !== "ACTIVE") return;
    const timer = window.setInterval(async () => {
      await fetch("/api/sim/blue/advance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ids) });
      await refresh();
    }, 4500);
    return () => window.clearInterval(timer);
  }, [autoAdvance, ids, refresh, view?.scenario.state]);

  async function respond(action: string, extras: Record<string, string | undefined> = {}) {
    if (!ids) return;
    await fetch("/api/sim/blue/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...ids, action, targetId: selectedHost, ...extras }) });
    await refresh();
  }

  const selected = view?.machines.find((machine) => machine.id === selectedHost);
  const authEvents = useMemo(() => view?.events.filter((event) => event.category === "AUTH").slice(-8).reverse() ?? [], [view]);
  if (!ids || !view) return <main className="loading-screen"><div className="boot-mark blue">ROOT<span>/SOC</span></div><p>Connecting defensive telemetry…</p></main>;

  return <RootChrome context="blue" active="soc" tone="blue" title="MERIDIAN DYNAMICS // SECURITY OPERATIONS" operator="blue.team@mdc" privilege="ANALYST" network="PRODUCTION">
    <div className="workspace-toolbar"><div><span className="live-dot blue" /> SOC WORKSPACE <b>{`// ${view.scenario.state}`}</b></div><div className="soc-tabs"><button className="active">LIVE EVENTS</button><button>THREAT TIMELINE</button><button>INVESTIGATION</button></div><button className="ghost-button" onClick={() => setAutoAdvance((value) => !value)}>{autoAdvance ? "Ⅱ PAUSE ATTACKER" : "▶ RESUME ATTACKER"}</button></div>
    <div className="soc-grid">
      <NetworkMap machines={view.machines} />
      <section className="panel alert-panel"><div className="panel-title">ALERT QUEUE <span>{view.alerts.length}</span></div><div className="data-list">{view.alerts.slice().reverse().map((alert) => <button key={alert.id} title={alert.rationale} className={`alert-row ${alert.severity.toLowerCase()}`}><b>{alert.ruleId} · {alert.title}</b><span>{alert.summary}</span><em>{alert.severity}</em></button>)}</div></section>
      <section className="panel incident-panel"><div className="panel-title">INCIDENT <span>GLASSHOUSE-01</span></div><div className="incident-score"><strong>{view.suspicion}</strong><span>THREAT PRESSURE</span></div><p>{view.objectiveRetrieved ? "Critical finance file extracted." : "Investigate the attack path and contain it before finance access."}</p><div className="meter"><span style={{ width: `${view.suspicion}%` }} /></div></section>
      <section className="panel logs-panel"><div className="panel-title">LIVE LOGS</div><div className="data-list compact">{view.events.slice(-14).reverse().map((event) => <code key={event.id}><b>{event.severity}</b> {event.action} · {event.source ?? "—"} → {event.target ?? "—"}</code>)}</div></section>
      <section className="panel"><div className="panel-title">AUTHENTICATION</div><div className="data-list compact">{authEvents.map((event) => <code key={event.id}>{event.action} · {event.userId} · {event.target}</code>)}</div></section>
      <section className="panel"><div className="panel-title">HOST INSPECTOR</div><select value={selectedHost} onChange={(event) => setSelectedHost(event.target.value)}>{view.machines.filter((machine) => machine.hostname !== "INTERNET").map((machine) => <option key={machine.id} value={machine.id}>{machine.hostname}</option>)}</select><div className="data-list compact"><code>STATE {selected?.state}</code><code>AVAILABILITY {selected?.availability}</code>{selected?.processes.map((process) => <code key={process.id}>{process.pid} {process.runningAs} {process.name}</code>)}</div></section>
      <section className="panel response-panel"><div className="panel-title">RESPONSE ACTIONS</div><div className="action-grid"><button onClick={() => void respond("INSPECT_HOST")}>Inspect host</button><button onClick={() => void respond("INSPECT_USER", { username: view.sessions.at(-1)?.user })}>Inspect user</button><button onClick={() => void respond("INSPECT_PROCESS")}>Inspect processes</button><button onClick={() => void respond("INCREASE_MONITORING")}>Increase monitoring</button><button onClick={() => void respond("ISOLATE_HOST")}>Isolate host</button><button onClick={() => void respond("RESTORE_HOST")}>Restore host</button><button onClick={() => void respond("BLOCK_CONNECTION")}>Block connections</button><button onClick={() => void respond("REMOVE_PERSISTENCE")}>Remove persistence</button><button disabled={!view.sessions.at(-1)} onClick={() => void respond("REVOKE_SESSION", { sessionId: view.sessions.at(-1)?.id })}>Revoke latest session</button><button onClick={() => void respond("RESET_PASSWORD", { username: "deploy" })}>Reset deploy credential</button></div></section>
      <section className="panel availability-panel"><div className="panel-title">SERVICE AVAILABILITY</div>{view.machines.filter((machine) => ["WEB-01", "DEV-01", "FIN-APP", "FIN-DB"].includes(machine.hostname)).map((machine) => <div key={machine.id}><span>{machine.hostname}</span><b className={machine.availability.toLowerCase()}>{machine.availability}</b></div>)}</section>
    </div>
    {view.scenario.state !== "ACTIVE" && <div className="operation-result"><strong>{view.scenario.state === "COMPLETED" ? "ATTACK CONTAINED" : "OBJECTIVE LOST"}</strong><Link className="primary-button" href={`/replay/${ids.scenarioId}?actor=${ids.actorId}`}>Review reconstruction</Link></div>}
  </RootChrome>;
}
