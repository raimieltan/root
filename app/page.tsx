"use client";

import Link from "next/link";
import { Archive, CheckSquare, Clock3, FileText, FolderOpen, Inbox, Search, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import RootChrome from "./ui/root-chrome";
import { RootPane, RootTable, RootTabs, RootTree } from "./ui/root-os";
import { campaign, operationPresentation, type OperationPresentation } from "@/lib/simulation/scenarios";
import { campaignProgress, readRuns, type LocalRun } from "@/lib/campaign";

const engagementId = (operation: OperationPresentation) => `ENG-${String(1000 + operation.presentation.order * 7).padStart(4, "0")}`;

export default function Home() {
  const [operations] = useState<OperationPresentation[]>(() => campaign.map(operationPresentation));
  const [runs, setRuns] = useState<LocalRun[]>([]);
  const [selected, setSelected] = useState("glasshouse");
  const [mode, setMode] = useState<"RED" | "BLUE">("RED");
  const [assistance, setAssistance] = useState("GUIDED");
  const [detailTab, setDetailTab] = useState("overview");

  useEffect(() => {
    const savedRuns = readRuns();
    const params = new URLSearchParams(location.search);
    const requestedOperation = params.get("operation");
    if (requestedOperation && operations.some((operation) => operation.id === requestedOperation)) setSelected(requestedOperation);
    if (params.get("team") === "BLUE") setMode("BLUE");
    if (params.get("assistance") === "OPERATOR" && campaignProgress(savedRuns).operatorModeUnlocked) setAssistance("OPERATOR");
    setRuns(savedRuns);
  }, [operations]);

  const progress = campaignProgress(runs);
  const operation = operations.find((entry) => entry.id === selected) ?? operations[0];
  const unlocked = !operation.presentation.prerequisite || progress.completed.includes(operation.presentation.prerequisite);
  const statusFor = (entry: OperationPresentation) => {
    if (entry.presentation.prerequisite && !progress.completed.includes(entry.presentation.prerequisite)) return "Access Restricted";
    if (runs.some((run) => run.definitionId === entry.id && !run.result)) return "In Progress";
    if (progress.completed.includes(entry.id)) return "Completed";
    return "Assigned";
  };

  return <RootChrome context="operations" active="operations" title="Work queue synchronized" operator="stan.tan" network="NODELINE / TRAINING">
    <div className="application-split operations-desk">
      <RootTree title="Work Queues" footer={<><button type="button"><Search size={15} />Search</button><button type="button"><Settings size={15} />Settings</button></>}>
        <button type="button" className="active"><Inbox size={15} />My Queue</button>
        <button type="button"><FolderOpen size={15} />All Assignments</button>
        <button type="button"><Clock3 size={15} />In Progress</button>
        <button type="button"><FileText size={15} />Awaiting Review</button>
        <button type="button"><CheckSquare size={15} />Completed</button>
        <button type="button"><Archive size={15} />Case Archive</button>
      </RootTree>

      <div className="application-main operations-main">
        <div className="desk-filterbar"><span>Assigned work</span><label>Environment <select defaultValue="all"><option value="all">All Environments</option><option>Client</option><option>Training Simulation</option></select></label><label>Status <select defaultValue="open"><option value="open">Open</option><option>Completed</option><option>All</option></select></label></div>
        <RootPane className="assignment-pane" title="Assigned Engagements" actions={<span>{operations.length} records</span>}>
          <RootTable><thead><tr><th>ID</th><th>Title</th><th>Client / Environment</th><th>Priority</th><th>Status</th><th>Review</th></tr></thead><tbody>
            {operations.map((entry) => { const locked = statusFor(entry) === "Access Restricted"; const completed = statusFor(entry) === "Completed"; return <tr key={entry.id} className={selected === entry.id ? "selected" : ""} onClick={() => setSelected(entry.id)}><td className="mono">{engagementId(entry)}</td><td>{entry.name}</td><td>{entry.organization}</td><td className={locked ? "state-warn" : ""}>{locked ? "Restricted" : entry.presentation.order > 5 ? "High" : "Normal"}</td><td className={completed ? "state-good" : locked ? "state-warn" : ""}>{statusFor(entry)}</td><td>{entry.presentation.order <= 3 ? "18 Sep" : "Pending"}</td></tr>; })}
          </tbody></RootTable>
        </RootPane>

        <section className="engagement-details">
          <RootTabs label="Engagement details" active={detailTab} onChange={setDetailTab} items={[{ id: "overview", label: "Overview" }, { id: "files", label: "Files" }, { id: "discussion", label: "Discussion" }, { id: "related", label: "Related" }]} />
          <div className="engagement-detail-body">
            <div className="engagement-summary">
              <header><span className="mono">{engagementId(operation)}</span><h1>{operation.name}</h1><span className={unlocked ? "state-good" : "state-warn"}>{unlocked ? statusFor(operation) : "Access Restricted"}</span></header>
              {detailTab === "overview" && <><dl><dt>Client</dt><dd>{operation.organization}</dd><dt>Environment</dt><dd>Training Simulation</dd><dt>Owner</dt><dd>{mode === "RED" ? "Offensive Operations" : "Security Operations"}</dd><dt>Clearance</dt><dd>{unlocked ? "C1 — Authorized" : "C2 required"}</dd></dl><h2>Summary</h2><p>{mode === "RED" ? operation.briefing.red : operation.briefing.blue}</p><h2>Authorized constraints</h2>{operation.briefing.constraints.map((constraint) => <p key={constraint}>• {constraint}</p>)}</>}
              {detailTab === "files" && <p>Engagement brief, scope authorization, and environment notes are attached to this record.</p>}
              {detailTab === "discussion" && <p>No unresolved supervisor messages.</p>}
              {detailTab === "related" && <p>Related records become available after evidence is submitted for review.</p>}
            </div>
            <aside className="engagement-actions">
              <h2>Workspace Configuration</h2>
              <label>Assignment <select value={mode} onChange={(event) => setMode(event.target.value as "RED" | "BLUE")}>{operation.availableModes.map((value) => <option value={value} key={value}>{value === "RED" ? "Authorized Assessment" : "Incident Response"}</option>)}</select></label>
              <label>Workflow Mode <select value={assistance} onChange={(event) => setAssistance(event.target.value)}><option value="GUIDED">Assisted</option><option value="OPERATOR" disabled={!progress.operatorModeUnlocked}>Standard {!progress.operatorModeUnlocked ? "— qualification required" : ""}</option></select></label>
              <p>{assistance === "GUIDED" ? "Contextual analyst notes and procedure references are available." : operation.assistance.operator}</p>
              {unlocked ? <Link className="primary-button open-workspace" href={`/${mode.toLowerCase()}?operation=${operation.id}&assistance=${assistance}`}>Open in Workspace</Link> : <p className="state-warn">Access requires completion of {operation.presentation.prerequisite} and the associated clearance review.</p>}
              <h2>Attachments (3)</h2><ul><li>scope_authorization.pdf</li><li>environment_notes.txt</li><li>rules_of_engagement.pdf</li></ul>
            </aside>
          </div>
        </section>
      </div>
    </div>
  </RootChrome>;
}
