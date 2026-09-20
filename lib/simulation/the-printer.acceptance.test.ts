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
}

describe("Act 0 The Printer", { concurrency: false }, () => {
  it("declares reusable event and fact objectives, and chains after First Shift", () => {
    const definition = getScenarioDefinition("the-printer");
    assert.equal(definition.presentation.prerequisite, "first-shift");
    assert.equal(definition.objectiveCompletion, "ALL");
    assert.ok(definition.objectives.some((objective) => objective.type === "event"));
    assert.ok(definition.objectives.some((objective) => objective.type === "fact"));
  });

  it("is completable by inspecting the service identity without guessing an evidence-file path", async () => {
    const initialized = await initializeScenario("RED", "the-printer", undefined, "OPERATOR");
    try {
      const state: TerminalState = { ...initialized.startingState, activeSessions: [], credentials: new Map(), context: { type: "UNIX" } };
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      const run = async (command: string) => {
        const result = await engine.executeCommand(command, state);
        assert.equal(result.success, true, `${command}: ${result.output}`);
        applyResult(state, result);
        return result.output;
      };

      assert.match(await run("help id"), /id \[username\]/);
      await run("pwd");
      await run("whoami");
      await run("id");
      await run("env");
      await run("cat TICKET-4471.txt");
      await run("ps");
      assert.match(await run("grep ERROR /var/log/print-spooler.log"), /permission denied/i);
      assert.match(await run("ls -l /var/spool/printer"), /770 root:print/);
      assert.match(await run("id printsvc"), /uid=\d+\(printsvc\).*groups=printsvc/);

      const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: initialized.scenarioId } });
      assert.equal(scenario.state, "COMPLETED");

      const view = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.ok(view?.guidance.objectives.every((objective) => objective.completed));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
