import type { ScenarioDefinition } from "./types";

export function validateScenario(definition: ScenarioDefinition) {
  const fail = (message: string): never => { throw new Error(`${definition.id}: ${message}`); };
  const unique = (values: string[], label: string) => { if (new Set(values).size !== values.length) fail(`duplicate ${label}`); };
  unique(definition.machines.map((m) => m.hostname), "host");
  unique(definition.routes.map((r) => r.id), "route");
  unique(definition.blueProfiles.map((p) => p.id), "profile");
  const host = (name: string) => definition.machines.find((m) => m.hostname === name) ?? fail(`unknown host ${name}`);
  const user = (name: string, username: string) => host(name).users.find((u) => u.username === username) ?? fail(`unknown identity ${username}@${name}`);
  if (!definition.id || !definition.briefing.red || !definition.briefing.blue || !definition.availableModes.length || definition.conditions.timeLimitMinutes <= 0) fail("incomplete mission metadata");
  user(definition.startingKnowledge.knownHosts[0], "attacker");
  definition.startingKnowledge.knownHosts.forEach(host);
  Object.values(definition.aliases).forEach(host);
  for (const machine of definition.machines) { unique(machine.users.map((u) => u.username), "identity"); unique(machine.files.map((f) => f.path), "file"); }
  for (const connection of definition.connections) { host(connection.source); host(connection.target); if (!Number.isInteger(connection.port) || connection.port < 1 || connection.port > 65535) fail("invalid port"); }
  for (const discovery of definition.discoveries) {
    const machine = host(discovery.trigger.host);
    if (discovery.trigger.kind === "file" && !machine.files.some((f) => f.path === discovery.trigger.value)) fail("discovery file absent");
    discovery.hosts?.forEach(host);
    discovery.credentials?.forEach((c) => user(c.scope, c.username));
  }
  for (const interaction of definition.webInteractions ?? []) user(interaction.host, interaction.sessionUser);
  for (const operation of definition.trustedServiceOperations ?? []) { user(operation.host, operation.fromUser); user(operation.host, operation.toUser); }
  if (!definition.objectives.length || definition.routes.length < 2) fail("objectives and competing routes required");
  for (const objective of definition.objectives) if (!host(objective.host).files.some((f) => f.path === objective.path)) fail("objective file absent");
  for (const route of definition.routes) {
    route.hosts.forEach(host);
    for (let i = 1; i < route.hosts.length; i++) if (!definition.connections.some((c) => c.source === route.hosts[i - 1] && c.target === route.hosts[i])) fail(`disconnected route ${route.id}`);
    if (!definition.blueProfiles.some((p) => p.routeId === route.id)) fail(`route has no AI profile ${route.id}`);
  }
  for (const profile of definition.blueProfiles) if (!profile.commands.length || !definition.routes.some((r) => r.id === profile.routeId)) fail("invalid AI profile");
  if (!definition.blueProfiles.some((p) => p.id === definition.defaultBlueProfile)) fail("default profile missing");
  definition.securityControls.forEach((c) => host(c.host));
  definition.businessServices.forEach((s) => s.hosts.forEach(host));
  definition.backgroundActivity.forEach((a) => { host(a.host); if (a.source) host(a.source); });
  return definition;
}
