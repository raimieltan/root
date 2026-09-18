import { AccessLevel, NetworkZone, SecurityEventCategory, SecurityEventSeverity } from "@/app/generated/prisma/enums";
import type { ScenarioDefinition } from "./types";

const event = (
  action: string,
  category: SecurityEventCategory,
  severity: SecurityEventSeverity,
  options: { visibleToRed?: boolean; visibleToBlue?: boolean; metadata?: Record<string, unknown> } = {},
) => ({ action, category, severity, ...options });

export const glasshouse: ScenarioDefinition = {
  id: "glasshouse",
  name: "Operation Glasshouse",
  organization: "Meridian Dynamics",
  briefing: { red: "Assess the public portal and remote access relationships. Retrieve the protected finance document without modifying production data.", blue: "Investigate unusual application execution and remote access. Prevent finance extraction while preserving the portal and backup services.", constraints: ["Do not modify financial records", "Contain precisely and restore affected services"] },
  presentation: { caseId: "FIN-06", focus: ["Fundamentals", "Privilege escalation", "Finance trust"], order: 1 },
  availableModes: ["RED", "BLUE"],
  assistance: { guided: ["Use curl on the known portal to inspect published relationships, or nmap to inspect its services.", "Use ls and cat after gaining a session. Files reveal identities and reachable systems.", "A PostgreSQL service accepts a known identity through psql; inspect only the tables that identity can read."], operator: "Follow the evidence across application, backup, and database trust boundaries." },
  conditions: { timeLimitMinutes: 90, minimumAvailability: 60 },
  securityControls: [{ host: "WEB-01", telemetry: ["WEB", "NETWORK", "PROCESS", "AUTH"] }, { host: "DEV-01", telemetry: ["AUTH", "NETWORK", "PRIVILEGE", "FILESYSTEM", "PERSISTENCE"] }, { host: "FIN-APP", telemetry: ["AUTH", "NETWORK"] }, { host: "VPN-01", telemetry: ["AUTH", "NETWORK"] }, { host: "BACKUP-01", telemetry: ["AUTH", "NETWORK"] }, { host: "FIN-DB", telemetry: ["AUTH", "FILESYSTEM"] }],
  businessServices: [{ name: "Employee portal", hosts: ["WEB-01"], impact: "Employees cannot access operations requests." }, { name: "Finance", hosts: ["FIN-APP", "FIN-DB"], impact: "Invoice processing stops." }, { name: "Backups", hosts: ["VPN-01", "BACKUP-01"], impact: "Scheduled recovery copies are delayed." }],
  persistencePolicy: { process: "root-agent", requiredPrivilege: AccessLevel.ROOT, beaconSeconds: 30 },
  knowledgeRewards: [{ concept: "Trust relationships", actions: ["LATERAL_MOVEMENT", "BACKUP_TRUST_LOGIN"] }, { concept: "Privilege escalation", actions: ["PRIVILEGE_ESCALATION"] }, { concept: "Incident response", actions: ["ATTACK_CONTAINED"] }],
  backgroundActivity: [{ host: "FIN-APP", user: "svc_web", action: "AUTH_SUCCESS", context: "Approved invoice application service account; scheduled processing." }],
  aliases: {
    "portal.meridian.test": "WEB-01",
    "vpn.meridian.test": "VPN-01",
    "fin-app.internal": "FIN-APP",
  },
  startingKnowledge: {
    knownHosts: ["INTERNET", "WEB-01"],
    knownAssets: ["portal.meridian.test"],
  },
  machines: [
    {
      hostname: "INTERNET", ip: "0.0.0.0", zone: NetworkZone.EXTERNAL, os: "appliance",
      users: [{ username: "attacker", role: "operator", privilege: AccessLevel.NONE, groups: ["red"] }], services: [], files: [],
    },
    {
      hostname: "EDGE-FW", ip: "10.10.10.1", zone: NetworkZone.DMZ, os: "appliance", users: [], services: [], files: [],
    },
    {
      hostname: "WEB-01", ip: "10.10.10.10", zone: NetworkZone.DMZ, os: "linux",
      users: [
        { username: "www-data", role: "web_service", privilege: AccessLevel.SERVICE, groups: ["www"] },
        { username: "root", role: "admin", privilege: AccessLevel.ROOT, groups: ["root"] },
      ],
      services: [
        { name: "ssh", port: 22, runningAsUser: "root", exposedZones: [NetworkZone.DMZ, NetworkZone.EXTERNAL] },
        { name: "http", port: 80, runningAsUser: "www-data", exposedZones: [NetworkZone.DMZ, NetworkZone.EXTERNAL] },
        { name: "https", port: 443, runningAsUser: "www-data", exposedZones: [NetworkZone.DMZ, NetworkZone.EXTERNAL] },
      ],
      files: [
        { path: "/var/www/meridian/app.conf", owner: "www-data", group: "www", permissions: "644", isSecret: true, contents: "DEV_HOST=10.20.10.20\nDEPLOY_USER=deploy\nDEPLOY_TOKEN=MeridianDeploy2024!Secret" },
        { path: "/var/www/meridian/portal/index.html", owner: "www-data", group: "www", permissions: "644", isSecret: false, contents: "Meridian Dynamics Employee Portal — legacy upload module enabled" },
      ],
      processes: [{ name: "nginx", pid: 482, runningAs: "www-data" }],
    },
    {
      hostname: "VPN-01", ip: "10.10.10.30", zone: NetworkZone.DMZ, os: "appliance",
      users: [
        { username: "fieldops", role: "contractor", privilege: AccessLevel.USER, groups: ["remote_ops"] },
        { username: "root", role: "admin", privilege: AccessLevel.ROOT, groups: ["root"] },
      ],
      services: [
        { name: "vpn", port: 443, runningAsUser: "root", exposedZones: [NetworkZone.EXTERNAL] },
        { name: "ssh", port: 22, runningAsUser: "root", exposedZones: [NetworkZone.EXTERNAL] },
      ],
      files: [{ path: "/etc/vpn/backup-peers.conf", owner: "root", group: "remote_ops", permissions: "640", isSecret: true, contents: "PEER=BACKUP-01\nSERVICE_USER=backup_svc\nSERVICE_TOKEN=BackupTransit-6f0a" }],
    },
    {
      hostname: "DEV-01", ip: "10.20.10.20", zone: NetworkZone.INTERNAL, os: "linux",
      users: [
        { username: "deploy", role: "developer", privilege: AccessLevel.USER, groups: ["deploy", "developers", "backup"], password: "MeridianDeploy2024!Secret" },
        { username: "root", role: "admin", privilege: AccessLevel.ROOT, groups: ["root"] },
      ],
      services: [
        { name: "ssh", port: 22, runningAsUser: "root", exposedZones: [NetworkZone.INTERNAL, NetworkZone.DMZ] },
        { name: "backup-sync", port: 8080, runningAsUser: "root", exposedZones: [NetworkZone.INTERNAL] },
      ],
      files: [
        { path: "/etc/backup-sync.conf", owner: "root", group: "deploy", permissions: "660", isSecret: true, contents: "BACKUP_TARGET=/backup\nRUN_HOOK=/opt/backup/run.sh\nRUN_AS=root\nVERIFY_SIGNATURE=true" },
        { path: "/opt/backup/run.sh", owner: "root", group: "backup", permissions: "770", isSecret: true, contents: "#!/bin/sh\n# Deploy-maintained verification hook\nverify_backup" },
        { path: "/etc/meridian/routes.conf", owner: "root", group: "root", permissions: "600", isSecret: true, contents: "FINANCE_API=10.30.10.20:443\nFIN_SERVICE_USER=svc_web\nFIN_SERVICE_TOKEN=svc-meridian-2026" },
      ],
      processes: [{ name: "backup-sync", pid: 731, runningAs: "root" }],
    },
    {
      hostname: "FIN-APP", ip: "10.30.10.20", zone: NetworkZone.FINANCE, os: "linux",
      users: [
        { username: "svc_web", role: "service", privilege: AccessLevel.SERVICE, groups: ["service"] },
        { username: "root", role: "admin", privilege: AccessLevel.ROOT, groups: ["root"] },
      ],
      services: [
        { name: "ssh", port: 22, runningAsUser: "root", exposedZones: [NetworkZone.INTERNAL, NetworkZone.FINANCE] },
        { name: "fin-api", port: 443, runningAsUser: "svc_web", exposedZones: [NetworkZone.INTERNAL, NetworkZone.FINANCE] },
      ],
      files: [{ path: "/etc/fin-app/db.conf", owner: "svc_web", group: "svc_web", permissions: "600", isSecret: true, contents: "DB_USER=finance_app\nDB_PASSWORD=FinanceApp2026!Secure\nDB_HOST=10.30.10.21\nDB_PORT=5432" }],
      processes: [{ name: "fin-api", pid: 902, runningAs: "svc_web" }],
    },
    {
      hostname: "FIN-DB", ip: "10.30.10.21", zone: NetworkZone.FINANCE, os: "linux",
      users: [
        { username: "finance_app", role: "service", privilege: AccessLevel.SERVICE, groups: ["db_users"], password: "FinanceApp2026!Secure" },
        { username: "db_backup", role: "backup_service", privilege: AccessLevel.SERVICE, groups: ["db_users", "backup"], password: "AtlasBackup-91d2" },
        { username: "root", role: "admin", privilege: AccessLevel.ROOT, groups: ["root"] },
      ],
      services: [{ name: "postgres", port: 5432, runningAsUser: "finance_app", exposedZones: [NetworkZone.FINANCE] }],
      files: [{ path: "/opt/db/data/PROJECT_ATLAS.pdf", owner: "finance_app", group: "db_users", permissions: "640", isSecret: true, contents: "PROJECT_ATLAS — CONFIDENTIAL\nMeridian autonomous routing acquisition blueprint." }],
      processes: [{ name: "postgres", pid: 1190, runningAs: "finance_app" }],
    },
    {
      hostname: "BACKUP-01", ip: "10.30.10.40", zone: NetworkZone.FINANCE, os: "linux",
      users: [{ username: "backup_svc", role: "backup_service", privilege: AccessLevel.SERVICE, groups: ["backup"] }],
      services: [
        { name: "ssh", port: 22, runningAsUser: "backup_svc", exposedZones: [NetworkZone.DMZ, NetworkZone.FINANCE] },
        { name: "backup", port: 873, runningAsUser: "backup_svc", exposedZones: [NetworkZone.FINANCE] },
      ],
      files: [
        { path: "/srv/backup/manifest.txt", owner: "backup_svc", group: "backup", permissions: "640", isSecret: false, contents: "Nightly finance backup manifest" },
        { path: "/etc/backup/finance-db.conf", owner: "backup_svc", group: "backup", permissions: "600", isSecret: true, contents: "DB_HOST=FIN-DB\nDB_USER=db_backup\nDB_TOKEN=AtlasBackup-91d2" },
      ],
    },
  ],
  connections: [
    { source: "INTERNET", target: "WEB-01", port: 80 },
    { source: "INTERNET", target: "WEB-01", port: 443 },
    { source: "INTERNET", target: "WEB-01", port: 22 },
    { source: "WEB-01", target: "DEV-01", port: 22, accessEvent: event("LATERAL_MOVEMENT", SecurityEventCategory.NETWORK, SecurityEventSeverity.MEDIUM, { visibleToRed: false }) },
    { source: "DEV-01", target: "FIN-APP", port: 22, accessEvent: event("LATERAL_MOVEMENT", SecurityEventCategory.NETWORK, SecurityEventSeverity.MEDIUM, { visibleToRed: false }) },
    { source: "DEV-01", target: "FIN-APP", port: 443 },
    { source: "FIN-APP", target: "FIN-DB", port: 5432, accessEvent: event("LATERAL_MOVEMENT", SecurityEventCategory.NETWORK, SecurityEventSeverity.MEDIUM, { visibleToRed: false }) },
    { source: "INTERNET", target: "VPN-01", port: 22, accessEvent: event("REMOTE_VPN_LOGIN", SecurityEventCategory.AUTH, SecurityEventSeverity.LOW, { visibleToRed: false }) },
    { source: "VPN-01", target: "BACKUP-01", port: 22, accessEvent: event("BACKUP_TRUST_LOGIN", SecurityEventCategory.AUTH, SecurityEventSeverity.LOW, { visibleToRed: false }) },
    { source: "BACKUP-01", target: "FIN-DB", port: 5432, accessEvent: event("BACKUP_DATABASE_LOGIN", SecurityEventCategory.AUTH, SecurityEventSeverity.MEDIUM, { visibleToRed: false }) },
    { source: "FIN-DB", target: "BACKUP-01", port: 873 },
  ],
  discoveries: [
    { trigger: { kind: "file", host: "WEB-01", value: "/var/www/meridian/app.conf" }, hosts: ["DEV-01"], credentials: [{ username: "deploy", scope: "DEV-01" }] },
    { trigger: { kind: "file", host: "DEV-01", value: "/etc/meridian/routes.conf" }, hosts: ["FIN-APP"], credentials: [{ username: "svc_web", scope: "FIN-APP" }] },
    { trigger: { kind: "file", host: "FIN-APP", value: "/etc/fin-app/db.conf" }, hosts: ["FIN-DB"], credentials: [{ username: "finance_app", scope: "FIN-DB" }] },
    {
      trigger: { kind: "web", host: "WEB-01", value: "portal.meridian.test" },
      output: "Meridian Employee Portal\nLegacy integration: /legacy-upload\nField operations remote access: vpn.meridian.test\nPublished support profile: fieldops / FieldOps-ReadOnly",
      hosts: ["VPN-01"], credentials: [{ username: "fieldops", scope: "VPN-01" }],
      evidence: [event("REMOTE_ACCESS_PROFILE_READ", SecurityEventCategory.WEB, SecurityEventSeverity.INFO, { visibleToBlue: false })],
    },
    { trigger: { kind: "file", host: "VPN-01", value: "/etc/vpn/backup-peers.conf" }, hosts: ["BACKUP-01"], credentials: [{ username: "backup_svc", scope: "BACKUP-01" }] },
    { trigger: { kind: "file", host: "BACKUP-01", value: "/etc/backup/finance-db.conf" }, hosts: ["FIN-DB"], credentials: [{ username: "db_backup", scope: "FIN-DB" }] },
  ],
  databases: [{
    host: "FIN-DB",
    service: "postgres",
    database: "finance",
    identities: [
      { username: "finance_app", tables: [{ name: "documents", columns: ["filename", "classification"], rows: [{ filename: "PROJECT_ATLAS.pdf", classification: "CONFIDENTIAL" }] }] },
      { username: "db_backup", tables: [{ name: "documents", columns: ["filename", "classification"], rows: [{ filename: "PROJECT_ATLAS.pdf", classification: "CONFIDENTIAL" }] }] },
    ],
  }],
  webInteractions: [{
    host: "WEB-01", method: "POST", path: "/legacy-upload", dataIncludes: "upload=",
    sessionUser: "www-data", prerequisiteAction: "PORT_PROBE", output: "Legacy upload worker accepted the request. Interactive web-service session opened: www-data@WEB-01",
    evidence: [
      event("EXPLOIT_VULNERABILITY", SecurityEventCategory.WEB, SecurityEventSeverity.HIGH, { metadata: { interface: "legacy-upload", method: "POST" } }),
      event("PROCESS_SPAWN", SecurityEventCategory.PROCESS, SecurityEventSeverity.MEDIUM),
    ],
  }],
  trustedServiceOperations: [{
    host: "DEV-01", service: "backup-sync", arguments: ["--run-hook"], fromUser: "deploy", requiredGroup: "backup", toUser: "root",
    output: "backup-sync executed its deploy-maintained hook as root. Root session opened.",
    evidence: [
      event("PRIVILEGED_CONFIG_MODIFIED", SecurityEventCategory.FILESYSTEM, SecurityEventSeverity.HIGH),
      event("SERVICE_RESTARTED", SecurityEventCategory.PRIVILEGE, SecurityEventSeverity.HIGH),
      event("PRIVILEGE_ESCALATION", SecurityEventCategory.PRIVILEGE, SecurityEventSeverity.CRITICAL),
    ],
  }],
  objectives: [{ id: "atlas", type: "retrieve_file", host: "FIN-DB", path: "/opt/db/data/PROJECT_ATLAS.pdf", label: "Retrieve PROJECT_ATLAS.pdf" }],
  detections: {
    PORT_SCAN_DETECTED: { id: "NET-SCAN-01", title: "Port scan", severity: "LOW", rationale: "Multiple service probes reached the same host in a short interval." },
    EXPLOIT_VULNERABILITY: { id: "WEB-EXEC-01", title: "Suspicious web activity", severity: "MEDIUM", rationale: "An unusual web request was followed by server-side process execution." },
    PRIVILEGED_CONFIG_MODIFIED: { id: "PRIV-SVC-CONFIG-01", title: "Privileged configuration changed", severity: "HIGH", rationale: "A non-root identity modified input trusted by a privileged service." },
    PRIVILEGE_ESCALATION: { id: "PRIV-ESC-01", title: "Privilege escalation", severity: "HIGH", rationale: "A user session was followed by a new root-level session on the same host." },
    LATERAL_MOVEMENT: { id: "AUTH-LATERAL-01", title: "Unusual internal login", severity: "MEDIUM", rationale: "A valid identity authenticated from a machine relationship not seen in normal activity." },
    REMOTE_VPN_LOGIN: { id: "AUTH-VPN-01", title: "Dormant contractor VPN login", severity: "LOW", rationale: "A valid field operations identity authenticated after a long period of inactivity." },
    BACKUP_TRUST_LOGIN: { id: "AUTH-BACKUP-01", title: "Backup service trust used", severity: "LOW", rationale: "The approved VPN-to-backup service relationship was used outside the backup window." },
    BACKUP_DATABASE_LOGIN: { id: "FIN-BACKUP-01", title: "Interactive backup database access", severity: "MEDIUM", rationale: "A backup identity opened an interactive finance database session instead of a scheduled job." },
    OBJECTIVE_RETRIEVED: { id: "FIN-DATA-01", title: "Sensitive finance access", severity: "HIGH", rationale: "A protected finance document was read and transferred from the database host." },
    AGENT_BEACON: { id: "C2-BEACON-01", title: "Persistent outbound beacon", severity: "HIGH", rationale: "A new process began periodic outbound communication." },
  },
  routes: [
    {
      id: "application-chain", name: "Application chain", hosts: ["INTERNET", "WEB-01", "DEV-01", "FIN-APP", "FIN-DB"],
      trustRelationship: "A writable deploy context controls input consumed by the root-owned backup-sync service, which exposes the finance application credential chain.",
      hypothesis: "Could the public application expose a deployment relationship that crosses into finance?",
      evidenceProfile: {
        network: "Broad probing and four-host traversal", authentication: "Several internal service logins", endpoint: "Web execution and privileged service modification",
        detections: "Web execution, lateral movement, and privilege-escalation analytics", consequence: "Fast, powerful access with a loud endpoint trail and high-confidence escalation evidence.",
        comparison: "Louder on endpoints and network telemetry than the backup-trust route.",
      },
    },
    {
      id: "backup-trust", name: "Backup trust", hosts: ["INTERNET", "VPN-01", "BACKUP-01", "FIN-DB"],
      trustRelationship: "A published contractor VPN identity can read the backup peer configuration, and FIN-DB trusts BACKUP-01's scheduled service identity.",
      hypothesis: "Does remote access reveal an identity chain that finance already trusts for backup operations?",
      evidenceProfile: {
        network: "Narrow three-host traversal", authentication: "Valid but unusual VPN and service-account use", endpoint: "Secret reads without code execution or privilege escalation",
        detections: "Dormant VPN, off-hours backup trust, and interactive database analytics", consequence: "Lower endpoint noise, but a concentrated identity trail that becomes suspicious when timing and purpose are correlated.",
        comparison: "Quieter on endpoints than the application chain, but more dependent on anomalous valid-credential behavior.",
      },
    },
  ],
  blueProfiles: [
    { id: "noisy-application", routeId: "application-chain", commands: ["nmap WEB-01", "curl -X POST portal.meridian.test/legacy-upload --data upload=archive", "cat /var/www/meridian/app.conf", "ssh deploy@DEV-01", "MeridianDeploy2024!Secret", "id", "ls -l /opt/backup/run.sh", "grep RUN_HOOK /etc/backup-sync.conf", "find /opt -name run.sh", "backup-sync --run-hook", "cat /etc/meridian/routes.conf", "ssh svc_web@FIN-APP", "cat /etc/fin-app/db.conf", "psql -h FIN-DB -U finance_app -d finance", "FinanceApp2026!Secure", "SELECT filename, classification FROM documents;"] },
    { id: "trusted-backup", routeId: "backup-trust", commands: ["curl portal.meridian.test", "ssh fieldops@VPN-01", "cat /etc/vpn/backup-peers.conf", "ssh backup_svc@BACKUP-01", "cat /etc/backup/finance-db.conf", "psql -h FIN-DB -U db_backup -d finance", "AtlasBackup-91d2", "\\dt", "SELECT filename, classification FROM documents;"] },
  ],
  defaultBlueProfile: "noisy-application",
};
