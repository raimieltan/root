import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ScenarioMode } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { SimulationEngine } from "./engine";
import { deleteScenario, initializeScenario } from "./initializer";
import { OperatorKnowledgeLedger } from "./operator-discoverability";
import { getScenarioDefinition } from "./scenarios";
import type { TerminalState } from "./types";

type RouteCatalog = Record<string, Record<string, string[]>>;

function endpointRoute(input: {
  publicUrl: string;
  scanHost: string;
  postTarget: string;
  data: string;
  configDirectory: string;
  configFile: string;
  serviceIdentity: string;
  serviceHost: string;
  objectiveName: string;
  objectivePath: string;
  installAgent?: boolean;
}) {
  return [
    `curl ${input.publicUrl}`,
    `nmap ${input.scanHost}`,
    `curl -X POST ${input.postTarget} --data ${input.data}`,
    ...(input.installAgent ? ["install-agent"] : []),
    "ls /etc",
    `ls /etc/${input.configDirectory}`,
    `cat /etc/${input.configDirectory}/${input.configFile}`,
    `ssh ${input.serviceIdentity}@${input.serviceHost}`,
    `find / -name ${input.objectiveName}`,
    `retrieve ${input.objectivePath}`,
  ];
}

function identityRoute(input: {
  publicUrl: string;
  humanIdentity: string;
  humanHost: string;
  handoffFile: string;
  serviceIdentity: string;
  serviceHost: string;
  objectiveName: string;
  objectivePath: string;
}) {
  return [
    `curl ${input.publicUrl}`,
    `ssh ${input.humanIdentity}@${input.humanHost}`,
    "ls /home",
    `ls /home/${input.humanIdentity}`,
    `cat /home/${input.humanIdentity}/${input.handoffFile}`,
    `ssh ${input.serviceIdentity}@${input.serviceHost}`,
    `find / -name ${input.objectiveName}`,
    `retrieve ${input.objectivePath}`,
  ];
}

// These are player validation paths, deliberately independent of autonomous Blue profiles.
const operatorRoutes: RouteCatalog = {
  nightshift: {
    "endpoint-agent": endpointRoute({ publicUrl: "shift.kronos.test", scanHost: "SHIFT-WEB", postTarget: "shift.kronos.test/maintenance/jobs", data: "job=handover", configDirectory: "shift", configFile: "worker.conf", serviceIdentity: "dispatch_svc", serviceHost: "DISPATCH-01", objectiveName: "NIGHT_MANIFEST.csv", objectivePath: "/srv/dispatch/NIGHT_MANIFEST.csv", installAgent: true }),
    "valid-identity": identityRoute({ publicUrl: "shift.kronos.test", humanIdentity: "morgan", humanHost: "ACCESS-01", handoffFile: "handover.txt", serviceIdentity: "dispatch_svc", serviceHost: "DISPATCH-01", objectiveName: "NIGHT_MANIFEST.csv", objectivePath: "/srv/dispatch/NIGHT_MANIFEST.csv" }),
  },
  "dead-drop": {
    "research-relay": [
      "curl exchange.collective.test",
      "ssh partner@EXCHANGE-01",
      "ls /home",
      "ls /home/partner",
      "cat /home/partner/routes.conf",
      "ssh relay_svc@RELAY-01",
      "ls /etc",
      "ls /etc/relay",
      "cat /etc/relay/vault.conf",
      "ssh research_svc@VAULT-01",
      "find / -name DROP_ARCHIVE.enc",
      "retrieve /srv/research/DROP_ARCHIVE.enc",
    ],
    "recovery-copy": endpointRoute({ publicUrl: "exchange.collective.test", scanHost: "RECOVERY-01", postTarget: "RECOVERY-01/restore/jobs", data: "source=external", configDirectory: "recovery", configFile: "replica.conf", serviceIdentity: "recovery_svc", serviceHost: "REPLICA-01", objectiveName: "DROP_ARCHIVE.enc", objectivePath: "/backup/DROP_ARCHIVE.enc" }),
  },
  "paper-trail": {
    "public-export": endpointRoute({ publicUrl: "grants.aster.test", scanHost: "GRANT-WEB", postTarget: "grants.aster.test/exports/jobs", data: "format=award", configDirectory: "aster", configFile: "export.conf", serviceIdentity: "records_svc", serviceHost: "RECORDS-01", objectiveName: "AWARD_ROSTER.csv", objectivePath: "/srv/awards/AWARD_ROSTER.csv" }),
    "vendor-reconciliation": identityRoute({ publicUrl: "grants.aster.test", humanIdentity: "lena", humanHost: "VENDOR-01", handoffFile: "reconciliation.txt", serviceIdentity: "records_svc", serviceHost: "RECORDS-01", objectiveName: "AWARD_ROSTER.csv", objectivePath: "/srv/awards/AWARD_ROSTER.csv" }),
  },
  "strange-login": {
    "maintenance-worker": endpointRoute({ publicUrl: "care.northline.test", scanHost: "CARE-PORTAL", postTarget: "care.northline.test/maintenance/reconcile", data: "source=external", configDirectory: "northline", configFile: "maintenance.conf", serviceIdentity: "results_svc", serviceHost: "RESULTS-01", objectiveName: "ON_CALL_ROSTER.csv", objectivePath: "/srv/clinical/ON_CALL_ROSTER.csv" }),
    "locum-coverage": identityRoute({ publicUrl: "care.northline.test", humanIdentity: "dana", humanHost: "LOCUM-ACCESS", handoffFile: "on-call.txt", serviceIdentity: "results_svc", serviceHost: "RESULTS-01", objectiveName: "ON_CALL_ROSTER.csv", objectivePath: "/srv/clinical/ON_CALL_ROSTER.csv" }),
  },
  "something-calling-home": {
    "dashboard-beacon": endpointRoute({ publicUrl: "outages.halcyon.test", scanHost: "OUTAGE-WEB", postTarget: "outages.halcyon.test/dashboard/reconcile", data: "outage=external", configDirectory: "halcyon", configFile: "dashboard.conf", serviceIdentity: "switch_svc", serviceHost: "SCHEDULE-01", objectiveName: "SWITCH_WINDOW.csv", objectivePath: "/srv/grid/SWITCH_WINDOW.csv", installAgent: true }),
    "field-handoff": identityRoute({ publicUrl: "outages.halcyon.test", humanIdentity: "ravi", humanHost: "CONTRACTOR-01", handoffFile: "switching.txt", serviceIdentity: "switch_svc", serviceHost: "SCHEDULE-01", objectiveName: "SWITCH_WINDOW.csv", objectivePath: "/srv/grid/SWITCH_WINDOW.csv" }),
  },
  "ghost-account": {
    "intake-persistence": endpointRoute({ publicUrl: "intake.northline.test", scanHost: "INTAKE-WEB", postTarget: "intake.northline.test/intake/reconcile", data: "import=external", configDirectory: "intake", configFile: "recovery.conf", serviceIdentity: "recovery_svc", serviceHost: "RECOVERY-01", objectiveName: "RECOVERY_CODES.csv", objectivePath: "/srv/recovery/RECOVERY_CODES.csv", installAgent: true }),
    "retired-provisioning": identityRoute({ publicUrl: "intake.northline.test", humanIdentity: "emergency_admin", humanHost: "PROVISION-01", handoffFile: "status.txt", serviceIdentity: "recovery_svc", serviceHost: "RECOVERY-01", objectiveName: "RECOVERY_CODES.csv", objectivePath: "/srv/recovery/RECOVERY_CODES.csv" }),
  },
  "no-one-knows": {
    "status-worker": endpointRoute({ publicUrl: "status.halcyon.test", scanHost: "STATUS-WEB", postTarget: "status.halcyon.test/status/reconcile", data: "update=emergency", configDirectory: "status", configFile: "restoration.conf", serviceIdentity: "plan_svc", serviceHost: "PLAN-01", objectiveName: "RESTORATION_PLAN.pdf", objectivePath: "/srv/restoration/RESTORATION_PLAN.pdf" }),
    "vendor-diagnostics": identityRoute({ publicUrl: "status.halcyon.test", humanIdentity: "mia", humanHost: "VENDOR-DIAG", handoffFile: "diagnostics.txt", serviceIdentity: "plan_svc", serviceHost: "PLAN-01", objectiveName: "RESTORATION_PLAN.pdf", objectivePath: "/srv/restoration/RESTORATION_PLAN.pdf" }),
  },
};

