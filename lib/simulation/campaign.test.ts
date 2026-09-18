import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/prisma";
import { campaign } from "./scenarios";
import { initializeScenario, deleteScenario } from "./initializer";
import { SimulationEngine } from "./engine";
import { advanceBlueScenario, respondToAttack } from "./blue";
import { businessAvailability } from "./availability";
import { validateScenario } from "./scenarios/validate";
import { campaignProgress, type LocalRun } from "../campaign";
import type { TerminalState } from "./types";

describe("Canonical campaign", { concurrency: false }, () => {
  it("expands the content alpha campaign to six organizations and eight linked operations", () => {
    assert.equal(campaign.length, 8);
    assert.equal(new Set(campaign.map((definition) => definition.organization)).size, 6);
    const incidentPack = campaign.filter((definition) => ["strange-login", "something-calling-home", "ghost-account", "no-one-knows"].includes(definition.id));
    assert.deepEqual(incidentPack.map((definition) => definition.presentation.prerequisite), ["paper-trail", "strange-login", "something-calling-home", "ghost-account"]);
    for (const definition of incidentPack) {
      assert.equal(definition.routes.length, 2);
      assert.equal(definition.blueProfiles.length, 2);
      assert.ok(definition.knowledgeRewards.some((reward) => reward.concept === "Incident response"));
    }
  });
  it("takes a guided newcomer through the prerequisite path to Operator", async () => {
    const onboardingProfiles = [campaign[0].blueProfiles[1], campaign[1].blueProfiles[0], campaign[2].blueProfiles[1]];
    const runs: LocalRun[] = [];

    for (const [index, profile] of onboardingProfiles.entries()) {
      const definition = campaign[index];
      const initialized = await initializeScenario("RED", definition.id);
      try {
        const state: TerminalState = { ...initialized.startingState, activeSessions: [], credentials: new Map() };
        const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
        for (const command of profile.commands) {
          const result = await engine.executeCommand(command, state);
          assert.equal(result.success, true, `${definition.id}: ${command}: ${result.output}`);
          if (result.newSession) {
            state.currentMachine = result.newSession.machineId;
            state.currentUser = result.newSession.userId;
            state.currentPrivilege = result.newSession.privilege;
            state.currentSessionId = result.newSession.id;
            state.context = result.context;
          }
        }
        const events = await prisma.securityEvent.findMany({ where: { scenarioId: initialized.scenarioId, actorId: initialized.actorId } });
        const actions = new Set(events.map((event) => event.action));
        runs.push({
          ...initialized,
          definitionId: definition.id,
          name: definition.name,
          mode: "RED",
          assistance: "GUIDED",
          startedAt: "",
          result: {
            won: true,
            route: profile.routeId,
            detected: events.some((event) => event.action === "DETECTION_TRIGGERED"),
            concepts: definition.knowledgeRewards.filter((reward) => reward.actions.some((action) => actions.has(action))).map((reward) => reward.concept),
            availability: 100,
          },
        });
      } finally {
        await deleteScenario(initialized.scenarioId);
      }
    }

    const progress = campaignProgress(runs);
    assert.equal(progress.designation, "Operator");
    assert.equal(progress.operatorModeUnlocked, true);
  });
  for (const definition of campaign) for (const profile of definition.blueProfiles) {
    it(`${definition.id}/${profile.id}: Red completes and leaves route evidence`, async () => {
      const run = await initializeScenario("RED", definition.id);
      try {
        const state: TerminalState = { ...run.startingState, activeSessions: [], credentials: new Map() };
        const engine = new SimulationEngine(run.scenarioId, run.actorId);
        for (const command of profile.commands) {
          const result = await engine.executeCommand(command, state);
          assert.equal(result.success, true, `${command}: ${result.output}`);
          if (result.newSession) { state.currentMachine = result.newSession.machineId; state.currentUser = result.newSession.userId; state.currentPrivilege = result.newSession.privilege; state.currentSessionId = result.newSession.id; state.context = result.context; }
        }
        const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: run.scenarioId }, include: { events: true } });
        assert.equal(scenario.state, "COMPLETED");
        assert.ok(scenario.events.some((e) => e.action === "OBJECTIVE_RETRIEVED"));
        assert.equal(scenario.events.some((e) => e.action === "WEB_REQUEST"), profile.commands.some((c) => c.startsWith("curl")));
      } finally { await deleteScenario(run.scenarioId); }
    });
    it(`${definition.id}/${profile.id}: Blue AI uses the same route events`, async () => {
      const run = await initializeScenario("BLUE", definition.id, profile.id);
      try {
        for (let i = 0; i < profile.commands.length; i++) {
          const result = await advanceBlueScenario(run.scenarioId, run.actorId);
          assert.equal(result.advanced, true, `step ${i}`);
        }
        assert.equal((await prisma.scenario.findUniqueOrThrow({ where: { id: run.scenarioId } })).state, "FAILED");
      } finally { await deleteScenario(run.scenarioId); }
    });
  }
  it("blocks unknown credentials and forbidden network paths for every network command", async () => {
    const run = await initializeScenario("RED", "dead-drop");
    try {
      const state: TerminalState = { ...run.startingState, activeSessions: [], credentials: new Map() };
      const engine = new SimulationEngine(run.scenarioId, run.actorId);
      for (const command of ["ssh nobody@EXCHANGE-01", "ssh research_svc@VAULT-01", "nmap VAULT-01", "ping VAULT-01", "curl VAULT-01", "curl -X POST VAULT-01/restore/jobs --data source=external"]) assert.equal((await engine.executeCommand(command, state)).success, false, command);
      await prisma.networkConnection.updateMany({ where: { source: { scenarioId: run.scenarioId }, target: { hostname: "RECOVERY-01" } }, data: { allowed: false } });
      assert.equal((await engine.executeCommand("curl -X POST RECOVERY-01/restore/jobs --data source=external", state)).success, false);
    } finally { await deleteScenario(run.scenarioId); }
  });
  it("one disrupted Dead Drop route leaves the independent recovery approach viable", async () => {
    const run = await initializeScenario("BLUE", "dead-drop", "partner-pivot");
    try {
      const connection = await prisma.networkConnection.findFirstOrThrow({ where: { source: { scenarioId: run.scenarioId, hostname: "EXCHANGE-01" }, target: { hostname: "RELAY-01" } } });
      await respondToAttack({ ...run, action: "BLOCK_CONNECTION", connectionId: connection.id });
      assert.ok((await businessAvailability(run.scenarioId)).percent < 100);
      for (let i = 0; i < 12; i++) await advanceBlueScenario(run.scenarioId, run.actorId);
      assert.equal((await prisma.scenario.findUniqueOrThrow({ where: { id: run.scenarioId } })).state, "FAILED");
      assert.ok(await prisma.securityEvent.count({ where: { scenarioId: run.scenarioId, action: "RECOVERY_LOGIN" } }));
    } finally { await deleteScenario(run.scenarioId); }
  });
  it("credential invalidation stops every Nightshift approach without shutting down business", async () => {
    const run = await initializeScenario("BLUE", "nightshift");
    try {
      await respondToAttack({ ...run, action: "RESET_PASSWORD", username: "dispatch_svc" });
      for (let i = 0; i < 15; i++) await advanceBlueScenario(run.scenarioId, run.actorId);
      assert.equal((await prisma.scenario.findUniqueOrThrow({ where: { id: run.scenarioId } })).state, "COMPLETED");
      assert.equal(await prisma.securityEvent.count({ where: { scenarioId: run.scenarioId, action: "OBJECTIVE_RETRIEVED" } }), 0);
    } finally { await deleteScenario(run.scenarioId); }
  });
  it("precise Paper Trail containment stops both record-access paths without taking records offline", async () => {
    const run = await initializeScenario("BLUE", "paper-trail");
    try {
      const links = await prisma.networkConnection.findMany({ where: { source: { scenarioId: run.scenarioId }, target: { hostname: "RECORDS-01" } }, include: { source: true } });
      assert.equal(links.length, 3);
      for (const connection of links.filter((link) => ["GRANT-WEB", "VENDOR-01"].includes(link.source.hostname))) {
        await respondToAttack({ ...run, action: "BLOCK_CONNECTION", connectionId: connection.id });
      }
      const availability = await businessAvailability(run.scenarioId);
      assert.ok(availability.percent >= 60);
      for (let step = 0; step < 12; step++) await advanceBlueScenario(run.scenarioId, run.actorId);
      const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: run.scenarioId } });
      assert.equal(scenario.state, "COMPLETED");
      assert.equal(await prisma.securityEvent.count({ where: { scenarioId: run.scenarioId, action: "OBJECTIVE_RETRIEVED" } }), 0);
    } finally { await deleteScenario(run.scenarioId); }
  });
  it("precise containment stops every Incident Response expansion route while preserving its protected service", async () => {
    const cases = [
      { id: "strange-login", objective: "RESULTS-01", routes: ["CARE-PORTAL", "LOCUM-ACCESS"] },
      { id: "something-calling-home", objective: "SCHEDULE-01", routes: ["OUTAGE-WEB", "CONTRACTOR-01"] },
      { id: "ghost-account", objective: "RECOVERY-01", routes: ["INTAKE-WEB", "PROVISION-01"] },
      { id: "no-one-knows", objective: "PLAN-01", routes: ["STATUS-WEB", "VENDOR-DIAG"] },
    ];
    for (const entry of cases) {
      const run = await initializeScenario("BLUE", entry.id);
      try {
        const links = await prisma.networkConnection.findMany({ where: { source: { scenarioId: run.scenarioId, hostname: { in: entry.routes } }, target: { hostname: entry.objective } }, include: { source: true } });
        assert.equal(links.length, 2, entry.id);
        for (const connection of links) await respondToAttack({ ...run, action: "BLOCK_CONNECTION", connectionId: connection.id });
        assert.ok((await businessAvailability(run.scenarioId)).percent >= 60, entry.id);
        for (let step = 0; step < 14; step++) await advanceBlueScenario(run.scenarioId, run.actorId);
        assert.equal((await prisma.scenario.findUniqueOrThrow({ where: { id: run.scenarioId } })).state, "COMPLETED", entry.id);
      } finally { await deleteScenario(run.scenarioId); }
    }
  });
  it("an agent survives session revocation, but removal and isolation have consequences", async () => {
    const run = await initializeScenario("BLUE", "nightshift", "persistent-worker");
    try {
      for (let i = 0; i < 3; i++) await advanceBlueScenario(run.scenarioId, run.actorId);
      const session = await prisma.session.findFirstOrThrow({ where: { scenarioId: run.scenarioId, machine: { hostname: "SHIFT-WEB" }, active: true } });
      await respondToAttack({ ...run, action: "REVOKE_SESSION", sessionId: session.id });
      assert.equal((await advanceBlueScenario(run.scenarioId, run.actorId)).advanced, true);
      assert.equal(await prisma.session.count({ where: { scenarioId: run.scenarioId, machineId: session.machineId, active: true } }), 1);
      await respondToAttack({ ...run, action: "REMOVE_PERSISTENCE", targetId: session.machineId });
      assert.equal(await prisma.persistence.count({ where: { machineId: session.machineId, active: true } }), 0);
      const dispatch = await prisma.machine.findFirstOrThrow({ where: { scenarioId: run.scenarioId, hostname: "DISPATCH-01" } });
      await respondToAttack({ ...run, action: "ISOLATE_HOST", targetId: dispatch.id });
      assert.ok((await businessAvailability(run.scenarioId)).percent < 100);
      await respondToAttack({ ...run, action: "RESTORE_HOST", targetId: dispatch.id });
      assert.equal((await businessAvailability(run.scenarioId)).percent, 100);
    } finally { await deleteScenario(run.scenarioId); }
  });
  it("rejects invalid content and does not reward repeated command or completion spam", () => {
    const invalid = structuredClone(campaign[0]); invalid.connections[0].target = "ABSENT";
    assert.throws(() => validateScenario(invalid), /unknown host/);
    const run: LocalRun = { scenarioId: "one", actorId: "actor", definitionId: "glasshouse", name: "Glasshouse", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "application-chain", detected: true, concepts: ["Trust relationships"], availability: 100 } };
    assert.equal(campaignProgress([run, { ...run, scenarioId: "two" }]).xp, campaignProgress([run]).xp);
    assert.deepEqual(campaignProgress([run]).completed, ["glasshouse"]);
  });
  it("earns Operator Mode clearance from demonstrated knowledge, not training review alone", () => {
    const run: LocalRun = { scenarioId: "one", actorId: "actor", definitionId: "glasshouse", name: "Glasshouse", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "application-chain", detected: true, concepts: ["Trust relationships", "Privilege escalation"], availability: 100 } };
    const trainingOnly = campaignProgress([], [{ moduleId: "trust-boundary", completedAt: "now" }]);
    const demonstrated = campaignProgress([run], [{ moduleId: "trust-boundary", completedAt: "now" }]);
    assert.equal(trainingOnly.designation, "Recruit");
    assert.equal(trainingOnly.operatorModeUnlocked, false);
    assert.equal(demonstrated.designation, "Junior Operator");
    assert.equal(demonstrated.operatorModeUnlocked, true);
  });
  it("awards NRO-1 only from Operator Mode Paper Trail evidence", () => {
    const juniorRun: LocalRun = { scenarioId: "one", actorId: "actor", definitionId: "glasshouse", name: "Glasshouse", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "application-chain", detected: true, concepts: ["Trust relationships", "Privilege escalation"], availability: 100 } };
    const evaluationRun: LocalRun = { ...juniorRun, scenarioId: "two", definitionId: "paper-trail", name: "Paper Trail", assistance: "OPERATOR", result: { ...juniorRun.result!, route: "vendor-reconciliation", concepts: ["Trust relationships", "Identity correlation"] } };
    const withoutTraining = campaignProgress([juniorRun, evaluationRun]);
    const certified = campaignProgress([juniorRun, evaluationRun], [{ moduleId: "trust-boundary", completedAt: "now" }]);
    assert.deepEqual(withoutTraining.certifications, []);
    assert.deepEqual(certified.certifications, ["NRO-1"]);
  });
  it("awards NIR-1 only from Blue Operator containment evidence", () => {
    const juniorRun: LocalRun = { scenarioId: "one", actorId: "actor", definitionId: "glasshouse", name: "Glasshouse", mode: "RED", assistance: "GUIDED", startedAt: "", result: { won: true, route: "application-chain", detected: true, concepts: ["Trust relationships", "Privilege escalation"], availability: 100 } };
    const evaluationRun: LocalRun = { ...juniorRun, scenarioId: "two", definitionId: "paper-trail", name: "Paper Trail", mode: "BLUE", assistance: "OPERATOR", result: { ...juniorRun.result!, route: "vendor-reconciliation", concepts: ["Incident response", "Identity correlation"] } };
    const withoutReview = campaignProgress([juniorRun, evaluationRun]);
    const certified = campaignProgress([juniorRun, evaluationRun], [{ moduleId: "identity-context", completedAt: "now" }]);
    assert.deepEqual(withoutReview.certifications, []);
    assert.deepEqual(certified.certifications, ["NIR-1"]);
  });
});
