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

describe("Act I The New Server", { concurrency: false }, () => {
  it("declares its objectives and chains after Wrong Network", () => {
    const definition = getScenarioDefinition("the-new-server");
    assert.equal(definition.presentation.prerequisite, "wrong-network");
    assert.equal(definition.objectiveCompletion, "ALL");
    assert.ok(definition.objectives.some((objective) => objective.type === "retrieve_file"));
  });

  it("is completable only after independently verifying address, ports, and application", async () => {
    const initialized = await initializeScenario("RED", "the-new-server", undefined, "OPERATOR");
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
      await run("cat TICKET-5300.txt");

      // The provisional address was never actually assigned.
      await run("ping 10.0.0.90", false);

      await run("ping NEW-APP-01");
      assert.match(await run("nmap NEW-APP-01"), /443\/tcp\s+open\s+https/);
      assert.match(await run("curl newapp.nodeline.test"), /Client Application/);

      await run("cat COMMISSIONING_ACCESS.txt");

      await run("ssh commissioning@NEW-APP-01");
      await run("SignOff-2026");
      await run("retrieve GO_LIVE_CHECKLIST.txt");

      const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: initialized.scenarioId } });
      assert.equal(scenario.state, "COMPLETED");

      const view = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.ok(view?.guidance.objectives.every((objective) => objective.completed));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });

  it("gates an HTTP route behind a declarative login/cookie session rather than curl string matching", async () => {
    const initialized = await initializeScenario("RED", "the-new-server", undefined, "OPERATOR");
    try {
      const state: TerminalState = { ...initialized.startingState, activeSessions: [], credentials: new Map(), context: { type: "UNIX" } };
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      const run = async (command: string, expectSuccess = true) => {
        const result = await engine.executeCommand(command, state);
        assert.equal(result.success, expectSuccess, `${command}: ${result.output}`);
        applyResult(state, result);
        return result.output;
      };

      // Without a cookie session, the protected route is unauthorized — no shell session is opened or switched.
      assert.match(await run("curl NEW-APP-01/account", false), /401 Unauthorized/);
      assert.equal(state.currentMachine, initialized.startingState.currentMachine);

      // A wrong password does not mint a cookie.
      assert.match(await run("curl -X POST NEW-APP-01/login --data \"username=commissioning&password=wrong\"", false), /401 Unauthorized/);
      assert.equal(await prisma.httpSession.count({ where: { scenarioId: initialized.scenarioId } }), 0);

      // The correct login credential mints a cookie session without switching the terminal's active machine.
      assert.match(await run("curl -X POST NEW-APP-01/login --data \"username=commissioning&password=SignOff-2026\""), /Set-Cookie/);
      assert.equal(state.currentMachine, initialized.startingState.currentMachine);
      assert.equal(await prisma.httpSession.count({ where: { scenarioId: initialized.scenarioId } }), 1);

      // The protected route now succeeds using the cookie, still without a shell session.
      assert.match(await run("curl NEW-APP-01/account"), /launch checklist pending sign-off/);
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
