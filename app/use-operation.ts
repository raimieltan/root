"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ScenarioView } from "./sim-types";
import { campaignProgress, readRuns, saveRun } from "@/lib/campaign";

export function useOperation(mode: "RED" | "BLUE") {
  const [ids, setIds] = useState<{ scenarioId: string; actorId: string }>();
  const [view, setView] = useState<ScenarioView>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const started = useRef(false);
  const refresh = useCallback(async (override?: { scenarioId: string; actorId: string }) => {
    const current = override ?? ids;
    if (!current) return;
    const data = await fetch(`/api/sim/state?scenarioId=${current.scenarioId}&actorId=${current.actorId}`, { cache: "no-store" }).then((r) => r.json());
    if (!data.success) throw new Error(data.error ?? "Operation unavailable");
    setView(data);
    if (data.scenario.state !== "ACTIVE") {
      const result = await fetch(`/api/sim/replay?scenarioId=${current.scenarioId}&actorId=${current.actorId}`).then((r) => r.json());
      const run = readRuns().find((r) => r.scenarioId === current.scenarioId);
      if (run && result.success) saveRun({ ...run, result: result.progression });
    }
  }, [ids]);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const params = new URLSearchParams(location.search);
      const existing = readRuns().find((r) => r.scenarioId === params.get("run"));
      if (existing) { const current = { scenarioId: existing.scenarioId, actorId: existing.actorId }; setIds(current); await refresh(current); return; }
      const definitionId = params.get("operation") ?? "glasshouse";
      const requestedAssistance = params.get("assistance") === "OPERATOR" ? "OPERATOR" : "GUIDED";
      const assistance = requestedAssistance === "OPERATOR" && campaignProgress(readRuns()).operatorModeUnlocked ? "OPERATOR" : "GUIDED";
      const response = await fetch("/api/sim/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, definitionId, assistance }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? "Unable to launch operation");
      const current = { scenarioId: data.scenarioId, actorId: data.actorId };
      setIds(current);
      sessionStorage.setItem(`root:${current.scenarioId}:actor`, current.actorId);
      saveRun({ ...current, definitionId, name: definitionId, mode, assistance, startedAt: new Date().toISOString() });
      params.set("run", current.scenarioId); history.replaceState(null, "", `${location.pathname}?${params}`);
      await refresh(current);
    })().catch((reason) => setError(reason instanceof Error ? reason.message : "Operation unavailable"));
  }, [attempt, mode, refresh]);

  const retry = useCallback(() => {
    started.current = false;
    setIds(undefined);
    setView(undefined);
    setError("");
    setAttempt((value) => value + 1);
  }, []);

  return { ids, view, refresh, error, setError, retry };
}
