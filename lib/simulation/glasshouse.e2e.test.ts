import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AccessLevel, ScenarioMode } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import { deleteScenario, initializeScenario } from "./initializer";
import { normalizeReplayEvent, summarizeReplay } from "./replay";
import { respondToAttack } from "./blue";
import { glasshouse } from "./scenarios";
import type { TerminalState } from "./types";

const routes = {
  application: [
    "nmap WEB-01",
    "exploit WEB-01",
    "cat /var/www/meridian/app.conf",
    "ssh deploy@DEV-01",
    "privesc backup-sync",
    "cat /etc/meridian/routes.conf",
    "ssh svc_web@FIN-APP",
    "cat /etc/fin-app/db.conf",
    "ssh finance_app@FIN-DB",
    "retrieve PROJECT_ATLAS.pdf",
  ],
  backup: [
    "curl portal.meridian.test",
    "ssh fieldops@VPN-01",
    "cat /etc/vpn/backup-peers.conf",
    "ssh backup_svc@BACKUP-01",
    "cat /etc/backup/finance-db.conf",
    "ssh db_backup@FIN-DB",
    "retrieve PROJECT_ATLAS.pdf",
  ],
  postgres: [
    "curl portal.meridian.test",
    "ssh fieldops@VPN-01",
    "cat /etc/vpn/backup-peers.conf",
    "ssh backup_svc@BACKUP-01",
    "cat /etc/backup/finance-db.conf",
    "psql -h FIN-DB -U db_backup -d finance --password AtlasBackup-91d2",
    "\\dt",
    "SELECT filename, classification FROM documents;",
  ],
};

async function runRoute(commands: string[]) {
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
    for (const command of commands) {
      const result = await engine.executeCommand(command, state);
      assert.equal(result.success, true, `${command}: ${result.output}`);
      if (result.newSession) {
        state.currentMachine = result.newSession.machineId;
        state.currentUser = result.newSession.userId;
        state.currentPrivilege = result.newSession.privilege;
        state.currentSessionId = result.newSession.id;
        state.context = result.context;
        state.currentPath = "/";
      }
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
      summary: summarizeReplay(events, { state: scenario.state, startedAt: scenario.startedAt?.toISOString(), endedAt: scenario.endedAt?.toISOString() }, glasshouse.routes),
    };
  } finally {
    await deleteScenario(initialized.scenarioId);
  }
}

describe("Operation Glasshouse end-to-end routes", { concurrency: false }, () => {
  it("retrieves PROJECT_ATLAS through the noisy application chain", async () => {
    const result = await runRoute(routes.application);
    const detections = result.events.filter((event) => event.action === "DETECTION_TRIGGERED").map((event) => event.metadata.ruleId);

    assert.equal(result.state, "COMPLETED");
    assert.equal(result.summary.route?.id, "application-chain");
    assert.equal(result.events.find((event) => event.action === "OBJECTIVE_RETRIEVED")?.metadata.objectiveId, "atlas");
    assert.deepEqual(result.summary.attackPath, ["INTERNET", "WEB-01", "DEV-01", "FIN-APP", "FIN-DB"]);
    assert.ok(result.events.some((event) => event.action === "EXPLOIT_EXECUTED"));
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
    assert.ok(!result.events.some((event) => event.action === "EXPLOIT_EXECUTED"));
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

  it("invalidates an active PostgreSQL context when Blue resets its identity", async () => {
    const initialized = await initializeScenario(ScenarioMode.BLUE);
    const state: TerminalState = {
      currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: AccessLevel.NONE,
      activeSessions: [], discoveredHosts: ["WEB-01"], credentials: new Map(), currentPath: "/",
    };
    try {
      const engine = new SimulationEngine(initialized.scenarioId, initialized.redActorId);
      for (const command of routes.postgres.slice(0, -2)) {
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
      const result = await engine.executeCommand("SELECT filename FROM documents;", state);
      assert.equal(result.success, false);
      assert.match(result.output, /no longer active/i);
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
