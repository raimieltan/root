import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AccessLevel, ScenarioMode } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import { deleteScenario, initializeScenario } from "./initializer";
import { OperatorKnowledgeLedger } from "./operator-discoverability";
import { normalizeReplayEvent, summarizeReplay } from "./replay";
import { advanceAutonomousBlueDefense, respondToAttack } from "./blue";
import { glasshouse } from "./scenarios";
import { getScenarioView } from "./state";
import type { TerminalState } from "./types";

const routes = {
  application: [
    "nmap 10.10.10.10",
    "curl -i http://10.10.10.10",
    "curl portal.meridian.test",
    "curl --data upload=archive portal.meridian.test/legacy-upload",
    "cat /var/www/meridian/app.conf",
    "ssh deploy@10.20.10.20",
    "MeridianDeploy2024!Secret",
    "id",
    "ls -l /opt/backup/run.sh",
    "grep RUN_HOOK /etc/backup-sync.conf",
    "find /opt -name run.sh",
    "backup-sync --run-hook",
    "cat /etc/meridian/routes.conf",
    "ssh svc_web@FIN-APP",
    "svc-meridian-2026",
    "cat /etc/fin-app/db.conf",
    "psql -h FIN-DB -U finance_app -d finance",
    "FinanceApp2026!Secure",
    "SELECT filename, classification FROM documents;",
  ],
  backup: [
    "curl -i http://10.10.10.10",
    "curl portal.meridian.test",
    "curl portal.meridian.test/api/profile",
    "ssh fieldops@VPN-01",
    "FieldOps-ReadOnly",
    "ls -l /",
    "cat /etc/vpn/backup-peers.conf",
    "ssh backup_svc@BACKUP-01",
    "BackupTransit-6f0a",
    "ls -l /",
    "cat /etc/backup/finance-db.conf",
    "psql -h FIN-DB -U db_backup -d finance",
    "AtlasBackup-91d2",
    "SELECT filename, classification FROM documents;",
  ],
  organicDiscovery: [
    "nmap 10.10.10.10",
    "curl -i http://10.10.10.10",
    "curl portal.meridian.test",
    "curl --data upload=archive portal.meridian.test/legacy-upload",
    "ls -l /",
    "cd /var",
    "ls -l",
    "cd www",
    "ls",
    "cd meridian",
    "ls -l .",
    "less app.conf",
    "ssh deploy@10.20.10.20",
    "MeridianDeploy2024!Secret",
    "ps",
    "grep HOOK /etc/backup-sync.conf",
    "less /etc/backup-sync.conf",
    "backup-sync --run-hook",
    "less /etc/meridian/routes.conf",
    "ssh svc_web@10.30.10.20",
    "svc-meridian-2026",
    "ps",
    "less /etc/fin-app/db.conf",
    "psql -h 10.30.10.21 -U finance_app",
    "FinanceApp2026!Secure",
    "\\l",
    "\\c finance",
    "\\dt",
    "\\d documents",
    "SELECT filename, classification FROM documents;",
  ],
  postgres: [
    "curl -i http://10.10.10.10",
    "curl portal.meridian.test",
    "curl portal.meridian.test/api/profile",
    "ssh fieldops@VPN-01",
    "FieldOps-ReadOnly",
    "ls -l /",
    "cat /etc/vpn/backup-peers.conf",
    "ssh backup_svc@BACKUP-01",
    "BackupTransit-6f0a",
    "ls -l /",
    "cat /etc/backup/finance-db.conf",
    "psql -h FIN-DB -U db_backup -d finance",
    "AtlasBackup-91d2",
    "\\dt",
    "SELECT filename, classification FROM documents;",
  ],
};

