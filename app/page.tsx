"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import RootChrome from "./ui/root-chrome";
import { campaign, operationPresentation, type OperationPresentation } from "@/lib/simulation/scenarios";
import { campaignProgress, readRuns, type LocalRun } from "@/lib/campaign";

export default function Home() {
  const [operations] = useState<OperationPresentation[]>(() => campaign.map(operationPresentation));
  const [runs, setRuns] = useState<LocalRun[]>([]);
  const [selected, setSelected] = useState("glasshouse");
  const [mode, setMode] = useState<"RED" | "BLUE">("RED");
  const [assistance, setAssistance] = useState("GUIDED");
  useEffect(() => { setRuns(readRuns()); }, []);
  const progress = campaignProgress(runs);
  const operation = operations.find((o) => o.id === selected);
  const unlocked = !operation?.presentation.prerequisite || progress.completed.includes(operation.presentation.prerequisite);
  return <RootChrome context="career" active="operations" title="CAMPAIGN // SECURITY OPERATIONS" operator="local.operator@nodeline" network="TRAINING ENVIRONMENT">
    <div className="career-grid">
      <section className="panel operator-panel"><header className="panel-title">LOCAL OPERATOR PROFILE</header><div className="data-list"><h1>Operator level {progress.level}</h1><p>{progress.xp} experience · {progress.completed.length}/3 operations completed</p><p>Progress is saved in this browser. Knowledge demonstrations and distinct outcomes earn experience.</p><h2>Proficiency</h2>{Object.entries(progress.proficiency).map(([concept, value]) => <p key={concept}>{concept} <b>{["Introduced", "Practiced", "Demonstrated", "Proficient", "Mastered"][value - 1]}</b></p>)}{!Object.keys(progress.proficiency).length && <p className="muted">Complete an operation to record demonstrated knowledge.</p>}{progress.completed.length === 3 && <strong className="green-text">MVP CAMPAIGN COMPLETE</strong>}</div></section>
      <section className="panel operations-panel"><header className="panel-title">OPERATIONS // CAMPAIGN ARC</header>
        <div className="operation-list">{operations.map((entry) => {
          const locked = entry.presentation.prerequisite && !progress.completed.includes(entry.presentation.prerequisite);
          return <button key={entry.id} className={`operation-row ${selected === entry.id ? "selected" : ""}`} onClick={() => setSelected(entry.id)} aria-pressed={selected === entry.id}><div className="operation-content"><header><h2>{entry.name}</h2><span>{locked ? "LOCKED" : progress.completed.includes(entry.id) ? "COMPLETED" : "AVAILABLE"}</span></header><p>{entry.organization} // {entry.presentation.caseId}</p><p>{entry.presentation.focus.join(" · ")}</p>{["RED", "BLUE"].map((team) => { const wins = runs.filter((r) => r.definitionId === entry.id && r.mode === team && r.result?.won); return <small key={team}>{team}: {wins.length ? `completed · best availability ${Math.max(...wins.map((r) => r.result!.availability))}% · ${[...new Set(wins.map((r) => r.assistance))].join(" / ")}` : "not completed"} </small>; })}</div></button>;
        })}</div>
        {operation && <div className="data-list"><h2>{operation.name} // BRIEFING</h2><div className="app-tabs" aria-label="Operation mode">{operation.availableModes.map((value) => <button key={value} className={mode === value ? "active" : ""} onClick={() => setMode(value)}>{value === "RED" ? "Red Team" : "Blue Team"}</button>)}</div><p>{mode === "RED" ? operation.briefing.red : operation.briefing.blue}</p>{operation.briefing.constraints.map((constraint) => <p key={constraint}>{constraint}</p>)}<label>Assistance <select value={assistance} onChange={(e) => setAssistance(e.target.value)}><option value="GUIDED">Guided</option><option value="OPERATOR">Operator</option></select></label><p>{assistance === "GUIDED" ? "Contextual hypotheses and investigation guidance." : operation.assistance.operator}</p>{unlocked ? <Link className="primary-button" href={`/${mode.toLowerCase()}?operation=${operation.id}&assistance=${assistance}`}>Launch {operation.name}</Link> : <p>Complete {operation.presentation.prerequisite} from Red or Blue to unlock this operation.</p>}</div>}
      </section>
      <aside className="career-rail"><section className="panel"><header className="panel-title">REPLAY LIBRARY // LOCAL HISTORY</header><div className="data-list">{runs.slice().reverse().map((run) => <article key={run.scenarioId}><b>{operations.find((o) => o.id === run.definitionId)?.name ?? run.definitionId}</b><p>{run.mode} · {run.assistance} · {run.result ? run.result.won ? "SUCCESS" : "FAILED" : "IN PROGRESS"}</p>{run.result && <p>{run.result.route ?? "Unresolved route"} · {run.result.detected ? "Detected" : "No recorded detection"}</p>}<Link href={run.result ? `/replay/${run.scenarioId}?actor=${run.actorId}` : `/${run.mode.toLowerCase()}?run=${run.scenarioId}`}>{run.result ? "Open reconstruction" : "Resume operation"}</Link></article>)}{!runs.length && <p>No recorded operations.</p>}</div></section></aside>
    </div>
  </RootChrome>;
}
