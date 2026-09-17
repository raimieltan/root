"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ScenarioView } from "@/app/sim-types";
import RootChrome from "@/app/ui/root-chrome";
import MissionPanel from "./mission-panel";
import NetworkMap from "./network-map";
import Terminal, { type TerminalState } from "./terminal";

const apps = ["Mission", "Files", "Browser", "Credentials", "Intel", "Logs", "Processes", "Sessions"] as const;

export default function RedTeamPage() {
  const [ids, setIds] = useState<{ scenarioId: string; actorId: string }>();
  const [view, setView] = useState<ScenarioView>();
  const [activeApp, setActiveApp] = useState<(typeof apps)[number]>("Mission");
  const [assistance, setAssistance] = useState<"GUIDED" | "OPERATOR">();
  const [terminalState, setTerminalState] = useState<TerminalState>({ currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: "NONE", currentPath: "/", discoveredHosts: ["WEB-01"] });

  const refresh = useCallback(async (override?: { scenarioId: string; actorId: string }) => {
    const current = override ?? ids; if (!current) return;
    const response = await fetch(`/api/sim/state?scenarioId=${current.scenarioId}&actorId=${current.actorId}`, { cache: "no-store" });
    const data = await response.json();
    if (data.success) {
      setView(data);
      if (data.currentSession) setTerminalState((state) => ({ ...state, currentMachine: data.currentSession.machine, currentUser: data.currentSession.user, currentPrivilege: data.currentSession.privilege, discoveredHosts: data.discoveredHosts }));
    }
  }, [ids]);

  useEffect(() => { void (async () => {
    const response = await fetch("/api/sim/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "RED" }) });
    const data = await response.json();
    if (data.success) { const next = { scenarioId: data.scenarioId, actorId: data.actorId }; setIds(next); if (data.startingState) setTerminalState(data.startingState); sessionStorage.setItem(`root:${data.scenarioId}:actor`, data.actorId); await refresh(next); }
  })(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ids || !view) return <main className="loading-screen"><div className="boot-mark">ROOT<span>/OS</span></div><p>Provisioning Meridian simulation…</p></main>;
  const currentMachine = view.machines.find((machine) => machine.hostname === terminalState.currentMachine);

  return <RootChrome context="red" active="terminal" tone="red" title="OPS // RED TEAM OPERATIONS" operator={`${terminalState.currentUser}@${terminalState.currentMachine}`} privilege={terminalState.currentPrivilege}>
    <div className="workspace-toolbar"><div><span className="live-dot" /> OPERATION GLASSHOUSE <b>{"// LIVE"}</b></div><div className="app-tabs">{apps.map((app) => <button key={app} className={activeApp === app ? "active" : ""} onClick={() => setActiveApp(app)}>{app}</button>)}</div><span>MERIDIAN DYNAMICS&nbsp;&nbsp;{"//"}&nbsp;&nbsp;FIN-06</span></div>
    <div className="red-layout">
      <Terminal scenarioId={ids.scenarioId} actorId={ids.actorId} initialState={terminalState} onStateChange={setTerminalState} onRefresh={() => void refresh()} />
      <div className="intel-stack">
        <NetworkMap machines={view.machines} current={terminalState.currentMachine} />
        {activeApp === "Mission" && <MissionPanel view={view} assistance={assistance ?? "GUIDED"} />}
        {activeApp === "Files" && <DataPanel title={`FILES // ${terminalState.currentMachine}`} rows={(currentMachine?.files ?? []).map((file) => `${file.permissions}  ${file.owner.padEnd(12)} ${file.path}`)} empty="No filesystem access on this host." />}
        {activeApp === "Browser" && <section className="panel content-panel"><div className="panel-title"><span>BROWSER <b>{"// portal.meridian.test"}</b></span></div><div className="browser-page"><b>MERIDIAN DYNAMICS</b><h2>Employee operations portal</h2><p>Authorized staff access only.</p><code>/legacy-upload · legacy integration endpoint</code><code>vpn.meridian.test · field operations remote access</code></div></section>}
        {activeApp === "Credentials" && <DataPanel title="CREDENTIALS // DISCOVERED" rows={view.credentials.map((credential) => `${credential.username.padEnd(14)} ${credential.scope.padEnd(10)} source: ${credential.origin}`)} empty="No credentials recorded. Inspect files and application configuration." />}
        {activeApp === "Intel" && <DataPanel title="INTEL // RELATIONSHIPS" rows={[...view.intel.hosts.map((host) => `HOST  ${host}`), ...view.intel.relationships.map((relationship) => `TRUST ${relationship}`)]} empty="No relationships recorded." />}
        {activeApp === "Logs" && <DataPanel title="RED-VISIBLE EVENT LOG" rows={view.events.slice(-12).reverse().map((event) => `${event.severity.padEnd(8)} ${event.action} ${event.target ?? ""}`)} empty="No telemetry yet." />}
        {activeApp === "Processes" && <DataPanel title={`PROCESSES // ${terminalState.currentMachine}`} rows={(currentMachine?.processes ?? []).map((process) => `${process.pid}  ${process.runningAs.padEnd(12)} ${process.name}`)} empty="No process data." />}
        {activeApp === "Sessions" && <DataPanel title="ACTIVE SESSIONS" rows={view.sessions.map((session) => `${session.user}@${session.machine}  [${session.privilege}]`)} empty="No sessions." />}
      </div>
    </div>
    {view.scenario.state !== "ACTIVE" && <div className="operation-result"><strong>{view.objectiveRetrieved ? "OBJECTIVE SECURED" : "OPERATION ENDED"}</strong><Link className="primary-button" href={`/replay/${ids.scenarioId}?actor=${ids.actorId}`}>Open reconstruction</Link></div>}
    {!assistance && <div className="onboarding-backdrop"><section className="onboarding-card"><p className="eyebrow">ASSISTANCE SELECTION · OPERATION GLASSHOUSE</p><h1>Your first foothold starts with understanding.</h1><p>Guided mode exposes hypotheses and concept checkpoints. Operator mode preserves the same simulation while leaving interpretation to you.</p><div className="concept-row"><span><b>HOST</b>a machine</span><span><b>PORT</b>a service door</span><span><b>SSH</b>a remote session</span></div><code>Known asset: portal.meridian.test</code><div><button className="ghost-button" onClick={() => setAssistance("OPERATOR")}>Begin operator mode</button><button className="primary-button" onClick={() => setAssistance("GUIDED")}>Begin guided mode</button></div></section></div>}
  </RootChrome>;
}

function DataPanel({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return <section className="panel content-panel"><div className="panel-title"><span>{title}</span></div><div className="data-list">{rows.length ? rows.map((row, index) => <code key={`${index}-${row}`}>{row}</code>) : <p className="muted">{empty}</p>}</div></section>;
}