async function runRoute(commands: string[], enforceDiscoverability = false) {
  const initialized = await initializeScenario(ScenarioMode.RED);
  const state: TerminalState = {
    currentMachine: "INTERNET",
    currentUser: "attacker",
    currentPrivilege: AccessLevel.NONE,
    activeSessions: [],
    discoveredHosts: ["WEB-01"],
    credentials: new Map(),
    currentPath: "/",
  };
  try {
    const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
    const ledger = OperatorKnowledgeLedger.fromScenario(glasshouse);
    const transcript: Array<{ command: string; output: string }> = [];
    for (const command of commands) {
      if (enforceDiscoverability) {
        const authorization = ledger.authorize(command, state);
        assert.equal(authorization.allowed, true, `${command}: unknown operator knowledge: ${authorization.unknown.join(", ")}`);
      }
      const stateBefore = { ...state };
      const result = await engine.executeCommand(command, state);
      assert.equal(result.success, true, `${command}: ${result.output}`);
      if (enforceDiscoverability) ledger.record(command, stateBefore, result);
      transcript.push({ command, output: result.output });
      if (result.newSession) {
        state.currentMachine = result.newSession.machineId;
        state.currentUser = result.newSession.userId;
        state.currentPrivilege = result.newSession.privilege;
        state.currentSessionId = result.newSession.id;
        state.context = result.context;
      }
      if (result.currentPath) state.currentPath = result.currentPath;
    }
    const scenario = await prisma.scenario.findUniqueOrThrow({
      where: { id: initialized.scenarioId },
      include: { events: { include: { sourceMachine: true, targetMachine: true }, orderBy: { timestamp: "asc" } } },
    });
    const events = scenario.events.map((entry) => normalizeReplayEvent({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      category: entry.category,
      action: entry.action,
      severity: entry.severity,
      source: entry.sourceMachine?.hostname ?? null,
      target: entry.targetMachine?.hostname ?? null,
      userId: entry.userId,
      metadata: entry.metadata,
      visibleToRed: entry.visibleToRed,
      visibleToBlue: entry.visibleToBlue,
    }));
    return {
      state: scenario.state,
      events,
      transcript,
      summary: summarizeReplay(events, { state: scenario.state, startedAt: scenario.startedAt?.toISOString(), endedAt: scenario.endedAt?.toISOString() }, glasshouse.routes),
    };
  } finally {
    await deleteScenario(initialized.scenarioId);
  }
}

