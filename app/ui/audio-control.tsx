"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Check, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { AUDIO_CHECK_EVENTS, AUDIO_EVENT_CATALOG, type AudioEventName } from "@/lib/audio/catalog";
import { playAudio, rootAudio, type AudioSettings } from "@/lib/audio/audio-system";

export function useRootAudio() {
  const snapshot = useSyncExternalStore(rootAudio.subscribe, rootAudio.getSnapshot, rootAudio.getServerSnapshot);
  useEffect(() => rootAudio.hydrate(), []);
  return snapshot;
}

const MIXER_CHANNELS: Array<{ key: keyof Pick<AudioSettings, "master" | "ui" | "terminal" | "alerts" | "environment" | "music" | "voice">; label: string }> = [
  { key: "master", label: "Master" },
  { key: "ui", label: "Desktop UI" },
  { key: "terminal", label: "Terminal" },
  { key: "alerts", label: "Security alerts" },
  { key: "environment", label: "Environment" },
  { key: "music", label: "Music" },
  { key: "voice", label: "Voice" },
];

export function AudioControlPanel({ onClose }: { onClose: () => void }) {
  const snapshot = useRootAudio();
  const [tab, setTab] = useState<"mixer" | "check">("mixer");
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState<AudioEventName[]>([]);
  const lastDefinition = snapshot.lastEvent ? AUDIO_EVENT_CATALOG[snapshot.lastEvent] : undefined;

  async function runCheck() {
    if (checking) return;
    setChecking(true);
    setChecked([]);
    for (const event of AUDIO_CHECK_EVENTS) {
      const played = await playAudio(event);
      if (played) setChecked((events) => [...events, event]);
      await new Promise((resolve) => window.setTimeout(resolve, 540));
    }
    setChecking(false);
  }

  return <div className="audio-dialog-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="audio-dialog" role="dialog" aria-modal="true" aria-labelledby="audio-dialog-title">
      <header className="audio-dialog-titlebar">
        <Volume2 size={15} aria-hidden="true" />
        <strong id="audio-dialog-title">Sound and Audio Devices Properties</strong>
        <button type="button" onClick={onClose} aria-label="Close sound settings"><X size={14} /></button>
      </header>
      <nav className="audio-dialog-tabs" role="tablist" aria-label="Sound settings sections">
        <button type="button" role="tab" aria-selected={tab === "mixer"} className={tab === "mixer" ? "active" : ""} onClick={() => setTab("mixer")}>Volume</button>
        <button type="button" role="tab" aria-selected={tab === "check"} className={tab === "check" ? "active" : ""} onClick={() => setTab("check")}>Audio check</button>
      </nav>

      {tab === "mixer" ? <div className="audio-dialog-body audio-mixer">
        <fieldset>
          <legend>Playback</legend>
          <label className="audio-enable-row"><input type="checkbox" checked={snapshot.settings.enabled} onChange={(event) => rootAudio.setSetting("enabled", event.target.checked)} /> Enable ROOT/OS sound</label>
          <div className="audio-channel-list">
            {MIXER_CHANNELS.map((channel) => <label key={channel.key}>
              <span>{channel.label}</span>
              <input aria-label={`${channel.label} volume`} type="range" min="0" max="100" value={Math.round(snapshot.settings[channel.key] * 100)} onChange={(event) => rootAudio.setSetting(channel.key, Number(event.target.value) / 100)} />
              <output>{Math.round(snapshot.settings[channel.key] * 100)}%</output>
            </label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend>Accessibility and comfort</legend>
          <label><input type="checkbox" checked={snapshot.settings.muteTyping} onChange={(event) => rootAudio.setSetting("muteTyping", event.target.checked)} /> Mute typing sounds</label>
          <label><input type="checkbox" checked={snapshot.settings.reduceAlertIntensity} onChange={(event) => rootAudio.setSetting("reduceAlertIntensity", event.target.checked)} /> Reduce alert intensity</label>
          <label><input type="checkbox" checked={snapshot.settings.reduceSuddenSounds} onChange={(event) => rootAudio.setSetting("reduceSuddenSounds", event.target.checked)} /> Reduce sudden sounds</label>
          <label><input type="checkbox" checked={snapshot.settings.mono} onChange={(event) => rootAudio.setSetting("mono", event.target.checked)} /> Mono audio</label>
          <label><input type="checkbox" checked={snapshot.settings.visualIndicators} onChange={(event) => rootAudio.setSetting("visualIndicators", event.target.checked)} /> Visual sound indicators</label>
          <label><input type="checkbox" checked={snapshot.settings.ambience} onChange={(event) => rootAudio.setSetting("ambience", event.target.checked)} /> Workstation ambience</label>
        </fieldset>
      </div> : <div className="audio-dialog-body audio-check">
        <section className="audio-device-status">
          <div className={`audio-speaker ${snapshot.settings.enabled ? "online" : "muted"}`}>{snapshot.settings.enabled ? <Volume2 size={34} /> : <VolumeX size={34} />}</div>
          <div><strong>ROOT/OS Web Audio Device</strong><span>Status: {snapshot.unlocked ? "READY" : "WAITING FOR OPERATOR INPUT"}</span><span>Output: {snapshot.settings.mono ? "MONAURAL" : "STEREO"} · {Math.round(snapshot.settings.master * 100)}%</span></div>
          <button type="button" disabled={checking || !snapshot.settings.enabled} onClick={() => void runCheck()}>{checking ? "Checking…" : "Run signal test"}</button>
        </section>
        <div className="audio-event-grid" aria-label="Individual audio checks">
          {AUDIO_CHECK_EVENTS.map((event) => { const definition = AUDIO_EVENT_CATALOG[event]; const passed = checked.includes(event); return <button type="button" key={event} onClick={() => void playAudio(event)}>
            <span className="audio-check-state" aria-hidden="true">{passed ? <Check size={13} /> : <Volume1 size={13} />}</span>
            <span><strong>{definition.label}</strong><small>{event}</small></span>
          </button>; })}
        </div>
        <output className="audio-signal-readout" aria-live="polite">
          <span>Last signal</span>
          <strong>{snapshot.lastEvent ?? "No signal received"}</strong>
          <small>{lastDefinition?.description ?? "Select a check to verify playback."}</small>
          <i key={snapshot.revision} style={{ "--signal-level": snapshot.lastEvent ? `${Math.max(16, Math.round((lastDefinition?.gain ?? 0) * 480))}%` : "0%" } as CSSProperties} />
        </output>
      </div>}

      <footer className="audio-dialog-footer"><span>Settings are stored on this workstation.</span><button type="button" onClick={onClose}>OK</button></footer>
    </section>
  </div>;
}

export function AudioVisualIndicator() {
  const snapshot = useRootAudio();
  if (!snapshot.settings.visualIndicators || !snapshot.lastEvent) return null;
  const definition = AUDIO_EVENT_CATALOG[snapshot.lastEvent];
  return <div className="audio-visual-indicator" key={`${snapshot.lastEvent}-${snapshot.revision}`} role="status">
    <Volume1 size={13} aria-hidden="true" /><span>{definition.label}</span>
  </div>;
}
