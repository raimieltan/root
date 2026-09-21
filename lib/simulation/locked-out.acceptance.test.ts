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

describe("Act 0 Locked Out", { concurrency: false }, () => {
  it("declares its objectives and chains after The Printer", () => {
    const definition = getScenarioDefinition("locked-out");
    assert.equal(definition.presentation.prerequisite, "the-printer");
    assert.equal(definition.objectiveCompletion, "ALL");
    assert.ok(definition.objectives.some((objective) => objective.type === "retrieve_file"));
  });

  it("is completable only after the player's own account fails and a delegated identity is discovered", async () => {
    const initialized = await initializeScenario("RED", "locked-out", undefined, "OPERATOR");
    try {
      const state: TerminalState = { ...initialized.startingState, activeSessions: [], credentials: new Map(), context: { type: "UNIX" } };
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      const ledger = OperatorKnowledgeLedger.fromScenario(getScenarioDefinition("locked-out"));
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
      await run("cd onboarding");
      await run("ls");
      await run("cat ARCHIVE_ACCESS.txt");

      // Own account has no login on the archive host.
      await run("ssh trainee@ARCHIVE-01", false);

      // Delegated identity, discovered from the onboarding note.
      await run("ssh archivist@ARCHIVE-01");
      await run("Temp-Pickup-2024");
      const packetPath = (await run("find / -name ONBOARDING_PACKET.txt")).trim();
      await run(`retrieve ${packetPath}`);

      const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: initialized.scenarioId } });
      assert.equal(scenario.state, "COMPLETED");

      const view = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.ok(view?.guidance.objectives.every((objective) => objective.completed));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