describe("Operation Glasshouse end-to-end routes", { concurrency: false }, () => {
  it("starts with the scoped IP but keeps the hostname and services unknown until investigation", async () => {
    const initialized = await initializeScenario(ScenarioMode.RED);
    try {
      assert.deepEqual(glasshouse.startingKnowledge.knownAssets, []);
      const before = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.ok(before);
      assert.deepEqual(before.machines.find((machine) => machine.hostname === "WEB-01")?.services, []);
      assert.ok(before.guidance.knowledge.unknown.includes("Application hostname"));
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      const state: TerminalState = { currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: AccessLevel.NONE, activeSessions: [], discoveredHosts: ["WEB-01"], credentials: new Map(), currentPath: "/" };
      const redirect = await engine.executeCommand("curl -i http://10.10.10.10", state);
      assert.match(redirect.output, /Location: http:\/\/portal\.meridian\.test\//);
      const after = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.ok(after?.guidance.knowledge.known.some((fact) => fact.id === "portal.hostname"));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });

  it("matches the legacy form semantically and rejects a different field or value", async () => {
    const initialized = await initializeScenario(ScenarioMode.RED);
    const state: TerminalState = { currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: AccessLevel.NONE, activeSessions: [], discoveredHosts: ["WEB-01"], credentials: new Map(), currentPath: "/" };
    try {
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      await engine.executeCommand("nmap 10.10.10.10", state);
      const invalid = await engine.executeCommand("curl --data report=archive portal.meridian.test/legacy-upload", state);
      assert.equal(invalid.success, false);
      assert.match(invalid.output, /422/);
      const valid = await engine.executeCommand("curl --data \"upload=archive\" portal.meridian.test/legacy-upload", state);
      assert.equal(valid.success, true);
      assert.equal(valid.newSession?.userId, "www-data");
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });

  it("retrieves PROJECT_ATLAS through the noisy application chain", async () => {
    const result = await runRoute(routes.application);
    const detections = result.events.filter((event) => event.action === "DETECTION_TRIGGERED").map((event) => event.metadata.ruleId);

    assert.equal(result.state, "COMPLETED");
    assert.equal(result.summary.route?.id, "application-chain");
    assert.equal(result.events.find((event) => event.action === "OBJECTIVE_RETRIEVED")?.metadata.objectiveId, "atlas");
    assert.deepEqual(result.summary.attackPath, ["INTERNET", "WEB-01", "DEV-01", "FIN-APP", "FIN-DB"]);
    assert.ok(result.events.some((event) => event.action === "EXPLOIT_VULNERABILITY"));
    assert.ok(result.events.some((event) => event.action === "PRIVILEGE_ESCALATION"));
    assert.ok(detections.includes("WEB-EXEC-01"));
    assert.ok(detections.includes("PRIV-ESC-01"));
    assert.ok(!result.events.some((event) => event.action === "BACKUP_TRUST_LOGIN"));
  });

  it("retrieves the same objective through VPN and backup trust with different evidence", async () => {
    const result = await runRoute(routes.backup);
    const detections = result.events.filter((event) => event.action === "DETECTION_TRIGGERED").map((event) => event.metadata.ruleId);

    assert.equal(result.state, "COMPLETED");
    assert.equal(result.summary.route?.id, "backup-trust");
    assert.equal(result.events.find((event) => event.action === "OBJECTIVE_RETRIEVED")?.metadata.objectiveId, "atlas");
    assert.deepEqual(result.summary.attackPath, ["INTERNET", "VPN-01", "BACKUP-01", "FIN-DB"]);
    assert.ok(result.events.some((event) => event.action === "REMOTE_VPN_LOGIN"));
    assert.ok(result.events.some((event) => event.action === "BACKUP_TRUST_LOGIN"));
    assert.ok(result.events.some((event) => event.action === "BACKUP_DATABASE_LOGIN"));
    assert.ok(detections.includes("AUTH-VPN-01"));
    assert.ok(detections.includes("FIN-BACKUP-01"));
    assert.ok(!detections.includes("WEB-EXEC-01"));
    assert.ok(!result.events.some((event) => event.action === "WEB_WORKER_EXECUTED"));
    assert.ok(!result.events.some((event) => event.action === "PRIVILEGE_ESCALATION"));
  });

  it("uses a bounded PostgreSQL context and produces shared database telemetry", async () => {
    const result = await runRoute(routes.postgres);
    const actions = result.events.map((event) => event.action);

    assert.equal(result.state, "COMPLETED");
    assert.ok(actions.includes("POSTGRES_AUTH_SUCCESS"));
    assert.ok(actions.includes("DATABASE_SESSION_CREATED"));
    assert.ok(actions.includes("DATABASE_QUERY"));
    assert.equal(result.events.find((event) => event.action === "OBJECTIVE_RETRIEVED")?.metadata.via, "postgres");
  });

  it("completes using only facts discoverable in-game: page source, process command line, and \\l/\\c/\\d", async () => {
    const result = await runRoute(routes.organicDiscovery, true);
    assert.equal(result.state, "COMPLETED");
    assert.equal(result.events.find((event) => event.action === "OBJECTIVE_RETRIEVED")?.metadata.via, "postgres");
    const outputFor = (command: string) => result.transcript.find((entry) => entry.command === command)?.output ?? "";
    assert.match(outputFor("nmap 10.10.10.10"), /80\/tcp\s+open\s+http/);
    assert.match(outputFor("curl -i http://10.10.10.10"), /Location: http:\/\/portal\.meridian\.test\//);
    assert.match(outputFor("curl portal.meridian.test"), /method="POST" action="\/legacy-upload"/);
    assert.match(outputFor("curl portal.meridian.test"), /select name="upload"/);
    assert.match(outputFor("curl portal.meridian.test"), /option value="archive"/);
    assert.match(outputFor("ls -l /"), /var\//);
    assert.match(outputFor("ls -l ."), /app\.conf/);
    assert.match(outputFor("ps"), /backup-sync --config \/etc\/backup-sync\.conf/);
    assert.match(outputFor("less /etc/backup-sync.conf"), /MANUAL_TRIGGER=backup-sync --run-hook/);
    assert.match(outputFor("less /etc/backup-sync.conf"), /ROUTES_CONFIG=\/etc\/meridian\/routes\.conf/);
    assert.match(outputFor("less /etc/fin-app/db.conf"), /DB_NAME=finance/);
    assert.match(outputFor("\\l"), /finance/);
    assert.match(outputFor("\\dt"), /documents/);
    assert.match(outputFor("\\d documents"), /filename/);
    const facts = result.events.filter((event) => event.action === "FACT_DISCOVERED").map((event) => event.metadata.factId);
    for (const required of ["portal.hostname", "portal.uploadEndpoint", "portal.uploadMethod", "portal.uploadField", "portal.uploadArchive", "backupSync.configPath", "backupSync.runHook", "finance.database", "finance.documentsTable", "finance.documentColumns"]) assert.ok(facts.includes(required), `missing semantic discovery ${required}`);
  });

  it("invalidates an active PostgreSQL context when Blue resets its identity", async () => {
    const initialized = await initializeScenario(ScenarioMode.BLUE);
    const state: TerminalState = {
      currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: AccessLevel.NONE,
      activeSessions: [], discoveredHosts: ["WEB-01"], credentials: new Map(), currentPath: "/",
    };
    try {
      const engine = new SimulationEngine(initialized.scenarioId, initialized.redActorId);
      for (const command of routes.postgres.slice(0, -3)) {
        const result = await engine.executeCommand(command, state);
        assert.equal(result.success, true, `${command}: ${result.output}`);
        if (result.newSession) {
          state.currentMachine = result.newSession.machineId;
          state.currentUser = result.newSession.userId;
          state.currentPrivilege = result.newSession.privilege;
          state.currentSessionId = result.newSession.id;
          state.context = result.context;
        }
      }
      await respondToAttack({ scenarioId: initialized.scenarioId, actorId: initialized.actorId, action: "RESET_PASSWORD", username: "db_backup" });
      const credential = await prisma.credential.findFirst({ where: { scenarioId: initialized.scenarioId, username: "db_backup", knownScope: "FIN-DB" } });
      assert.ok(credential);
      assert.equal(credential.valid, false);
      assert.equal(credential.serviceName, "postgres");
      const result = await engine.executeCommand("AtlasBackup-91d2", state);
      assert.equal(result.success, false);
      assert.match(result.output, /authentication prompt is active/i);
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });

  it("baseline Blue escalates repeated authentication failures and changes shared credential state", async () => {
    const initialized = await initializeScenario(ScenarioMode.RED);
    const state: TerminalState = { currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: AccessLevel.NONE, activeSessions: [], discoveredHosts: ["WEB-01"], credentials: new Map(), currentPath: "/" };
    try {
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      await engine.executeCommand("curl portal.meridian.test/api/profile", state);
      const prompt = await engine.executeCommand("ssh fieldops@VPN-01", state);
      assert.ok(prompt.newSession);
      state.currentSessionId = prompt.newSession.id;
      state.currentMachine = prompt.newSession.machineId;
      state.currentUser = prompt.newSession.userId;
      state.context = prompt.context;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const failed = await engine.executeCommand("incorrect-password", state);
        assert.equal(failed.success, false);
        await advanceAutonomousBlueDefense(initialized.scenarioId);
      }
      const credential = await prisma.credential.findFirstOrThrow({ where: { scenarioId: initialized.scenarioId, username: "fieldops" } });
      assert.equal(credential.valid, false);
      const actions = (await prisma.securityEvent.findMany({ where: { scenarioId: initialized.scenarioId } })).map((event) => event.action);
      assert.ok(actions.includes("BLUE_OBSERVE"));
      assert.ok(actions.includes("BLUE_INVESTIGATE"));
      assert.ok(actions.includes("BLUE_RESTRICT_ACCOUNT"));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
