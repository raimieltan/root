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
  const startingHost = definition.startingSession?.host ?? definition.startingKnowledge.knownHosts[0];
  user(startingHost, definition.startingSession?.user ?? "attacker");
  if (!definition.startingKnowledge.knownHosts.includes(startingHost)) fail("starting session host must be known");
  definition.startingKnowledge.knownHosts.forEach(host);
  unique(definition.dnsRecords.map((record) => record.name), "dns record name");
  for (const record of definition.dnsRecords) {
    if (record.type === "A") host(record.value);
    else if (!definition.dnsRecords.some((other) => other.name === record.value)) fail(`dangling CNAME ${record.name} -> ${record.value}`);
  }
  for (const machine of definition.machines) {
    unique(machine.users.map((u) => u.username), "identity"); unique(machine.files.map((f) => f.path), "file"); unique(machine.services.map((service) => `${service.name}:${service.port}`), "service");
    for (const service of machine.services) {
      if (!service.permissions.length || !service.resources.length || !service.outcomes.length) fail(`service contract incomplete ${machine.hostname}:${service.name}`);
      if (service.permissions.some((permission) => !permission.requires.length)) fail(`service permission has no requirements ${machine.hostname}:${service.name}`);
      if (service.resources.some((resource) => !resource.id || !resource.operations.length)) fail(`service resource incomplete ${machine.hostname}:${service.name}`);
      if (service.outcomes.some((outcome) => !outcome.action || !outcome.telemetry.length || !outcome.blueResponses.length)) fail(`service outcome lacks telemetry or Blue response ${machine.hostname}:${service.name}`);
    }
  }
  for (const connection of definition.connections) { host(connection.source); host(connection.target); if (!Number.isInteger(connection.port) || connection.port < 1 || connection.port > 65535) fail("invalid port"); }
  for (const discovery of definition.discoveries) {
    if (discovery.trigger.kind === "dns") {
      if (!definition.dnsRecords.some((record) => record.name === discovery.trigger.host)) fail(`dns discovery references unknown record ${discovery.trigger.host}`);
      discovery.hosts?.forEach(host);
      discovery.credentials?.forEach((c) => user(c.scope, c.username));
      for (const fact of discovery.facts ?? []) if (!definition.facts?.some((entry) => entry.id === fact)) fail(`unknown discovery fact ${fact}`);
      continue;
    }
    const machine = host(discovery.trigger.host);
    if (discovery.trigger.kind === "file" && !machine.files.some((f) => f.path === discovery.trigger.value)) fail("discovery file absent");
    discovery.hosts?.forEach(host);
    discovery.credentials?.forEach((c) => user(c.scope, c.username));
    for (const fact of discovery.facts ?? []) if (!definition.facts?.some((entry) => entry.id === fact)) fail(`unknown discovery fact ${fact}`);
  }
  const factIds = definition.facts?.map((fact) => fact.id) ?? [];
  if (new Set(factIds).size !== factIds.length) fail("duplicate fact id");
  for (const interaction of definition.webInteractions ?? []) {
    user(interaction.host, interaction.sessionUser);
    if (!host(interaction.host).services.some((service) => ["http", "https"].includes(service.name))) fail(`web interaction has no web service ${interaction.host}`);
    if (!interaction.evidence.length) fail(`web interaction lacks telemetry ${interaction.host}:${interaction.path}`);
  }
  unique((definition.httpRoutes ?? []).map((route) => `${route.host}:${route.method}:${route.path}`), "http route");
  for (const route of definition.httpRoutes ?? []) {
    if (!host(route.host).services.some((service) => ["http", "https"].includes(service.name))) fail(`http route has no web service ${route.host}`);
    if (route.login && route.requiresSession) fail(`http route cannot be both a login and session-gated ${route.host}:${route.path}`);
  }
  for (const operation of definition.trustedServiceOperations ?? []) {
    user(operation.host, operation.fromUser); user(operation.host, operation.toUser);
    if (!host(operation.host).services.some((service) => service.name === operation.service)) fail(`trusted operation has no service ${operation.host}:${operation.service}`);
    if (!operation.evidence.length) fail(`trusted operation lacks telemetry ${operation.host}:${operation.service}`);
  }
  for (const database of definition.databases ?? []) {
    if (!host(database.host).services.some((service) => service.name === database.service)) fail(`database has no service ${database.host}:${database.service}`);
    for (const identity of database.identities) { user(database.host, identity.username); if (!identity.tables.length) fail(`database identity has no resources ${database.host}:${identity.username}`); }
  }
  if (!definition.objectives.length) fail("objectives required");
  unique(definition.objectives.map((objective) => objective.id), "objective");
  for (const objective of definition.objectives) {
    if (objective.hints.length !== 3) fail(`objective ${objective.id} must define exactly 3 hints`);
    for (const tier of objective.hints) {
      if (!tier.text.trim()) fail(`objective ${objective.id} has empty hint text`);
      for (const factId of tier.skipIfFactKnown ?? []) {
        if (!factIds.includes(factId)) fail(`objective ${objective.id} references unknown hint fact ${factId}`);
      }
    }
    if (objective.type === "retrieve_file" && !host(objective.host).files.some((file) => file.path === objective.path)) fail("objective file absent");
    if (objective.type === "fact" && !definition.facts?.some((fact) => fact.id === objective.factId)) fail(`objective references unknown fact ${objective.factId}`);
    if (objective.type === "event") {
      if (!objective.event.action) fail("event objective action required");
      if (objective.event.sourceHost) host(objective.event.sourceHost);
      if (objective.event.targetHost) host(objective.event.targetHost);
    }
    if (objective.learning && (!objective.learning.concepts.length || !objective.learning.evidence)) fail(`learning annotation incomplete ${objective.id}`);
  }
  for (const question of definition.beginnerExitQuestions ?? []) {
    if (!question.prompt || !question.evidenceObjectives.length) fail(`exit question incomplete ${question.id}`);
    for (const objectiveId of question.evidenceObjectives) if (!definition.objectives.some((objective) => objective.id === objectiveId)) fail(`exit question references unknown objective ${objectiveId}`);
  }
  if (definition.availableModes.includes("BLUE") && definition.routes.length < 2) fail("Blue operations require competing routes");
  for (const route of definition.routes) {
    route.hosts.forEach(host);
    for (let i = 1; i < route.hosts.length; i++) if (!definition.connections.some((c) => c.source === route.hosts[i - 1] && c.target === route.hosts[i])) fail(`disconnected route ${route.id}`);
    if (!definition.blueProfiles.some((p) => p.routeId === route.id)) fail(`route has no AI profile ${route.id}`);
  }
  for (const profile of definition.blueProfiles) if (!profile.commands.length || !definition.routes.some((r) => r.id === profile.routeId)) fail("invalid AI profile");
  if (definition.availableModes.includes("BLUE") && !definition.blueProfiles.some((p) => p.id === definition.defaultBlueProfile)) fail("default profile missing");
  definition.securityControls.forEach((c) => host(c.host));
  definition.businessServices.forEach((s) => s.hosts.forEach(host));
  definition.backgroundActivity.forEach((a) => { host(a.host); if (a.source) host(a.source); });
  return definition;
}
