"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import RootChrome from "@/app/ui/root-chrome";
import { campaign } from "@/lib/simulation/scenarios";
import {
  campaignProgress,
  readRuns,
  readTraining,
  saveTraining,
  trainingModules,
  type LocalRun,
  type TrainingModule,
  type TrainingRecord,
} from "@/lib/campaign";

const proficiencyLabel = ["", "Introduced", "Practiced", "Demonstrated", "Proficient", "Mastered"];

export default function CareerPage() {
  const [runs, setRuns] = useState<LocalRun[]>([]);
  const [training, setTraining] = useState<TrainingRecord[]>([]);
  const [selectedId, setSelectedId] = useState(trainingModules[0].id);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setRuns(readRuns());
    setTraining(readTraining());
  }, []);

  const progress = campaignProgress(runs, training);
  const selected = trainingModules.find((module) => module.id === selectedId) ?? trainingModules[0];
  const completed = useMemo(() => new Set(progress.trainingCompleted), [progress.trainingCompleted]);
  const trustDemonstrated = (progress.proficiency["Trust relationships"] ?? 0) > 0;
  const nroAwarded = progress.certifications.includes("NRO-1");
  const nroEvaluationReady = !nroAwarded && progress.operatorModeUnlocked && trustDemonstrated && completed.has("trust-boundary");
  const incidentDemonstrated = (progress.proficiency["Incident response"] ?? 0) > 0;
  const nirAwarded = progress.certifications.includes("NIR-1");
  const nirEvaluationReady = !nirAwarded && progress.operatorModeUnlocked && incidentDemonstrated && completed.has("identity-context");

  function completeExercise(module: TrainingModule, answer: number) {
    if (answer !== module.correctChoice) {
      setFeedback("Evidence does not support that conclusion. Re-read the relationship, identity context, and business consequence.");
      return;
    }

    const record = { moduleId: module.id, completedAt: new Date().toISOString() };
    saveTraining(record);
    setTraining((records) => [...records.filter((entry) => entry.moduleId !== module.id), record]);
    setFeedback(module.debrief);
  }

  return (
    <RootChrome context="career" active="career" title="CAREER // OPERATOR DEVELOPMENT" operator="local.operator@nodeline" network="NODELINE TRAINING RANGE">
      <div className="career-grid career-hub-grid">
        <section className="panel operator-panel career-profile-card">
          <header className="panel-title">OPERATOR RECORD <span>LOCAL PROFILE</span></header>
          <div className="operator-identity">
            <div className="operator-avatar" aria-hidden="true">◇</div>
            <div>
              <h1>{progress.designation}</h1>
              <p>local.operator@nodeline</p>
              <span>Career designation earned through demonstrated operation knowledge.</span>
            </div>
            <dl>
              <dt>LEVEL</dt><dd>{progress.level}</dd>
              <dt>XP</dt><dd>{progress.xp}</dd>
              <dt>OPERATIONS</dt><dd>{progress.completed.length}/{campaign.length}</dd>
            </dl>
          </div>

          <div className="level-row">
            <strong>{progress.level}</strong>
            <div><span>OPERATOR LEVEL</span><small>{progress.xp % 250}/250 XP TO NEXT LEVEL</small><i><b style={{ width: `${(progress.xp % 250) / 2.5}%` }} /></i></div>
          </div>

          <div className="proficiency">
            <h2>DEMONSTRATED PROFICIENCY</h2>
            {trainingModules.map((module) => {
              const value = progress.proficiency[module.concept] ?? 0;
              return <div key={module.concept}><span>{module.concept}</span><i><b style={{ width: `${value * 20}%` }} /></i><em>{value ? proficiencyLabel[value] : "Not yet demonstrated"}</em></div>;
            })}
          </div>

          <blockquote>
            Training can sharpen an observation. Only a completed operation can demonstrate it.
            <small>NODELINE CAREER POLICY // KNOWLEDGE IS EVIDENCE</small>
          </blockquote>
        </section>

        <section className="panel training-range" id="training">
          <header className="panel-title">TRAINING RANGE // EVIDENCE EXERCISES <span>{completed.size}/{trainingModules.length} REVIEWED</span></header>
          <div className="training-layout">
            <nav className="training-modules" aria-label="Training exercises">
              {trainingModules.map((module) => <button key={module.id} type="button" className={module.id === selected.id ? "active" : ""} onClick={() => { setSelectedId(module.id); setFeedback(""); }}>
                <span>{completed.has(module.id) ? "✓" : "○"}</span><b>{module.concept}</b><small>{module.title}</small>
              </button>)}
            </nav>
            <article className="evidence-exercise">
              <p className="eyebrow">{selected.concept.toUpperCase()} // {completed.has(selected.id) ? "REVIEWED" : "REQUIRES REVIEW"}</p>
              <h2>{selected.title}</h2>
              <code>{selected.caseFile}</code>
              <p>{selected.prompt}</p>
              <div className="evidence-choices">
                {selected.choices.map((choice, index) => <button key={choice} type="button" onClick={() => completeExercise(selected, index)} disabled={completed.has(selected.id)}>{String.fromCharCode(65 + index)} // {choice}</button>)}
              </div>
              {completed.has(selected.id) && <p className="green-text">REVIEW RECORDED // {selected.debrief}</p>}
              {!completed.has(selected.id) && feedback && <p className="training-feedback" role="status">{feedback}</p>}
            </article>
          </div>
        </section>

        <aside className="career-rail career-development">
          <section className="panel"><header className="panel-title">CLEARANCE</header><div className="data-list">
            <b>{progress.operatorModeUnlocked ? "OPERATOR MODE CLEARED" : "GUIDED MODE REQUIRED"}</b>
            <p>{progress.operatorModeUnlocked ? "Operator Mode is now available on campaign operations. Guidance will be reduced; the simulation stays the same." : "Complete an operation and demonstrate two distinct concepts to earn Junior Operator clearance."}</p>
            <Link className="primary-button" href="/">Open operations</Link>
          </div></section>
          <section className="panel"><header className="panel-title">CERTIFICATION TRACK</header><div className="data-list">
            <article className={nroAwarded || nroEvaluationReady ? "cert-ready" : ""}><b>{nroAwarded ? "NRO-1 // AWARDED" : "NRO-1 // NETWORK RECONNAISSANCE OPERATOR"}</b><p>{nroAwarded ? "Awarded from a successful Operator Mode Paper Trail run with recorded trust-relationship evidence." : nroEvaluationReady ? "EVALUATION READY — complete Paper Trail in Operator Mode. The evidence must show a trust relationship crossing into award records." : "Requires the Trusted input review, Junior Operator clearance, and demonstrated Trust relationships."}</p>{nroEvaluationReady && <Link className="primary-button" href="/?operation=paper-trail&team=RED&assistance=OPERATOR">Begin NRO-1 evaluation</Link>}</article>
            <article className={nirAwarded || nirEvaluationReady ? "cert-ready" : ""}><b>{nirAwarded ? "NIR-1 // AWARDED" : "NIR-1 // INCIDENT RESPONDER"}</b><p>{nirAwarded ? "Awarded from a successful Blue Operator Paper Trail defense with recorded incident-response evidence." : nirEvaluationReady ? "EVALUATION READY — contain both Paper Trail record-access paths in Blue Operator Mode while preserving availability." : "Requires the Identity is not intent review, Junior Operator clearance, and demonstrated incident response."}</p>{nirEvaluationReady && <Link className="primary-button" href="/?operation=paper-trail&team=BLUE&assistance=OPERATOR">Begin NIR-1 evaluation</Link>}</article>
          </div></section>
          <section className="panel"><header className="panel-title">NEXT RECOMMENDATION</header><div className="data-list"><p>{trainingModules.find((module) => !completed.has(module.id)) ? `Review ${trainingModules.find((module) => !completed.has(module.id))!.title}, then apply that relationship in your next operation.` : "Return to Operations and demonstrate a reviewed concept under live constraints."}</p></div></section>
        </aside>
      </div>
    </RootChrome>
  );
}
