"use client";

import Link from "next/link";
import { Archive, BookOpen, BriefcaseBusiness, Building2, FileText, FolderLock, HardDrive, Monitor, Network, RadioTower, Settings, ShieldCheck, Trash2, UserRound, Volume2, VolumeX } from "lucide-react";
import { FormEvent, type PointerEvent, type ReactNode, useEffect, useState } from "react";
import { playAudio } from "@/lib/audio/audio-system";
import { AudioControlPanel, AudioVisualIndicator, useRootAudio } from "./audio-control";
import { RootWindow } from "./root-os";

type Section = "career" | "operations" | "terminal" | "network" | "soc" | "alerts" | "replay";
type Tone = "neutral" | "red" | "blue" | "truth";

const appInfo = {
  operations: { title: "Operations Desk - ROOT/OS", menu: ["File", "View", "Engagement", "Tools", "Help"] },
  career: { title: "Employee Portal - Nodeline Security", menu: ["File", "View", "HR", "Learning", "Help"] },
  red: { title: "Engagement Workspace - ROOT/OS", menu: ["File", "Edit", "View", "Tools", "Window", "Help"] },
  blue: { title: "Security Operations Center - ROOT/OS", menu: ["File", "View", "Alerts", "Investigation", "Response", "Help"] },
  replay: { title: "After-Action Review - ROOT/OS", menu: ["File", "View", "Timeline", "Evidence", "Export", "Help"] },
} as const;

const shortcuts = [
  ["/", "Computer", Monitor], ["/", "Operations Desk", BriefcaseBusiness],
  ["/red", "Engagement Tools", FolderLock], ["/blue", "SOC Console", RadioTower],
  ["/career", "Employee Portal", UserRound], ["/", "Case Archive", Archive],
  ["/", "Documentation", BookOpen], ["/", "Trash", Trash2],
] as const;

function Clock() {
  const [now, setNow] = useState<Date>();
  useEffect(() => { const update = () => setNow(new Date()); update(); const timer = window.setInterval(update, 30_000); return () => window.clearInterval(timer); }, []);
  return <time suppressHydrationWarning>{now ? now.toLocaleDateString(undefined, { month: "short", day: "2-digit" }) : "—"} &nbsp; {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}</time>;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("stan.tan");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) { setError("Operator ID and password are required."); void playAudio("auth.failure"); return; }
    sessionStorage.setItem("root:workstation-authenticated", "true");
    void playAudio("auth.success");
    onLogin();
  };
  return <div className="os-login"><section className="os-login-dialog" aria-labelledby="login-title">
    <header className="os-login-head"><div className="os-login-mark">N</div><strong>NODELINE SECURITY</strong><h1 id="login-title">ROOT/OS</h1><p>Secure Operations Workstation</p></header>
    <form onSubmit={submit}><label>Username<input autoFocus value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input type="password" value={password} autoComplete="current-password" onFocus={() => void playAudio("auth.prompt")} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="os-login-error" role="alert">{error}</p>}<button type="submit">Log In</button></form>
    <footer className="os-login-foot"><span>Version 1.4.7</span><span>Authorized Use Only</span></footer>
  </section></div>;
}

