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
// Turns off only when the server says the voice is unavailable (503) — a rate limit (429)
// just means this one answer uses the browser voice.
let neuralAvailable = true;

export const getContext = () => {
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

type Subtitles = { sentences: string[]; onSentence: (s: string) => void };

/** Play audio through the analyser (for lip-sync); subtitles advance by each sentence's share of the text. */
const playBuffer = (buffer: AudioBuffer, signal?: AbortSignal, subs?: Subtitles, lipSync = true, onStart?: () => void) =>
  new Promise<void>((resolve) => {
    const c = getContext()!;
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(analyser!);
    currentSource = src;
    const data = new Uint8Array(analyser!.fftSize);
    let raf = 0;
    const startAt = c.currentTime;

    // Cumulative fraction of the text at which each sentence begins.
    const total = subs ? subs.sentences.reduce((n, x) => n + x.length, 0) : 0;
    const marks: number[] = [];
    if (subs) {
      let acc = 0;
      for (const x of subs.sentences) {
        marks.push(acc / total);
        acc += x.length;
      }
    }
    let shown = 0;

    const meter = () => {
      if (subs) {
        const p = (c.currentTime - startAt) / buffer.duration;
        while (shown + 1 < marks.length && p >= marks[shown + 1]) subs.onSentence(subs.sentences[++shown]);
      }
      analyser!.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      if (lipSync) voiceState.level = Math.min(1, Math.sqrt(sum / data.length) * 5.5);
      raf = requestAnimationFrame(meter);
    };

    const finish = () => {
      cancelAnimationFrame(raf);
      if (lipSync) voiceState.level = 0;
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
    if (lipSync) voiceState.speaking = true;
    // Text and gestures are released at the exact moment sound starts.
    onStart?.();
    subs?.onSentence(subs.sentences[0]);
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
const browserSpeak = (text: string, sentences: string[], onSentence: (s: string) => void, signal?: AbortSignal, onStart?: () => void) =>
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

    // Chrome's network voices stop after ~15s unless nudged.
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);

    u.onstart = () => {
      voiceState.speaking = true;
      onStart?.();
      onSentence(sentences[0]);
    };
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
  /** called once, when the voice actually starts (after any download / synthesis delay) */
  onStart?: () => void;
  /** narrator lines: play audio/subtitles without moving the persona's mouth */
  narrator?: boolean;
  onSentence?: (sentence: string) => void;
  signal?: AbortSignal;
};

export const speak = async (text: string, { muted, onStart, onSentence = () => {}, signal }: SpeakOptions) => {
  let started = false;
  const startOnce = () => {
    if (!started) {
      started = true;
      onStart?.();
    }
  };
  stopSpeaking();
  const sentences = splitSentences(stripMarkdown(text));
  if (!sentences.length) return;

  try {
    if (muted) {
      startOnce();
      for (const s of sentences) {
        if (signal?.aborted) break;
        onSentence(s);
        await silentSpeak(s, signal);
      }
      return;
    }

    // Neural voice: usually one request per answer (fewer requests = no gaps and
    // less free-tier quota); longer texts fetch chunk N+1 while chunk N plays.
    const neuralChunks = chunk(sentences, 380);
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
            await browserSpeak(c, splitSentences(c), onSentence, signal, startOnce);
          }
        } else {
          startOnce();
          for (const s of splitSentences(rest)) {
            onSentence(s);
            await silentSpeak(s, signal);
          }
        }
        return;
      }
      next = i + 1 < neuralChunks.length ? fetchAudio(neuralChunks[i + 1], signal) : Promise.resolve(null);
      await playBuffer(buffer, signal, { sentences: splitSentences(neuralChunks[i]), onSentence }, true, startOnce);
    }
  } finally {
    voiceState.speaking = false;
    voiceState.level = -1;
  }
};

/** Play a pre-recorded line (public/voice/*.wav) with lip-sync and timed subtitles. */
// Pre-recorded clips are downloaded once, ahead of time, so they start instantly.
const clipCache = new Map<string, Promise<ArrayBuffer>>();

export const preloadClips = (urls: string[]) => {
  for (const url of urls) {
    if (!clipCache.has(url)) clipCache.set(url, fetch(url).then((r) => r.arrayBuffer()));
  }
};

export const playClip = async (url: string, text: string, { muted, narrator = false, onStart, onSentence = () => {}, signal }: SpeakOptions) => {
  if (!narrator) stopSpeaking();
  const sentences = splitSentences(text);
  const c = getContext();
  if (muted || !c || c.state !== "running") {
    onStart?.();
    for (const s of sentences) {
      if (signal?.aborted) return;
      onSentence(s);
      if (narrator) await new Promise((r) => setTimeout(r, Math.max(1400, s.split(/\s+/).length * 330)));
      else await silentSpeak(s, signal);
    }
    return;
  }
  try {
    preloadClips([url]);
    // decodeAudioData detaches its input, so decode a copy of the cached bytes.
    const bytes = (await clipCache.get(url)!).slice(0);
    const buffer = await c.decodeAudioData(bytes);
    if (signal?.aborted) return;
    await playBuffer(buffer, signal, { sentences, onSentence }, !narrator, onStart);
  } catch {
    clipCache.delete(url);
    if (!signal?.aborted && !narrator) await speak(text, { muted, onStart, onSentence, signal });
  } finally {
    if (!narrator) {
      voiceState.speaking = false;
      voiceState.level = -1;
    }
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

// ───────────────────────── Listening (Whisper via /api/stt) ─────────────────────────

export const canRecord = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

/**
 * Record one spoken question. Stops automatically ~1.2s after the visitor stops
 * talking (simple voice-activity detection), after 15s, when aborted, or when
 * stop() is called. Resolves with null if nothing was said.
 */
export const recordSpeech = ({ onLevel, signal }: { onLevel?: (level: number) => void; signal?: AbortSignal } = {}) => {
  let stopFn = () => {};
  const promise = (async (): Promise<Blob | null> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const c = getContext()!;
    const source = c.createMediaStreamSource(stream);
    const meter = c.createAnalyser();
    meter.fftSize = 1024;
    source.connect(meter);
    const data = new Uint8Array(meter.fftSize);

    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const parts: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && parts.push(e.data);

    let heard = false;
    let silenceSince = 0;
    const started = performance.now();
    let raf = 0;

    return await new Promise<Blob | null>((resolve) => {
      const finish = () => {
        cancelAnimationFrame(raf);
        if (rec.state !== "inactive") rec.stop();
      };
      stopFn = finish;
      signal?.addEventListener("abort", finish, { once: true });

      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        source.disconnect();
        resolve(heard && parts.length ? new Blob(parts, { type: rec.mimeType || "audio/webm" }) : null);
      };

      const loop = () => {
        meter.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const level = Math.sqrt(sum / data.length);
        onLevel?.(Math.min(1, level * 6));
        const now = performance.now();
        if (level > 0.035) {
          heard = true;
          silenceSince = 0;
        } else if (heard) {
          silenceSince ||= now;
          if (now - silenceSince > 1200) return finish();
        }
        if (now - started > 15000 || (!heard && now - started > 7000)) return finish();
        raf = requestAnimationFrame(loop);
      };

      rec.start(250);
      loop();
    });
  })();
  return { promise, stop: () => stopFn() };
};

export const transcribe = async (audio: Blob): Promise<string> => {
  const form = new FormData();
  form.append("audio", audio, audio.type.includes("mp4") ? "speech.mp4" : "speech.webm");
  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) throw new Error(res.status === 429 ? "rate-limited" : "stt-failed");
  const data = await res.json();
  return data.text ?? "";
};
