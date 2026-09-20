import type { HintChain, HintTier, ScenarioDefinition, RouteDefinition, ScenarioDnsRecordDefinition, ScenarioObjective, ScenarioServiceDefinition } from "./types";

type Machine = ScenarioDefinition["machines"][number];
type ObjectiveDraft = ScenarioObjective extends infer Objective
  ? Objective extends { hints: HintChain }
    ? Omit<Objective, "hints">
    : never
  : never;

export const hintChain = (
  concept: string | HintTier,
  direction: string | HintTier,
  strong: string | HintTier,
): HintChain => [concept, direction, strong].map((tier) =>
  typeof tier === "string" ? { text: tier } : tier,
) as HintChain;

export const guidedOnboarding = [
  "Use `pwd`, `ls`, and `cat` to establish context and inspect readable evidence before acting.",
  "Use `ping`, `nmap`, and `curl` to distinguish reachability, exposed services, and application behavior.",
  "Use `whoami`, `id`, `ps`, and configuration files to reason about identities, processes, permissions, and trust.",
];

const sharedObjectiveHints: Record<string, HintChain> = {
  "locate-session": hintChain(
    "First establish where the active shell is positioned in the filesystem.",
    "Ask the shell for its current working directory before navigating elsewhere.",
    "Run `pwd` and use the returned path as the session's starting location.",
  ),
  "identify-user": hintChain(
    "A shell session runs as a specific identity; establish that identity before judging access.",
    "Use the command that reports only the current username.",
    "Run `whoami` and record the returned account name.",
  ),
  "inspect-groups": hintChain(
    "Permissions depend on more than a username; group membership is part of the identity.",
    "Inspect the current identity's uid, primary group, and supplementary groups.",
    "Run `id` and compare its groups with any file or service permissions you find.",
  ),
  "inspect-environment": hintChain(
    "The session environment records host and execution context that the prompt may not show.",
    "Inspect environment variables and look for the current hostname.",
    "Run `env` and find `HOSTNAME` in the output.",
  ),
};

const known = (text: string, factId: string): HintTier => ({ text, skipIfFactKnown: [factId] });
const evidence = (concept: string, direction: string, strong: string, factId?: string): HintChain => hintChain(
  factId ? known(concept, factId) : concept,
  direction,
  strong,
);

