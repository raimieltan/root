import { prisma } from "@/lib/prisma";
import { getDefinitionForScenario } from "./initializer";

export async function businessAvailability(scenarioId: string) {
  const definition = await getDefinitionForScenario(scenarioId);
  const machines = await prisma.machine.findMany({ where: { scenarioId }, include: { services: true } });
  const connections = await prisma.networkConnection.findMany({ where: { source: { scenarioId } }, include: { target: true } });
  const services = definition.businessServices.map((service) => {
    const offline = service.hosts.some((hostname) => machines.find((m) => m.hostname === hostname)?.services.some((s) => s.status !== "RUNNING"));
    const blocked = connections.some((connection) => service.hosts.includes(connection.target.hostname) && !connection.allowed);
    return { ...service, state: offline ? "OFFLINE" : blocked ? "DEGRADED" : "HEALTHY" };
  });
  const percent = Math.round(services.reduce((sum, service) => sum + (service.state === "HEALTHY" ? 100 : service.state === "DEGRADED" ? 50 : 0), 0) / Math.max(1, services.length));
  return { services, percent };
}
