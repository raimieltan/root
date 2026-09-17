import { AccessLevel, NetworkZone, ScenarioMode, ScenarioState } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const hosts = [
  { hostname: "INTERNET", ip: "0.0.0.0", zone: NetworkZone.EXTERNAL, os: "appliance" },
  { hostname: "EDGE-FW", ip: "10.10.10.1", zone: NetworkZone.DMZ, os: "appliance" },
  { hostname: "WEB-01", ip: "10.10.10.10", zone: NetworkZone.DMZ, os: "linux" },
  { hostname: "VPN-01", ip: "10.10.10.30", zone: NetworkZone.DMZ, os: "appliance" },
  { hostname: "DEV-01", ip: "10.20.10.20", zone: NetworkZone.INTERNAL, os: "linux" },
  { hostname: "FIN-APP", ip: "10.30.10.20", zone: NetworkZone.FINANCE, os: "linux" },
  { hostname: "FIN-DB", ip: "10.30.10.21", zone: NetworkZone.FINANCE, os: "linux" },
  { hostname: "BACKUP-01", ip: "10.30.10.40", zone: NetworkZone.FINANCE, os: "linux" },
];

export async function initializeScenario(mode: ScenarioMode = ScenarioMode.RED) {
  return prisma.$transaction(async (tx) => {
    const scenario = await tx.scenario.create({ data: { mode, state: ScenarioState.SETUP } });
    const created = new Map<string, { id: string }>();
    for (const host of hosts) {
      created.set(host.hostname, await tx.machine.create({ data: { ...host, scenarioId: scenario.id } }));
    }
    const id = (hostname: string) => {
      const machine = created.get(hostname);
      if (!machine) throw new Error(`Missing seed host ${hostname}`);
      return machine.id;
    };

    const userSeeds = [
      ["INTERNET", "attacker", "operator", AccessLevel.NONE, ["red"]],
      ["WEB-01", "www-data", "web_service", AccessLevel.SERVICE, ["www"]],
      ["WEB-01", "root", "admin", AccessLevel.ROOT, ["root"]],
      ["DEV-01", "deploy", "developer", AccessLevel.USER, ["deploy", "developers"]],
      ["DEV-01", "root", "admin", AccessLevel.ROOT, ["root"]],
      ["FIN-APP", "svc_web", "service", AccessLevel.SERVICE, ["service"]],
      ["FIN-APP", "root", "admin", AccessLevel.ROOT, ["root"]],
      ["FIN-DB", "finance_app", "service", AccessLevel.SERVICE, ["db_users"]],
      ["FIN-DB", "root", "admin", AccessLevel.ROOT, ["root"]],
      ["BACKUP-01", "backup", "service", AccessLevel.SERVICE, ["backup"]],
    ] as const;
    const users = new Map<string, { id: string }>();
    for (const [host, username, role, privilege, groups] of userSeeds) {
      const user = await tx.user.create({ data: { username, role, privilege, groups: [...groups], machineId: id(host), password: username === "deploy" ? "MeridianDeploy2024!Secret" : undefined } });
      users.set(`${host}:${username}`, user);
    }

    const serviceSeeds = [
      ["WEB-01", "ssh", 22, "root", [NetworkZone.DMZ, NetworkZone.EXTERNAL]],
      ["WEB-01", "http", 80, "www-data", [NetworkZone.DMZ, NetworkZone.EXTERNAL]],
      ["WEB-01", "https", 443, "www-data", [NetworkZone.DMZ, NetworkZone.EXTERNAL]],
      ["VPN-01", "vpn", 443, "root", [NetworkZone.EXTERNAL]],
      ["DEV-01", "ssh", 22, "root", [NetworkZone.INTERNAL, NetworkZone.DMZ]],
      ["DEV-01", "backup-sync", 8080, "root", [NetworkZone.INTERNAL]],
      ["FIN-APP", "ssh", 22, "root", [NetworkZone.INTERNAL, NetworkZone.FINANCE]],
      ["FIN-APP", "fin-api", 443, "svc_web", [NetworkZone.INTERNAL, NetworkZone.FINANCE]],
      ["FIN-DB", "postgres", 5432, "finance_app", [NetworkZone.FINANCE]],
      ["BACKUP-01", "backup", 873, "backup", [NetworkZone.FINANCE]],
    ] as const;
    for (const [host, name, port, runningAsUser, exposedZones] of serviceSeeds) {
      await tx.service.create({ data: { name, port, protocol: "tcp", runningAsUser, machineId: id(host), exposedZones: [...exposedZones] } });
    }

    const fileSeeds = [
      ["WEB-01", "/var/www/meridian/app.conf", "www-data", "www", "644", true, "DEV_HOST=10.20.10.20\nDEPLOY_USER=deploy\nDEPLOY_TOKEN=MeridianDeploy2024!Secret"],
      ["WEB-01", "/var/www/meridian/portal/index.html", "www-data", "www", "644", false, "Meridian Dynamics Employee Portal — legacy upload module enabled"],
      ["DEV-01", "/etc/backup-sync.conf", "root", "deploy", "660", true, "BACKUP_TARGET=/backup\nRUN_HOOK=verify\nVERIFY_SIGNATURE=true"],
      ["DEV-01", "/etc/meridian/routes.conf", "root", "root", "600", true, "FINANCE_API=10.30.10.20:443\nFIN_SERVICE_USER=svc_web\nFIN_SERVICE_TOKEN=svc-meridian-2026"],
      ["FIN-APP", "/etc/fin-app/db.conf", "svc_web", "svc_web", "600", true, "DB_USER=finance_app\nDB_PASSWORD=FinanceApp2026!Secure\nDB_HOST=10.30.10.21\nDB_PORT=5432"],
      ["FIN-DB", "/opt/db/data/PROJECT_ATLAS.pdf", "finance_app", "db_users", "600", true, "PROJECT_ATLAS — CONFIDENTIAL\nMeridian autonomous routing acquisition blueprint."],
      ["BACKUP-01", "/srv/backup/manifest.txt", "backup", "backup", "640", false, "Nightly finance backup manifest"],
    ] as const;
    for (const [host, path, owner, group, permissions, isSecret, contents] of fileSeeds) {
      await tx.file.create({ data: { path, owner, group, permissions, isSecret, contents, machineId: id(host) } });
    }

    const processSeeds = [
      ["WEB-01", "nginx", 482, "www-data"], ["DEV-01", "backup-sync", 731, "root"],
      ["FIN-APP", "fin-api", 902, "svc_web"], ["FIN-DB", "postgres", 1190, "finance_app"],
    ] as const;
    for (const [host, name, pid, runningAs] of processSeeds) await tx.process.create({ data: { name, pid, runningAs, machineId: id(host) } });

    const links = [
      ["INTERNET", "WEB-01", 80], ["INTERNET", "WEB-01", 443], ["INTERNET", "WEB-01", 22],
      ["WEB-01", "DEV-01", 22], ["DEV-01", "FIN-APP", 22], ["DEV-01", "FIN-APP", 443],
      ["FIN-APP", "FIN-DB", 5432], ["FIN-DB", "BACKUP-01", 873],
    ] as const;
    for (const [source, target, port] of links) {
      await tx.networkConnection.create({ data: { sourceMachineId: id(source), targetMachineId: id(target), port, protocol: "tcp", allowed: true } });
      const zone = hosts.find((host) => host.hostname === source)!.zone;
      await tx.networkRule.create({ data: { sourceZone: zone, targetMachineId: id(target), port, allow: true } });
    }

    const redActor = await tx.actor.create({ data: { name: mode === ScenarioMode.BLUE ? "Scripted Red" : "Red Team Operator", role: mode === ScenarioMode.BLUE ? "red_ai" : "red_operator", scenarioId: scenario.id } });
    const blueActor = mode === ScenarioMode.BLUE ? await tx.actor.create({ data: { name: "Blue Team Operator", role: "blue_operator", scenarioId: scenario.id } }) : null;
    const attacker = users.get("INTERNET:attacker")!;
    await tx.session.create({ data: { actorId: redActor.id, userId: attacker.id, machineId: id("INTERNET"), privilege: AccessLevel.NONE, scenarioId: scenario.id } });
    await tx.securityEvent.create({ data: { actorId: redActor.id, scenarioId: scenario.id, targetMachineId: id("WEB-01"), category: "SYSTEM", action: "MISSION_STARTED", severity: "INFO", visibleToRed: true, visibleToBlue: false, metadata: JSON.stringify({ knownHost: "portal.meridian.test" }) } });
    await tx.scenario.update({ where: { id: scenario.id }, data: { state: ScenarioState.ACTIVE, startedAt: new Date() } });
    return { scenarioId: scenario.id, actorId: blueActor?.id ?? redActor.id, redActorId: redActor.id };
  });
}

export async function getScenario(scenarioId: string) {
  return prisma.scenario.findUnique({ where: { id: scenarioId }, include: { actors: true, sessions: true, events: true, machines: { include: { users: true, services: true, files: true, processes: true, persistence: true } } } });
}

export async function deleteScenario(scenarioId: string) {
  return prisma.scenario.delete({ where: { id: scenarioId } });
}
