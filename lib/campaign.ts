export type LocalRun = { scenarioId: string; actorId: string; definitionId: string; name: string; mode: string; assistance: string; startedAt: string; result?: { won: boolean; route: string | null; detected: boolean; concepts: string[]; availability: number } };
export type TrainingRecord = { moduleId: string; completedAt: string };
export type TrainingModule = { id: string; concept: string; title: string; caseFile: string; prompt: string; choices: string[]; correctChoice: number; debrief: string };
const key = "root:campaign:v1";
const trainingKey = "root:training:v1";

export const trainingModules: TrainingModule[] = [
  {
    id: "trust-boundary", concept: "Trust relationships", title: "Trusted input review",
    caseFile: "DEV-01 // backup-sync runs as root. deploy can modify /etc/backup-sync.conf.",
    prompt: "Which observation should change the next investigative action?",
    choices: ["The host runs SSH, so scan it again.", "A deploy-controlled input is consumed by a root-owned service.", "The root account exists on the host."],
    correctChoice: 1,
    debrief: "The important relationship is control: a lower-privilege identity can influence an input trusted by a privileged service.",
  },
  {
    id: "identity-context", concept: "Incident response", title: "Identity is not intent",
    caseFile: "FIN-APP // svc_web authenticated from an unrecognized source immediately after unusual application execution.",
    prompt: "What makes this worth investigating before resetting the credential?",
    choices: ["The credential is invalid because it belongs to a service.", "The source, timing, and destination are abnormal even though the identity is valid.", "Every FIN-APP authentication must be contained immediately."],
    correctChoice: 1,
    debrief: "Valid credentials can still be suspicious. Correlate the relationship and timing before choosing a response with business impact.",
  },
  {
    id: "containment-impact", concept: "Privilege escalation", title: "Contain precisely",
    caseFile: "FIN-DB is reachable through both FIN-APP and BACKUP-01. Finance must remain available above 60%.",
    prompt: "What is the best first containment decision?",
    choices: ["Map and interrupt the observed route, then verify whether the alternate route remains viable.", "Isolate every finance host immediately.", "Wait until the objective is retrieved to avoid disruption."],
    correctChoice: 0,
    debrief: "Containment is a hypothesis test with consequences: interrupt the evidence-backed path, assess alternatives, and preserve the business service where possible.",
  },
];
export function readRuns(): LocalRun[] {
  try { const value = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value.filter((r) => typeof r.scenarioId === "string" && typeof r.definitionId === "string") : []; } catch { return []; }
}
export function saveRun(run: LocalRun) {
  const runs = readRuns();
  const previous = runs.find((r) => r.scenarioId === run.scenarioId);
  localStorage.setItem(key, JSON.stringify([...runs.filter((r) => r.scenarioId !== run.scenarioId), { ...previous, ...run }]));
}
export function readTraining(): TrainingRecord[] {
  try { const value = JSON.parse(localStorage.getItem(trainingKey) ?? "[]"); return Array.isArray(value) ? value.filter((record) => typeof record?.moduleId === "string" && typeof record?.completedAt === "string") : []; } catch { return []; }
}
export function saveTraining(record: TrainingRecord) {
  const records = readTraining();
  localStorage.setItem(trainingKey, JSON.stringify([...records.filter((entry) => entry.moduleId !== record.moduleId), record]));
}
export function campaignProgress(runs: LocalRun[], training: TrainingRecord[] = []) {
  const wins = runs.filter((r) => r.result?.won);
  const completed = [...new Set(wins.map((r) => r.definitionId))];
  const demonstrations = new Set(wins.flatMap((r) => r.result!.concepts.map((c) => `${c}:${r.definitionId}:${r.mode}:${r.assistance}`)));
  const proficiency = Object.fromEntries([...new Set(wins.flatMap((r) => r.result!.concepts))].map((concept) => [concept, Math.min(5, [...demonstrations].filter((d) => d.startsWith(`${concept}:`)).length)]));
  const achievements = new Set(wins.map((r) => `${r.definitionId}:${r.mode}:${r.assistance}:${r.result!.route}`));
  const xp = achievements.size * 100 + demonstrations.size * 25;
  const demonstratedConcepts = Object.values(proficiency).filter((value) => value >= 1).length;
  const designation = completed.length >= 3 && demonstratedConcepts >= 3
    ? "Operator"
    : completed.length >= 1 && demonstratedConcepts >= 2
      ? "Junior Operator"
      : "Recruit";
  const trainingCompleted = [...new Set(training.map((record) => record.moduleId))];
  const nroEarned = designation !== "Recruit" && trainingCompleted.includes("trust-boundary") && wins.some((run) =>
    run.definitionId === "paper-trail" &&
    run.assistance === "OPERATOR" &&
    run.result?.concepts.includes("Trust relationships"),
  );
  const nirEarned = designation !== "Recruit" && trainingCompleted.includes("identity-context") && wins.some((run) =>
    run.definitionId === "paper-trail" &&
    run.mode === "BLUE" &&
    run.assistance === "OPERATOR" &&
    run.result?.concepts.includes("Incident response"),
  );
  return {
    completed, proficiency, xp, level: 1 + Math.floor(xp / 250), designation,
    trainingCompleted,
    certifications: [nroEarned ? "NRO-1" : null, nirEarned ? "NIR-1" : null].filter((certification): certification is string => Boolean(certification)),
    operatorModeUnlocked: designation !== "Recruit",
  };
}
