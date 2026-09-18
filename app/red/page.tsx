"use client";

import Link from "next/link";
import { BookOpen, FileKey2, FileText, FolderOpen, ListTree, Network, ScrollText, Server, SquareTerminal } from "lucide-react";
import { useState } from "react";
import { useOperation } from "@/app/use-operation";
import type { ScenarioView } from "@/app/sim-types";
import RootChrome from "@/app/ui/root-chrome";
import { RootTree } from "@/app/ui/root-os";
import MissionPanel from "./mission-panel";
import NetworkMap from "./network-map";
import Terminal, { type TerminalState } from "./terminal";

const apps = ["Mission", "Hosts", "Terminal", "Credentials", "Files", "Processes", "Network", "Notes"] as const;
const navItems = [
  ["Mission", "Overview", BookOpen], ["Hosts", "Hosts", Server], ["Terminal", "Operator Console", SquareTerminal],
  ["Credentials", "Credential Findings", FileKey2], ["Files", "Files", FolderOpen], ["Processes", "Processes", ListTree],
  ["Network", "Network Map", Network], ["Notes", "Case Notes", FileText],
] as const;

export default function RedTeamPage() {
  const { ids, view, refresh, error, retry } = useOperation("RED");
  const [activeApp, setActiveApp] = useState<(typeof apps)[number]>("Terminal");
  const assistance = view?.assistance;
  const [terminalPrefill, setTerminalPrefill] = useState("");
  const [terminalState, setTerminalState] = useState<TerminalState>({ currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: "NONE", currentPath: "/", context: { type: "UNIX" }, discoveredHosts: [] });

  if (!ids || !view) return <main className="loading-screen"><div className="boot-mark">ROOT<span>/OS</span></div><p role={error ? "alert" : undefined}>{error || "Provisioning operation…"}</p>{error && <button type="button" onClick={retry}>Retry connection</button>}<Link href="/">Return to operations</Link></main>;
  const currentMachine = view.machines.find((machine) => machine.hostname === terminalState.currentMachine);

  return <RootChrome context="red" active="terminal" tone="red" title={view.operation.presentation.caseId} operator={`${terminalState.currentUser}@${terminalState.currentMachine}`} privilege={terminalState.currentPrivilege}>
    <div className="engagement-workspace">
      <RootTree title="Engagement" footer={<><button type="button"><ScrollText size={15} />Reporting</button><button type="button"><BookOpen size={15} />Help &amp; Documentation</button></>}>
        {navItems.map(([id, label, Icon]) => <button type="button" key={id} className={activeApp === id ? "active" : ""} onClick={() => setActiveApp(id)}><Icon size={15} />{label}</button>)}
      </RootTree>
      <div className="engagement-main">
        <div className="workspace-toolbar"><div><span className="live-dot" /> {view.operation.name} <b>{view.scenario.state}</b></div><span>{view.operation.organization} · {view.operation.presentation.caseId} · {assistance === "GUIDED" ? "Assisted" : "Standard"}</span></div>
        <div className="engagement-grid">
          <Terminal scenarioId={ids.scenarioId} actorId={ids.actorId} prefill={terminalPrefill} initialState={view.currentSession ? { currentMachine: view.currentSession.machine, currentUser: view.currentSession.user, currentPrivilege: view.currentSession.privilege, currentSessionId: view.currentSession.id, currentPath: "/", context: { type: "UNIX" }, discoveredHosts: view.discoveredHosts } : terminalState} onStateChange={setTerminalState} onRefresh={() => void refresh()} />
          <NetworkMap machines={view.machines} current={terminalState.currentMachine} organization={view.operation.organization} />
          <div className="engagement-lower">
            {activeApp === "Mission" && <MissionPanel view={view} assistance={assistance ?? "GUIDED"} />}
            {activeApp === "Hosts" && <DataPanel title="HOST DETAILS" rows={view.machines.map((machine) => `${machine.hostname.padEnd(14)} ${machine.ip.padEnd(15)} ${machine.state}`)} empty="No hosts recorded." />}
            {activeApp === "Terminal" && <MissionPanel view={view} assistance={assistance ?? "GUIDED"} />}
            {activeApp === "Files" && <DataPanel title={`FILES — ${terminalState.currentMachine}`} rows={(currentMachine?.files ?? []).map((file) => `${file.permissions}  ${file.owner.padEnd(12)} ${file.path}`)} empty="No filesystem access on this host." />}
            {activeApp === "Credentials" && <CredentialsPanel scenarioId={ids.scenarioId} actorId={ids.actorId} credentials={view.credentials} onUse={(command) => { setTerminalPrefill(command); setActiveApp("Terminal"); }} />}
            {activeApp === "Network" && <DataPanel title="DISCOVERED RELATIONSHIPS" rows={[...view.intel.hosts.map((host) => `HOST  ${host}`), ...view.intel.relationships.map((relationship) => `TRUST ${relationship}`)]} empty="No relationships recorded." />}
            {activeApp === "Processes" && <DataPanel title={`PROCESSES — ${terminalState.currentMachine}`} rows={(currentMachine?.processes ?? []).map((process) => `${process.pid}  ${process.runningAs.padEnd(12)} ${process.commandLine ?? process.name}`)} empty="No process data." />}
            {activeApp === "Notes" && <DataPanel title="CASE NOTES / OBSERVABLE EVENTS" rows={view.events.slice(-12).reverse().map((event) => `${event.severity.padEnd(8)} ${event.action} ${event.target ?? ""}`)} empty="No observations recorded." />}
          </div>
        </div>
      </div>
    </div>
    {view.scenario.state !== "ACTIVE" && <div className="operation-result"><strong>{view.objectiveRetrieved ? "ENGAGEMENT COMPLETE" : "ENGAGEMENT CLOSED — TASKING INCOMPLETE"}</strong><Link className="primary-button" href={`/replay/${ids.scenarioId}?actor=${ids.actorId}`}>Open After-Action Review</Link></div>}
  </RootChrome>;
}

