import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, Server, Shield, Swords } from "lucide-react";
import type { ReactNode } from "react";
import RootChrome from "./ui/root-chrome";

const proficiency = [
  ["Reconnaissance", 4], ["Exploitation", 3], ["Post-Exploitation", 2],
  ["Digital Forensics", 5], ["Network Defense", 3], ["Operational Security", 4],
] as const;

export default function Home() {
  return (
    <RootChrome context="career" active="operations" title="SECURITY OPERATIONS PORTAL">
      <div className="career-grid">
        <section className="panel operator-panel">
          <header className="panel-title"><span>OPERATOR PROFILE <b>{"// NODELINE SECURITY"}</b></span><button>EDIT</button></header>
          <div className="operator-identity">
            <div className="operator-avatar"><span className="root-mark large" aria-hidden="true"><i /><i /></span></div>
            <div><h1>deploy0</h1><p>Junior Operator</p><span>Nodeline Security</span></div>
            <dl><dt>OPERATOR ID</dt><dd>OP-1042-77A3</dd><dt>CLEARANCE</dt><dd>LEVEL 1</dd><dt>HOME NODE</dt><dd>DEV-01</dd></dl>
          </div>
          <div className="rank-grid">
            <article className="rank red-rank"><Swords /><span>RED RANK</span><strong>TIER 1</strong><div><i style={{ width: "12%" }} /></div><small>120 / 1,000 XP</small></article>
            <article className="rank blue-rank"><Shield /><span>BLUE RANK</span><strong>TIER 1</strong><div><i style={{ width: "26%" }} /></div><small>260 / 1,000 XP</small></article>
          </div>
          <div className="level-row"><strong>3</strong><div><span>OPERATOR LEVEL</span><i><b style={{ width: "42%" }} /></i><small>420 / 1,200 XP</small></div></div>
          <div className="proficiency"><h2>PROFICIENCY SUMMARY</h2>{proficiency.map(([label, value]) => <div key={label}><span>{label}</span><i><b style={{ width: `${value * 10}%` }} /></i><em>{value}/10</em></div>)}</div>
          <blockquote>“Access is a skill. Discipline is a multiplier.”<small>— Nodeline Security</small></blockquote>
        </section>

        <section className="panel operations-panel">
          <header className="panel-title"><span>OPERATIONS <b>{"// AVAILABLE CASES"}</b></span><span>×</span></header>
          <div className="operation-tabs"><button className="active">ALL OPERATIONS</button><button>RED TEAM</button><button>BLUE TEAM</button><button>TRAINING</button><span>SORT: RECOMMENDED⌄</span></div>
          <div className="operation-list">
            <Operation href="/red" tone="red" icon={<Swords />} title="OPERATION GLASSHOUSE" id="FIN-06" client="Meridian Dynamics" type="Red Team" difficulty="Advanced" time="2–4 hours" description="Retrieve PROJECT_ATLAS.pdf from FIN-DB inside the Meridian Dynamics infrastructure. Maintain operational security and avoid detection." tags={["INITIAL ACCESS", "LATERAL MOVEMENT", "DATA EXFILTRATION"]} />
            <Operation href="/blue" tone="blue" icon={<Shield />} title="OPERATION NIGHTSHIFT" id="LOG-03" client="Kronos Logistics" type="Blue Team" difficulty="Intermediate" time="1–2 hours" description="Investigate a suspected intrusion. Analyze shared telemetry, identify the path, contain the attacker, and preserve service availability." tags={["LOG ANALYSIS", "THREAT HUNTING", "INCIDENT RESPONSE"]} />
            <Operation href="/red" tone="amber" icon={<Server />} title="OPERATION DEAD DROP" id="CTR-02" client="Collective Research" type="Training" difficulty="Beginner" time="30–60 minutes" description="Locate and retrieve an encrypted drop from a public server. Practice safe tradecraft and document indicators of compromise." tags={["OSINT", "BASIC EXPLOITATION", "OPSEC"]} />
          </div>
        </section>

        <aside className="career-rail">
          <section className="panel"><header className="panel-title"><span>CERTIFICATIONS</span><button>VIEW ALL</button></header><div className="cert-list"><p><b>NLS-101</b><span>Operational Security<em><Check /> CERTIFIED</em></span></p><p><b>NLS-102</b><span>Linux Fundamentals<em><Check /> CERTIFIED</em></span></p><p><b>NLS-201</b><span>Network Analysis<em className="amber">● IN PROGRESS</em></span></p><p><b>NLS-202</b><span>Web Application Exploitation<em className="muted"><LockKeyhole /> LOCKED</em></span></p></div></section>
          <section className="panel"><header className="panel-title"><span>RECENT ACTIVITY</span><button>VIEW ALL</button></header><div className="activity-list"><p><i className="green" />Completed training module<small>Linux Fundamentals // 14:02</small></p><p><i className="amber" />Accessed operation brief<small>Operation Glasshouse // 12:41</small></p><p><i className="blue" />Submitted incident report<small>Simulated Phishing // Yesterday</small></p><p><i className="green" />Earned achievement<small>First Footprint // Yesterday</small></p></div></section>
          <section className="panel"><header className="panel-title"><span>KNOWLEDGE TRACKER</span><button>VIEW ALL</button></header><div className="knowledge-list"><p><b>T1055</b><span>Process Injection</span><em>2/3</em></p><p><b>T1078</b><span>Valid Accounts</span><em>1/3</em></p><p className="complete"><b>T1059</b><span>Command &amp; Scripting</span><em>3/3</em></p><p><b>T1041</b><span>Exfiltration Over C2</span><em>1/3</em></p></div></section>
        </aside>
      </div>
    </RootChrome>
  );
}

function Operation({ href, tone, icon, title, id, client, type, difficulty, time, description, tags }: { href: string; tone: string; icon: ReactNode; title: string; id: string; client: string; type: string; difficulty: string; time: string; description: string; tags: string[] }) {
  return <Link href={href} className={`operation-row ${tone}`}><div className="operation-art">{icon}<small>NODELINE<br />CASE FILE</small></div><div className="operation-content"><header><h2>{title}</h2><span>ID: {id} <ArrowRight /></span></header><dl><dt>CLIENT</dt><dd>{client}</dd><dt>TYPE</dt><dd>{type}</dd><dt>DIFFICULTY</dt><dd>{difficulty}</dd><dt>EST. TIME</dt><dd>{time}</dd></dl><h3>OBJECTIVE</h3><p>{description}</p><footer>{tags.map(tag => <span key={tag}>{tag}</span>)}</footer></div></Link>;
}
