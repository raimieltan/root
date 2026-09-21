import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AccessLevel } from "@/app/generated/prisma/enums";
import { OperatorKnowledgeLedger } from "./operator-discoverability";
import { getScenarioDefinition } from "./scenarios";
import type { CommandResult, TerminalState } from "./types";

const successful = (output: string, currentPath?: string): CommandResult => ({ success: true, output, events: [], currentPath });
const failed = (output: string): CommandResult => ({ success: false, output, events: [] });

function stateFor(scenarioId: string): TerminalState {
  const definition = getScenarioDefinition(scenarioId);
  return {
    currentMachine: definition.startingSession?.host ?? definition.startingKnowledge.knownHosts[0],
    currentUser: definition.startingSession?.user ?? "attacker",
    currentPrivilege: AccessLevel.USER,
    currentPath: definition.startingSession?.path ?? "/",
    activeSessions: [],
    discoveredHosts: [...definition.startingKnowledge.knownHosts],
    credentials: new Map(),
    context: { type: "UNIX" },
  };
}

describe("OperatorKnowledgeLedger", () => {
  it("rejects an unobserved path and accepts directory entries learned through ls", () => {
    const definition = getScenarioDefinition("the-printer");
    const ledger = OperatorKnowledgeLedger.fromScenario(definition);
    const state = stateFor(definition.id);

    assert.deepEqual(ledger.authorize("cat TICKET-4471.txt", state), { allowed: false, unknown: ["TICKET-4471.txt"] });
    ledger.record("ls", state, successful("TICKET-4471.txt\n"));
    assert.equal(ledger.authorize("cat TICKET-4471.txt", state).allowed, true);

    assert.equal(ledger.authorize("cd /var", state).allowed, true);
    state.currentPath = "/var";
    assert.equal(ledger.authorize("cd log", state).allowed, false);
    ledger.record("ls", state, successful("log/\nspool/"));
    assert.equal(ledger.authorize("cd log", state).allowed, true);
    assert.equal(ledger.authorize("cat /etc/nodeline/group-membership.txt", state).allowed, false);
  });

  it("requires SSH identities and prompted secrets to appear in prior evidence", () => {
    const definition = getScenarioDefinition("wrong-network");
    const ledger = OperatorKnowledgeLedger.fromScenario(definition);
    const state = stateFor(definition.id);

    assert.equal(ledger.authorize("ssh netops@NETOPS-01", state).allowed, false);
    ledger.record("cat NETWORK_ACCESS.txt", state, successful("Approved jump: netops@NETOPS-01\nPassword: Bridge-Access-9"));
    assert.equal(ledger.authorize("ssh netops@NETOPS-01", state).allowed, true);

    state.context = { type: "AUTHENTICATING", serviceName: "ssh", username: "netops", host: "NETOPS-01" };
    assert.equal(ledger.authorize("guessed-password", state).allowed, false);
    assert.equal(ledger.authorize("Bridge-Access-9", state).allowed, true);
  });

  it("requires HTTP routes, form fields, and values to be observed", () => {
    const definition = getScenarioDefinition("the-new-server");
    const ledger = OperatorKnowledgeLedger.fromScenario(definition);
    const state = stateFor(definition.id);
    const command = "curl -X POST NEW-APP-01/login --data username=commissioning&password=SignOff-2026";

    ledger.record("cat COMMISSIONING_ACCESS.txt", state, successful("Host NEW-APP-01\nUser commissioning\nSecret SignOff-2026"));
    assert.deepEqual(ledger.authorize(command, state), { allowed: false, unknown: ["/login", "username", "password"] });
    ledger.record("curl NEW-APP-01", state, successful('<form method="POST" action="/login"><input name="username"><input name="password"></form>'));
    assert.equal(ledger.authorize(command, state).allowed, true);
  });

  it("requires database identifiers to be enumerated before use", () => {
    const definition = getScenarioDefinition("glasshouse");
    const ledger = OperatorKnowledgeLedger.fromScenario(definition);
    const state = stateFor(definition.id);

    assert.equal(ledger.authorize("\\c finance", state).allowed, false);
    ledger.record("\\l", state, successful("finance"));
    assert.equal(ledger.authorize("\\c finance", state).allowed, true);
    assert.equal(ledger.authorize("SELECT filename, classification FROM documents;", state).allowed, false);
    ledger.record("\\d documents", state, successful("filename | text\nclassification | text\ndocuments"));
    assert.equal(ledger.authorize("SELECT filename, classification FROM documents;", state).allowed, true);
  });

  it("does not learn from failed command output", () => {
    const definition = getScenarioDefinition("the-printer");
    const ledger = OperatorKnowledgeLedger.fromScenario(definition);
    const state = stateFor(definition.id);

    ledger.record("cat hidden.txt", state, failed("secret-user@SECRET-01 password=hunter2"));
    assert.equal(ledger.authorize("ssh secret-user@SECRET-01", state).allowed, false);
  });

  it("keeps directory-listing evidence scoped to the host that exposed it", () => {
    const definition = getScenarioDefinition("wrong-network");
    const ledger = OperatorKnowledgeLedger.fromScenario(definition);
    const state = stateFor(definition.id);

    ledger.record("ls", state, successful("LOCAL_ONLY.txt"));
    assert.equal(ledger.authorize("cat LOCAL_ONLY.txt", state).allowed, true);
    state.currentMachine = "NETOPS-01";
    assert.equal(ledger.authorize("cat LOCAL_ONLY.txt", state).allowed, false);
  });
});
