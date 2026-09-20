"use client";

import { FormEvent, useState } from "react";
import { playAudio } from "@/lib/audio/audio-system";
import type { TerminalState } from "./terminal";

type Props = {
  scenarioId: string;
  actorId: string;
  session: Pick<TerminalState, "currentSessionId" | "currentMachine" | "currentUser" | "currentPath" | "context" | "discoveredHosts">;
  onDiscovered: (hosts: string[]) => void;
};

type Page = { url: string; status: string; ok: boolean; body: string };

function quote(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

export default function Browser({ scenarioId, actorId, session, onDiscovered }: Props) {
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [data, setData] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Page[]>([]);
  const [index, setIndex] = useState(-1);
  const current = index >= 0 ? history[index] : undefined;

  async function open(event: FormEvent) {
    event.preventDefault();
    const target = address.trim();
    if (!target || busy) return;
    setBusy(true);
    void playAudio("terminal.command.submit");
    const command = `curl${method === "POST" ? " -X POST" : ""} ${target}${method === "POST" && data ? ` --data ${quote(data)}` : ""}`;
    try {
      const response = await fetch("/api/sim/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, actorId, command, currentSessionId: session.currentSessionId, currentMachine: session.currentMachine, currentUser: session.currentUser, currentPath: session.currentPath, context: session.context }),
      });
      const result = await response.json();
      const body: string = result.output ?? result.error ?? "No response.";
      const status = body.split("\n")[0] || (response.ok ? "200 OK" : "Request failed");
      const page: Page = { url: target, status, ok: response.ok, body };
      const nextHistory = [...history.slice(0, index + 1), page];
      setHistory(nextHistory);
      setIndex(nextHistory.length - 1);
      if (result.discoveredHosts && result.discoveredHosts.length > session.discoveredHosts.length) { onDiscovered(result.discoveredHosts); void playAudio("network.host.discovered"); }
      void playAudio(response.ok ? "terminal.command.submit" : "terminal.command.error");
    } catch {
      const page: Page = { url: target, status: "Connection failed", ok: false, body: "Simulation server unavailable." };
      setHistory((items) => [...items.slice(0, index + 1), page]);
      setIndex((items) => items + 1);
      void playAudio("terminal.command.error");
    } finally { setBusy(false); }
  }

  const go = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= history.length) return;
    setIndex(next);
    setAddress(history[next].url);
  };

  return <section className="panel content-panel browser-panel">
    <div className="panel-title"><span>BROWSER — {session.currentMachine}</span><span>{current ? current.status : "No page loaded"}</span></div>
    <div className="browser-toolbar">
      <button type="button" disabled={index <= 0} onClick={() => go(-1)} title="Back">◀</button>
      <button type="button" disabled={index >= history.length - 1} onClick={() => go(1)} title="Forward">▶</button>
      <select value={method} onChange={(event) => setMethod(event.target.value as "GET" | "POST")}>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
      </select>
      <form className="browser-address" onSubmit={open}>
        <input type="text" placeholder="host/path, e.g. NEW-APP-01/login" value={address} autoComplete="off" onChange={(event) => setAddress(event.target.value)} disabled={busy} />
        <button type="submit" disabled={busy}>Go</button>
      </form>
    </div>
    {method === "POST" && <div className="browser-data">
      <label htmlFor="browser-data">Form data (urlencoded):</label>
      <input id="browser-data" type="text" placeholder="username=trainee&password=..." value={data} autoComplete="off" onChange={(event) => setData(event.target.value)} disabled={busy} />
    </div>}
    <div className={`browser-page ${current && !current.ok ? "browser-page-error" : ""}`}>
      {current ? <pre>{current.body}</pre> : <p className="muted">Enter an address above to request a page. Requests run as the active terminal session ({session.currentUser}@{session.currentMachine}).</p>}
    </div>
  </section>;
}
