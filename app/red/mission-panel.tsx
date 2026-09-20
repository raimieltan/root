"use client";

import { useState } from "react";
import type { ScenarioView } from "@/app/sim-types";

type MissionPanelProps = {
  view: ScenarioView;
  assistance: "GUIDED" | "OPERATOR";
  scenarioId: string;
  actorId: string;
  onViewChange: (view: ScenarioView) => void;
};

export default function MissionPanel({ view, assistance, scenarioId, actorId, onViewChange }: MissionPanelProps) {
  const [pendingObjectiveId, setPendingObjectiveId] = useState<string>();
  const [hintError, setHintError] = useState("");
  const firstOpenObjectiveId = view.guidance.objectives.find((objective) => !objective.completed)?.id;
  const requestHint = async (objectiveId: string) => {
    setPendingObjectiveId(objectiveId);
    setHintError("");
    try {
      const response = await fetch("/api/sim/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, actorId, objectiveId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to request hint");
      onViewChange(data as ScenarioView);
    } catch (error) {
      setHintError(error instanceof Error ? error.message : "Unable to request hint");
    } finally {
      setPendingObjectiveId(undefined);
    }
  };

  return <section className="panel mission-panel">
    <div className="panel-title"><span>ENGAGEMENT BRIEF <b>{view.operation.name}</b></span><span>{assistance === "GUIDED" ? "ASSISTED" : "STANDARD"} · {view.operation.presentation.caseId}</span></div>
    <p className="eyebrow">AUTHORIZED SECURITY ASSESSMENT</p>
    <h2>{view.guidance.objective}</h2>
    <p className="muted">{view.operation.briefing.red}</p>
    <div className="objective-list" aria-label="Task evidence">
      <header><b>TASK EVIDENCE</b><span>{view.guidance.objectives.filter((objective) => objective.completed).length} / {view.guidance.objectives.length} verified</span></header>
      {view.guidance.objectives.map((objective) => {
        const hint = view.guidance.hints.find((entry) => entry.objectiveId === objective.id);
        const showHintControl = assistance === "GUIDED" && !objective.completed && hint?.nextAvailable;
        return <div key={objective.id} className={`objective-row ${objective.completed ? "completed" : "pending"}`}>
        <span aria-hidden="true">{objective.completed ? "✓" : "□"}</span>
        <div className="objective-main">
          <div className="objective-summary"><p>{objective.label}</p><small>{objective.completed ? "VERIFIED" : "OPEN"}</small></div>
          {assistance === "GUIDED" && hint && hint.revealedText.length > 0 && <div className="objective-hints" aria-live="polite">
            {hint.revealedText.map((text, index) => <p key={`${objective.id}-${index}`}><b>HINT {index + 1}</b><span>{text}</span></p>)}
          </div>}
          {assistance === "GUIDED" && view.guidance.stuck && objective.id === firstOpenObjectiveId && hint?.nextAvailable && <div className="stuck-nudge"><b>HAVING TROUBLE?</b><span>A hint is available for this objective.</span></div>}
        </div>
        {showHintControl && <button className="hint-action" type="button" disabled={pendingObjectiveId === objective.id} aria-label={`Request hint for ${objective.label}`} onClick={() => void requestHint(objective.id)}>{pendingObjectiveId === objective.id ? "REQUESTING…" : "REQUEST HINT"}</button>}
      </div>;
      })}
      {hintError && <p className="hint-error" role="alert">{hintError}</p>}
    </div>
    <div className="knowledge-state">
      <div><b>KNOWN</b>{view.guidance.knowledge.known.map((fact) => <span key={fact.id}><small>{fact.category}</small>{fact.value}</span>)}</div>
      <div><b>UNKNOWN</b>{view.guidance.knowledge.unknown.map((unknown) => <span key={unknown}>{unknown}</span>)}</div>
    </div>
    {assistance === "GUIDED" && view.guidance.knowledge.lastRevealed && <div className="mission-suggestion"><b>LAST ACTION REVEALED</b><span>{view.guidance.knowledge.lastRevealed}</span>{view.guidance.knowledge.contextual && <small>{view.guidance.knowledge.contextual}</small>}</div>}
    {assistance === "GUIDED" && <div className="hypothesis-list">
      <div className="hypothesis-intro"><b>WORKING HYPOTHESES</b><span>Review available evidence before selecting an approach.</span></div>
      {view.guidance.hypotheses.map((hypothesis) => <article key={hypothesis.id} className={hypothesis.status.toLowerCase()}>
        <header><b>{hypothesis.title}</b><span>{hypothesis.status}</span></header>
        <p>{hypothesis.question}</p>
        {hypothesis.evidence.length > 0 && <small>{hypothesis.evidence.join(" · ")}</small>}
      </article>)}
    </div>}
    {assistance === "OPERATOR" && <div className="mission-suggestion"><b>STANDARD WORKFLOW</b><span>{view.operation.assistance.operator}</span></div>}
    <div className="opsec-summary"><b>ACTIVITY SUMMARY</b><span>NETWORK {view.opsec.network}</span><span>AUTHENTICATION {view.opsec.authentication}</span><span>ENDPOINT {view.opsec.endpoint}</span></div>
  </section>;
}
