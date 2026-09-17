"use client";

import Link from "next/link";
import {
  Activity,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CircleDot,
  Files,
  FolderKanban,
  GraduationCap,
  Network,
  Radar,
  ScrollText,
  Settings,
  ShieldCheck,
  TerminalSquare,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

type Section = "career" | "operations" | "terminal" | "network" | "soc" | "alerts" | "replay";
type Tone = "neutral" | "red" | "blue" | "truth";

const navByContext = {
  career: [
    ["career", "Career", UserRound],
    ["operations", "Operations", BriefcaseBusiness],
    ["intel", "Intel", BookOpen],
    ["training", "Training", GraduationCap],
    ["files", "Files", Files],
    ["settings", "Settings", Settings],
  ],
  red: [
    ["terminal", "Terminal", TerminalSquare],
    ["network", "Network", Network],
    ["files", "Files", Files],
    ["intel", "Intel", BookOpen],
    ["sessions", "Sessions", Activity],
    ["logs", "Logs", ScrollText],
    ["operations", "Mission", CircleDot],
  ],
  blue: [
    ["terminal", "Terminal", TerminalSquare],
    ["soc", "SOC", Radar],
    ["alerts", "Alerts", Bell],
    ["cases", "Cases", FolderKanban],
    ["network", "Assets", Network],
    ["intel", "Intel", BookOpen],
    ["settings", "Settings", Settings],
  ],
  replay: [
    ["terminal", "Terminal", TerminalSquare],
    ["network", "Network", Network],
    ["files", "Files", Files],
    ["intel", "Intel", BookOpen],
    ["logs", "Logs", ScrollText],
    ["replay", "Operations", CircleDot],
  ],
} as const;

export default function RootChrome({
  context,
  active,
  tone = "neutral",
  title,
  operator = "deploy@DEV-01",
  privilege = "USER",
  network = "INTERNAL (10.20.0.0/16)",
  children,
}: {
  context: keyof typeof navByContext;
  active: Section;
  tone?: Tone;
  title: string;
  operator?: string;
  privilege?: string;
  network?: string;
  children: ReactNode;
}) {
  const navigation = navByContext[context];

  return (
    <main className={`root-shell tone-${tone}`}>
      <header className="root-topbar">
        <Link href="/" className="root-brand" aria-label="ROOT OS home">
          <span className="root-mark" aria-hidden="true"><i /><i /></span>
          <strong>ROOT/OS</strong>
          <small>v1.4.7</small>
        </Link>
        <div className="root-context">NODELINE <b>{"//"}</b> {title}</div>
        <div className="root-top-status">
          <span>UTC&nbsp;&nbsp;2026-09-18&nbsp;&nbsp;03:14:22</span>
          <strong><ShieldCheck size={13} /> SECURE</strong>
        </div>
      </header>

      <aside className="root-sidebar" aria-label="Workstation navigation">
        <nav>
          {navigation.map(([id, label, Icon]) => (
            <Link key={id} href={id === "operations" || id === "career" ? "/" : "#"} className={active === id ? "active" : ""} aria-current={active === id ? "page" : undefined}>
              <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <p>DISCIPLINE<br />CREATES<br />ACCESS.</p>
      </aside>

      <section className="root-workspace">{children}</section>

      <footer className="root-statusbar">
        <div><span>SESSION</span><i /> <b>{operator}</b></div>
        <div><span>PRIVILEGE</span><b>{privilege}</b></div>
        <div><span>NETWORK</span><b>{network}</b></div>
        <div className="root-statusbar-fill"><span>OPSEC</span><b>NOMINAL</b></div>
        <div className="root-signal" aria-label="System signal nominal"><i /></div>
        <p>{"// NO EVIDENCE. JUST RESULTS."}</p>
      </footer>
    </main>
  );
}
