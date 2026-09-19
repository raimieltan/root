import type { ScenarioDefinition } from "./types";
import { commonDetections, discover, dns, external, file, host, identity, link, route } from "./content";

export const paperTrail: ScenarioDefinition = {
  id: "paper-trail", name: "Operation Paper Trail", organization: "Aster Civic Systems",
  presentation: { caseId: "AUTH-11", order: 10, prerequisite: "dead-drop", focus: ["Authorization", "Vendor trust", "Precise containment"] },
  briefing: {
    red: "Aster's public grant portal and vendor access process both reach the protected award register. Retrieve AWARD_ROSTER.csv without altering any civic records.",
    blue: "Investigate unusual grant-export activity and vendor access to the award register. Stop disclosure while keeping public filing and records review available.",
    constraints: ["Vendor access is legitimate during reconciliation windows", "Blocking record access degrades public award review"],
  },
  availableModes: ["RED", "BLUE"],
  assistance: {
    guided: ["curl grants.aster.test reveals the vendor reconciliation relationship. The public portal has a separate export worker.", "Use ls and cat after access: compare who controls the export configuration with which identity can read the award register.", "For Blue, contain the observed record-access relationship, then test whether the other authorization path remains viable."],
    operator: "Separate a legitimate vendor authorization from the source and purpose that make it suspicious.",
  },
  conditions: { timeLimitMinutes: 90, minimumAvailability: 60 },
  dnsRecords: dns({ "grants.aster.test": "GRANT-WEB" }),
  startingKnowledge: { knownHosts: ["INTERNET", "GRANT-WEB"], knownAssets: ["grants.aster.test"] },
  machines: [external,
    host("GRANT-WEB", "10.70.1.10", "DMZ", [identity("root", "ROOT")], [file("/etc/aster/export.conf", "root", "RECORDS_HOST=RECORDS-01\nRECORDS_USER=records_svc\nRECORDS_TOKEN=aster-records-2026")], true),
    host("VENDOR-01", "10.70.1.30", "DMZ", [identity("lena")], [file("/home/lena/reconciliation.txt", "lena", "Vendor reconciliation uses records_svc during the approved window. Read-only access reaches /srv/awards/AWARD_ROSTER.csv.")]),
    host("RECORDS-01", "10.70.2.10", "INTERNAL", [identity("records_svc", "SERVICE")], [file("/srv/awards/AWARD_ROSTER.csv", "records_svc", "SIMULATED RESTRICTED AWARDS\nproject,recipient\nCommunity Health,North District Clinic")]),
    host("FILING-01", "10.70.2.40", "INTERNAL", [identity("filing_svc", "SERVICE")]),
  ],
  connections: [
    link("INTERNET", "GRANT-WEB", 443),
    link("INTERNET", "VENDOR-01", 22, "VENDOR_RECONCILIATION_LOGIN"),
    link("GRANT-WEB", "RECORDS-01", 22, "GRANT_EXPORT_LOGIN"),
    link("VENDOR-01", "RECORDS-01", 22, "VENDOR_RECORDS_LOGIN"),
    link("FILING-01", "RECORDS-01", 22),
  ],
  discoveries: [
    { trigger: { kind: "web", host: "GRANT-WEB", value: "grants.aster.test" }, output: "Aster Civic Grants\nVendor reconciliation: lena@VENDOR-01 / AsterRecon-41\nPublic export worker enabled for filing review.", hosts: ["VENDOR-01"], credentials: [{ username: "lena", scope: "VENDOR-01" }] },
    discover("VENDOR-01", "/home/lena/reconciliation.txt", "RECORDS-01", "records_svc"),
    discover("GRANT-WEB", "/etc/aster/export.conf", "RECORDS-01", "records_svc"),
  ],
  webInteractions: [{ host: "GRANT-WEB", method: "POST", path: "/exports/jobs", dataIncludes: "format=award", sessionUser: "root", prerequisiteAction: "PORT_PROBE", output: "The public export worker accepted the unsigned award job as root. Session opened.", evidence: [{ action: "WEB_WORKER_EXECUTED", category: "WEB", severity: "HIGH" }, { action: "PROCESS_SPAWN", category: "PROCESS", severity: "HIGH" }] }],
  objectives: [{ id: "award-roster", type: "retrieve_file", host: "RECORDS-01", path: "/srv/awards/AWARD_ROSTER.csv", label: "Retrieve AWARD_ROSTER.csv" }],
  detections: {
    ...commonDetections,
    VENDOR_RECONCILIATION_LOGIN: { id: "AUTH-VENDOR-01", title: "Vendor reconciliation login", severity: "LOW", rationale: "Vendor access is expected only when its source, timing, and follow-on record activity match the reconciliation purpose." },
    GRANT_EXPORT_LOGIN: { id: "AUTH-EXPORT-01", title: "Grant export service login", severity: "MEDIUM", rationale: "A public-facing grant worker opened an interactive records session." },
    VENDOR_RECORDS_LOGIN: { id: "AUTH-VENDOR-02", title: "Vendor identity reached award records", severity: "HIGH", rationale: "A vendor-access host reused a records identity outside normal filing service behavior." },
  },
  routes: [
    route("public-export", "Public export worker", ["INTERNET", "GRANT-WEB", "RECORDS-01"], "A public grant-export worker runs as root and holds the records service token. Its interactive records session is noisy but direct.", "Can the grant portal's export worker cross from public filing into protected award records?", true),
    route("vendor-reconciliation", "Vendor reconciliation", ["INTERNET", "VENDOR-01", "RECORDS-01"], "A legitimate vendor identity receives a read-only records service credential during reconciliation. The authorization becomes dangerous when its source and purpose diverge.", "Can a valid vendor reconciliation relationship reach records outside its intended business purpose?", false),
  ],
  blueProfiles: [
    { id: "public-export", routeId: "public-export", commands: ["nmap GRANT-WEB", "curl -X POST grants.aster.test/exports/jobs --data format=award", "cat /etc/aster/export.conf", "ssh records_svc@RECORDS-01", "retrieve AWARD_ROSTER.csv"] },
    { id: "vendor-reconciliation", routeId: "vendor-reconciliation", commands: ["curl grants.aster.test", "ssh lena@VENDOR-01", "cat /home/lena/reconciliation.txt", "ssh records_svc@RECORDS-01", "retrieve AWARD_ROSTER.csv"] },
  ],
  defaultBlueProfile: "vendor-reconciliation",
  securityControls: [{ host: "GRANT-WEB", telemetry: ["WEB", "NETWORK", "PROCESS", "AUTH"] }, { host: "VENDOR-01", telemetry: ["AUTH", "NETWORK"] }, { host: "RECORDS-01", telemetry: ["AUTH", "FILESYSTEM"] }],
  businessServices: [
    { name: "Grant filing", hosts: ["GRANT-WEB"], impact: "Public grant submission is unavailable." },
    { name: "Award records", hosts: ["RECORDS-01"], impact: "Public award review is degraded while record access is contained." },
    { name: "Filing review", hosts: ["FILING-01"], impact: "Clerks cannot reconcile filed awards." },
  ],
  persistencePolicy: { process: "grant-export-agent", requiredPrivilege: "ROOT", beaconSeconds: 30 },
  knowledgeRewards: [
    { concept: "Trust relationships", actions: ["GRANT_EXPORT_LOGIN", "VENDOR_RECORDS_LOGIN"] },
    { concept: "Incident response", actions: ["BLOCK_CONNECTION", "ATTACK_CONTAINED"] },
    { concept: "Identity correlation", actions: ["VENDOR_RECONCILIATION_LOGIN", "INSPECT_USER"] },
  ],
  backgroundActivity: [
    { host: "RECORDS-01", source: "FILING-01", user: "records_svc", action: "AUTH_SUCCESS", context: "Approved filing service reconciliation; scheduled, non-interactive record access." },
    { host: "VENDOR-01", user: "lena", action: "AUTH_SUCCESS", context: "Approved vendor reconciliation access; no award-record export expected." },
  ],
};
