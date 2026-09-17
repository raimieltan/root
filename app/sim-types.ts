export type MachineView = { id: string; hostname: string; ip: string; zone: string; os: string; state: string; availability: string; services: Array<{ name: string; port: number; status: string }>; processes: Array<{ id: string; name: string; pid: number; runningAs: string }>; files: Array<{ path: string; owner: string; permissions: string; isSecret: boolean }>; persistence: Array<{ id: string; type: string; active: boolean }> };
export type EventView = { id: string; timestamp: string; category: string; action: string; severity: string; source: string | null; target: string | null; userId: string | null; metadata: Record<string, unknown>; visibleToRed: boolean; visibleToBlue: boolean };
export type ScenarioView = {
  scenario: { id: string; mode: string; state: string; startedAt?: string; endedAt?: string };
  actor: { id: string; role: string }; redActorId?: string;
  currentSession: { id: string; machine: string; user: string; privilege: string } | null;
  sessions: Array<{ id: string; machine: string; user: string; privilege: string; createdAt: string }>;
  discoveredHosts: string[]; machines: MachineView[]; events: EventView[];
  alerts: Array<{ id: string; ruleId: string; title: string; severity: string; summary: string; timestamp: string; rationale: string; evidenceEventId?: string }>;
  suspicion: number; objectiveRetrieved: boolean;
  credentials: Array<{ username: string; scope: string; origin: string }>;
  intel: { hosts: string[]; relationships: string[] };
  opsec: { network: string; authentication: string; endpoint: string };
  progress: Record<"scanned" | "initialAccess" | "credential" | "devAccess" | "root" | "finApp" | "finDb" | "objective", boolean>;
};
