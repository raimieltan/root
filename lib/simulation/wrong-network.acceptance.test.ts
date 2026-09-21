import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import { deleteScenario, initializeScenario } from "./initializer";
import { OperatorKnowledgeLedger } from "./operator-discoverability";
import { getScenarioDefinition } from "./scenarios";
import { getScenarioView } from "./state";
import type { TerminalState } from "./types";

function applyResult(state: TerminalState, result: Awaited<ReturnType<SimulationEngine["executeCommand"]>>) {
  if (result.currentPath) state.currentPath = result.currentPath;
  if (result.newSession) {
    state.currentMachine = result.newSession.machineId;
    state.currentUser = result.newSession.userId;
    state.currentPrivilege = result.newSession.privilege;
    state.currentSessionId = result.newSession.id;
    state.context = result.context;
  }
}

describe("Act I Wrong Network", { concurrency: false }, () => {
  it("declares its objectives and chains after Service Unavailable", () => {
    const definition = getScenarioDefinition("wrong-network");
    assert.equal(definition.presentation.prerequisite, "service-unavailable");
    assert.equal(definition.objectiveCompletion, "ALL");
    assert.ok(definition.objectives.some((objective) => objective.type === "retrieve_file"));
  });

  it("is completable only after pivoting through the documented jump host into a segmented network", async () => {
    const initialized = await initializeScenario("RED", "wrong-network", undefined, "OPERATOR");
    try {
      const state: TerminalState = { ...initialized.startingState, activeSessions: [], credentials: new Map(), context: { type: "UNIX" } };
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      const ledger = OperatorKnowledgeLedger.fromScenario(getScenarioDefinition("wrong-network"));
      const run = async (command: string, expectSuccess = true) => {
        const authorization = ledger.authorize(command, state);
        assert.equal(authorization.allowed, true, `${command}: unknown operator knowledge: ${authorization.unknown.join(", ")}`);
        const stateBefore = { ...state };
        const result = await engine.executeCommand(command, state);
        assert.equal(result.success, expectSuccess, `${command}: ${result.output}`);
        ledger.record(command, stateBefore, result);
        applyResult(state, result);
        return result.output;
      };

      await run("pwd");
      await run("whoami");
      await run("id");
      await run("env");
      await run("ls");
      await run("cat TICKET-5220.txt");

      // DEPLOY-STAGE has no direct route from HELPDESK-01 — segmentation, not an outage.
      await run("ssh trainee@DEPLOY-STAGE", false);

      await run("cat NETWORK_ACCESS.txt");

      await run("ssh netops@NETOPS-01");
      await run("Bridge-Access-9");
      await run("ls");
      await run("cat DEPLOY_ACCESS.txt");

      await run("ssh deploy@DEPLOY-STAGE");
      await run("Stage-Verify-7");
      const healthcheckPath = (await run("find / -name STAGE_HEALTHCHECK.txt")).trim();
      await run(`retrieve ${healthcheckPath}`);

      const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: initialized.scenarioId } });
      assert.equal(scenario.state, "COMPLETED");

      const view = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.ok(view?.guidance.objectives.every((objective) => objective.completed));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
