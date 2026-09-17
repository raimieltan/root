"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RootChrome from "@/app/ui/root-chrome";
import { snapshotAt, visibleToLens, type KeyDecision, type ReplayEvent, type ReplayLens, type ReplaySnapshot, type ReplaySummary } from "@/lib/simulation/replay";

type ReplayPayload = {
  scenario: { id: string; mode: string; state: string; startedAt?: string; endedAt?: string };
  machines: Array<{ hostname: string; ip: string; zone: string }>;
  events: ReplayEvent[];
  summary: ReplaySummary;
  keyDecision: KeyDecision;
};

const emptySnapshot: ReplaySnapshot = { knownHosts: [], accessedHosts: [], privilegedHosts: [], isolatedHosts: [], activeSessions: [], detections: [], objectiveRetrieved: false };

function formatElapsed(milliseconds: number | null) {
  if (milliseconds === null) return "NOT DETECTED";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ReplayClient({ scenarioId, actorId }: { scenarioId: string; actorId?: string }) {
  const [payload, setPayload] = useState<ReplayPayload>();
  const [error, setError] = useState<string>();
  const [lens, setLens] = useState<ReplayLens>("TRUTH");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const actor = actorId ?? sessionStorage.getItem(`root:${scenarioId}:actor`);
    if (!actor) { queueMicrotask(() => setError("Replay authorization was not found for this operation.")); return; }
    void fetch(`/api/sim/replay?scenarioId=${scenarioId}&actorId=${actor}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error ?? "Replay unavailable");
        setPayload(data);
        setSelectedIndex(Math.max(0, data.events.length - 1));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Replay unavailable"));
  }, [actorId, scenarioId]);

  const visible = useMemo(() => payload?.events.filter((event) => visibleToLens(event, lens)) ?? [], [lens, payload]);
  useEffect(() => {
    if (!playing || selectedIndex >= visible.length - 1) return;
    const timer = window.setTimeout(() => setSelectedIndex((index) => {
      const next = Math.min(index + 1, visible.length - 1);
      if (next >= visible.length - 1) setPlaying(false);
      return next;
    }), 650);
    return () => window.clearTimeout(timer);
  }, [playing, selectedIndex, visible.length]);

  const selected = visible[selectedIndex];
  const selectedTruthIndex = selected && payload ? payload.events.findIndex((event) => event.id === selected.id) : -1;
  const snapshot = payload && selectedTruthIndex >= 0 ? snapshotAt(payload.events.slice(0, selectedTruthIndex + 1), lens, selected?.id) : emptySnapshot;
  const start = payload?.scenario.startedAt ? new Date(payload.scenario.startedAt).getTime() : 0;

  if (error) return <main className="loading-screen"><div className="boot-mark">ROOT<span>/REPLAY</span></div><p>{error}</p><Link className="primary-button" href="/">Return to operations</Link></main>;
  if (!payload) return <main className="loading-screen"><div className="boot-mark">ROOT<span>/REPLAY</span></div><p>Reconstructing operation evidence…</p></main>;

  const lensHosts = lens === "RED" ? payload.machines.filter((machine) => snapshot.knownHosts.includes(machine.hostname)) : payload.machines;
  const perspective = lens === "RED" ? payload.keyDecision.redPerspective : lens === "BLUE" ? payload.keyDecision.bluePerspective : payload.keyDecision.analysis;
  const selectLens = (nextLens: ReplayLens) => {
    const count = payload.events.filter((event) => visibleToLens(event, nextLens)).length;
    setLens(nextLens);
    setSelectedIndex(Math.max(0, count - 1));
    setPlaying(false);
  };

  return <RootChrome context="replay" active="replay" tone="truth" title="OPERATIONS // POST-OPERATION ANALYSIS" privilege="ROOT">
    <div className="replay-layout">
      <header className="replay-heading"><div><h1>OPERATION GLASSHOUSE <b>{"// RECONSTRUCTION & AFTER-ACTION REPLAY"}</b></h1><p>Reconstruct the truth. Learn. Adapt. Operate better.</p></div><span>MERIDIAN DYNAMICS&nbsp;&nbsp;{"//"}&nbsp;&nbsp;OP-GLASSHOUSE</span></header>
      <div className="lens-tabs">{(["RED", "BLUE", "TRUTH"] as ReplayLens[]).map((item) => <button key={item} onClick={() => selectLens(item)} className={`${lens === item ? "active" : ""} ${item.toLowerCase()}`}><strong>{item === "TRUTH" ? "FULL TRUTH" : `${item} VIEW`}</strong><span>{item === "RED" ? "Attacker Perspective" : item === "BLUE" ? "Defender Perspective" : "Complete Reconstruction"}</span></button>)}<p>SAME DATA.<br />DIFFERENT PERSPECTIVE.<br />A CLEARER TRUTH.</p></div>

      <section className="panel replay-timeline-panel">
        <div className="panel-title"><span>EVENT TIMELINE <b>{`// ${lens} LENS`}</b></span><button className="replay-control" onClick={() => { if (selectedIndex >= visible.length - 1) setSelectedIndex(0); setPlaying((value) => !value); }}>{playing ? "Ⅱ PAUSE" : "▶ PLAY REPLAY"}</button></div>
        <div className="timeline">{visible.map((event, index) => { const elapsed = start ? Math.max(0, new Date(event.timestamp).getTime() - start) : 0; return <button key={event.id} onClick={() => { setSelectedIndex(index); setPlaying(false); }} className={`timeline-event ${event.severity.toLowerCase()} ${index === selectedIndex ? "selected" : ""}`}><time>{formatElapsed(elapsed).slice(3)}</time><i /><div><span>{event.category}</span><h3>{event.action.replaceAll("_", " ")}</h3><p>{event.source ?? "SYSTEM"} → {event.target ?? "—"}{event.userId ? ` · ${event.userId}` : ""}</p></div><b>{event.severity}</b></button>; })}</div>
        <div className="replay-scrubber"><label htmlFor="replay-position">EVENT {Math.min(selectedIndex + 1, visible.length)} / {visible.length}</label><input id="replay-position" type="range" min="0" max={Math.max(0, visible.length - 1)} value={Math.min(selectedIndex, Math.max(0, visible.length - 1))} onChange={(event) => { setSelectedIndex(Number(event.target.value)); setPlaying(false); }} /></div>
      </section>

      <aside className="replay-side">
        <section className="panel operation-summary"><div className="panel-title"><span>♦ OPERATION RESULT</span><strong>{payload.summary.status}</strong></div><h2>OPERATION GLASSHOUSE</h2><p>Meridian Dynamics<br />Objective: PROJECT_ATLAS.pdf</p><dl><dt>DURATION</dt><dd>{formatElapsed(payload.summary.durationMs)}</dd><dt>DETECTION TIME</dt><dd>{formatElapsed(payload.summary.detectionTimeMs)}</dd><dt>CONTAINED</dt><dd>{payload.summary.contained ? "Yes" : "No"}</dd><dt>SESSIONS CREATED</dt><dd>{payload.summary.sessionCount}</dd><dt>PERSISTENCE</dt><dd>{payload.summary.persistenceInstalled ? "Installed" : "None"}</dd><dt>STATUS</dt><dd className={payload.summary.status === "SUCCESS" ? "green-text" : "red-text"}>{payload.summary.status}</dd></dl></section>
        <section className="panel path-panel"><div className="panel-title"><span>ATTACK PATH <b>{"// EVENT DERIVED"}</b></span></div><div className="attack-path">{payload.summary.attackPath.map((host, index) => <span key={`${host}-${index}`}>{index > 0 && <i>→</i>}<b>{host}</b></span>)}</div></section>
      </aside>

      <section className="panel replay-state-panel"><div className="panel-title"><span>SYSTEM STATE <b>{`// ${selected ? selected.action.replaceAll("_", " ") : "START"}`}</b></span><span>{snapshot.detections.length} DETECTIONS</span></div><div className="replay-hosts">{lensHosts.map((machine) => { const state = snapshot.isolatedHosts.includes(machine.hostname) ? "ISOLATED" : snapshot.privilegedHosts.includes(machine.hostname) ? "PRIVILEGED" : snapshot.accessedHosts.includes(machine.hostname) ? "ACCESSED" : "OBSERVED"; return <article key={machine.hostname} className={state.toLowerCase()}><strong>{machine.hostname}</strong><span>{machine.ip}</span><em>{state}</em></article>; })}</div></section>

      <section className="panel learning-summary"><div className="panel-title"><span>KEY DECISION ANALYSIS</span><span>{payload.summary.evidenceCount} EVIDENCE EVENTS</span></div><article><h2>{payload.keyDecision.title}</h2><p>{perspective}</p><small>{snapshot.objectiveRetrieved ? "Objective state: retrieved" : "Objective state: protected"} · Active sessions: {snapshot.activeSessions.length}</small></article><Link className="primary-button" href="/">START ANOTHER OPERATION →</Link></section>
    </div>
  </RootChrome>;
}
