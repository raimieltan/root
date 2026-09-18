"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

export type TerminalState = { currentMachine: string; currentUser: string; currentPrivilege: string; currentPath: string; currentSessionId?: string; context?: { type: "UNIX" | "SSH" } | { type: "POSTGRES"; serviceName: string; databaseName: string }; discoveredHosts: string[] };

type Props = { scenarioId: string; actorId: string; initialState: TerminalState; onStateChange: (state: TerminalState) => void; onRefresh: () => void };
type Line = { kind: "command" | "output" | "error"; text: string };

export default function Terminal({ scenarioId, actorId, initialState, onStateChange, onRefresh }: Props) {
  const [state, setState] = useState(initialState);
  const [line, setLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Line[]>([{ kind: "output", text: "ROOT/OS — Authorized operation\nType 'help' for commands. Use ls to inspect available files and sessions <number> to switch active access." }]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const command = line.trim();
    if (!command || busy) return;
    setLine(""); setBusy(true);
    const prompt = state.context?.type === "POSTGRES" ? `${state.context.databaseName}=>` : `${state.currentUser}@${state.currentMachine}:${state.currentPath}$`;
    setHistory((items) => [...items, { kind: "command", text: `${prompt} ${command}` }]);
    if (command === "clear") { setHistory([]); setBusy(false); return; }
    try {
      const response = await fetch("/api/sim/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioId, actorId, command, currentSessionId: state.currentSessionId, currentMachine: state.currentMachine, currentUser: state.currentUser, currentPath: state.currentPath, context: state.context }) });
      const data = await response.json();
      const next = { ...state };
      if (data.newSession) { next.currentMachine = data.newSession.machineId; next.currentUser = data.newSession.userId; next.currentPrivilege = data.newSession.privilege; next.currentSessionId = data.newSession.id; next.currentPath = "/"; }
      if (data.context) next.context = data.context;
      if (data.currentPath) next.currentPath = data.currentPath;
      if (data.discoveredHosts) next.discoveredHosts = data.discoveredHosts;
      setState(next); onStateChange(next);
      setHistory((items) => [...items, { kind: response.ok ? "output" : "error", text: data.output ?? data.error ?? "Command failed" }]);
      onRefresh();
    } catch {
      setHistory((items) => [...items, { kind: "error", text: "Simulation server unavailable." }]);
    } finally { setBusy(false); }
  }

  return <section className="terminal-shell" aria-label="ROOT OS terminal">
    <div className="terminal-bar"><span>TERMINAL&nbsp;&nbsp;–&nbsp;&nbsp;{state.currentUser}@{state.currentMachine}</span><span>×</span></div>
    <div className="terminal-output">
      {history.map((item, index) => <pre key={`${index}-${item.text}`} className={`terminal-${item.kind}`}>{item.text}</pre>)}
      <div ref={bottomRef} />
    </div>
    <form className="terminal-input" onSubmit={submit}>
      <label htmlFor="command">{state.context?.type === "POSTGRES" ? `${state.context.databaseName}=>` : `${state.currentUser}@${state.currentMachine}:${state.currentPath}$`}</label>
      <input id="command" autoComplete="off" autoFocus value={line} onChange={(event) => setLine(event.target.value)} disabled={busy} />
    </form>
  </section>;
}
