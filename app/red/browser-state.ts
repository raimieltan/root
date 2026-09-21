import type { SimulatedHttpResponse, TerminalContext } from "@/lib/simulation/types";
import type { TerminalState } from "./terminal";

type BrowserCommandResult = {
  newSession?: { id: string; machineId: string; userId: string; privilege: string };
  context?: TerminalContext;
  currentPath?: string;
  discoveredHosts?: string[];
  httpResponse?: SimulatedHttpResponse;
};

export function applyBrowserCommandResult(state: TerminalState, result: BrowserCommandResult): TerminalState {
  const next = { ...state };
  if (result.newSession) {
    next.currentMachine = result.newSession.machineId;
    next.currentUser = result.newSession.userId;
    next.currentPrivilege = result.newSession.privilege;
    next.currentSessionId = result.newSession.id;
    next.currentPath = "/";
  }
  if (result.context) next.context = result.context;
  if (result.currentPath) next.currentPath = result.currentPath;
  if (result.discoveredHosts) next.discoveredHosts = result.discoveredHosts;
  return next;
}
