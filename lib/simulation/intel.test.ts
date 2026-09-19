import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AccessLevel, ScenarioMode } from "@/app/generated/prisma/enums";
import { SimulationEngine } from "./engine";
import { deleteScenario, initializeScenario } from "./initializer";
import { getScenarioView } from "./state";
import type { TerminalState } from "./types";

// The Glasshouse "application" route pivots WEB-01 -> DEV-01 -> FIN-APP -> FIN-DB using only
// commands the mission already exercises. Intel must auto-populate from that activity alone,
// with no scenario-specific Intel wiring.
const applicationRoute = [
  "nmap 10.10.10.10",
  "curl -i http://10.10.10.10",
  "curl portal.meridian.test",
  "curl --data upload=archive portal.meridian.test/legacy-upload",
  "cat /var/www/meridian/app.conf",
  "ssh deploy@DEV-01",
  "MeridianDeploy2024!Secret",
  "id",
  "ls -l /opt/backup/run.sh",
  "grep RUN_HOOK /etc/backup-sync.conf",
  "find /opt -name run.sh",
  "backup-sync --run-hook",
  "cat /etc/meridian/routes.conf",
  "ssh svc_web@FIN-APP",
  "svc-meridian-2026",
  "cat /etc/fin-app/db.conf",
  "psql -h FIN-DB -U finance_app -d finance",
  "FinanceApp2026!Secure",
];

describe("Intel auto-recording", { concurrency: false }, () => {
  it("populates HOSTS, CREDENTIALS, NETWORKS, and RELATIONSHIPS from existing discovery and session data alone", async () => {
    const initialized = await initializeScenario(ScenarioMode.RED, "glasshouse");
    const state: TerminalState = {
      currentMachine: "INTERNET", currentUser: "attacker", currentPrivilege: AccessLevel.NONE,
      activeSessions: [], discoveredHosts: ["WEB-01"], credentials: new Map(), currentPath: "/",
    };
    try {
      const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);
      for (const command of applicationRoute) {
        const result = await engine.executeCommand(command, state);
        assert.equal(result.success, true, `${command}: ${result.output}`);
        if (result.newSession) {
          state.currentMachine = result.newSession.machineId;
          state.currentUser = result.newSession.userId;
          state.currentPrivilege = result.newSession.privilege;
          state.currentSessionId = result.newSession.id;
          state.context = result.context;
          state.currentPath = "/";
        }
      }

      const view = await getScenarioView(initialized.scenarioId, initialized.actorId);
      assert.ok(view);
      assert.ok(view!.intel.hosts.includes("WEB-01"));
      assert.ok(view!.intel.hosts.includes("DEV-01"));
      assert.ok(view!.intel.hosts.includes("FIN-APP"));
      assert.ok(view!.intel.credentials.some((entry) => entry.startsWith("deploy@")));
      assert.ok(view!.intel.credentials.some((entry) => entry.startsWith("svc_web@")));
      assert.ok(view!.intel.networks.length > 0);
      assert.ok(view!.intel.relationships.some((entry) => entry.includes("→ DEV-01")));
      assert.ok(view!.intel.relationships.some((entry) => entry.includes("→ FIN-APP")));
    } finally {
      await deleteScenario(initialized.scenarioId);
    }
  });
});
