import { prisma } from "@/lib/prisma";

export async function reachable(scenarioId: string, sourceMachineId: string, targetMachineId: string, ports?: number[]) {
  const link = await prisma.networkConnection.findFirst({ where: { sourceMachineId, targetMachineId, allowed: true, ...(ports ? { port: { in: ports } } : {}), source: { scenarioId }, target: { scenarioId } }, include: { target: { include: { services: true } } } });
  if (!link || !link.target.services.some((service) => service.port === link.port && service.status === "RUNNING")) return false;
  const events = await prisma.securityEvent.findMany({ where: { scenarioId, targetMachineId: { in: [sourceMachineId, targetMachineId] }, action: { in: ["HOST_ISOLATED", "HOST_RESTORED"] } }, orderBy: { timestamp: "asc" } });
  const isolated = new Set<string>();
  for (const event of events) if (event.targetMachineId) { if (event.action === "HOST_ISOLATED") isolated.add(event.targetMachineId); else isolated.delete(event.targetMachineId); }
  return isolated.size === 0;
}
