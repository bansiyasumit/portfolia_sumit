import { NextResponse } from "next/server";

const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = "whisper-large-v3-turbo";
const MAX_BYTES = 3 * 1024 * 1024;
// Vocabulary hint so Whisper spells names and research terms correctly.
const PROMPT =
  "Questions for Sumit Bansiya about NIT Jalandhar, MITS Gwalior, IndiaAI Fellowship, Seg-CycleGAN, Pix2Pix, CESM, Grad-CAM, RAG, FAISS, BM25, CrewAI, LangChain, PyTorch.";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 30;
const hits = new Map<string, number[]>();

/** Speech-to-text for the persona's mic button (Groq Whisper). Works in every browser. */
export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "stt-unavailable" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > MAX_REQUESTS) return NextResponse.json({ error: "rate-limited" }, { status: 429 });

  let audio: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("audio");
    audio = f instanceof File ? f : null;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  if (!audio || audio.size === 0 || audio.size > MAX_BYTES) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", audio, audio.name || "speech.webm");
  upstream.append("model", MODEL);
  upstream.append("language", "en");
  upstream.append("prompt", PROMPT);
  upstream.append("response_format", "json");

  const res = await fetch(GROQ_STT_URL, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: upstream });
  if (!res.ok) {
    console.error("Groq STT error:", res.status, (await res.text()).slice(0, 300));
    return NextResponse.json({ error: res.status === 429 ? "rate-limited" : "stt-failed" }, { status: res.status === 429 ? 429 : 502 });
  }
  const data = await res.json();
  return NextResponse.json({ text: String(data.text ?? "").trim() });
}
