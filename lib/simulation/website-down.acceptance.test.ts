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
}

describe("Act I Where Did the Website Go?", { concurrency: false }, () => {
  it("declares its objectives and chains after Locked Out", () => {
    const definition = getScenarioDefinition("website-down");
    assert.equal(definition.presentation.prerequisite, "locked-out");
    assert.equal(definition.objectiveCompletion, "ALL");
    assert.ok(definition.objectives.some((objective) => objective.type === "fact"));
  });

  it("is completable only after ruling out a host outage in favor of a stale hostname", async () => {
    const initialized = await initializeScenario("RED", "website-down", undefined, "OPERATOR");
    try {
      const state: TerminalState = { ...initialized.startingState, activeSessions: [], credentials: new Map(), context: { type: "UNIX" } };
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      const ledger = OperatorKnowledgeLedger.fromScenario(getScenarioDefinition("website-down"));
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
      await run("cat TICKET-5102.txt");

      // Query the DNS record directly rather than assuming what the hostname resolves to.
      assert.match(await run("dig intranet.nodeline.test"), /ANSWER SECTION[\s\S]*A\s+10\.0\.0\.55/);

      // The hostname's current target is up, but runs no web service.
      await run("ping intranet.nodeline.test");
      assert.match(await run("nmap intranet.nodeline.test"), /22\/tcp\s+open\s+ssh/);

      await run("cat DNS_MIGRATION_NOTICE.txt");
      assert.match(await run("curl intranet-new.nodeline.test"), /Nodeline Intranet/);

      const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: initialized.scenarioId } });
      assert.equal(scenario.state, "COMPLETED");

      const view = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.ok(view?.guidance.objectives.every((objective) => objective.completed));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
