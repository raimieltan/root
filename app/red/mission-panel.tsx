import type { ScenarioView } from "@/app/sim-types";

const stages: Array<[keyof ScenarioView["progress"], string]> = [["scanned", "Scan WEB-01"], ["initialAccess", "Gain initial access"], ["credential", "Recover credentials"], ["devAccess", "Move to DEV-01"], ["root", "Escalate to root"], ["finApp", "Reach FIN-APP"], ["finDb", "Reach FIN-DB"], ["objective", "Retrieve PROJECT_ATLAS.pdf"]];

const suggestions: Array<[keyof ScenarioView["progress"], string]> = [
  ["scanned", "nmap portal.meridian.test"],
  ["initialAccess", "Inspect the portal, then use the matching access tool."],
  ["credential", "Inspect application configuration on WEB-01."],
  ["devAccess", "Use the discovered deploy identity to open an internal session."],
  ["root", "Inspect processes and the root-owned service configuration."],
  ["finApp", "Read the finance route available to the privileged DEV-01 session."],
  ["finDb", "Inspect FIN-APP configuration and follow the database trust relationship."],
  ["objective", "Read, then retrieve PROJECT_ATLAS.pdf."],
];

export default function MissionPanel({ view, assistance }: { view: ScenarioView; assistance: "GUIDED" | "OPERATOR" }) {
  const nextSuggestion = suggestions.find(([key]) => !view.progress[key])?.[1];
  return <section className="panel mission-panel">
    <div className="panel-title"><span>MISSION <b>{"// OPERATION GLASSHOUSE"}</b></span><span>{assistance} {"// FIN-06"}</span></div>
    <p className="eyebrow">AUTHORIZED SECURITY ASSESSMENT</p>
    <h2>Retrieve PROJECT_ATLAS.pdf</h2>
    <p className="muted">Begin with portal.meridian.test. Understand the system, establish access, and traverse Meridian&apos;s trust relationships.</p>
    {assistance === "GUIDED" && <div className="progress-list">{stages.map(([key, label], index) => <div className={view.progress[key] ? "done" : ""} key={key}><span>{view.progress[key] ? "✓" : String(index + 1).padStart(2, "0")}</span>{label}</div>)}</div>}
    {assistance === "GUIDED" && nextSuggestion && <div className="mission-suggestion"><b>NEXT HYPOTHESIS</b><code>{nextSuggestion}</code></div>}
    <div className="opsec-summary"><b>OBSERVED FOOTPRINT</b><span>NETWORK {view.opsec.network}</span><span>AUTH {view.opsec.authentication}</span><span>ENDPOINT {view.opsec.endpoint}</span></div>
  </section>;
}
