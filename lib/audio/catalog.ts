export type AudioCategory = "ui" | "terminal" | "alerts" | "environment" | "music" | "voice";

export type AudioEventName =
  | "system.boot"
  | "ui.click"
  | "ui.window.open"
  | "ui.window.close"
  | "ui.app.launch"
  | "terminal.key"
  | "terminal.command.submit"
  | "terminal.command.error"
  | "auth.prompt"
  | "auth.success"
  | "auth.failure"
  | "auth.privilege.changed"
  | "network.host.discovered"
  | "network.service.discovered"
  | "security.alert.low"
  | "security.alert.medium"
  | "security.alert.high"
  | "security.alert.critical"
  | "evidence.discovered"
  | "mission.updated"
  | "mission.completed"
  | "mission.failed";

export type ToneStep = {
  frequency: number;
  duration: number;
  offset?: number;
  gain?: number;
};

export type AudioEventDefinition = {
  label: string;
  category: AudioCategory;
  description: string;
  waveform: OscillatorType;
  gain: number;
  tones: ToneStep[];
};

export const AUDIO_EVENT_CATALOG: Record<AudioEventName, AudioEventDefinition> = {
  "system.boot": { label: "ROOT/OS boot", category: "ui", description: "Workstation audio initialized", waveform: "sine", gain: .16, tones: [{ frequency: 82, duration: .09 }, { frequency: 164, duration: .12, offset: .11 }, { frequency: 246, duration: .16, offset: .23 }] },
  "ui.click": { label: "Control input", category: "ui", description: "Desktop control activated", waveform: "triangle", gain: .055, tones: [{ frequency: 620, duration: .022 }] },
  "ui.window.open": { label: "Window open", category: "ui", description: "Application window available", waveform: "triangle", gain: .07, tones: [{ frequency: 330, duration: .045 }, { frequency: 440, duration: .05, offset: .035 }] },
  "ui.window.close": { label: "Window close", category: "ui", description: "Application window closed", waveform: "triangle", gain: .065, tones: [{ frequency: 390, duration: .04 }, { frequency: 260, duration: .055, offset: .035 }] },
  "ui.app.launch": { label: "Application launch", category: "ui", description: "ROOT/OS application launched", waveform: "square", gain: .045, tones: [{ frequency: 145, duration: .035 }, { frequency: 360, duration: .06, offset: .05 }] },
  "terminal.key": { label: "Terminal key", category: "terminal", description: "Operator console key input", waveform: "square", gain: .018, tones: [{ frequency: 760, duration: .012 }] },
  "terminal.command.submit": { label: "Command submit", category: "terminal", description: "Command sent to simulation", waveform: "triangle", gain: .07, tones: [{ frequency: 230, duration: .035 }, { frequency: 310, duration: .04, offset: .028 }] },
  "terminal.command.error": { label: "Command error", category: "terminal", description: "Command could not complete", waveform: "sine", gain: .1, tones: [{ frequency: 210, duration: .11 }, { frequency: 155, duration: .13, offset: .08 }] },
  "auth.prompt": { label: "Authentication request", category: "ui", description: "Credentials required", waveform: "sine", gain: .1, tones: [{ frequency: 392, duration: .08 }] },
  "auth.success": { label: "Authentication accepted", category: "ui", description: "Access granted", waveform: "sine", gain: .11, tones: [{ frequency: 392, duration: .09 }, { frequency: 523, duration: .14, offset: .09 }] },
  "auth.failure": { label: "Authentication rejected", category: "ui", description: "Access denied", waveform: "triangle", gain: .1, tones: [{ frequency: 277, duration: .09 }, { frequency: 196, duration: .14, offset: .08 }] },
  "auth.privilege.changed": { label: "Privilege changed", category: "ui", description: "Session privilege updated", waveform: "triangle", gain: .1, tones: [{ frequency: 110, duration: .06 }, { frequency: 440, duration: .13, offset: .075 }] },
  "network.host.discovered": { label: "Host discovered", category: "ui", description: "New network host recorded", waveform: "sine", gain: .085, tones: [{ frequency: 740, duration: .035 }, { frequency: 555, duration: .07, offset: .04 }] },
  "network.service.discovered": { label: "Service discovered", category: "ui", description: "Network service recorded", waveform: "triangle", gain: .06, tones: [{ frequency: 880, duration: .025 }] },
  "security.alert.low": { label: "Low security alert", category: "alerts", description: "Low-severity event received", waveform: "sine", gain: .075, tones: [{ frequency: 440, duration: .07 }] },
  "security.alert.medium": { label: "Medium security alert", category: "alerts", description: "Investigation may be required", waveform: "sine", gain: .11, tones: [{ frequency: 440, duration: .075 }, { frequency: 554, duration: .09, offset: .09 }] },
  "security.alert.high": { label: "High security alert", category: "alerts", description: "High-severity event received", waveform: "triangle", gain: .14, tones: [{ frequency: 330, duration: .1 }, { frequency: 440, duration: .1, offset: .11 }, { frequency: 330, duration: .12, offset: .22 }] },
  "security.alert.critical": { label: "Critical security alert", category: "alerts", description: "Critical event requires attention", waveform: "sawtooth", gain: .16, tones: [{ frequency: 220, duration: .14 }, { frequency: 330, duration: .14, offset: .15 }, { frequency: 220, duration: .17, offset: .3 }] },
  "evidence.discovered": { label: "Evidence discovered", category: "ui", description: "Meaningful evidence recorded", waveform: "triangle", gain: .085, tones: [{ frequency: 310, duration: .045 }, { frequency: 465, duration: .09, offset: .055 }] },
  "mission.updated": { label: "Objective updated", category: "ui", description: "Mission state changed", waveform: "sine", gain: .08, tones: [{ frequency: 349, duration: .07 }, { frequency: 440, duration: .1, offset: .075 }] },
  "mission.completed": { label: "Operation complete", category: "music", description: "Primary objective completed", waveform: "sine", gain: .12, tones: [{ frequency: 262, duration: .13 }, { frequency: 330, duration: .13, offset: .13 }, { frequency: 392, duration: .24, offset: .26 }] },
  "mission.failed": { label: "Operation closed", category: "music", description: "Operation ended without completion", waveform: "sine", gain: .1, tones: [{ frequency: 294, duration: .14 }, { frequency: 220, duration: .24, offset: .13 }] },
};

export const AUDIO_CHECK_EVENTS: AudioEventName[] = [
  "ui.window.open",
  "terminal.command.submit",
  "auth.success",
  "auth.failure",
  "network.host.discovered",
  "security.alert.medium",
  "security.alert.critical",
  "evidence.discovered",
  "mission.completed",
];

export function alertEventForSeverity(severity: string): AudioEventName {
  switch (severity.toUpperCase()) {
    case "CRITICAL": return "security.alert.critical";
    case "HIGH": return "security.alert.high";
    case "MEDIUM": return "security.alert.medium";
    default: return "security.alert.low";
  }
}
