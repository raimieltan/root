import { AccessLevel, ScenarioMode, ScenarioState } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { parseMetadata } from "./rules";
import { getScenarioDefinition } from "./scenarios";
import type { ScenarioDefinition } from "./scenarios";

export async function initializeScenario(mode: ScenarioMode = ScenarioMode.RED, definitionId = "glasshouse", blueProfileId?: string, assistance: "GUIDED" | "OPERATOR" = "GUIDED") {
  const definition = getScenarioDefinition(definitionId);
  if (!definition.availableModes.includes(mode as "RED" | "BLUE")) throw new Error("Unavailable mode");
  if (blueProfileId && !definition.blueProfiles.some((profile) => profile.id === blueProfileId)) throw new Error("Unknown attacker profile");
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
        const { permissions, resources, outcomes, ...persisted } = service;
        await tx.service.create({ data: { ...persisted, protocol: "tcp", exposedZones: [...service.exposedZones], machineId: id(machine.hostname), metadata: JSON.stringify({ permissions, resources, outcomes }) } });
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
    if (mode === ScenarioMode.RED) await tx.actor.create({ data: { name: "Baseline Blue", role: "blue_ai", scenarioId: scenario.id } });
    const startHost = definition.startingSession?.host ?? definition.startingKnowledge.knownHosts[0];
    const startUsername = definition.startingSession?.user ?? "attacker";
    const startUser = users.get(`${startHost}:${startUsername}`);
    if (!startUser) throw new Error("Scenario must define its starting identity");
    const startPrivilege = definition.machines.find((machine) => machine.hostname === startHost)?.users.find((user) => user.username === startUsername)?.privilege ?? AccessLevel.NONE;
    await tx.session.create({ data: { actorId: redActor.id, userId: startUser.id, machineId: id(startHost), privilege: startPrivilege, scenarioId: scenario.id } });
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
          assistance,
          knownHosts: definition.startingKnowledge.knownHosts,
          knownAssets: definition.startingKnowledge.knownAssets,
          startingPath: definition.startingSession?.path ?? "/",
          blueProfileId: blueProfileId ?? definition.defaultBlueProfile,
        }),
      },
    });
    const businessActor = await tx.actor.create({ data: { scenarioId: scenario.id, name: "Business activity", role: "business" } });
    for (const activity of definition.backgroundActivity) {
      const identity = users.get(`${activity.host}:${activity.user}`);
      const privilege = definition.machines.find((m) => m.hostname === activity.host)?.users.find((u) => u.username === activity.user)?.privilege;
      if (identity && privilege) await tx.session.create({ data: { scenarioId: scenario.id, actorId: businessActor.id, machineId: id(activity.host), userId: identity.id, privilege, sourceMachineId: activity.source ? id(activity.source) : undefined } });
      await tx.securityEvent.create({ data: { scenarioId: scenario.id, actorId: businessActor.id, targetMachineId: id(activity.host), sourceMachineId: activity.source ? id(activity.source) : undefined, userId: activity.user, action: activity.action, category: "AUTH", severity: "INFO", visibleToRed: false, visibleToBlue: true, metadata: JSON.stringify({ context: activity.context, background: true }) } });
    }
    await tx.scenario.update({ where: { id: scenario.id }, data: { state: ScenarioState.ACTIVE, startedAt: new Date() } });
    return {
      scenarioId: scenario.id,
      actorId: blueActor?.id ?? redActor.id,
      redActorId: redActor.id,
      startingState: {
        currentMachine: startHost,
        currentUser: startUsername,
        currentPrivilege: startPrivilege,
        currentPath: definition.startingSession?.path ?? "/",
        discoveredHosts: [...definition.startingKnowledge.knownHosts],
      },
    };
  }, { timeout: 30_000 });
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
