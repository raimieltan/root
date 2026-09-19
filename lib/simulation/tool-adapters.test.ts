import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BLUE_RESPONSE_ACTIONS } from "./blue";
import { campaign } from "./scenarios";
import { createToolAdapterRegistry, parseTerminalInput, toolContracts, type ToolExecutionHandlers } from "./tools";
import type { CommandResult, TerminalState } from "./types";

const result = (output: string): CommandResult => ({ success: true, output, events: [] });
const unavailable = async () => result("unavailable");
const handlers: ToolExecutionHandlers = {
  invalid: (message) => ({ success: false, output: message, events: [] }),
  shell: new Proxy({}, { get: (_target, command: string) => async () => result(command) }),
  unknown: (command) => ({ success: false, output: command, events: [] }),
  curl: unavailable,
  service: unavailable,
  postgresConnect: unavailable,
  postgresInput: unavailable,
  authenticate: unavailable,
};

const state = (context: TerminalState["context"] = { type: "UNIX" }): TerminalState => ({
  currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: "NONE", activeSessions: [], discoveredHosts: [], credentials: new Map(), context,
});

describe("Tool adapter contracts", () => {
  it("gives every supported tool an explicit execution, telemetry, replay, and Blue-response contract", () => {
    const contracts = toolContracts();
    assert.equal(new Set(contracts.map((contract) => contract.id)).size, contracts.length);
    for (const contract of contracts) {
      assert.ok(contract.syntax && contract.permissions.length && contract.resources.length >= 0 && contract.outcomes.length, contract.id);
      if (contract.telemetry.length) {
        assert.notEqual(contract.replay, "NONE", contract.id);
      }
      if (contract.detectability !== "NONE") {
        assert.ok(contract.telemetry.some((action) => action !== "TOOL_EXECUTED"), contract.id);
        assert.ok(contract.blueResponses.length, contract.id);
      }
      for (const response of contract.blueResponses) assert.ok((BLUE_RESPONSE_ACTIONS as readonly string[]).includes(response), `${contract.id}: ${response}`);
    }
  });

  it("dispatches through adapters and gives interactive contexts precedence over shell syntax", async () => {
    const registry = createToolAdapterRegistry(handlers);
    assert.equal(registry.resolve("nmap WEB-01").contract.id, "network.nmap");
    assert.equal(registry.resolve("curl portal.test").contract.id, "network.curl");
    assert.equal(registry.resolve("anything", { type: "POSTGRES", serviceName: "postgres" }).contract.id, "database.psql-input");
    assert.equal(registry.resolve("nmap WEB-01", { type: "AUTHENTICATING", serviceName: "ssh", username: "deploy", host: "DEV-01" }).contract.id, "authentication.prompt");
    assert.equal((await registry.execute("whoami", state())).output, "whoami");
  });

  it("preserves typed parsing for network, service, database, and authentication intents", () => {
    assert.deepEqual(parseTerminalInput("curl -X POST app.test/run --data task=sync"), { kind: "CURL_REQUEST", url: "app.test/run", method: "POST", data: "task=sync" });
    assert.deepEqual(parseTerminalInput("backup-sync --run-hook"), { kind: "SERVICE_OPERATION", service: "backup-sync", args: ["--run-hook"] });
    assert.deepEqual(parseTerminalInput("psql -h FIN-DB -U finance_app -d finance"), { kind: "PSQL_CONNECT", host: "FIN-DB", username: "finance_app", database: "finance", password: undefined });
    assert.deepEqual(parseTerminalInput("SELECT * FROM documents;", { type: "POSTGRES", serviceName: "postgres", databaseName: "finance" }), { kind: "PSQL_INPUT", input: "SELECT * FROM documents;" });
  });

  it("requires explicit service permissions, resources, outcomes, telemetry, and countermeasures across the campaign", () => {
    for (const definition of campaign) {
      assert.deepEqual(new Set(definition.availableModes), new Set(["RED", "BLUE"]), definition.id);
      for (const machine of definition.machines) for (const service of machine.services) {
        assert.ok(service.permissions.length, `${definition.id}:${machine.hostname}:${service.name}:permissions`);
        assert.ok(service.resources.length, `${definition.id}:${machine.hostname}:${service.name}:resources`);
        assert.ok(service.outcomes.length, `${definition.id}:${machine.hostname}:${service.name}:outcomes`);
        for (const outcome of service.outcomes) {
          assert.ok(outcome.telemetry.length, `${definition.id}:${machine.hostname}:${service.name}:telemetry`);
          assert.ok(outcome.blueResponses.length, `${definition.id}:${machine.hostname}:${service.name}:responses`);
          for (const response of outcome.blueResponses) assert.ok((BLUE_RESPONSE_ACTIONS as readonly string[]).includes(response), `${definition.id}:${response}`);
        }
      }
      for (const route of definition.routes) assert.ok(definition.blueProfiles.some((profile) => profile.routeId === route.id), `${definition.id}:${route.id}`);
    }
  });
});
