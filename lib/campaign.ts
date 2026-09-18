export type LocalRun = { scenarioId: string; actorId: string; definitionId: string; name: string; mode: string; assistance: string; startedAt: string; result?: { won: boolean; route: string | null; detected: boolean; concepts: string[]; availability: number } };
const key = "root:campaign:v1";
export function readRuns(): LocalRun[] {
  try { const value = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value.filter((r) => typeof r.scenarioId === "string" && typeof r.definitionId === "string") : []; } catch { return []; }
}
export function saveRun(run: LocalRun) {
  const runs = readRuns();
  const previous = runs.find((r) => r.scenarioId === run.scenarioId);
  localStorage.setItem(key, JSON.stringify([...runs.filter((r) => r.scenarioId !== run.scenarioId), { ...previous, ...run }]));
}
export function campaignProgress(runs: LocalRun[]) {
  const wins = runs.filter((r) => r.result?.won);
  const completed = [...new Set(wins.map((r) => r.definitionId))];
  const demonstrations = new Set(wins.flatMap((r) => r.result!.concepts.map((c) => `${c}:${r.definitionId}:${r.mode}:${r.assistance}`)));
  const proficiency = Object.fromEntries([...new Set(wins.flatMap((r) => r.result!.concepts))].map((concept) => [concept, Math.min(5, [...demonstrations].filter((d) => d.startsWith(`${concept}:`)).length)]));
  const achievements = new Set(wins.map((r) => `${r.definitionId}:${r.mode}:${r.assistance}:${r.result!.route}`));
  const xp = achievements.size * 100 + demonstrations.size * 25;
  return { completed, proficiency, xp, level: 1 + Math.floor(xp / 250) };
}
