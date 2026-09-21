"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ScenarioView } from "@/app/sim-types";
import { playAudio } from "@/lib/audio/audio-system";
import type { SimulatedHttpResponse } from "@/lib/simulation/types";
import { parseBrowserDocument, type BrowserForm } from "./browser-document";
import { applyBrowserCommandResult } from "./browser-state";
import type { TerminalState } from "./terminal";

type Props = {
  scenarioId: string;
  actorId: string;
  session: TerminalState;
  httpSessions: ScenarioView["httpSessions"];
  onStateChange: (state: TerminalState) => void;
  onRefresh: () => void | Promise<void>;
};

type Page = { response: SimulatedHttpResponse; ok: boolean };

function quote(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function fallbackResponse(url: string, method: string, output: string, ok: boolean): SimulatedHttpResponse {
  return { url, method, status: ok ? 200 : 422, reason: ok ? "OK" : "Request rejected", headers: [], body: output };
}

export default function Browser({ scenarioId, actorId, session, httpSessions, onStateChange, onRefresh }: Props) {
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [data, setData] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Page[]>([]);
  const [index, setIndex] = useState(-1);
  const current = index >= 0 ? history[index] : undefined;
  const document = useMemo(() => current ? parseBrowserDocument(current.response.body, current.response.url) : undefined, [current]);

  async function request(target: string, requestMethod: "GET" | "POST", requestData = "") {
    const normalizedTarget = target.trim();
    if (!normalizedTarget || busy) return;
    setBusy(true);
    setAddress(normalizedTarget);
    setMethod(requestMethod);
    if (requestMethod === "POST") setData(requestData);
    void playAudio("terminal.command.submit");
    const command = `curl${requestMethod === "POST" ? " -X POST" : ""} ${normalizedTarget}${requestMethod === "POST" && requestData ? ` --data ${quote(requestData)}` : ""}`;
    try {
      const response = await fetch("/api/sim/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, actorId, command, currentSessionId: session.currentSessionId, currentMachine: session.currentMachine, currentUser: session.currentUser, currentPath: session.currentPath, context: session.context }),
      });
      const result = await response.json();
      const ok = Boolean(result.success && response.ok);
      const httpResponse: SimulatedHttpResponse = result.httpResponse ?? fallbackResponse(normalizedTarget, requestMethod, result.output ?? result.error ?? "No response.", ok);
      const page: Page = { response: httpResponse, ok };
      setHistory((items) => {
        const next = [...items.slice(0, index + 1), page];
        setIndex(next.length - 1);
        return next;
      });

      const nextState = applyBrowserCommandResult(session, result);
      onStateChange(nextState);
      await onRefresh();

      if ((result.discoveredHosts?.length ?? 0) > session.discoveredHosts.length) void playAudio("network.host.discovered");
      void playAudio(ok ? "terminal.command.submit" : "terminal.command.error");
    } catch {
      const page: Page = { response: fallbackResponse(normalizedTarget, requestMethod, "Simulation server unavailable.", false), ok: false };
      setHistory((items) => {
        const next = [...items.slice(0, index + 1), page];
        setIndex(next.length - 1);
        return next;
      });
      void playAudio("terminal.command.error");
    } finally {
      setBusy(false);
    }
  }

  function open(event: FormEvent) {
    event.preventDefault();
    void request(address, method, data);
  }

  const go = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= history.length) return;
    setIndex(next);
    setAddress(history[next].response.url);
  };

  const visibleSessions = httpSessions;

  return <section className="panel content-panel browser-panel" aria-label="Simulated web browser">
    <div className="panel-title"><span>BROWSER — {session.currentMachine}</span><span>{current ? `${current.response.status} ${current.response.reason}` : "No page loaded"}</span></div>
    <div className="browser-toolbar">
      <button type="button" disabled={index <= 0} onClick={() => go(-1)} title="Back">◀</button>
      <button type="button" disabled={index >= history.length - 1} onClick={() => go(1)} title="Forward">▶</button>
      <button type="button" disabled={!current || busy} onClick={() => current && void request(current.response.url, current.response.method === "POST" ? "POST" : "GET", current.response.method === "POST" ? data : "")} title="Reload">↻</button>
      <select aria-label="Request method" value={method} onChange={(event) => setMethod(event.target.value as "GET" | "POST")}>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
      </select>
      <form className="browser-address" onSubmit={open}>
        <label className="sr-only" htmlFor="browser-address">Address</label>
        <input id="browser-address" type="text" placeholder="host/path, e.g. NEW-APP-01/login" value={address} autoComplete="off" onChange={(event) => setAddress(event.target.value)} disabled={busy} />
        <button type="submit" disabled={busy}>{busy ? "Waiting…" : "Go"}</button>
      </form>
    </div>
    {method === "POST" && <div className="browser-data">
      <label htmlFor="browser-data">Form data (URL encoded)</label>
      <input id="browser-data" type="text" placeholder="username=trainee&password=..." value={data} autoComplete="off" onChange={(event) => setData(event.target.value)} disabled={busy} />
    </div>}
    <div className="browser-workspace">
      <div className={`browser-page ${current && !current.ok ? "browser-page-error" : ""}`}>
        {current && document ? <>
          <div className="browser-response-line"><strong>{current.response.status} {current.response.reason}</strong><span>{current.response.method} {current.response.url}</span></div>
          {current.response.headers.length > 0 && <dl className="browser-headers">{current.response.headers.map((header, headerIndex) => <div key={`${headerIndex}-${header.name}`}><dt>{header.name}</dt><dd>{header.value}</dd></div>)}</dl>}
          <div className="browser-document-text">{document.text || "(empty response body)"}</div>
          {document.links.length > 0 && <nav className="browser-links" aria-label="Page links">{document.links.map((link) => <button type="button" key={`${link.target}-${link.label}`} onClick={() => void request(link.target, "GET")}>{link.label}</button>)}</nav>}
          {document.forms.map((form, formIndex) => <BrowserFormView key={`${form.action}-${formIndex}`} form={form} disabled={busy} onSubmit={(body) => void request(form.action, form.method, body)} />)}
        </> : <p className="muted">Enter an address above to request a page. Requests originate from the active session ({session.currentUser}@{session.currentMachine}).</p>}
      </div>
      <aside className="browser-session-pane" aria-label="Application sessions">
        <h3>Application sessions</h3>
        {visibleSessions.length ? visibleSessions.map((entry) => <div className="browser-session-row" key={`${entry.host}-${entry.username}`}>
          <strong>{entry.host}</strong>
          <span>{entry.username}</span>
          <code>{entry.cookieName}=managed</code>
        </div>) : <p>No application cookies recorded.</p>}
      </aside>
    </div>
    <div className="browser-status"><span>{busy ? "Contacting service…" : current ? `${current.response.body.length} bytes received` : "Ready"}</span><span>{visibleSessions.length} cookie session{visibleSessions.length === 1 ? "" : "s"}</span></div>
  </section>;
}

function BrowserFormView({ form, disabled, onSubmit }: { form: BrowserForm; disabled: boolean; onSubmit: (body: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(form.fields.map((field) => [field.name, field.options[0]?.value ?? ""])));
  return <form className="browser-form" onSubmit={(event) => {
    event.preventDefault();
    onSubmit(new URLSearchParams(values).toString());
  }}>
    <div className="browser-form-title"><span>{form.method}</span><code>{form.action}</code></div>
    {form.fields.map((field) => <label key={field.name}>{field.label}
      {field.type === "select"
        ? <select value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} disabled={disabled}>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        : <input type={field.type} autoComplete="off" value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} disabled={disabled} />}
    </label>)}
    <button type="submit" disabled={disabled}>{form.submitLabel}</button>
  </form>;
}