function DataPanel({ title, rows, empty }: { title: string; rows: string[]; empty: string }) {
  return <section className="panel content-panel"><div className="panel-title"><span>{title}</span></div><div className="data-list">{rows.length ? rows.map((row, index) => <code key={`${index}-${row}`}>{row}</code>) : <p className="muted">{empty}</p>}</div></section>;
}

type Credential = ScenarioView["credentials"][number];

function CredentialsPanel({ scenarioId, actorId, credentials, onUse }: { scenarioId: string; actorId: string; credentials: Credential[]; onUse: (command: string) => void }) {
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const request = async (credentialId: string, action: "REVEAL" | "USE") => {
    const response = await fetch("/api/sim/credentials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioId, actorId, credentialId, action }) });
    const data = await response.json();
    if (!response.ok || !data.success) { setNotice(data.error ?? "Credential action failed."); return; }
    if (action === "REVEAL") { setRevealed((current) => ({ ...current, [credentialId]: data.secret })); return; }
    if (!data.valid) { setNotice("Credential invalidated by Blue response."); return; }
    onUse(data.command); setNotice("Connection command prepared in terminal. Password remains prompted.");
  };
  const copy = async (credentialId: string) => {
    const secret = revealed[credentialId];
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setNotice("Credential copied to clipboard.");
  };
  return <section className="panel content-panel"><div className="panel-title"><span>CREDENTIAL FINDINGS</span></div><div className="data-list credential-list">
    {credentials.length ? credentials.map((credential) => <div key={credential.id} className="credential-entry">
      <code>{credential.username}@{credential.scope}  [{credential.type}]  {credential.valid ? "VALID" : "INVALID"}</code>
      <small>source: {credential.origin}</small>
      <code className="credential-secret">secret: {revealed[credential.id] ?? "••••••••••••"}</code>
      <div className="credential-actions"><button type="button" onClick={() => void request(credential.id, "REVEAL")}>Reveal</button><button type="button" disabled={!revealed[credential.id]} onClick={() => void copy(credential.id)}>Copy</button><button type="button" disabled={!credential.valid} onClick={() => void request(credential.id, "USE")}>Use</button></div>
    </div>) : <p className="muted">No credentials recorded. Inspect files and application configuration.</p>}
    {notice && <p className="muted" role="status">{notice}</p>}
  </div></section>;
}
