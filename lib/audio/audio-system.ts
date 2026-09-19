"use client";

import { AUDIO_EVENT_CATALOG, type AudioCategory, type AudioEventName } from "./catalog";

export type AudioSettings = {
  enabled: boolean;
  master: number;
  ui: number;
  terminal: number;
  alerts: number;
  environment: number;
  music: number;
  voice: number;
  muteTyping: boolean;
  reduceAlertIntensity: boolean;
  mono: boolean;
  visualIndicators: boolean;
  reduceSuddenSounds: boolean;
  ambience: boolean;
};

export type AudioSnapshot = {
  settings: AudioSettings;
  unlocked: boolean;
  lastEvent?: AudioEventName;
  revision: number;
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  enabled: true,
  master: .62,
  ui: .58,
  terminal: .42,
  alerts: .7,
  environment: .22,
  music: .45,
  voice: .7,
  muteTyping: false,
  reduceAlertIntensity: false,
  mono: false,
  visualIndicators: true,
  reduceSuddenSounds: true,
  ambience: true,
};

const STORAGE_KEY = "root:audio-settings:v1";
type Listener = () => void;
const SERVER_AUDIO_SNAPSHOT: AudioSnapshot = { settings: DEFAULT_AUDIO_SETTINGS, unlocked: false, revision: 0 };

class RootAudioSystem {
  private context?: AudioContext;
  private master?: GainNode;
  private ambientOscillators: OscillatorNode[] = [];
  private listeners = new Set<Listener>();
  private snapshot: AudioSnapshot = { settings: DEFAULT_AUDIO_SETTINGS, unlocked: false, revision: 0 };

  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => SERVER_AUDIO_SNAPSHOT;
  subscribe = (listener: Listener) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };

  hydrate() {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) this.snapshot = { ...this.snapshot, settings: { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(saved) }, revision: this.snapshot.revision + 1 };
    } catch { /* Invalid or unavailable storage falls back to safe defaults. */ }
    this.emit();
  }

  async unlock() {
    if (typeof window === "undefined") return false;
    const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return false;
    if (!this.context) {
      this.context = new AudioContextConstructor();
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") await this.context.resume();
    if (!this.snapshot.unlocked) {
      this.snapshot = { ...this.snapshot, unlocked: true, revision: this.snapshot.revision + 1 };
      this.emit();
      this.syncAmbience();
    }
    return true;
  }

  setSetting<K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) {
    const settings = { ...this.snapshot.settings, [key]: value };
    this.snapshot = { ...this.snapshot, settings, revision: this.snapshot.revision + 1 };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* Settings remain valid for this session. */ }
    this.emit();
    this.syncAmbience();
  }

  async play(name: AudioEventName) {
    const definition = AUDIO_EVENT_CATALOG[name];
    const settings = this.snapshot.settings;
    if (!settings.enabled || (name === "terminal.key" && settings.muteTyping)) return false;
    if (!(await this.unlock()) || !this.context || !this.master) return false;

    const categoryVolume = settings[definition.category as AudioCategory];
    const alertReduction = definition.category === "alerts" && settings.reduceAlertIntensity ? .5 : 1;
    const transientReduction = settings.reduceSuddenSounds ? .78 : 1;
    const totalGain = settings.master * categoryVolume * definition.gain * alertReduction * transientReduction;
    const start = this.context.currentTime + .006;
    const pitchVariation = name === "terminal.key" || name === "ui.click" ? .97 + Math.random() * .06 : 1;

    for (const [index, step] of definition.tones.entries()) {
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      const panner = this.context.createStereoPanner();
      const at = start + (step.offset ?? 0);
      const peak = Math.max(.0001, totalGain * (step.gain ?? 1));
      oscillator.type = definition.waveform;
      oscillator.frequency.setValueAtTime(step.frequency * pitchVariation, at);
      envelope.gain.setValueAtTime(.0001, at);
      envelope.gain.exponentialRampToValueAtTime(peak, at + Math.min(.012, step.duration / 3));
      envelope.gain.exponentialRampToValueAtTime(.0001, at + step.duration);
      oscillator.connect(envelope);
      panner.pan.value = settings.mono ? 0 : (index % 2 === 0 ? -.12 : .12);
      envelope.connect(panner);
      panner.connect(this.master);
      oscillator.start(at);
      oscillator.stop(at + step.duration + .02);
    }

    this.snapshot = { ...this.snapshot, lastEvent: name, revision: this.snapshot.revision + 1 };
    this.emit();
    return true;
  }

  private syncAmbience() {
    this.stopAmbience();
    if (!this.context || !this.master || !this.snapshot.unlocked || !this.snapshot.settings.enabled || !this.snapshot.settings.ambience) return;
    const level = this.snapshot.settings.master * this.snapshot.settings.environment * .012;
    if (level <= .0001) return;
    for (const [frequency, scale] of [[55, 1], [110, .35]] as const) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = level * scale;
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start();
      this.ambientOscillators.push(oscillator);
    }
  }

  private stopAmbience() {
    for (const oscillator of this.ambientOscillators) oscillator.stop();
    this.ambientOscillators = [];
  }

  private emit() { for (const listener of this.listeners) listener(); }
}

export const rootAudio = new RootAudioSystem();
export const playAudio = (event: AudioEventName) => rootAudio.play(event);
