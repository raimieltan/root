import type { ScenarioView } from "@/app/sim-types";

export default function MissionPanel({ view, assistance }: { view: ScenarioView; assistance: "GUIDED" | "OPERATOR" }) {
  return <section className="panel mission-panel">
    <div className="panel-title"><span>MISSION <b>{view.operation.name}</b></span><span>{assistance} // {view.operation.presentation.caseId}</span></div>
    <p className="eyebrow">AUTHORIZED SECURITY ASSESSMENT</p>
    <h2>{view.guidance.objective}</h2>
    <p className="muted">{view.operation.briefing.red}</p>
    {assistance === "GUIDED" && view.operation.assistance.guided.map((hint) => <p key={hint}>{hint}</p>)}
    {assistance === "GUIDED" && <div className="hypothesis-list">
      <div className="hypothesis-intro"><b>COMPETING HYPOTHESES</b><span>Either may reach the objective. Neither is prescribed.</span></div>
      {view.guidance.hypotheses.map((hypothesis) => <article key={hypothesis.id} className={hypothesis.status.toLowerCase()}>
        <header><b>{hypothesis.title}</b><span>{hypothesis.status}</span></header>
        <p>{hypothesis.question}</p>
        {hypothesis.evidence.length > 0 && <small>{hypothesis.evidence.join(" · ")}</small>}
      </article>)}
    </div>}
    {assistance === "OPERATOR" && <div className="mission-suggestion"><b>OPERATOR MODE</b><span>Interpret services, identities, files, and trust relationships without route prompts.</span></div>}
    <div className="opsec-summary"><b>OBSERVED FOOTPRINT</b><span>NETWORK {view.opsec.network}</span><span>AUTH {view.opsec.authentication}</span><span>ENDPOINT {view.opsec.endpoint}</span></div>
  </section>;
}
