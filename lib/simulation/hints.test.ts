import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import { deleteScenario, initializeScenario } from "./initializer";
import { requestHint } from "./hints";
import { parseMetadata } from "./rules";
import type { TerminalState } from "./types";

describe("Guided hint requests", { concurrency: false }, () => {
  it("reveals useful tiers in order, skips known facts, and caps at tier three", async () => {
    const run = await initializeScenario("RED", "glasshouse", undefined, "GUIDED");
    try {
      const state: TerminalState = { ...run.startingState, activeSessions: [], credentials: new Map() };
      const engine = new SimulationEngine(run.scenarioId, run.actorId);
      assert.equal((await engine.executeCommand("nmap 10.10.10.10", state)).success, true);
      assert.equal((await engine.executeCommand("curl -i http://10.10.10.10", state)).success, true);

      const first = await requestHint({ ...run, objectiveId: "atlas" });
      assert.equal(first.guidance.hints[0].unlockedTier, 1);
      assert.deepEqual(first.guidance.hints[0].revealedText, [
        "Inspect the portal's interfaces, then follow configuration and process command lines on each gained host.",
      ]);

      const second = await requestHint({ ...run, objectiveId: "atlas" });
      assert.equal(second.guidance.hints[0].unlockedTier, 2);
      assert.equal(second.guidance.hints[0].revealedText.length, 2);

      const third = await requestHint({ ...run, objectiveId: "atlas" });
      assert.equal(third.guidance.hints[0].unlockedTier, 3);
      assert.equal(third.guidance.hints[0].nextAvailable, false);
      await assert.rejects(requestHint({ ...run, objectiveId: "atlas" }), /no more hints/i);
      assert.equal(await prisma.securityEvent.count({ where: { scenarioId: run.scenarioId, action: "HINT_REQUESTED" } }), 3);
    } finally {
      await deleteScenario(run.scenarioId);
    }
  });

  it("rejects forged tiers, unknown and completed objectives", async () => {
    const run = await initializeScenario("RED", "glasshouse");
    try {
      await assert.rejects(requestHint({ ...run, objectiveId: "atlas", tier: 3 }), /next hint tier/i);
      await assert.rejects(requestHint({ ...run, objectiveId: "absent" }), /unknown objective/i);
      await prisma.securityEvent.create({
        data: {
          scenarioId: run.scenarioId,
          actorId: run.actorId,
          action: "OBJECTIVE_COMPLETED",
          category: "SYSTEM",
          severity: "INFO",
          metadata: JSON.stringify({ objectiveId: "atlas" }),
        },
      });
      await assert.rejects(requestHint({ ...run, objectiveId: "atlas" }), /completed objective/i);
    } finally {
      await deleteScenario(run.scenarioId);
    }
  });

  it("rejects non-red actors and inactive scenarios", async () => {
    const blue = await initializeScenario("BLUE", "glasshouse");
    try {
      await assert.rejects(requestHint({ ...blue, objectiveId: "atlas" }), /red operator/i);
    } finally {
      await deleteScenario(blue.scenarioId);
    }

    const inactive = await initializeScenario("RED", "glasshouse");
    try {
      await prisma.scenario.update({ where: { id: inactive.scenarioId }, data: { state: "FAILED", endedAt: new Date() } });
      await assert.rejects(requestHint({ ...inactive, objectiveId: "atlas" }), /active operation/i);
    } finally {
      await deleteScenario(inactive.scenarioId);
    }
  });

  it("serializes simultaneous requests into consecutive tiers", async () => {
    const run = await initializeScenario("RED", "glasshouse");
    try {
      const views = await Promise.all([
        requestHint({ ...run, objectiveId: "atlas" }),
        requestHint({ ...run, objectiveId: "atlas" }),
      ]);
      const tiers = await prisma.securityEvent.findMany({ where: { scenarioId: run.scenarioId, action: "HINT_REQUESTED" } });
      assert.deepEqual(tiers.map((event) => parseMetadata(event.metadata).tier).sort(), [1, 2]);
      assert.ok(views.some((view) => view.guidance.hints[0].unlockedTier >= 1));
    } finally {
      await deleteScenario(run.scenarioId);
    }
  });
});
