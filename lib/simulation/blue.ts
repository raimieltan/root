import { ScenarioState, SecurityEventCategory, SecurityEventSeverity } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import type { TerminalState } from "./types";

const aiCommands = [
  "nmap WEB-01", "exploit WEB-01", "cat /var/www/meridian/app.conf", "ssh deploy@DEV-01",
  "privesc backup-sync", "cat /etc/meridian/routes.conf", "ssh svc_web@FIN-APP",
  "cat /etc/fin-app/db.conf", "ssh finance_app@FIN-DB", "retrieve PROJECT_ATLAS.pdf",
];

export async function advanceBlueScenario(scenarioId: string, blueActorId: string) {
  const scenario = await prisma.scenario.findFirst({ where: { id: scenarioId, mode: "BLUE" }, include: { actors: true } });
  if (!scenario || !scenario.actors.some((actor) => actor.id === blueActorId && actor.role === "blue_operator")) throw new Error("Scenario not found");
  if (scenario.state !== ScenarioState.ACTIVE) return { advanced: false, state: scenario.state };
  if (scenario.startedAt && Date.now() - scenario.startedAt.getTime() >= 15 * 60_000) {
    await prisma.scenario.update({ where: { id: scenarioId }, data: { state: ScenarioState.COMPLETED, endedAt: new Date() } });
    return { advanced: false, state: ScenarioState.COMPLETED };
  }
  const redActor = scenario.actors.find((actor) => actor.role === "red_ai");
  if (!redActor) throw new Error("Red actor missing");
  const step = await prisma.securityEvent.count({ where: { scenarioId, action: "AI_STEP" } });
  if (step >= aiCommands.length) return { advanced: false, state: scenario.state };
  const latest = await prisma.session.findFirst({ where: { scenarioId, actorId: redActor.id, active: true }, include: { machine: true, user: true }, orderBy: { createdAt: "desc" } });
  if (!latest) {
    await prisma.scenario.update({ where: { id: scenarioId }, data: { state: ScenarioState.COMPLETED, endedAt: new Date() } });
    return { advanced: false, state: ScenarioState.COMPLETED };
  }
  const state: TerminalState = { currentMachine: latest.machine.hostname, currentUser: latest.user.username, currentPrivilege: latest.privilege, activeSessions: [], discoveredHosts: [], credentials: new Map(), currentPath: "/" };
  const result = await new SimulationEngine(scenarioId, redActor.id).executeCommand(aiCommands[step], state);
  if (!result.success) {
    await prisma.securityEvent.create({ data: { scenarioId, actorId: redActor.id, category: SecurityEventCategory.SYSTEM, action: "ATTACK_CONTAINED", severity: SecurityEventSeverity.HIGH, visibleToRed: true, visibleToBlue: true, metadata: JSON.stringify({ step, command: aiCommands[step], reason: result.output }) } });
    await prisma.scenario.update({ where: { id: scenarioId }, data: { state: ScenarioState.COMPLETED, endedAt: new Date() } });
    return { advanced: false, contained: true, state: ScenarioState.COMPLETED };
  }
  await prisma.securityEvent.create({ data: { scenarioId, actorId: redActor.id, category: SecurityEventCategory.SYSTEM, action: "AI_STEP", severity: SecurityEventSeverity.INFO, visibleToRed: false, visibleToBlue: false, visibleInReplay: false, metadata: JSON.stringify({ step, command: aiCommands[step] }) } });
  if (result.objectiveRetrieved) await prisma.scenario.update({ where: { id: scenarioId }, data: { state: ScenarioState.FAILED, endedAt: new Date() } });
  return { advanced: true, step, output: result.output, objectiveRetrieved: result.objectiveRetrieved };
}

export async function respondToAttack(input: { scenarioId: string; actorId: string; action: string; targetId?: string; sessionId?: string; username?: string }) {
  const actor = await prisma.actor.findFirst({ where: { id: input.actorId, scenarioId: input.scenarioId, role: "blue_operator" } });
  if (!actor) throw new Error("Unauthorized actor");
  const allowed = ["INSPECT_HOST", "INSPECT_USER", "INSPECT_PROCESS", "REVOKE_SESSION", "RESET_PASSWORD", "BLOCK_CONNECTION", "ISOLATE_HOST", "RESTORE_HOST", "INCREASE_MONITORING", "REMOVE_PERSISTENCE"];
  if (!allowed.includes(input.action)) throw new Error("Unsupported response action");
  const target = input.targetId ? await prisma.machine.findFirst({ where: { id: input.targetId, scenarioId: input.scenarioId } }) : null;
  let affected = 0;
  if (input.action === "REVOKE_SESSION" && input.sessionId) affected = (await prisma.session.updateMany({ where: { id: input.sessionId, scenarioId: input.scenarioId }, data: { active: false } })).count;
  if (input.action === "RESET_PASSWORD" && input.username) affected = (await prisma.session.updateMany({ where: { scenarioId: input.scenarioId, active: true, user: { username: input.username } }, data: { active: false } })).count + 1;
  if (input.action === "BLOCK_CONNECTION" && target) affected = (await prisma.networkConnection.updateMany({ where: { targetMachineId: target.id }, data: { allowed: false } })).count;
  if (input.action === "ISOLATE_HOST" && target) {
    affected = (await prisma.networkConnection.updateMany({ where: { OR: [{ sourceMachineId: target.id }, { targetMachineId: target.id }] }, data: { allowed: false } })).count;
    await prisma.session.updateMany({ where: { scenarioId: input.scenarioId, machineId: target.id, active: true }, data: { active: false } });
  }
  if (input.action === "RESTORE_HOST" && target) affected = (await prisma.networkConnection.updateMany({ where: { OR: [{ sourceMachineId: target.id }, { targetMachineId: target.id }] }, data: { allowed: true } })).count;
  if (input.action === "REMOVE_PERSISTENCE" && target) {
    affected = (await prisma.persistence.updateMany({ where: { machineId: target.id, active: true }, data: { active: false } })).count;
    await prisma.process.deleteMany({ where: { machineId: target.id, name: "root-agent" } });
  }
  await prisma.securityEvent.create({ data: { scenarioId: input.scenarioId, actorId: input.actorId, category: SecurityEventCategory.SYSTEM, action: input.action === "ISOLATE_HOST" ? "HOST_ISOLATED" : input.action === "RESTORE_HOST" ? "HOST_RESTORED" : input.action, severity: input.action.startsWith("INSPECT") ? SecurityEventSeverity.INFO : SecurityEventSeverity.MEDIUM, targetMachineId: target?.id, userId: input.username, visibleToRed: input.action !== "INCREASE_MONITORING", visibleToBlue: true, metadata: JSON.stringify({ affected }) } });
  return { success: true, affected };
}
