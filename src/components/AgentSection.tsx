"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { OPEN_AGENT_EVENT } from "@/lib/film";
import { SceneHeader } from "./SceneHeader";

const QUESTIONS = [
  "What is Seg-CycleGAN and why does it matter?",
  "How did you cut RAG latency from 4.2s to 0.9s?",
  "Walk me through your agent crew.",
  "Take me to your thesis",
];

const openAgent = (prompt?: string) =>
  window.dispatchEvent(new CustomEvent(OPEN_AGENT_EVENT, { detail: { prompt } }));

/** Typewriter loop through sample questions inside the "interrogation room" monitor. */
const useTypewriter = (lines: string[]) => {
  const [text, setText] = useState("");
  useEffect(() => {
    let line = 0, char = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const current = lines[line];
      if (!deleting) {
        char++;
        setText(current.slice(0, char));
        if (char === current.length) {
          deleting = true;
          timer = setTimeout(step, 1800);
          return;
        }
      } else {
        char--;
        setText(current.slice(0, char));
        if (char === 0) {
          deleting = false;
          line = (line + 1) % lines.length;
        }
      }
      timer = setTimeout(step, deleting ? 22 : 45);
    };
    timer = setTimeout(step, 600);
    return () => clearTimeout(timer);
  }, [lines]);
  return text;
};

export const AgentSection = () => {
  const typed = useTypewriter(QUESTIONS);

  return (
    <section id="agent" data-scene="Agent" className="relative py-28 md:py-40">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <SceneHeader
          number={5}
          slug="Int. Interrogation room — live"
          title="Interview"
          accent="my AI twin"
          intro="Skip the résumé. A tool-using agent grounded in my real record — it looks things up before it answers, keeps it brief, and can walk you around this site."
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Monitor */}
          <motion.button
            onClick={() => openAgent()}
            data-cursor="ASK"
            className="lg:col-span-3 text-left relative rounded-sm border border-paper/15 bg-ink-2 overflow-hidden min-h-[320px] md:min-h-[380px] p-6 md:p-10 flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, #ece8e1 0 1px, transparent 1px 4px)" }}
            />
            <div className="flex items-center justify-between hud text-paper/40">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" /> Agent.Sumit — online
              </span>
              <span>Groq · gpt-oss-120b</span>
            </div>
            <div className="flex-1 flex items-center">
              <p className="font-serif italic text-3xl md:text-5xl leading-tight text-paper">
                <span className="text-ember not-italic font-mono text-2xl md:text-3xl mr-3">&gt;</span>
                {typed}
                <span className="inline-block w-[0.5ch] h-[1em] align-[-0.12em] bg-ember ml-1 animate-pulse" />
              </p>
            </div>
            <div className="hud text-paper/50">Click to open the terminal ↗</div>
          </motion.button>

          {/* Suggested prompts */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {QUESTIONS.map((q, i) => (
              <motion.button
                key={q}
                onClick={() => openAgent(q)}
                className="group text-left flex items-center justify-between gap-4 border border-paper/10 hover:border-ember/60 rounded-sm px-5 py-4 transition-colors"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="text-paper/80 group-hover:text-paper text-sm md:text-base">{q}</span>
                <span className="text-ember group-hover:translate-x-1 transition-transform">→</span>
              </motion.button>
            ))}
            <p className="hud text-paper/30 mt-2">Tip: it can also navigate — try “show me the RAG project”</p>
          </div>
        </div>
      </div>
    </section>
  );
};
