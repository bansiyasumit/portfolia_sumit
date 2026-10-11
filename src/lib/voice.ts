"use client";

/**
 * Voice for the 3D persona.
 *
 * 1. Neural voice (Groq Orpheus via /api/tts), played through Web Audio so the
 *    mouth follows the real loudness of the speech. Chunks are pre-fetched one
 *    ahead, so there are no gaps between sentences.
 * 2. Fallback: the browser's own speech synthesis, preferring natural/neural
 *    voices (Edge "Online (Natural)", Google voices) over robotic desktop ones.
 * 3. Muted: subtitles and lip movement only.
 */

type VoiceState = {
  speaking: boolean;
  /** 0..1 pulse bumped on each spoken word (browser voice) and decayed by the renderer */
  wordPulse: number;
  /** 0..1 loudness of the playing neural audio, or -1 when not available */
  level: number;
};

/** Live lip-sync signal read by the 3D persona every frame (global singleton, see Persona.tsx). */
export const voiceState: VoiceState = ((globalThis as { __sbVoice?: VoiceState }).__sbVoice ??= {
  speaking: false,
  wordPulse: 0,
  level: -1,
});

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

/** Group sentences into chunks of up to ~maxChars so speech flows naturally. */
const chunk = (sentences: string[], maxChars: number) => {
  const out: string[] = [];
  for (const s of sentences) {
    const last = out[out.length - 1];
    if (last && last.length + s.length + 1 <= maxChars) out[out.length - 1] = `${last} ${s}`;
    else out.push(s);
  }
  return out;
};

// ───────────────────────── Neural voice (Web Audio) ─────────────────────────

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let neuralAvailable = true; // flips off after the first failure so we stop trying

const getContext = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    analyser.connect(ctx.destination);
  }
  return ctx;
};

/** Call from a click/tap handler: browsers only allow audio after a gesture. */
export const unlockAudio = () => {
  const c = getContext();
  if (c && c.state === "suspended") c.resume().catch(() => {});
};

const fetchAudio = async (text: string, signal?: AbortSignal): Promise<AudioBuffer | null> => {
  const c = getContext();
  if (!c || !neuralAvailable) return null;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });
    if (!res.ok) {
      if (res.status === 503) neuralAvailable = false;
      return null;
    }
    return await c.decodeAudioData(await res.arrayBuffer());
  } catch {
    return null;
  }
};

let currentSource: AudioBufferSourceNode | null = null;

const playBuffer = (buffer: AudioBuffer, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const c = getContext()!;
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(analyser!);
    currentSource = src;
    const data = new Uint8Array(analyser!.fftSize);
    let raf = 0;

    const meter = () => {
      analyser!.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      voiceState.level = Math.min(1, Math.sqrt(sum / data.length) * 5.5);
      raf = requestAnimationFrame(meter);
    };

    const finish = () => {
      cancelAnimationFrame(raf);
      voiceState.level = 0;
      if (currentSource === src) currentSource = null;
      resolve();
    };
    src.onended = finish;
    signal?.addEventListener(
      "abort",
      () => {
        try {
          src.stop();
        } catch {}
      },
      { once: true }
    );
    voiceState.speaking = true;
    meter();
    src.start();
  });

// ───────────────────────── Browser voice (fallback) ─────────────────────────

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

// Natural/neural voices first; robotic "Desktop" SAPI voices last.
const VOICE_RANK: RegExp[] = [
  /prabhat.*natural/i,
  /(online|natural).*english \(india\)/i,
  /(guy|ryan|andrew|brian|christopher|eric).*(online|natural)/i,
  /(online|natural)/i,
  /google uk english male/i,
  /google us english/i,
  /google.*english/i,
  /en-IN/i,
  /en-GB/i,
  /en-US/i,
];

let cachedVoice: SpeechSynthesisVoice | null | undefined;

