import { AccessLevel } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "@/lib/simulation/engine";
import type { TerminalState } from "@/lib/simulation/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const scenarioId = typeof body.scenarioId === "string" ? body.scenarioId : "";
    const actorId = typeof body.actorId === "string" ? body.actorId : "";
    const command = typeof body.command === "string" ? body.command.trim() : "";
    if (!scenarioId || !actorId || !command || command.length > 300) return Response.json({ success: false, error: "Invalid command request" }, { status: 400 });
    const actor = await prisma.actor.findFirst({ where: { id: actorId, scenarioId, role: "red_operator" } });
    if (!actor) return Response.json({ success: false, error: "Unauthorized actor" }, { status: 403 });
    const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
    if (!scenario || scenario.state !== "ACTIVE") return Response.json({ success: false, output: "This operation has ended." }, { status: 409 });
    if (scenario.startedAt && Date.now() - scenario.startedAt.getTime() >= 15 * 60_000) {
      await prisma.scenario.update({ where: { id: scenarioId }, data: { state: "FAILED", endedAt: new Date() } });
      return Response.json({ success: false, output: "Operation timer expired." }, { status: 409 });
    }
    const currentMachine = typeof body.currentMachine === "string" ? body.currentMachine : "INTERNET";
    const currentUser = typeof body.currentUser === "string" ? body.currentUser : "attacker";
    const session = await prisma.session.findFirst({ where: { scenarioId, actorId, active: true, machine: { hostname: currentMachine }, user: { username: currentUser } }, include: { user: true } });
    if (!session) return Response.json({ success: false, output: "That session is no longer active." }, { status: 409 });
    const state: TerminalState = { currentMachine, currentUser, currentPrivilege: session.user.privilege ?? AccessLevel.NONE, currentPath: typeof body.currentPath === "string" ? body.currentPath : "/", activeSessions: [], discoveredHosts: [], credentials: new Map() };
    const result = await new SimulationEngine(scenarioId, actorId).executeCommand(command, state);
    return Response.json(result, { status: result.success ? 200 : 422 });
  } catch (error) {
    console.error("Command execution error", error);
    return Response.json({ success: false, error: "Failed to execute command" }, { status: 500 });
  }
}
