import type { AccessLevel, NetworkZone, SecurityEventCategory, SecurityEventSeverity } from "@/app/generated/prisma/enums";

export type SimMachine = {
  id: string;
  hostname: string;
  ip: string;
  zone: NetworkZone;
  os: "linux" | "windows" | "appliance";
};

export type SimUser = {
  id: string;
  username: string;
  role: string;
  machineId: string;
  password?: string;
  groups: string[];
  privilege: AccessLevel;
};

export type SimService = {
  id: string;
  name: string;
  port: number;
  protocol: "tcp" | "udp";
  runningAsUser: string;
  status: "running" | "stopped";
  machineId: string;
  exposedZones: NetworkZone[];
};

export type SimFile = {
  id: string;
  path: string;
  owner: string;
  group?: string;
  contents?: string;
  machineId: string;
  permissions: string;
  isSecret: boolean;
};

export type SimSession = {
  id: string;
  userId: string;
  machineId: string;
  privilege: AccessLevel;
  sourceMachineId?: string;
  createdAt: Date;
  active: boolean;
  context: "UNIX" | "SSH" | "POSTGRES" | "AUTHENTICATING";
  serviceName?: string;
  databaseName?: string;
};

export type TerminalContext =
  | { type: "UNIX" | "SSH" }
  | { type: "POSTGRES"; serviceName: string; databaseName: string }
  | { type: "AUTHENTICATING"; serviceName: string; username: string; host: string; databaseName?: string };

export type SimulationEvent = {
  id: string;
  timestamp: Date;
  category: SecurityEventCategory;
  action: string;
  severity: SecurityEventSeverity;
  sourceMachineId?: string;
  targetMachineId?: string;
  userId?: string;
  visibleToRed: boolean;
  visibleToBlue: boolean;
  metadata?: Record<string, unknown>;
};

// Command result types
export type CommandResult = {
  success: boolean;
  output: string;
  events: SimulationEvent[];
  sessionUpdated?: boolean;
  newSession?: SimSession;
  context?: TerminalContext;
  objectiveRetrieved?: boolean;
  discoveredHosts?: string[];
  currentPath?: string;
};

export type TerminalState = {
  currentMachine: string;
  currentUser: string;
  currentPrivilege: AccessLevel;
  activeSessions: SimSession[];
  discoveredHosts: string[];
  credentials: Map<string, { username: string; password: string; scope: string }>;
  currentPath?: string;
  currentSessionId?: string;
  context?: TerminalContext;
};
