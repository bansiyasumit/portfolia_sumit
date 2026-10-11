"use client";

/**
 * Browser voice for the persona: free text-to-speech (speechSynthesis) and
 * speech-to-text (SpeechRecognition where available). Speech is split into
 * sentences so subtitles stay in sync and Chrome's ~15s utterance cut-off
 * never triggers.
 */

/** Live lip-sync signal read by the 3D persona every frame. */
export const voiceState = {
  speaking: false,
  /** 0..1 pulse, bumped on each spoken word and decayed by the renderer */
  wordPulse: 0,
};

export const stripMarkdown = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>|]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const ABBREVIATION = /\b(?:M|B|Dr|Mr|Ms|Mrs|Prof|St|vs|etc|e\.g|i\.e|approx)\.$/i;

/** Split at real sentence ends only — not inside "M.Tech", "8.43" or "e.g.". */
export const splitSentences = (text: string) => {
  const parts = text.split(/(?<=[.!?]["')\]]*)\s+(?=[A-Z0-9"“(])/);
  const out: string[] = [];
  for (const part of parts) {
    const prev = out[out.length - 1];
    if (prev && ABBREVIATION.test(prev)) out[out.length - 1] = `${prev} ${part}`;
    else out.push(part);
  }
  return out.map((s) => s.trim()).filter(Boolean);
};

// Prefer an Indian-English male voice, then any natural-sounding English male voice.
const VOICE_PREFERENCES = [/prabhat/i, /ravi/i, /en-IN/i, /google uk english male/i, /guy|ryan|david|daniel|george/i, /en-GB/i, /en-US/i, /^en/i];

let cachedVoice: SpeechSynthesisVoice | null | undefined;

const pickVoice = (): SpeechSynthesisVoice | null => {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  if (!voices.length) return null;
  for (const pref of VOICE_PREFERENCES) {
    const v = voices.find((x) => pref.test(x.name) || pref.test(x.lang));
    if (v) return (cachedVoice = v);
  }
  return (cachedVoice = voices[0]);
};

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export type SpeakOptions = {
  muted: boolean;
  onSentence?: (sentence: string) => void;
  signal?: AbortSignal;
};

/** Rough spoken duration for muted playback, so subtitles and the mouth still move. */
const estimateMs = (s: string) => Math.max(1400, s.split(/\s+/).length * 330);

const speakSentence = (sentence: string, muted: boolean, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();

    if (muted || !canSpeak()) {
      voiceState.speaking = true;
      const words = sentence.split(/\s+/).length;
      const per = estimateMs(sentence) / words;
      let i = 0;
      const tick = setInterval(() => {
        voiceState.wordPulse = 1;
        if (++i >= words || signal?.aborted) {
          clearInterval(tick);
          voiceState.speaking = false;
          resolve();
        }
      }, per);
      return;
    }

    const u = new SpeechSynthesisUtterance(sentence);
    const voice = pickVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.rate = 1.0;
    u.pitch = 0.92;
    u.onstart = () => (voiceState.speaking = true);
    u.onboundary = () => (voiceState.wordPulse = 1);
    const done = () => {
      voiceState.speaking = false;
      resolve();
    };
    u.onend = done;
    u.onerror = done;
    signal?.addEventListener("abort", () => window.speechSynthesis.cancel(), { once: true });
    window.speechSynthesis.speak(u);
  });

/** Speak text sentence by sentence; resolves when finished or aborted. */
export const speak = async (text: string, { muted, onSentence, signal }: SpeakOptions) => {
  if (canSpeak()) window.speechSynthesis.cancel();
  for (const sentence of splitSentences(stripMarkdown(text))) {
    if (signal?.aborted) break;
    onSentence?.(sentence);
    await speakSentence(sentence, muted, signal);
    await new Promise((r) => setTimeout(r, 120));
  }
  voiceState.speaking = false;
};

export const stopSpeaking = () => {
  if (canSpeak()) window.speechSynthesis.cancel();
  voiceState.speaking = false;
};

// Voices load asynchronously in Chrome.
if (typeof window !== "undefined" && canSpeak()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = undefined;
  };
}

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export const createRecognizer = (): Recognition | null => {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => Recognition }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "en-IN";
  r.interimResults = false;
  r.maxAlternatives = 1;
  return r;
};
