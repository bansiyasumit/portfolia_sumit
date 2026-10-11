import { NextResponse } from "next/server";

const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const MODEL = "canopylabs/orpheus-v1-english";
const VOICE = process.env.GROQ_TTS_VOICE ?? "troy";
const MAX_CHARS = 400;

// Light per-IP rate limit so the free Groq quota can't be drained by one visitor.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 40;
const hits = new Map<string, number[]>();

const limited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_REQUESTS;
};

// Small cache: the greeting and common answers are synthesized once per server instance.
const cache = new Map<string, ArrayBuffer>();

/**
 * Neural text-to-speech for the 3D persona (Groq · Orpheus). Any failure returns
 * a JSON error so the client can fall back to the browser's built-in voice.
 */
export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "tts-unavailable" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });

  let text = "";
  try {
    const body = await req.json();
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  if (!text || text.length > MAX_CHARS) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const cached = cache.get(text);
  if (cached) return new Response(cached, { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } });

  const res = await fetch(GROQ_TTS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice: VOICE, input: text, response_format: "wav" }),
  });

  if (!res.ok) {
    console.error("Groq TTS error:", res.status, (await res.text()).slice(0, 300));
    // 429 = free-tier limit hit (temporary); anything else = treat the voice as unavailable.
    return res.status === 429
      ? NextResponse.json({ error: "rate-limited" }, { status: 429 })
      : NextResponse.json({ error: "tts-unavailable" }, { status: 503 });
  }

  const audio = await res.arrayBuffer();
  if (cache.size > 50) cache.clear();
  cache.set(text, audio);
  return new Response(audio, { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } });
}
