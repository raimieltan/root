import type { AccessLevel, NetworkZone, SecurityEventCategory, SecurityEventSeverity } from "@/app/generated/prisma/enums";

export type ScenarioEventDefinition = {
  action: string;
  category: SecurityEventCategory;
  severity: SecurityEventSeverity;
  visibleToRed?: boolean;
  visibleToBlue?: boolean;
  metadata?: Record<string, unknown>;
};

export type ScenarioDiscovery = {
  trigger: { kind: "file" | "web"; host: string; value: string };
  output?: string;
  hosts?: string[];
  credentials?: Array<{ username: string; scope: string }>;
  evidence?: ScenarioEventDefinition[];
};

export type RouteDefinition = {
  id: string;
  name: string;
  hosts: string[];
  trustRelationship: string;
  hypothesis: string;
  evidenceProfile: {
    network: string;
    authentication: string;
    endpoint: string;
    detections: string;
    consequence: string;
    comparison: string;
  };
};

export type ScenarioDefinition = {
  id: string;
  name: string;
  organization: string;
  briefing: { red: string; blue: string; constraints: string[] };
  presentation: { caseId: string; focus: string[]; order: number; prerequisite?: string };
  availableModes: Array<"RED" | "BLUE">;
  assistance: { guided: string[]; operator: string };
  conditions: { timeLimitMinutes: number; minimumAvailability: number };
  securityControls: Array<{ host: string; telemetry: string[] }>;
  businessServices: Array<{ name: string; hosts: string[]; impact: string }>;
  persistencePolicy: { process: string; requiredPrivilege: AccessLevel; beaconSeconds: number };
  knowledgeRewards: Array<{ concept: string; actions: string[] }>;
  backgroundActivity: Array<{ host: string; user: string; source?: string; action: string; context: string }>;
  aliases: Record<string, string>;
  startingKnowledge: { knownHosts: string[]; knownAssets: string[] };
  machines: Array<{
    hostname: string;
    ip: string;
    zone: NetworkZone;
    os: "linux" | "windows" | "appliance";
    users: Array<{ username: string; role: string; privilege: AccessLevel; groups: string[]; password?: string }>;
    services: Array<{ name: string; port: number; runningAsUser: string; exposedZones: NetworkZone[] }>;
    files: Array<{ path: string; owner: string; group?: string; permissions: string; isSecret: boolean; contents: string }>;
    processes?: Array<{ name: string; pid: number; runningAs: string }>;
  }>;
  connections: Array<{
    source: string;
    target: string;
    port: number;
    accessEvent?: ScenarioEventDefinition;
  }>;
  discoveries: ScenarioDiscovery[];
  databases?: Array<{
    host: string;
    service: string;
    database: string;
    identities: Array<{
      username: string;
      tables: Array<{ name: string; columns: string[]; rows: Array<Record<string, string>> }>;
    }>;
  }>;
  exploits: Array<{
    target: string;
    sessionUser: string;
    prerequisiteAction?: string;
    module: string;
    output: string;
    evidence: ScenarioEventDefinition[];
  }>;
  privilegeEscalations: Array<{
    command: string;
    host: string;
    fromUser: string;
    toUser: string;
    output: string;
    evidence: ScenarioEventDefinition[];
  }>;
  objectives: Array<{ id: string; type: "retrieve_file"; host: string; path: string; label: string }>;
  detections: Record<string, { id: string; title: string; severity: string; rationale: string }>;
  routes: RouteDefinition[];
  blueProfiles: Array<{ id: string; routeId: string; commands: string[] }>;
  defaultBlueProfile: string;
};