export default function RootChrome({ context, tone = "neutral", title, operator = "stan.tan", privilege = "OPERATOR", network = "NODELINE", children }: {
  context: keyof typeof appInfo; active: Section; tone?: Tone; title: string; operator?: string; privilege?: string; network?: string; children: ReactNode;
}) {
  const [startOpen, setStartOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const audio = useRootAudio();
  useEffect(() => setAuthenticated(sessionStorage.getItem("root:workstation-authenticated") === "true"), []);
  useEffect(() => { if (authenticated) void playAudio("ui.window.open"); }, [authenticated, context]);
  const info = appInfo[context];
  const appTitle = context === "red" && title ? `${info.title.replace(" - ROOT/OS", "")} - ${title}` : info.title;

  const handleDesktopPointer = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target : undefined;
    if (!target || target.closest(".audio-dialog") || target.closest(".os-login")) return;
    if (target.closest("a")) void playAudio("ui.app.launch");
    else if (target.closest("button, [role='tab']")) void playAudio("ui.click");
  };

  return <div className={`os-desktop tone-${tone}`} onPointerDownCapture={handleDesktopPointer} onClick={() => startOpen && setStartOpen(false)}>
    <div className="os-wallpaper-brand" aria-hidden="true"><b>N</b><strong>NODELINE SECURITY</strong><small>PEOPLE. INFORMATION. RESILIENCE.</small></div>
    <dl className="os-machine-meta"><dt>Host</dt><dd>ROOT-WS-27</dd><dt>User</dt><dd>stan.tan</dd><dt>Domain</dt><dd>NODELINE</dd><dt>IP</dt><dd>10.20.14.27</dd></dl>
    <div className="os-shortcuts" aria-label="Desktop shortcuts">{shortcuts.map(([href, label, Icon]) => <Link className="os-shortcut" href={href} key={label}><span className="os-shortcut-icon"><Icon size={22} strokeWidth={1.5} /></span><span>{label}</span></Link>)}</div>
    <main className={`root-shell tone-${tone}`}><section className="root-workspace"><RootWindow title={appTitle} menu={[...info.menu]} status={<><span>{title}</span><span>Session: {operator}</span><span>Privilege: {privilege}</span><span>Network: {network}</span></>}>{children}</RootWindow></section></main>

    {startOpen && <section className="os-start-menu" onClick={(event) => event.stopPropagation()}><header><strong>ROOT/OS</strong><span>stan.tan · NODELINE</span></header><nav>
      <Link href="/"><BriefcaseBusiness size={16} />Operations Desk</Link><Link href="/red"><FolderLock size={16} />Engagement Workspace</Link><Link href="/blue"><RadioTower size={16} />Security Operations Center</Link><hr />
      <Link href="/career"><UserRound size={16} />Employee Portal</Link><Link href="/"><Archive size={16} />After-Action Review</Link><hr />
      <button className="submenu" type="button"><Network size={16} />System Tools</button><button className="submenu" type="button"><ShieldCheck size={16} />Administration</button><button className="submenu" type="button"><HardDrive size={16} />Accessories</button><hr />
      <button type="button" onClick={() => { setAudioOpen(true); setStartOpen(false); }}><Settings size={16} />Sound and Audio Devices</button><button type="button"><BookOpen size={16} />Help &amp; Documentation</button><hr />
      <button type="button" onClick={() => { void playAudio("ui.window.close"); setAuthenticated(false); }}><Building2 size={16} />Lock Workstation</button><button type="button" onClick={() => { void playAudio("ui.window.close"); sessionStorage.removeItem("root:workstation-authenticated"); setAuthenticated(false); }}><FileText size={16} />Log Out...</button>
    </nav></section>}

    <footer className="os-taskbar"><button className="os-start-button" type="button" aria-expanded={startOpen} onClick={(event) => { event.stopPropagation(); setStartOpen((value) => !value); }}><span aria-hidden="true">N</span> ROOT</button><button className="os-task-button" type="button"><span className="os-title-icon">N</span>{info.title.split(" - ")[0]}</button><div className="os-task-tray"><span className="os-tray-led" /><span>LAN</span><button className="os-audio-tray" type="button" aria-label="Open sound settings" title="Sound and Audio Devices" onClick={() => setAudioOpen(true)}>{audio.settings.enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button><ShieldCheck size={14} /><Clock /></div></footer>
    <AudioVisualIndicator />
    {audioOpen && <AudioControlPanel onClose={() => { void playAudio("ui.window.close"); setAudioOpen(false); }} />}
    {authenticated === false && <LoginScreen onLogin={() => setAuthenticated(true)} />}
  </div>;
}
