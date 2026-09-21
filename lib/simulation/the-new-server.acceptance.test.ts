import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import { deleteScenario, initializeScenario } from "./initializer";
import { OperatorKnowledgeLedger } from "./operator-discoverability";
import { getScenarioDefinition } from "./scenarios";
import { getScenarioView } from "./state";
import { respondToAttack } from "./blue";
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
      const ledger = OperatorKnowledgeLedger.fromScenario(getScenarioDefinition("the-new-server"));
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
      await run("cat TICKET-5300.txt");

      // The provisional address was never actually assigned.
      await run("ping 10.0.0.90", false);

      await run("ping NEW-APP-01");
      assert.match(await run("nmap NEW-APP-01"), /443\/tcp\s+open\s+https/);
      assert.match(await run("curl newapp.nodeline.test"), /Client Application/);

      await run("cat COMMISSIONING_ACCESS.txt");

      await run("ssh commissioning@NEW-APP-01");
      await run("SignOff-2026");
      const checklistPath = (await run("find / -name GO_LIVE_CHECKLIST.txt")).trim();
      await run(`retrieve ${checklistPath}`);

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
        return result;
      };

      // Without a cookie session, the protected route is unauthorized — no shell session is opened or switched.
      const unauthorized = await run("curl NEW-APP-01/account", false);
      assert.match(unauthorized.output, /401 Unauthorized/);
      assert.equal(unauthorized.httpResponse?.status, 401);
      assert.equal(unauthorized.httpResponse?.session, undefined);
      assert.equal(state.currentMachine, initialized.startingState.currentMachine);

      // A wrong password does not mint a cookie.
      const rejected = await run("curl -X POST NEW-APP-01/login --data \"username=commissioning&password=wrong\"", false);
      assert.match(rejected.output, /401 Unauthorized/);
      assert.equal(rejected.httpResponse?.status, 401);
      assert.equal(await prisma.httpSession.count({ where: { scenarioId: initialized.scenarioId } }), 0);

      // The correct login credential mints a cookie session without switching the terminal's active machine.
      const login = await run("curl -X POST NEW-APP-01/login --data \"username=commissioning&password=SignOff-2026\"");
      assert.match(login.output, /Set-Cookie/);
      assert.equal(login.httpResponse?.status, 200);
      assert.deepEqual(login.httpResponse?.headers, [{ name: "Set-Cookie", value: "session=new-app-01" }]);
      assert.equal(login.httpResponse?.session?.username, "commissioning");
      assert.equal(state.currentMachine, initialized.startingState.currentMachine);
      assert.equal(await prisma.httpSession.count({ where: { scenarioId: initialized.scenarioId } }), 1);
      assert.deepEqual((await getScenarioView(initialized.scenarioId, initialized.actorId))?.httpSessions.map((session) => [session.host, session.username]), [["NEW-APP-01", "commissioning"]]);

      // The protected route now succeeds using the cookie, still without a shell session.
      const account = await run("curl NEW-APP-01/account");
      assert.match(account.output, /launch checklist pending sign-off/);
      assert.equal(account.httpResponse?.session?.host, "NEW-APP-01");

      const blue = await prisma.actor.findFirstOrThrow({ where: { scenarioId: initialized.scenarioId, role: "blue_ai" } });
      await prisma.actor.update({ where: { id: blue.id }, data: { role: "blue_operator" } });
      await respondToAttack({ scenarioId: initialized.scenarioId, actorId: blue.id, action: "RESET_PASSWORD", username: "commissioning" });
      assert.equal(await prisma.httpSession.count({ where: { scenarioId: initialized.scenarioId } }), 0);
      assert.deepEqual((await getScenarioView(initialized.scenarioId, initialized.actorId))?.httpSessions, []);
      assert.equal((await run("curl NEW-APP-01/account", false)).httpResponse?.status, 401);
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
