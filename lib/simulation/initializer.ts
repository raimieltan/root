import { AccessLevel, ScenarioMode, ScenarioState } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { parseMetadata } from "./rules";
import { getScenarioDefinition } from "./scenarios";
import type { ScenarioDefinition } from "./scenarios";

export async function initializeScenario(mode: ScenarioMode = ScenarioMode.RED, definitionId = "glasshouse", blueProfileId?: string) {
  const definition = getScenarioDefinition(definitionId);
  return prisma.$transaction(async (tx) => {
    const scenario = await tx.scenario.create({ data: { mode, state: ScenarioState.SETUP } });
    const created = new Map<string, { id: string }>();
    for (const machine of definition.machines) {
      created.set(machine.hostname, await tx.machine.create({
        data: { hostname: machine.hostname, ip: machine.ip, zone: machine.zone, os: machine.os, scenarioId: scenario.id },
      }));
    }
    const id = (hostname: string) => {
      const machine = created.get(hostname);
      if (!machine) throw new Error(`Missing scenario host ${hostname}`);
      return machine.id;
    };

    const users = new Map<string, { id: string }>();
    for (const machine of definition.machines) {
      for (const user of machine.users) {
        const createdUser = await tx.user.create({ data: { ...user, groups: [...user.groups], machineId: id(machine.hostname) } });
        users.set(`${machine.hostname}:${user.username}`, createdUser);
      }
      for (const service of machine.services) {
        await tx.service.create({ data: { ...service, protocol: "tcp", exposedZones: [...service.exposedZones], machineId: id(machine.hostname) } });
      }
      for (const file of machine.files) await tx.file.create({ data: { ...file, machineId: id(machine.hostname) } });
      for (const process of machine.processes ?? []) await tx.process.create({ data: { ...process, machineId: id(machine.hostname) } });
    }

    for (const connection of definition.connections) {
      await tx.networkConnection.create({ data: { sourceMachineId: id(connection.source), targetMachineId: id(connection.target), port: connection.port, protocol: "tcp", allowed: true } });
      const source = definition.machines.find((machine) => machine.hostname === connection.source);
      if (!source) throw new Error(`Missing source host ${connection.source}`);
      await tx.networkRule.create({ data: { sourceZone: source.zone, targetMachineId: id(connection.target), port: connection.port, allow: true } });
    }

    const redActor = await tx.actor.create({ data: { name: mode === ScenarioMode.BLUE ? "Scripted Red" : "Red Team Operator", role: mode === ScenarioMode.BLUE ? "red_ai" : "red_operator", scenarioId: scenario.id } });
    const blueActor = mode === ScenarioMode.BLUE ? await tx.actor.create({ data: { name: "Blue Team Operator", role: "blue_operator", scenarioId: scenario.id } }) : null;
    const startHost = definition.startingKnowledge.knownHosts[0];
    const attacker = users.get(`${startHost}:attacker`);
    if (!attacker) throw new Error("Scenario must define its starting attacker identity");
    await tx.session.create({ data: { actorId: redActor.id, userId: attacker.id, machineId: id(startHost), privilege: AccessLevel.NONE, scenarioId: scenario.id } });
    await tx.securityEvent.create({
      data: {
        actorId: redActor.id,
        scenarioId: scenario.id,
        targetMachineId: id(definition.startingKnowledge.knownHosts.at(-1) ?? startHost),
        category: "SYSTEM",
        action: "MISSION_STARTED",
        severity: "INFO",
        visibleToRed: true,
        visibleToBlue: false,
        metadata: JSON.stringify({
          scenarioDefinitionId: definition.id,
          knownHosts: definition.startingKnowledge.knownHosts,
          knownAssets: definition.startingKnowledge.knownAssets,
          blueProfileId: blueProfileId ?? definition.defaultBlueProfile,
        }),
      },
    });
    await tx.scenario.update({ where: { id: scenario.id }, data: { state: ScenarioState.ACTIVE, startedAt: new Date() } });
    return {
      scenarioId: scenario.id,
      actorId: blueActor?.id ?? redActor.id,
      redActorId: redActor.id,
      startingState: {
        currentMachine: startHost,
        currentUser: "attacker",
        currentPrivilege: AccessLevel.NONE,
        currentPath: "/",
        discoveredHosts: [...definition.startingKnowledge.knownHosts],
      },
    };
  });
}

export async function getDefinitionForScenario(scenarioId: string): Promise<ScenarioDefinition> {
  const mission = await prisma.securityEvent.findFirst({ where: { scenarioId, action: "MISSION_STARTED" }, orderBy: { timestamp: "asc" } });
  const metadata = parseMetadata(mission?.metadata);
  return getScenarioDefinition(typeof metadata.scenarioDefinitionId === "string" ? metadata.scenarioDefinitionId : "glasshouse");
}

export async function getScenario(scenarioId: string) {
  return prisma.scenario.findUnique({ where: { id: scenarioId }, include: { actors: true, sessions: true, events: true, machines: { include: { users: true, services: true, files: true, processes: true, persistence: true } } } });
}

export async function deleteScenario(scenarioId: string) {
  return prisma.scenario.delete({ where: { id: scenarioId } });
}
