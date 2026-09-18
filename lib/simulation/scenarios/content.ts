import type { ScenarioDefinition, RouteDefinition } from "./types";

type Machine = ScenarioDefinition["machines"][number];
export const identity = (username: string, privilege: "USER" | "SERVICE" | "ROOT" = "USER") => ({ username, role: privilege === "SERVICE" ? "service" : "human", privilege, groups: [username] });
export const file = (path: string, owner: string, contents: string, permissions = "600") => ({ path, owner, group: owner, permissions, isSecret: true, contents });
export function host(hostname: string, ip: string, zone: Machine["zone"], users: Machine["users"], files: Machine["files"] = [], web = false): Machine {
  return { hostname, ip, zone, os: "linux", users, files,
    services: [{ name: "ssh", port: 22, runningAsUser: "root", exposedZones: ["EXTERNAL", "DMZ", "INTERNAL", "FINANCE"] }, ...(web ? [{ name: "https", port: 443, runningAsUser: users[0].username, exposedZones: ["EXTERNAL" as const, "DMZ" as const] }] : [])],
    processes: [{ name: web ? "portal-worker" : "sshd", pid: 210, runningAs: users[0].username }] };
}
export const external: Machine = { hostname: "INTERNET", ip: "0.0.0.0", zone: "EXTERNAL", os: "appliance", users: [{ username: "attacker", role: "operator", privilege: "NONE", groups: [] }], services: [], files: [] };
export const link = (source: string, target: string, port = 22, action?: string) => ({ source, target, port, ...(action ? { accessEvent: { action, category: "AUTH" as const, severity: "MEDIUM" as const } } : {}) });
export const discover = (host: string, value: string, target: string, username: string): ScenarioDefinition["discoveries"][number] => ({ trigger: { kind: "file", host, value }, hosts: [target], credentials: [{ username, scope: target }] });
export const commonDetections: ScenarioDefinition["detections"] = {
  PORT_SCAN_DETECTED: { id: "NET-PROBE", title: "Concentrated service probing", severity: "LOW", rationale: "Service probes reveal an attempt to map accessible infrastructure." },
  WEB_WORKER_EXECUTED: { id: "ENDPOINT-EXEC", title: "Unexpected endpoint execution", severity: "HIGH", rationale: "A public request caused an unexpected worker process." },
  AGENT_BEACON: { id: "ENDPOINT-BEACON", title: "New periodic outbound process", severity: "HIGH", rationale: "Correlate the process owner and startup artifact with the initiating session." },
  OBJECTIVE_RETRIEVED: { id: "DATA-EXPORT", title: "Protected document exported", severity: "CRITICAL", rationale: "Protected data left the host through an interactive session." },
};
export const route = (id: string, name: string, hosts: string[], trustRelationship: string, hypothesis: string, endpoint: boolean): RouteDefinition => ({
  id, name, hosts, trustRelationship, hypothesis,
  evidenceProfile: { network: endpoint ? "Service probing and pivot traffic" : "Targeted connections along existing trust", authentication: "Valid identities used from unusual sources", endpoint: endpoint ? "Interactive execution and optional startup artifacts" : "Configuration and document reads; no exploit process", detections: endpoint ? "Endpoint execution and beacon analytics" : "Authentication relationship analytics", consequence: endpoint ? "Persistent access can survive session revocation, at the cost of observable artifacts." : "Lower endpoint exposure depends on credentials remaining valid.", comparison: endpoint ? "Compare process ancestry with the alternative's valid-authentication trail." : "Compare source, identity, timing, and purpose with the alternative's endpoint artifacts." },
});