function updateState(state: TerminalState, result: Awaited<ReturnType<SimulationEngine["executeCommand"]>>) {
  if (result.newSession) {
    state.currentMachine = result.newSession.machineId;
    state.currentUser = result.newSession.userId;
    state.currentPrivilege = result.newSession.privilege;
    state.currentSessionId = result.newSession.id;
    state.context = result.context;
    state.currentPath = "/";
  } else if (result.context) {
    state.context = result.context;
  }
  if (result.currentPath) state.currentPath = result.currentPath;
  if (result.discoveredHosts) state.discoveredHosts = result.discoveredHosts;
}

async function revealPlayerCredentials(scenarioId: string, ledger: OperatorKnowledgeLedger) {
  const credentials = await prisma.credential.findMany({ where: { scenarioId, valid: true } });
  for (const credential of credentials) ledger.observeCredential({
    username: credential.username,
    scope: credential.knownScope,
    secret: credential.secret,
  });
}

describe("campaign Operator Mode routes", { concurrency: false }, () => {
  it("maintains a distinct player-validation path for every declared Act II-V route", () => {
    for (const [scenarioId, routes] of Object.entries(operatorRoutes)) {
      const definition = getScenarioDefinition(scenarioId);
      assert.deepEqual(Object.keys(routes).sort(), definition.routes.map((route) => route.id).sort(), `${scenarioId} route coverage drifted`);
    }
  });

  for (const [scenarioId, routes] of Object.entries(operatorRoutes)) {
    for (const [routeId, commands] of Object.entries(routes)) {
      it(`${scenarioId}/${routeId} completes without oracle knowledge`, async () => {
        const definition = getScenarioDefinition(scenarioId);
        const initialized = await initializeScenario(ScenarioMode.RED, scenarioId, undefined, "OPERATOR");
        const state: TerminalState = {
          ...initialized.startingState,
          activeSessions: [],
          credentials: new Map(),
          context: { type: "UNIX" },
        };
        const ledger = OperatorKnowledgeLedger.fromScenario(definition);
        const engine = new SimulationEngine(initialized.scenarioId, initialized.actorId);

        try {
          for (const command of commands) {
            const authorization = ledger.authorize(command, state);
            assert.equal(authorization.allowed, true, `${scenarioId}/${routeId}: ${command} uses unknown operator knowledge: ${authorization.unknown.join(", ")}`);

            const stateBefore = { ...state };
            const result = await engine.executeCommand(command, state);
            assert.equal(result.success, true, `${scenarioId}/${routeId}: ${command}: ${result.output}`);
            ledger.record(command, stateBefore, result);
            updateState(state, result);
            await revealPlayerCredentials(initialized.scenarioId, ledger);
          }

          const scenario = await prisma.scenario.findUniqueOrThrow({ where: { id: initialized.scenarioId } });
          assert.equal(scenario.state, "COMPLETED", `${scenarioId}/${routeId} did not complete its objective`);
        } finally {
          await deleteScenario(initialized.scenarioId);
        }
      });
    }
  }
});
