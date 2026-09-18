import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { alertsFromEvents } from "./rules";
import { selectKeyDecision, snapshotAt, summarizeReplay, type ReplayEvent } from "./replay";

const at = (seconds: number) => new Date(Date.UTC(2026, 8, 18, 0, 0, seconds)).toISOString();
const event = (input: Partial<ReplayEvent> & Pick<ReplayEvent, "id" | "action">): ReplayEvent => ({
  id: input.id,
  timestamp: input.timestamp ?? at(Number(input.id)),
  category: input.category ?? "SYSTEM",
  action: input.action,
  severity: input.severity ?? "INFO",
  source: input.source ?? null,
  target: input.target ?? null,
  userId: input.userId ?? null,
  metadata: input.metadata ?? {},
  visibleToRed: input.visibleToRed ?? true,
  visibleToBlue: input.visibleToBlue ?? true,
});

const glasshouse: ReplayEvent[] = [
  event({ id: "1", action: "MISSION_STARTED", target: "WEB-01", visibleToBlue: false }),
  event({ id: "2", action: "SESSION_CREATED", source: "INTERNET", target: "WEB-01", userId: "www-data", metadata: { privilege: "SERVICE" } }),
  event({ id: "3", action: "HOST_DISCOVERED", target: "DEV-01", visibleToBlue: false }),
  event({ id: "4", action: "SESSION_CREATED", source: "WEB-01", target: "DEV-01", userId: "deploy", metadata: { privilege: "USER" } }),
  event({ id: "5", action: "LATERAL_MOVEMENT", source: "WEB-01", target: "DEV-01", userId: "deploy", visibleToRed: false, severity: "MEDIUM" }),
  event({ id: "6", action: "DETECTION_TRIGGERED", source: "WEB-01", target: "DEV-01", userId: "deploy", visibleToRed: false, severity: "MEDIUM", metadata: { ruleId: "AUTH-LATERAL-01", title: "Unusual internal login", severity: "MEDIUM", rationale: "Unusual source relationship", evidenceEventId: "5" } }),
  event({ id: "7", action: "ROOT_SESSION_CREATED", target: "DEV-01", userId: "root", severity: "HIGH", metadata: { privilege: "ROOT" } }),
  event({ id: "8", action: "SESSION_CREATED", source: "DEV-01", target: "FIN-APP", userId: "svc_web" }),
  event({ id: "9", action: "SESSION_CREATED", source: "FIN-APP", target: "FIN-DB", userId: "finance_app" }),
  event({ id: "10", action: "OBJECTIVE_RETRIEVED", target: "FIN-DB", userId: "finance_app", severity: "CRITICAL" }),
];

describe("Glasshouse replay projection", () => {
  it("keeps Red and Blue knowledge asymmetric", () => {
    const red = snapshotAt(glasshouse, "RED");
    const blue = snapshotAt(glasshouse, "BLUE");
    const truth = snapshotAt(glasshouse, "TRUTH");

    assert.ok(red.knownHosts.includes("DEV-01"));
    assert.equal(red.detections.length, 0);
    assert.equal(blue.detections[0]?.ruleId, "AUTH-LATERAL-01");
    assert.deepEqual(truth.activeSessions.map((session) => session.host), ["WEB-01", "DEV-01", "DEV-01", "FIN-APP", "FIN-DB"]);
  });

  it("derives operation metrics and the full attack path from evidence", () => {
    const summary = summarizeReplay(glasshouse, { state: "COMPLETED", startedAt: at(0), endedAt: at(12) });

    assert.equal(summary.status, "SUCCESS");
    assert.equal(summary.durationMs, 12_000);
    assert.equal(summary.detectionTimeMs, 6_000);
    assert.deepEqual(summary.attackPath, ["INTERNET", "WEB-01", "DEV-01", "FIN-APP", "FIN-DB"]);
    assert.equal(summary.sessionCount, 5);
  });

  it("explains the highest-value decision from the recorded operation", () => {
    assert.match(selectKeyDecision(glasshouse).title, /DEV-01/);
  });

  it("builds alerts from persisted detection outcomes", () => {
    const detection = glasshouse[5];
    const alerts = alertsFromEvents([{ ...detection, timestamp: detection.timestamp, metadata: JSON.stringify(detection.metadata), targetMachine: { hostname: "DEV-01" }, sourceMachine: { hostname: "WEB-01" } }]);

    assert.equal(alerts.length, 1);
    assert.deepEqual({ ruleId: alerts[0].ruleId, evidenceEventId: alerts[0].evidenceEventId, rationale: alerts[0].rationale }, { ruleId: "AUTH-LATERAL-01", evidenceEventId: "5", rationale: "Unusual source relationship" });
  });
});
