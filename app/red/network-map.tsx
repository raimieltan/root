"use client";

import type { MachineView } from "@/app/sim-types";
import { Globe2, Server } from "lucide-react";

export default function NetworkMap({ machines, current, organization = "INFRASTRUCTURE" }: { machines: MachineView[]; current?: string; organization?: string }) {
  return <section className="panel network-panel">
    <div className="panel-title"><span>Network Map <b>{organization}</b></span><span>Infrastructure</span></div>
    <div className="network-grid">
      <div className="internet-node"><Globe2 /><span>INTERNET</span></div>
      {machines.filter((machine) => machine.hostname !== "INTERNET").map((machine) => <article key={machine.id} className={`host-card ${machine.state.toLowerCase()} ${current === machine.hostname ? "current" : ""}`}>
        <Server aria-hidden="true" /><div><strong>{machine.hostname}</strong><small>{machine.ip}</small><small>{machine.services.slice(0, 2).map(service => service.name.toUpperCase()).join(" | ") || machine.zone}</small></div><div className="host-led" /><em>{machine.state}</em>
      </article>)}
    </div>
    <footer className="network-legend"><span><i className="online" /> ONLINE</span><span><i className="discovered" /> DISCOVERED</span><span><i className="flagged" /> FLAGGED</span><b>{organization}</b></footer>
  </section>;
}