const scenarioObjectiveHints: Record<string, Record<string, HintChain>> = {
  "first-shift": {
    "inspect-permissions": hintChain("File access is explained by mode, owner, and group together.", "Use a detailed listing instead of relying on filenames alone.", "Run `ls -l` in the home and documentation directories and read each permission field."),
    "navigate-docs": hintChain("Local procedures live outside the home directory.", "Follow the documented absolute path into the workstation's documentation tree.", "Run `cd /usr/share/doc/nodeline` and confirm the new directory."),
    "read-handbook": evidence("The workstation handbook defines which observations count as evidence.", "Read the local procedure named by the welcome file.", "Run `cat /usr/share/doc/nodeline/FIRST_SHIFT.txt`.", "orientation.handbook"),
    "inspect-services": evidence("A running process can reveal the service, address, and port it provides.", "Inspect full process command lines and relate the listener to this host.", "Run `ps` and find `nodeline-docs --listen 10.0.0.10:8080`.", "orientation.serviceRelationship"),
  },
  "the-printer": {
    "review-ticket": evidence("Begin with the reported symptom and time rather than a guessed cause.", "Read the local trouble ticket to scope the affected service.", "Run `cat /home/trainee/TICKET-4471.txt`.", "printer.ticket"),
    "inspect-process": evidence("A stalled queue does not prove the service process stopped.", "Check the process table before deciding the daemon crashed.", "Run `ps` and locate `print-spoolerd`.", "printer.processState"),
    "inspect-log": evidence("A running daemon can still fail when it touches a protected resource.", "Read the service log for the first concrete error.", "Run `cat /var/log/print-spooler.log` and identify the permission denial.", "printer.logEvidence"),
    "inspect-spool-permissions": hintChain("The failing resource's owner, group, and mode determine who may write to it.", "Inspect the spool directory itself with a detailed listing.", "Run `ls -l /var/spool/printer` and record its owner, group, and permission digits."),
    "correlate-cause": evidence("The directory requirement matters only when compared with the service account's groups.", "Inspect the `printsvc` identity and compare its groups with the spool directory.", "Run `id printsvc`; compare its groups with the required `print` group.", "printer.groupMismatch"),
  },
  "locked-out": {
    "review-handoff": evidence("A missing local account may be an intentional delegated-access design.", "Read the onboarding note before inventing a workaround.", "Run `cat /home/trainee/onboarding/ARCHIVE_ACCESS.txt`.", "locked.handoffNote"),
    "verify-no-local-account": hintChain("Confirm the access boundary with your own identity before switching accounts.", "Attempt the documented archive host as the current user and observe authentication.", "Run `ssh trainee@ARCHIVE-01` and record the failure."),
    "discover-credential": evidence("Delegated access uses a different identity whose credentials must come from evidence.", "Re-read the archive note for the pickup username and secret.", "Use the `archivist` credential published in `ARCHIVE_ACCESS.txt`.", "locked.tempCredential"),
    "authenticate-delegated": evidence("Use the delegated identity only on the host and service it was issued for.", "Open an SSH session to the archive with the documented account.", "Run `ssh archivist@ARCHIVE-01` and enter the documented secret.", "locked.tempCredential"),
    "retrieve-packet": evidence("Reading a file and retrieving the mission objective are distinct actions.", "Once authenticated on the archive host, use the objective retrieval action.", "Run `retrieve ONBOARDING_PACKET.txt` on `ARCHIVE-01`.", "locked.tempCredential"),
  },
  "website-down": {
    "review-ticket": evidence("Establish the reported hostname and symptom before testing infrastructure.", "Read the Floor 2 trouble ticket.", "Run `cat /home/trainee/TICKET-5102.txt`.", "website.ticket"),
    "query-dns-record": evidence("A hostname problem must be separated from a host or service problem.", "Query the DNS record itself to see its current target.", "Run `dig intranet.nodeline.test`.", "website.dnsRecordStale"),
    "confirm-old-host-up": evidence("A stale target may still be reachable even when it no longer serves the site.", "Test network reachability to the host returned by DNS.", "Run `ping OLD-INTRANET-01`.", "website.dnsRecordStale"),
    "scan-old-host": evidence("Reachability does not prove the expected web service is listening.", "Enumerate the reachable host's exposed services.", "Run `nmap OLD-INTRANET-01` and distinguish SSH from HTTP/HTTPS.", "website.hostUpNoSite"),
    "discover-migration-notice": evidence("A live host without the site suggests the application moved.", "Look for an operational notice describing the migration.", "Run `cat /home/trainee/DNS_MIGRATION_NOTICE.txt`.", "website.migrationNotice"),
    "reach-live-site": evidence("Verify the replacement hostname by observing an HTTP response.", "Request the site at the hostname published by the migration notice.", "Run `curl intranet-new.nodeline.test`.", "website.confirmedLive"),
  },
  "service-unavailable": {
    "review-ticket": evidence("Separate the user's service symptom from assumptions about the host.", "Read the reporting-service ticket for the affected name and machine.", "Run `cat /home/trainee/TICKET-5188.txt`.", "reports.ticket"),
    "confirm-host-up": evidence("A failed application does not imply its machine is offline.", "Test reachability and note any service that still responds.", "Run `ping REPORTS-01`; then verify SSH remains reachable.", "reports.hostUp"),
    "confirm-port-closed": evidence("Different services on one host can have different availability.", "Scan the host and compare the management port with the reporting port.", "Run `nmap REPORTS-01` and compare SSH with HTTPS.", "reports.portClosed"),
    "discover-access": evidence("Use the documented support path before attempting internal authentication.", "Read the standard-access note in the trainee home directory.", "Run `cat /home/trainee/STANDARD_ACCESS.txt`.", "reports.standardAccess"),
    "authenticate-reports": evidence("A reachable management service can provide evidence from inside the host.", "Use the documented helpdesk identity to open an SSH session.", "Run `ssh trainee@REPORTS-01` with the standard credential.", "reports.standardAccess"),
    "correlate-cause": evidence("A closed application port should be correlated with process and log state.", "Inspect the reporting log and compare it with the running process list.", "Read `/var/log/reports-app.log` and confirm `reports-app` is absent from `ps`.", "reports.processCrashed"),
  },
  "wrong-network": {
    "review-ticket": evidence("Record the desired deployment host and the failed source network.", "Read the deployment trouble ticket.", "Run `cat /home/trainee/TICKET-5220.txt`.", "wrongnet.ticket"),
    "discover-jumphost": evidence("Segmentation often requires an approved intermediate host rather than direct access.", "Read the network-access procedure for the finance deployment segment.", "Run `cat /home/trainee/NETWORK_ACCESS.txt`.", "wrongnet.jumphostNote"),
    "reach-netops": evidence("Enter the segment through the documented jump host.", "Authenticate to the network-operations host with the published identity.", "Run `ssh netops@NETOPS-01`.", "wrongnet.jumphostNote"),
    "discover-deploy-access": evidence("The jump host may carry the next bounded credential for its reachable segment.", "Inspect the local deploy-access note after reaching NETOPS-01.", "Run `cat /home/netops/DEPLOY_ACCESS.txt`.", "wrongnet.deployAccess"),
    "reach-deploy-stage": evidence("The deployment host is reachable from the jump host, not the original workstation.", "Use the documented deploy identity from the NETOPS-01 session.", "Run `ssh deploy@DEPLOY-STAGE` from `NETOPS-01`.", "wrongnet.deployAccess"),
    "retrieve-healthcheck": evidence("Complete the task with the objective action after establishing the segmented path.", "Retrieve the health-check file from the deployment host.", "Run `retrieve STAGE_HEALTHCHECK.txt` on `DEPLOY-STAGE`.", "wrongnet.deployAccess"),
  },
  "the-new-server": {
    "review-ticket": evidence("Provisioning notes are claims that still need independent verification.", "Read the ticket and record both candidate addresses.", "Run `cat /home/trainee/TICKET-5300.txt`.", "newserver.ticket"),
    "confirm-address": evidence("Only one candidate address should answer as the new application host.", "Test both ticket addresses instead of assuming the first is correct.", "Compare `ping 10.0.0.90` with `ping 10.0.0.91`.", "newserver.confirmedAddress"),
    "confirm-ports": evidence("A live address still needs service enumeration.", "Scan the confirmed host for its exposed management and application services.", "Run `nmap NEW-APP-01` and verify SSH plus HTTPS.", "newserver.portsConfirmed"),
    "confirm-app": evidence("An open HTTPS port does not prove the correct application is deployed.", "Request the service and inspect its response identity.", "Run `curl https://NEW-APP-01`.", "newserver.appConfirmed"),
    "discover-commissioning-access": evidence("Commissioning access should come from local deployment documentation.", "Read the commissioning note after confirming the host and application.", "Run `cat /home/trainee/COMMISSIONING_ACCESS.txt`.", "newserver.commissioningAccess"),
    "authenticate-newapp": evidence("Use the commissioning credential only on the verified new server.", "Open an SSH session with the documented commissioning identity.", "Run `ssh commissioning@NEW-APP-01`.", "newserver.commissioningAccess"),
    "retrieve-checklist": evidence("Retrieval proves the verified host is ready for the next review step.", "Use the objective action from the authenticated server session.", "Run `retrieve GO_LIVE_CHECKLIST.txt` on `NEW-APP-01`.", "newserver.commissioningAccess"),
  },
  glasshouse: {
    atlas: hintChain(known("Trace trust from the public service toward the protected finance data.", "portal.hostname"), known("Inspect the portal's interfaces, then follow configuration and process command lines on each gained host.", "finance.appRelationship"), known("Start with `nmap 10.10.10.10` and `curl portal.meridian.test`; the application route reaches `FIN-DB`, database `finance`, and `/opt/db/data/PROJECT_ATLAS.pdf`.", "finance.database")),
  },
  nightshift: { manifest: hintChain("Separate the human handover identity from the service identity that can reach dispatch.", "Inspect either the public maintenance worker or the documented handover through `ACCESS-01`.", "POST `job=handover` to `/maintenance/jobs`, inspect `/etc/shift/worker.conf`, then use `dispatch_svc@DISPATCH-01` to retrieve `NIGHT_MANIFEST.csv`.") },
  "dead-drop": {
    archive: hintChain("A segmented vault must be reached through an authorized relay relationship.", "Follow the partner route from the exchange host and inspect each pivot's local route configuration.", "Use `partner@EXCHANGE-01`, read `/home/partner/routes.conf`, then pivot as `relay_svc` and `research_svc` to `VAULT-01`."),
    "archive-copy": hintChain("Recovery infrastructure provides an independent path to a copy of the objective.", "Inspect `RECOVERY-01` and its restore worker rather than forcing the blocked vault route.", "POST `source=external` to `RECOVERY-01/restore/jobs`, read `/etc/recovery/replica.conf`, then use `recovery_svc@REPLICA-01`."),
  },
  "paper-trail": { "award-roster": hintChain("Compare the public export worker with the legitimate vendor reconciliation trust.", "The export worker's configuration identifies the records identity; the vendor path documents the same destination.", "POST `format=award` to `/exports/jobs`, inspect `/etc/aster/export.conf`, then use `records_svc@RECORDS-01` to retrieve `AWARD_ROSTER.csv`.") },
  "strange-login": { "on-call-roster": hintChain("A valid login becomes suspicious through its source and follow-on behavior.", "Compare the care maintenance worker with the locum handover path; both can expose the results service identity.", "POST `source=external` to `/maintenance/reconcile`, inspect `/etc/northline/maintenance.conf`, then use `results_svc@RESULTS-01`.") },
  "something-calling-home": { "switch-window": hintChain("Treat the beacon and the credential path as related but distinct evidence.", "The outage dashboard worker runs privileged work; its configuration points to the schedule identity.", "POST `outage=external` to `/dashboard/reconcile`, inspect `/etc/halcyon/dashboard.conf`, then use `switch_svc@SCHEDULE-01`.") },
  "ghost-account": { "recovery-codes": hintChain("Identity validity and lifecycle authorization are separate questions.", "Compare the intake reconciliation worker with the retired provisioning path to the recovery service.", "POST `import=external` to `/intake/reconcile`, inspect `/etc/intake/recovery.conf`, then use `recovery_svc@RECOVERY-01`.") },
  "no-one-knows": { "restoration-plan": hintChain("Test which trust relationship is compromised without assuming every valid vendor action is hostile.", "Compare the privileged status worker with the vendor diagnostics path to `PLAN-01`.", "POST `update=emergency` to `/status/reconcile`, inspect `/etc/status/restoration.conf`, then use `plan_svc@PLAN-01`.") },
};

