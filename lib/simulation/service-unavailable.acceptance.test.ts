import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import { deleteScenario, initializeScenario } from "./initializer";
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

describe("Act I Service Unavailable", { concurrency: false }, () => {
  it("declares its objectives and chains after Where Did the Website Go?", () => {
    const definition = getScenarioDefinition("service-unavailable");
    assert.equal(definition.presentation.prerequisite, "website-down");
    assert.equal(definition.objectiveCompletion, "ALL");
    assert.ok(definition.objectives.some((objective) => objective.type === "event" && objective.event.action === "SESSION_CREATED"));
  });

  it("is completable only after ruling out a host outage in favor of a crashed service", async () => {
    const initialized = await initializeScenario("RED", "service-unavailable", undefined, "OPERATOR");
    try {
      const state: TerminalState = { ...initialized.startingState, activeSessions: [], credentials: new Map(), context: { type: "UNIX" } };
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      const run = async (command: string, expectSuccess = true) => {
        const result = await engine.executeCommand(command, state);
        assert.equal(result.success, expectSuccess, `${command}: ${result.output}`);
        applyResult(state, result);
        return result.output;
      };

      await run("pwd");
      await run("whoami");
      await run("id");
      await run("env");
      await run("cat TICKET-5188.txt");

      // Host answers ping and SSH is open, but HTTPS is stopped.
      await run("ping REPORTS-01");
      assert.match(await run("nmap REPORTS-01"), /443\/tcp\s+closed/);

      await run("cat STANDARD_ACCESS.txt");

      await run("ssh trainee@REPORTS-01");
      await run("Helpdesk#2024");
      assert.match(await run("cat /var/log/reports-app.log"), /configuration read failure/);

      const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: initialized.scenarioId } });
      assert.equal(scenario.state, "COMPLETED");

      const view = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.ok(view?.guidance.objectives.every((objective) => objective.completed));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
