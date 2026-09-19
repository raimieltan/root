"use client";
import { useCallback, useEffect, useState } from "react";
import type { ScenarioView } from "../sim-types";

export type ModuleId = "dashboard" | "alerts" | "incidents" | "hosts" | "network" | "auth" | "services" | "evidence" | "playbooks" | "reports";

export type Selection =
  | { kind: "alert"; id: string }
  | { kind: "host"; id: string }
  | { kind: "process"; id: string; hostId: string }
  | { kind: "connection"; id: string }
  | { kind: "identity"; id: string }
  | { kind: "service"; id: string }
  | { kind: "evidence"; id: string }
  | { kind: "finding"; id: string }
  | undefined;

export type ReadStatus = "NEW" | "SEEN" | "REVIEWED";

const SUSPICIOUS_PROCESS_HINTS = ["curl", "wget", " nc ", "netcat", "base64", "python -c", "powershell", "/tmp/", "chmod +x"];

export function processRisk(process: { name: string; commandLine: string | null }): "LOW" | "MEDIUM" | "HIGH" {
  const line = `${process.name} ${process.commandLine ?? ""}`.toLowerCase();
  if (SUSPICIOUS_PROCESS_HINTS.some((hint) => line.includes(hint))) return "HIGH";
  const known = ["nginx", "sshd", "postgres", "systemd", "bash", "node", "cron", "init"];
  if (!known.includes(process.name.toLowerCase())) return "MEDIUM";
  return "LOW";
}

// A host needs analyst attention when it shows isolation, suspicious/compromised
// state, active persistence, or a high-risk observed process.
export function hostNeedsAttention(machine: ScenarioView["machines"][number]) {
  if (["ISOLATED", "SUSPICIOUS", "COMPROMISED"].includes(machine.state)) return true;
  if (machine.persistence.some((artifact) => artifact.active)) return true;
  if (machine.processes.some((process) => processRisk(process) === "HIGH")) return true;
  return false;
}

export function useReadState(scenarioId: string | undefined) {
  const key = scenarioId ? `root:soc:read:${scenarioId}` : "";
  const [state, setState] = useState<Record<string, ReadStatus>>({});

  useEffect(() => {
    if (!key) return;
    try {
      const raw = sessionStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from sessionStorage, an external system, once scenarioId is known
      setState(raw ? (JSON.parse(raw) as Record<string, ReadStatus>) : {});
    } catch {
      setState({});
    }
  }, [key]);

  const persist = useCallback((next: Record<string, ReadStatus>) => {
    setState(next);
    if (key) {
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage unavailable; state still tracked in memory
      }
    }
  }, [key]);

  const status = useCallback((token: string): ReadStatus => state[token] ?? "NEW", [state]);

  const markSeen = useCallback((token: string) => {
    if (state[token]) return;
    persist({ ...state, [token]: "SEEN" });
  }, [state, persist]);

  const markReviewed = useCallback((token: string) => {
    if (state[token] === "REVIEWED") return;
    persist({ ...state, [token]: "REVIEWED" });
  }, [state, persist]);

  return { status, markSeen, markReviewed };
}

export function selectionToken(selection: Selection): string | undefined {
  if (!selection) return undefined;
  return `${selection.kind}:${selection.id}`;
}

const severityWeight: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export function highestSeverityColor(severities: string[]): "gray" | "amber" | "red" {
  const top = severities.reduce((max, severity) => (severityWeight[severity] ?? 0) > (severityWeight[max] ?? 0) ? severity : max, "LOW");
  if (top === "HIGH" || top === "CRITICAL") return "red";
  if (top === "MEDIUM") return "amber";
  return "gray";
}

export function formatWindow(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
