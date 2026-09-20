import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ScenarioObjective } from "./scenarios/types";
import { deriveHintGuidance, isActorStuck, type GuidanceEvent } from "./guidance";

const startedAt = new Date("2026-09-20T00:00:00.000Z");
const at = (offset: number) => new Date(startedAt.getTime() + offset * 1_000);
const event = (action: string, offset: number, metadata: unknown, actorId: string | null = "red"): GuidanceEvent => ({
  action,
  actorId,
  timestamp: at(offset),
  metadata,
});
const hintRequested = (objectiveId: string, tier: number, offset = tier) => event(
  "HINT_REQUESTED",
  offset,
  JSON.stringify({ objectiveId, tier }),
);
const tool = (offset: number, success: boolean, actorId = "red") => event("TOOL_EXECUTED", offset, { success }, actorId);

const objectives: ScenarioObjective[] = [{
  id: "one",
  type: "retrieve_file",
  host: "TARGET",
  path: "/objective.txt",
  label: "Retrieve objective",
  hints: [
    { text: "concept", skipIfFactKnown: ["known.first"] },
    { text: "direction" },
    { text: "strong" },
  ],
}];

describe("Guided hint derivation", () => {
  it("keeps hint content hidden until a tier is requested", () => {
    assert.deepEqual(deriveHintGuidance(objectives, [], new Set(), new Set()), [{
      objectiveId: "one",
      unlockedTier: 0,
      revealedText: [],
      nextAvailable: true,
    }]);
  });

  it("advances requested slots past facts the player already knows", () => {
    assert.deepEqual(
      deriveHintGuidance(objectives, [hintRequested("one", 1)], new Set(["known.first"]), new Set())[0].revealedText,
      ["direction"],
    );
    assert.deepEqual(
      deriveHintGuidance(objectives, [hintRequested("one", 2), hintRequested("one", 1)], new Set(["known.first"]), new Set())[0].revealedText,
      ["direction", "strong"],
    );
  });

  it("ignores malformed requests and excludes completed objectives", () => {
    const malformed = [
      event("HINT_REQUESTED", 1, "not-json"),
      event("HINT_REQUESTED", 2, { objectiveId: "one", tier: 4 }),
      event("OTHER", 3, { objectiveId: "one", tier: 3 }),
    ];
    assert.equal(deriveHintGuidance(objectives, malformed, new Set(), new Set())[0].unlockedTier, 0);
    assert.deepEqual(deriveHintGuidance(objectives, [hintRequested("one", 3)], new Set(), new Set(["one"])), []);
  });
});

describe("Guided stuck detection", () => {
  it("marks ten tool attempts without progress as stuck", () => {
    assert.equal(isActorStuck(Array.from({ length: 10 }, (_, index) => tool(index + 1, true)), "red", startedAt), true);
  });

  it("marks three recent failures as stuck and ignores another actor", () => {
    const events = [tool(1, false, "blue"), tool(2, false), tool(3, false), tool(4, false)];
    assert.equal(isActorStuck(events, "red", startedAt), true);
    assert.equal(isActorStuck(events, "blue", startedAt), false);
  });

  it("resets the attempt count after objective or fact progress", () => {
    const events = [
      ...Array.from({ length: 9 }, (_, index) => tool(index + 1, true)),
      event("FACT_DISCOVERED", 10, { factId: "progress" }),
      tool(11, true),
    ];
    assert.equal(isActorStuck(events, "red", startedAt), false);
  });
});
