import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyBrowserCommandResult } from "./browser-state";
import type { TerminalState } from "./terminal";

describe("Browser shared terminal state", () => {
  it("propagates an interactive web-worker session and its home directory", () => {
    const state: TerminalState = { currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: "NONE", currentPath: "/", context: { type: "UNIX" }, discoveredHosts: ["WEB-01"] };
    const next = applyBrowserCommandResult(state, {
      newSession: { id: "session-1", machineId: "WEB-01", userId: "www-data", privilege: "USER" },
      context: { type: "UNIX" },
      currentPath: "/home/www-data",
      discoveredHosts: ["WEB-01", "DEV-01"],
    });

    assert.deepEqual(next, { currentMachine: "WEB-01", currentUser: "www-data", currentPrivilege: "USER", currentSessionId: "session-1", currentPath: "/home/www-data", context: { type: "UNIX" }, discoveredHosts: ["WEB-01", "DEV-01"] });
    assert.equal(state.currentMachine, "INTERNET");
  });

  it("does not switch shell identity for a cookie-only response", () => {
    const state: TerminalState = { currentMachine: "HELPDESK-01", currentUser: "trainee", currentPrivilege: "USER", currentPath: "/home/trainee", context: { type: "UNIX" }, discoveredHosts: ["HELPDESK-01", "NEW-APP-01"] };
    const next = applyBrowserCommandResult(state, { httpResponse: { url: "NEW-APP-01/login", method: "POST", status: 200, reason: "OK", headers: [], body: "Logged in." } });
    assert.deepEqual(next, state);
  });
});
