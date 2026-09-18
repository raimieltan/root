export type MachineView = { id: string; hostname: string; ip: string; zone: string; os: string; state: string; availability: string; services: Array<{ name: string; port: number; status: string }>; processes: Array<{ id: string; name: string; pid: number; runningAs: string; commandLine: string | null }>; files: Array<{ path: string; owner: string; permissions: string; isSecret: boolean }>; persistence: Array<{ id: string; type: string; active: boolean }> };
export type EventView = { id: string; timestamp: string; category: string; action: string; severity: string; source: string | null; target: string | null; userId: string | null; metadata: Record<string, unknown>; visibleToRed: boolean; visibleToBlue: boolean };
export type ScenarioView = {
  operation: import("@/lib/simulation/scenarios").OperationPresentation;
  assistance: "GUIDED" | "OPERATOR";
  availability: { percent: number; services: Array<{ name: string; hosts: string[]; impact: string; state: string }> };
  connections: Array<{ id: string; source: string; target: string; port: number; allowed: boolean }>;
  investigation: Array<{
    id: string; name: string; hypothesis: string; status: "OPEN" | "SUPPORTED" | "CONTAINED";
    evidence: {
      hosts: string[]; identities: string[]; processes: string[];
      connections: Array<{ id: string; source: string; target: string; port: number; allowed: boolean }>;
      timeline: Array<{ id: string; timestamp: string; action: string; source: string | null; target: string | null; identity: string | null }>;
    };
    uncertainty: string;
    businessImpact: Array<{ name: string; impact: string }>;
  }>;
  scenario: { id: string; mode: string; state: string; startedAt?: string; endedAt?: string };
  actor: { id: string; role: string }; redActorId?: string;
  currentSession: { id: string; machine: string; user: string; privilege: string } | null;
  sessions: Array<{ id: string; machine: string; user: string; privilege: string; createdAt: string }>;
  discoveredHosts: string[]; machines: MachineView[]; events: EventView[];
  alerts: Array<{ id: string; ruleId: string; title: string; severity: string; summary: string; timestamp: string; rationale: string; evidenceEventId?: string }>;
  blueStatus?: {
    responseWindow: { elapsedSeconds: number; limitSeconds: number };
    alertsReviewed: number;
    activeHypotheses: number;
    containedHypotheses: number;
    lastResponse?: { action: string; timestamp: string; availability: number; businessImpact: string[] };
  };
  suspicion: number; objectiveRetrieved: boolean;
  credentials: Array<{ id: string; username: string; type: string; scope: string; origin: string; serviceName: string | null; databaseName: string | null; valid: boolean }>;
  intel: { hosts: string[]; relationships: string[] };
  opsec: { network: string; authentication: string; endpoint: string };
  guidance: {
    objective: string;
    knowledge: {
      known: Array<{ id: string; category: string; value: string }>;
      unknown: string[];
      lastRevealed?: string;
      contextual?: string;
    };
    hypotheses: Array<{ id: string; title: string; question: string; status: "OPEN" | "SUPPORTED" | "VALIDATED"; evidence: string[] }>;
  };
};
