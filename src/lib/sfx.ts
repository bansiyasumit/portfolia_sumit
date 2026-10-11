"use client";

import { getContext } from "./voice";

/**
 * Trailer sound design, synthesized with Web Audio (no audio files):
 * the "braam" horn, a riser, the landing impact, whooshes and title hits.
 * Everything is a no-op until audio has been unlocked by a click.
 */

let master: GainNode | null = null;
let enabled = false;

export const setSfxEnabled = (on: boolean) => {
  enabled = on;
};

const out = () => {
  const c = getContext();
  if (!c || !enabled || c.state !== "running") return null;
  if (!master) {
    master = c.createGain();
    master.gain.value = 0.55;
    // Gentle compression glues the layers together like a trailer mix.
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master.connect(comp).connect(c.destination);
  }
  return { c, master };
};

const noiseBuffer = (c: AudioContext, seconds: number) => {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
};

const env = (g: GainNode, t: number, attack: number, peak: number, release: number) => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
};

/** The trailer "BRAAAM": detuned low brass through a sweeping low-pass. */
export const braam = (duration = 3.2) => {
  const o = out();
  if (!o) return;
  const { c, master } = o;
  const t = c.currentTime;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 6;
  filter.frequency.setValueAtTime(120, t);
  filter.frequency.exponentialRampToValueAtTime(900, t + 0.35);
  filter.frequency.exponentialRampToValueAtTime(180, t + duration);
  const shaper = c.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / curve.length) * 2 - 1;
    curve[i] = Math.tanh(x * 3);
  }
  shaper.curve = curve;
  const g = c.createGain();
  env(g, t, 0.08, 0.9, duration);
  filter.connect(shaper).connect(g).connect(master);
  for (const [freq, type] of [[43.65, "sawtooth"], [43.9, "sawtooth"], [87.3, "square"], [65.4, "sawtooth"]] as const) {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(filter);
    osc.start(t);
    osc.stop(t + duration + 0.2);
  }
};

/** Rising tension: pitch-climbing tone + swelling filtered noise. */
export const riser = (duration = 2.4) => {
  const o = out();
  if (!o) return;
  const { c, master } = o;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + duration);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.12, t + duration);
  og.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.05);
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, duration + 0.1);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 2;
  bp.frequency.setValueAtTime(400, t);
  bp.frequency.exponentialRampToValueAtTime(6000, t + duration);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.35, t + duration);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.05);
  osc.connect(og).connect(master);
  n.connect(bp).connect(ng).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.1);
  n.start(t);
};

/** Superhero landing: sub-bass drop + crunchy noise burst + tail. */
export const impact = () => {
  const o = out();
  if (!o) return;
  const { c, master } = o;
  const t = c.currentTime;
  const sub = c.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(140, t);
  sub.frequency.exponentialRampToValueAtTime(28, t + 1.2);
  const sg = c.createGain();
  env(sg, t, 0.005, 1.0, 1.6);
  sub.connect(sg).connect(master);
  sub.start(t);
  sub.stop(t + 1.8);

  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, 2);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(5000, t);
  lp.frequency.exponentialRampToValueAtTime(200, t + 1.5);
  const ng = c.createGain();
  env(ng, t, 0.003, 0.8, 1.4);
  n.connect(lp).connect(ng).connect(master);
  n.start(t);
};

/** Air whoosh, e.g. for camera moves and the comet. */
export const whoosh = (duration = 0.9) => {
  const o = out();
  if (!o) return;
  const { c, master } = o;
  const t = c.currentTime;
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, duration + 0.1);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(3000, t + duration * 0.6);
  bp.frequency.exponentialRampToValueAtTime(500, t + duration);
  const g = c.createGain();
  env(g, t, duration * 0.55, 0.5, duration * 0.45);
  n.connect(bp).connect(g).connect(master);
  n.start(t);
};

/** Short metallic hit for each title card slam. */
export const hit = () => {
  const o = out();
  if (!o) return;
  const { c, master } = o;
  const t = c.currentTime;
  for (const f of [220, 331, 497]) {
    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.6);
    const g = c.createGain();
    env(g, t, 0.003, 0.25, 0.7);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.8);
  }
  const kick = c.createOscillator();
  kick.frequency.setValueAtTime(90, t);
  kick.frequency.exponentialRampToValueAtTime(35, t + 0.4);
  const kg = c.createGain();
  env(kg, t, 0.002, 0.9, 0.45);
  kick.connect(kg).connect(master);
  kick.start(t);
  kick.stop(t + 0.5);
};