export function withObjectiveHints(scenarioId: string, objectives: ObjectiveDraft[]): ScenarioObjective[] {
  return objectives.map((objective) => {
    const hints = scenarioObjectiveHints[scenarioId]?.[objective.id] ?? sharedObjectiveHints[objective.id];
    if (!hints) throw new Error(`${scenarioId}: missing authored hints for objective ${objective.id}`);
    return { ...objective, hints } as ScenarioObjective;
  });
}
export const identity = (username: string, privilege: "USER" | "SERVICE" | "ROOT" = "USER") => ({ username, role: privilege === "SERVICE" ? "service" : "human", privilege, groups: [username] });
export const file = (path: string, owner: string, contents: string, permissions = "600") => ({ path, owner, group: owner, permissions, isSecret: true, contents });
export function service(name: string, port: number, runningAsUser: string, exposedZones: ScenarioServiceDefinition["exposedZones"], status?: ScenarioServiceDefinition["status"]): ScenarioServiceDefinition {
  const web = name === "http" || name === "https" || name.endsWith("-api") || name === "vpn";
  const database = name === "postgres";
  const trusted = name === "backup-sync" || name === "backup";
  return {
    name, port, runningAsUser, exposedZones, status,
    permissions: [
      { action: "CONNECT", requires: ["NETWORK_REACHABLE", "SERVICE_RUNNING"] },
      ...(!web ? [{ action: "AUTHENTICATE" as const, requires: ["NETWORK_REACHABLE" as const, "SERVICE_RUNNING" as const, "VALID_CREDENTIAL" as const, "IDENTITY_GRANT" as const] }] : []),
      ...(database ? [{ action: "QUERY" as const, requires: ["SERVICE_RUNNING" as const, "IDENTITY_GRANT" as const, "RESOURCE_PERMISSION" as const] }] : []),
      ...(trusted ? [{ action: "EXECUTE" as const, requires: ["SERVICE_RUNNING" as const, "GROUP_MEMBERSHIP" as const, "RESOURCE_PERMISSION" as const] }] : []),
    ],
    resources: database
      ? [{ id: `${name}:databases`, kind: "DATABASE", operations: ["ENUMERATE", "QUERY"], sensitivity: "SENSITIVE" }]
      : trusted
        ? [{ id: `${name}:trusted-input`, kind: "HOOK", operations: ["READ", "EXECUTE"], sensitivity: "SENSITIVE" }]
        : web
          ? [{ id: `${name}:endpoints`, kind: "ENDPOINT", operations: ["ENUMERATE", "EXECUTE"], sensitivity: "INTERNAL" }]
          : [{ id: `${name}:session`, kind: "SESSION", operations: ["ENUMERATE"], sensitivity: "INTERNAL" }],
    outcomes: database
      ? [{ action: "DATABASE_ACCESS", telemetry: ["POSTGRES_AUTH_SUCCESS", "DATABASE_SESSION_CREATED", "DATABASE_QUERY"], blueResponses: ["REVOKE_SESSION", "RESET_PASSWORD", "BLOCK_CONNECTION", "ISOLATE_HOST"] }]
      : trusted
        ? [{ action: "TRUSTED_SERVICE_EXECUTION", telemetry: ["PRIVILEGE_ESCALATION", "ROOT_SESSION_CREATED"], blueResponses: ["REVOKE_SESSION", "TERMINATE_PROCESS", "ISOLATE_HOST"] }]
        : web
          ? [{ action: "WEB_ACCESS", telemetry: ["WEB_REQUEST", "PROCESS_SPAWN", "SESSION_CREATED"], blueResponses: ["BLOCK_CONNECTION", "TERMINATE_PROCESS", "ISOLATE_HOST"] }]
          : [{ action: "REMOTE_SESSION", telemetry: ["AUTH_SUCCESS", "AUTH_FAILED", "SESSION_CREATED"], blueResponses: ["REVOKE_SESSION", "RESET_PASSWORD", "DISABLE_ACCOUNT", "BLOCK_CONNECTION"] }],
  };
}
export function host(hostname: string, ip: string, zone: Machine["zone"], users: Machine["users"], files: Machine["files"] = [], web = false): Machine {
  return { hostname, ip, zone, os: "linux", users, files,
    services: [service("ssh", 22, "root", ["EXTERNAL", "DMZ", "INTERNAL", "FINANCE"]), ...(web ? [service("https", 443, users[0].username, ["EXTERNAL", "DMZ"])] : [])],
    processes: [{ name: web ? "portal-worker" : "sshd", pid: 210, runningAs: users[0].username }] };
}
export const external: Machine = { hostname: "INTERNET", ip: "0.0.0.0", zone: "EXTERNAL", os: "appliance", users: [{ username: "attacker", role: "operator", privilege: "NONE", groups: [] }], services: [], files: [] };
export const link = (source: string, target: string, port = 22, action?: string) => ({ source, target, port, ...(action ? { accessEvent: { action, category: "AUTH" as const, severity: "MEDIUM" as const } } : {}) });
export const discover = (host: string, value: string, target: string, username: string): ScenarioDefinition["discoveries"][number] => ({ trigger: { kind: "file", host, value }, hosts: [target], credentials: [{ username, scope: target }] });
// Simple name -> hostname A records, for scenarios with no DNS staleness/chaining to model.
export const dns = (records: Record<string, string>): ScenarioDnsRecordDefinition[] => Object.entries(records).map(([name, value]) => ({ name, type: "A", value }));
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
