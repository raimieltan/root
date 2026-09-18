"use client";

import { Award, BriefcaseBusiness, FileText, Gauge, GraduationCap, KeyRound, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RootChrome from "@/app/ui/root-chrome";
import { RootPane, RootTable, RootTabs, RootTree } from "@/app/ui/root-os";
import { campaign } from "@/lib/simulation/scenarios";
import { campaignProgress, readRuns, readTraining, saveTraining, trainingModules, type LocalRun, type TrainingModule, type TrainingRecord } from "@/lib/campaign";

const proficiencyLabel = ["Unassessed", "Introduced", "Practiced", "Demonstrated", "Proficient", "Advanced"];

export default function CareerPage() {
  const [runs, setRuns] = useState<LocalRun[]>([]);
  const [training, setTraining] = useState<TrainingRecord[]>([]);
  const [selectedId, setSelectedId] = useState(trainingModules[0].id);
  const [section, setSection] = useState("overview");
  const [feedback, setFeedback] = useState("");
  useEffect(() => { setRuns(readRuns()); setTraining(readTraining()); }, []);

  const progress = campaignProgress(runs, training);
  const selected = trainingModules.find((module) => module.id === selectedId) ?? trainingModules[0];
  const completed = useMemo(() => new Set(progress.trainingCompleted), [progress.trainingCompleted]);
  const trustDemonstrated = (progress.proficiency["Trust relationships"] ?? 0) > 0;
  const nroAwarded = progress.certifications.includes("NRO-1");
  const nroEvaluationReady = !nroAwarded && progress.operatorModeUnlocked && trustDemonstrated && completed.has("trust-boundary");
  const incidentDemonstrated = (progress.proficiency["Incident response"] ?? 0) > 0;
  const nirAwarded = progress.certifications.includes("NIR-1");
  const nirEvaluationReady = !nirAwarded && progress.operatorModeUnlocked && incidentDemonstrated && completed.has("identity-context");
  const grade = progress.level >= 10 ? "O-3" : progress.level >= 5 ? "O-2" : "O-1";

  function completeExercise(module: TrainingModule, answer: number) {
    if (answer !== module.correctChoice) { setFeedback("The available evidence does not support that conclusion. Review the relationship, identity context, and business consequence."); return; }
    const record = { moduleId: module.id, completedAt: new Date().toISOString() };
    saveTraining(record); setTraining((records) => [...records.filter((entry) => entry.moduleId !== module.id), record]); setFeedback(module.debrief);
  }

  const nav = [["overview", "Profile", UserRound], ["employment", "Employment", BriefcaseBusiness], ["training", "Training", GraduationCap], ["certifications", "Certifications", Award], ["competencies", "Competencies", Gauge], ["access", "Clearance & Access", KeyRound], ["performance", "Performance", FileText]] as const;

  return <RootChrome context="career" active="career" title="Personnel record available" operator="stan.tan" network="NODELINE / CORPORATE">
    <div className="application-split employee-portal">
      <RootTree title="Employee Self-Service" footer={<button type="button">Settings</button>}>
        {nav.map(([id, label, Icon]) => <button type="button" key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}><Icon size={15} />{label}</button>)}
      </RootTree>
      <div className="employee-main">
        <header className="employee-header">
          <div className="employee-photo" aria-label="Employee photo">ST</div>
          <div className="employee-identity"><h1>Sean Raimiel Tan</h1><h2>{progress.designation === "Recruit" ? "Associate Security Operator" : progress.designation}</h2><dl><dt>Employee ID</dt><dd>NS-1073</dd><dt>Email</dt><dd>stan.tan@nodeline.local</dd><dt>Location</dt><dd>Manila, PH</dd><dt>Department</dt><dd>Operations</dd></dl></div>
          <div className="employee-record"><dl><dt>Employee Grade</dt><dd><strong>{grade}</strong></dd><dt>Professional Development</dt><dd><div className="portal-progress"><i style={{ width: `${Math.min(100, progress.xp / 10)}%` }} /></div>{progress.xp} / 1,000</dd><dt>Clearance Status</dt><dd className="state-good">{progress.operatorModeUnlocked ? "C2 — Active" : "C1 — Active"}</dd><dt>Employment Type</dt><dd>Full-time</dd><dt>Hire Date</dt><dd>14 Mar 2024</dd></dl></div>
        </header>
        <RootTabs label="Employee record sections" active={section} onChange={setSection} items={[{ id: "overview", label: "Overview" }, { id: "training", label: "Training" }, { id: "certifications", label: "Certifications" }, { id: "access", label: "Access" }, { id: "performance", label: "Performance" }, { id: "employment", label: "Activity" }]} />

        <div className="employee-content">
          {section === "training" ? <div className="training-workspace">
            <RootPane title={`Assigned Training — ${completed.size}/${trainingModules.length} reviewed`}><nav className="training-module-list">{trainingModules.map((module) => <button key={module.id} className={module.id === selected.id ? "active" : ""} onClick={() => { setSelectedId(module.id); setFeedback(""); }}><span>{completed.has(module.id) ? "Complete" : "Assigned"}</span><b>{module.title}</b><small>{module.concept}</small></button>)}</nav></RootPane>
            <RootPane title={`Procedure Review — ${selected.title}`}><article className="training-document"><code>{selected.caseFile}</code><h2>{selected.prompt}</h2>{selected.choices.map((choice, index) => <button key={choice} onClick={() => completeExercise(selected, index)} disabled={completed.has(selected.id)}>{String.fromCharCode(65 + index)}. {choice}</button>)}{completed.has(selected.id) && <p className="state-good">Training record updated. {selected.debrief}</p>}{!completed.has(selected.id) && feedback && <p className="state-warn">{feedback}</p>}</article></RootPane>
          </div> : <>
            <RootPane className="employee-certifications" title={section === "competencies" ? "Competency Framework" : "Certifications and Qualifications"}>
              {section === "competencies" ? <RootTable><thead><tr><th>Competency</th><th>Assessment</th><th>Evidence</th></tr></thead><tbody>{trainingModules.map((module) => { const value = progress.proficiency[module.concept] ?? 0; return <tr key={module.concept}><td>{module.concept}</td><td>{proficiencyLabel[value]}</td><td>{value ? "Operational record" : "No assessment recorded"}</td></tr>; })}</tbody></RootTable> : <RootTable><thead><tr><th>Name</th><th>Issuer</th><th>Status</th><th>Requirement</th></tr></thead><tbody>
                <tr><td>NRO-1 — Network Reconnaissance Operator</td><td>Nodeline</td><td className={nroAwarded ? "state-good" : nroEvaluationReady ? "state-warn" : ""}>{nroAwarded ? "Current" : nroEvaluationReady ? "Assessment Available" : "Not Held"}</td><td>Trusted input review / operational evidence</td></tr>
                <tr><td>NIR-1 — Network Incident Responder</td><td>Nodeline</td><td className={nirAwarded ? "state-good" : nirEvaluationReady ? "state-warn" : ""}>{nirAwarded ? "Current" : nirEvaluationReady ? "Assessment Available" : "Not Held"}</td><td>Identity review / incident response evidence</td></tr>
                <tr><td>SEC-OPS Fundamentals</td><td>Nodeline</td><td className="state-good">Current</td><td>New employee orientation</td></tr>
              </tbody></RootTable>}
            </RootPane>
            <aside className="employee-side"><RootPane title="Access and Development"><div className="portal-properties"><p><b>Standard workflow</b><span>{progress.operatorModeUnlocked ? "Authorized" : "Training required"}</span></p><p><b>Completed engagements</b><span>{progress.completed.length} / {campaign.length}</span></p><p><b>Training reviews</b><span>{completed.size} / {trainingModules.length}</span></p></div><Link className="primary-button" href="/">Open Operations Desk</Link></RootPane><RootPane title="Upcoming Training"><ul><li>Advanced Threat Analysis</li><li>Windows Forensics</li><li>Evidence Handling Review</li></ul></RootPane></aside>
          </>}
        </div>
      </div>
    </div>
  </RootChrome>;
}
