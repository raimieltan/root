import type { AccessLevel, NetworkZone, SecurityEventCategory, SecurityEventSeverity, ServiceStatus } from "@/app/generated/prisma/enums";

export type ScenarioEventDefinition = {
  action: string;
  category: SecurityEventCategory;
  severity: SecurityEventSeverity;
  visibleToRed?: boolean;
  visibleToBlue?: boolean;
  metadata?: Record<string, unknown>;
};

export type ScenarioDiscovery = {
  trigger: { kind: "file" | "web" | "scan" | "process" | "postgres" | "dns"; host: string; value: string };
  output?: string;
  hosts?: string[];
  credentials?: Array<{ username: string; scope: string }>;
  facts?: string[];
  factPatterns?: Record<string, string>;
  evidence?: ScenarioEventDefinition[];
};

// A record's value is a machine hostname; a CNAME's value is another DNS name in this map (chained on lookup).
export type ScenarioDnsRecordDefinition = { name: string; type: "A" | "CNAME"; value: string; ttlSeconds?: number };

export type ScenarioFact = {
  id: string;
  category: "NETWORK" | "APPLICATION" | "HOST" | "IDENTITY" | "DATABASE" | "OBJECTIVE";
  known: string;
  unknown: string;
  knownAtStart?: boolean;
  guidance?: string;
  discoverableFrom: string;
  alternative?: string;
  requiredFor: string;
};

export type KnowledgeDomain =
  | "COMPUTING_OS"
  | "NETWORKING"
  | "WEB_SYSTEMS"
  | "DATABASES"
  | "IDENTITY_ACCESS"
  | "OFFENSIVE_SECURITY"
  | "DEFENSIVE_SECURITY"
  | "NETWORK_PACKET_ANALYSIS"
  | "CLOUD_INFRASTRUCTURE"
  | "SECURITY_REASONING";

export type LearningAnnotation = {
  domain: KnowledgeDomain;
  concepts: string[];
  stage: "INTRODUCED" | "PRACTICED" | "DEMONSTRATED" | "PROFICIENT" | "MASTERED";
  evidence: string;
};

type ObjectiveBase = {
  id: string;
  label: string;
  learning?: LearningAnnotation;
};

export type ScenarioObjective =
  | (ObjectiveBase & { type: "retrieve_file"; host: string; path: string })
  | (ObjectiveBase & {
      type: "event";
      event: {
        action: string;
        sourceHost?: string;
        targetHost?: string;
        userId?: string;
        metadata?: Record<string, string | number | boolean>;
      };
    })
  | (ObjectiveBase & { type: "fact"; factId: string });

export type BeginnerExitQuestion = {
  id: string;
  prompt: string;
  evidenceObjectives: string[];
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

export type ServicePermissionDefinition = {
  action: "CONNECT" | "AUTHENTICATE" | "ENUMERATE" | "READ" | "EXECUTE" | "QUERY";
  requires: Array<"NETWORK_REACHABLE" | "SERVICE_RUNNING" | "VALID_CREDENTIAL" | "IDENTITY_GRANT" | "GROUP_MEMBERSHIP" | "RESOURCE_PERMISSION">;
};

export type ServiceResourceDefinition = {
  id: string;
  kind: "SESSION" | "ENDPOINT" | "CONFIGURATION" | "HOOK" | "DATABASE" | "TABLE" | "FILE";
  operations: Array<"ENUMERATE" | "READ" | "EXECUTE" | "QUERY">;
  sensitivity: "PUBLIC" | "INTERNAL" | "SENSITIVE" | "OBJECTIVE";
};

export type ServiceOutcomeDefinition = {
  action: string;
  telemetry: string[];
  blueResponses: string[];
};

export type ScenarioServiceDefinition = {
  name: string;
  port: number;
  runningAsUser: string;
  exposedZones: NetworkZone[];
  status?: ServiceStatus;
  permissions: ServicePermissionDefinition[];
  resources: ServiceResourceDefinition[];
  outcomes: ServiceOutcomeDefinition[];
};

export type ScenarioDefinition = {
  id: string;
  name: string;
  organization: string;
  briefing: { red: string; blue: string; constraints: string[] };
  objectiveSummary?: string;
  presentation: { caseId: string; focus: string[]; order: number; prerequisite?: string };
  availableModes: Array<"RED" | "BLUE">;
  assistance: { guided: string[]; operator: string; operatorAvailableAtStart?: boolean };
  conditions: { timeLimitMinutes: number; minimumAvailability: number };
  securityControls: Array<{ host: string; telemetry: string[] }>;
  businessServices: Array<{ name: string; hosts: string[]; impact: string }>;
  persistencePolicy: { process: string; requiredPrivilege: AccessLevel; beaconSeconds: number };
  knowledgeRewards: Array<{ concept: string; actions: string[] }>;
  backgroundActivity: Array<{ host: string; user: string; source?: string; action: string; context: string }>;
  dnsRecords: ScenarioDnsRecordDefinition[];
  startingKnowledge: { knownHosts: string[]; knownAssets: string[] };
  startingSession?: { host: string; user: string; path?: string };
  facts?: ScenarioFact[];
  machines: Array<{
    hostname: string;
    ip: string;
    zone: NetworkZone;
    os: "linux" | "windows" | "appliance";
    users: Array<{ username: string; role: string; privilege: AccessLevel; groups: string[]; password?: string }>;
    services: ScenarioServiceDefinition[];
    files: Array<{ path: string; owner: string; group?: string; permissions: string; isSecret: boolean; contents: string }>;
    processes?: Array<{ name: string; pid: number; runningAs: string; commandLine?: string }>;
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
  webInteractions?: Array<{
    host: string;
    method: string;
    path: string;
    dataIncludes?: string;
    formField?: string;
    formValue?: string;
    sessionUser: string;
    prerequisiteAction?: string;
    output: string;
    evidence: ScenarioEventDefinition[];
  }>;
  trustedServiceOperations?: Array<{
    host: string;
    service: string;
    arguments: string[];
    fromUser: string;
    requiredGroup: string;
    toUser: string;
    output: string;
    evidence: ScenarioEventDefinition[];
  }>;
  objectives: ScenarioObjective[];
  objectiveCompletion?: "ANY" | "ALL";
  beginnerExitQuestions?: BeginnerExitQuestion[];
  detections: Record<string, { id: string; title: string; severity: string; rationale: string }>;
  routes: RouteDefinition[];
  blueProfiles: Array<{ id: string; routeId: string; commands: string[] }>;
  defaultBlueProfile: string;
};
