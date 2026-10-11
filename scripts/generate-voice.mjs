// Pre-renders the persona's scripted lines with Groq Orpheus so they cost no
// API quota at runtime. Run: node scripts/generate-voice.mjs  (needs GROQ_API_KEY in .env.local)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const key = readFileSync(".env.local", "utf8").match(/GROQ_API_KEY=(\S+)/)?.[1];
if (!key) throw new Error("GROQ_API_KEY missing from .env.local");

const LINES = JSON.parse(readFileSync("src/data/voiceLines.json", "utf8"));

mkdirSync("public/voice", { recursive: true });
for (const [name, { voice, text }] of Object.entries(LINES)) {
  const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "canopylabs/orpheus-v1-english", voice, input: text, response_format: "wav" }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status} ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`public/voice/${name}.wav`, buf);
  console.log(`${name}.wav  ${(buf.length / 1024).toFixed(0)} KB  (${voice})`);
  await new Promise((r) => setTimeout(r, 15000)); // stay under the free tier's tokens-per-minute limit
}
