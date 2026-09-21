import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import { deleteScenario, initializeScenario } from "./initializer";
import { OperatorKnowledgeLedger } from "./operator-discoverability";
import { normalizeReplayEvent, summarizeReplay, visibleToLens, type ReplayLens } from "./replay";
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

describe("Act 0 First Shift", { concurrency: false }, () => {
  it("declares reusable event and fact objectives with both presentations", () => {
    const definition = getScenarioDefinition("first-shift");
    assert.equal(definition.objectiveCompletion, "ALL");
    assert.ok(definition.objectives.some((objective) => objective.type === "event"));
    assert.ok(definition.objectives.some((objective) => objective.type === "fact"));
    assert.equal(definition.assistance.operatorAvailableAtStart, true);
    assert.ok(definition.assistance.guided.every((hint) => !hint.includes("trainee") && !hint.includes("OPS-01") && !hint.includes("10.0.0.10")));
    assert.match(definition.assistance.operator, /welcome file|handbook/i);
  });

  it("is completable from in-world evidence and answers every Milestone 2 exit question", async () => {
    const initialized = await initializeScenario("RED", "first-shift", undefined, "OPERATOR");
    try {
      const state: TerminalState = { ...initialized.startingState, activeSessions: [], credentials: new Map(), context: { type: "UNIX" } };
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      const ledger = OperatorKnowledgeLedger.fromScenario(getScenarioDefinition("first-shift"));
      const run = async (command: string) => {
        const authorization = ledger.authorize(command, state);
        assert.equal(authorization.allowed, true, `${command}: unknown operator knowledge: ${authorization.unknown.join(", ")}`);
        const stateBefore = { ...state };
        const result = await engine.executeCommand(command, state);
        assert.equal(result.success, true, `${command}: ${result.output}`);
        ledger.record(command, stateBefore, result);
        applyResult(state, result);
        return result.output;
      };

      assert.equal(await run("pwd"), "/home/trainee");
      const homeListing = await run("ls -l");
      assert.match(homeListing, /WELCOME\.txt/);
      const welcome = await run("cat WELCOME.txt");
      const handbookPath = welcome.match(/\/usr\/share\/doc\/nodeline\/FIRST_SHIFT\.txt/)?.[0];
      assert.ok(handbookPath, "welcome file must publish the handbook path");

      assert.equal(await run("whoami"), "trainee");
      assert.match(await run("id"), /groups=trainees,operations/);
      assert.match(await run("env"), /HOSTNAME=OPS-01/);
      await run(`cd ${handbookPath.slice(0, handbookPath.lastIndexOf("/"))}`);
      assert.match(await run("ls -l"), /640 root:trainees/);
      assert.match(await run(`cat ${handbookPath.split("/").at(-1)}`), /State conclusions.*assumption/i);
      assert.match(await run("ps"), /nodeline-docs --listen 10\.0\.0\.10:8080/);

      const scenario = await prisma.scenario.findUniqueOrThrow({
        where: { id: initialized.scenarioId },
        include: { events: { include: { sourceMachine: true, targetMachine: true }, orderBy: { timestamp: "asc" } } },
      });
      assert.equal(scenario.state, "COMPLETED");
      const completed = scenario.events.filter((event) => event.action === "OBJECTIVE_COMPLETED");
      const definition = getScenarioDefinition("first-shift");
      assert.equal(completed.length, definition.objectives.length);
      const completedIds = new Set(completed.map((event) => JSON.parse(event.metadata ?? "{}").objectiveId));
      for (const question of definition.beginnerExitQuestions ?? []) {
        assert.ok(question.evidenceObjectives.every((objectiveId) => completedIds.has(objectiveId)), `${question.id}: ${question.prompt}`);
      }
      for (const event of completed) {
        const metadata = JSON.parse(event.metadata ?? "{}") as { learning?: { domain?: string; concepts?: string[]; stage?: string; evidence?: string } };
        assert.ok(metadata.learning?.domain);
        assert.ok(metadata.learning?.concepts?.length);
        assert.equal(metadata.learning?.stage, "PRACTICED");
        assert.ok(metadata.learning?.evidence);
      }

      const replay = scenario.events.map((event) => normalizeReplayEvent({
        id: event.id,
        timestamp: event.timestamp.toISOString(),
        category: event.category,
        action: event.action,
        severity: event.severity,
        source: event.sourceMachine?.hostname ?? null,
        target: event.targetMachine?.hostname ?? null,
        userId: event.userId,
        metadata: event.metadata,
        visibleToRed: event.visibleToRed,
        visibleToBlue: event.visibleToBlue,
      }));
      for (const lens of ["RED", "BLUE", "TRUTH"] as ReplayLens[]) {
        const visible = replay.filter((event) => visibleToLens(event, lens));
        const summary = summarizeReplay(visible, { state: scenario.state, startedAt: scenario.startedAt?.toISOString(), endedAt: scenario.endedAt?.toISOString() });
        assert.equal(summary.status, "SUCCESS", `${lens} reconstruction status`);
        assert.equal(summary.learningEvidence.length, definition.objectives.length, `${lens} learning evidence`);
        assert.deepEqual(summary.attackPath, ["OPS-01"], `${lens} orientation host`);
      }

      const view = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.equal(view?.assistance, "OPERATOR");
      assert.ok(view?.guidance.objectives.every((objective) => objective.completed));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });

  it("keeps Guided mode on the same authoritative simulation", async () => {
    const initialized = await initializeScenario("RED", "first-shift", undefined, "GUIDED");
    try {
      const view = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.equal(view?.assistance, "GUIDED");
      assert.deepEqual(view?.guidance.objectives.map((objective) => objective.completed), Array(8).fill(false));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
