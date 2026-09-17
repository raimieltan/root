export type EventLike = {
  action: string;
  severity: string;
  timestamp: Date | string;
  visibleToRed: boolean;
  visibleToBlue: boolean;
  targetMachine?: { hostname: string } | null;
  sourceMachine?: { hostname: string } | null;
  userId?: string | null;
  metadata?: string | null;
};

export type AlertView = {
  id: string;
  ruleId: string;
  title: string;
  severity: string;
  summary: string;
  timestamp: string;
  rationale: string;
  evidenceEventId?: string;
};

export type DetectionRule = {
  id: string;
  title: string;
  severity: string;
  rationale: string;
};

const detectionRules: Record<string, DetectionRule> = {
  PORT_SCAN_DETECTED: { id: "NET-SCAN-01", title: "Port scan", severity: "LOW", rationale: "Multiple service probes reached the same host in a short interval." },
  EXPLOIT_EXECUTED: { id: "WEB-EXEC-01", title: "Suspicious web activity", severity: "MEDIUM", rationale: "An unusual web request was followed by server-side process execution." },
  PRIVILEGED_CONFIG_MODIFIED: { id: "PRIV-SVC-CONFIG-01", title: "Privileged configuration changed", severity: "HIGH", rationale: "A non-root identity modified input trusted by a privileged service." },
  PRIVILEGE_ESCALATION: { id: "PRIV-ESC-01", title: "Privilege escalation", severity: "HIGH", rationale: "A user session was followed by a new root-level session on the same host." },
  LATERAL_MOVEMENT: { id: "AUTH-LATERAL-01", title: "Unusual internal login", severity: "MEDIUM", rationale: "A valid identity authenticated from a machine relationship not seen in normal activity." },
  OBJECTIVE_RETRIEVED: { id: "FIN-DATA-01", title: "Sensitive finance access", severity: "HIGH", rationale: "A protected finance document was read and transferred from the database host." },
  AGENT_BEACON: { id: "C2-BEACON-01", title: "Persistent outbound beacon", severity: "HIGH", rationale: "A new process began periodic outbound communication." },
};

export function detectionForAction(action: string) {
  return detectionRules[action];
}

export function alertsFromEvents(events: Array<EventLike & { id?: string }>): AlertView[] {
  const hasRecordedDetections = events.some((event) => event.action === "DETECTION_TRIGGERED");
  return events.flatMap((event, index) => {
    if (hasRecordedDetections && event.action !== "DETECTION_TRIGGERED") return [];
    const metadata = parseMetadata(event.metadata);
    const recordedRule = event.action === "DETECTION_TRIGGERED" && typeof metadata.ruleId === "string"
      ? {
          id: metadata.ruleId,
          title: typeof metadata.title === "string" ? metadata.title : "Detection rule",
          severity: typeof metadata.severity === "string" ? metadata.severity : event.severity,
          rationale: typeof metadata.rationale === "string" ? metadata.rationale : "Recorded detection rule matched simulation evidence.",
        }
      : undefined;
    const rule = recordedRule ?? detectionRules[event.action];
    if (!rule || !event.visibleToBlue) return [];
    const source = event.sourceMachine?.hostname ?? "unknown source";
    const target = event.targetMachine?.hostname ?? "unknown target";
    return [{
      id: event.id ?? `${event.action}-${index}`,
      ruleId: rule.id,
      title: rule.title,
      severity: rule.severity,
      summary: `${source} → ${target}${event.userId ? ` as ${event.userId}` : ""}`,
      timestamp: new Date(event.timestamp).toISOString(),
      rationale: rule.rationale,
      evidenceEventId: typeof metadata.evidenceEventId === "string" ? metadata.evidenceEventId : event.id,
    }];
  });
}

export function suspicionFromEvents(events: EventLike[]) {
  const weights: Record<string, number> = { INFO: 1, LOW: 4, MEDIUM: 9, HIGH: 16, CRITICAL: 24 };
  const recordedDetections = events.filter((event) => event.action === "DETECTION_TRIGGERED" && event.visibleToBlue);
  const evidence = recordedDetections.length ? recordedDetections : events.filter((event) => event.visibleToBlue);
  return Math.min(100, evidence.reduce((score, event) => score + (weights[event.severity] ?? 0), 0));
}

export function parseMetadata(metadata?: string | null): Record<string, unknown> {
  if (!metadata) return {};
  try { return JSON.parse(metadata) as Record<string, unknown>; } catch { return {}; }
}