const pickVoice = (): SpeechSynthesisVoice | null => {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = (window.speechSynthesis?.getVoices() ?? []).filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (!voices.length) return null;
  for (const rx of VOICE_RANK) {
    const v = voices.find((x) => rx.test(`${x.name} ${x.lang}`));
    if (v) return (cachedVoice = v);
  }
  return (cachedVoice = voices[0]);
};

if (typeof window !== "undefined" && canSpeak()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = undefined;
  };
}

/** Speak one chunk with the browser voice; switches subtitles at sentence boundaries. */
const browserSpeak = (text: string, sentences: string[], onSentence: (s: string) => void, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.rate = 1.02;
    u.pitch = 1;

    // Character offsets where each sentence starts, for boundary-driven subtitles.
    const starts: number[] = [];
    let offset = 0;
    for (const s of sentences) {
      starts.push(text.indexOf(s, offset));
      offset = starts[starts.length - 1] + s.length;
    }
    let shown = 0;
    onSentence(sentences[0]);

    // Chrome's network voices stop after ~15s unless nudged.
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);

    u.onstart = () => (voiceState.speaking = true);
    u.onboundary = (e) => {
      voiceState.wordPulse = 1;
      for (let i = starts.length - 1; i > shown; i--) {
        if (e.charIndex >= starts[i]) {
          shown = i;
          onSentence(sentences[i]);
          break;
        }
      }
    };
    const done = () => {
      clearInterval(keepAlive);
      voiceState.speaking = false;
      resolve();
    };
    u.onend = done;
    u.onerror = done;
    signal?.addEventListener("abort", () => window.speechSynthesis.cancel(), { once: true });
    window.speechSynthesis.speak(u);
  });

/** Muted playback: timed subtitles and lip movement, no audio. */
const silentSpeak = (sentence: string, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    voiceState.speaking = true;
    const words = sentence.split(/\s+/).length;
    const per = Math.max(1400, words * 330) / words;
    let i = 0;
    const tick = setInterval(() => {
      voiceState.wordPulse = 1;
      if (++i >= words || signal?.aborted) {
        clearInterval(tick);
        voiceState.speaking = false;
        resolve();
      }
    }, per);
  });

// ───────────────────────── Public API ─────────────────────────

export type SpeakOptions = {
  muted: boolean;
  onSentence?: (sentence: string) => void;
  signal?: AbortSignal;
};

export const speak = async (text: string, { muted, onSentence = () => {}, signal }: SpeakOptions) => {
  stopSpeaking();
  const sentences = splitSentences(stripMarkdown(text));
  if (!sentences.length) return;

  try {
    if (muted) {
      for (const s of sentences) {
        if (signal?.aborted) break;
        onSentence(s);
        await silentSpeak(s, signal);
      }
      return;
    }

    // Neural voice: fetch chunk N+1 while chunk N plays.
    const neuralChunks = chunk(sentences, 220);
    let next = neuralAvailable ? fetchAudio(neuralChunks[0], signal) : Promise.resolve(null);
    for (let i = 0; i < neuralChunks.length; i++) {
      const buffer = await next;
      if (signal?.aborted) return;
      if (!buffer) {
        // Neural voice unavailable — speak the rest with the browser voice.
        const rest = neuralChunks.slice(i).join(" ");
        if (canSpeak()) {
          for (const c of chunk(splitSentences(rest), 240)) {
            if (signal?.aborted) return;
            await browserSpeak(c, splitSentences(c), onSentence, signal);
          }
        } else {
          for (const s of splitSentences(rest)) {
            onSentence(s);
            await silentSpeak(s, signal);
          }
        }
        return;
      }
      next = i + 1 < neuralChunks.length ? fetchAudio(neuralChunks[i + 1], signal) : Promise.resolve(null);
      onSentence(neuralChunks[i]);
      await playBuffer(buffer, signal);
    }
  } finally {
    voiceState.speaking = false;
    voiceState.level = -1;
  }
};

export const stopSpeaking = () => {
  if (canSpeak()) window.speechSynthesis.cancel();
  try {
    currentSource?.stop();
  } catch {}
  currentSource = null;
  voiceState.speaking = false;
  voiceState.level = -1;
};

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
