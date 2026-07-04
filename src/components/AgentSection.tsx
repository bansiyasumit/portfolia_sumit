"use client";

import { Cpu, Terminal, Zap } from "lucide-react";
import { Reveal } from "./Reveal";

export const OPEN_AGENT_EVENT = "agent-sumit:open";

export const AgentSection = () => {
  const openAgent = () => {
    window.dispatchEvent(new Event(OPEN_AGENT_EVENT));
  };

  return (
    <section id="agent" className="scroll-mt-24 relative">
      <Reveal>
        <div className="flex items-center gap-4 mb-3">
          <span className="font-orbitron text-[#00f3ff] text-xs tracking-[0.3em] uppercase">Chapter 03</span>
          <div className="h-px flex-1 bg-gradient-to-r from-[#00f3ff]/40 to-transparent" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black font-orbitron mb-10 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600 uppercase tracking-tighter">
          Talk to Agent Sumit
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass-panel rounded-lg p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: "linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />

          <div className="relative flex-1">
            <p className="text-gray-300 font-inter text-lg leading-relaxed mb-6 max-w-xl">
              Rather than reading a static bio, ask a Groq-backed language model trained on my
              projects, skills, and career history directly. Query the research, the RAG systems,
              or the origin story — it answers in real time, in character.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["/bio", "/projects", "/lore", "/credits"].map((cmd) => (
                <span
                  key={cmd}
                  className="font-orbitron text-xs text-[#00f3ff] border border-[#00f3ff]/30 px-3 py-1.5 rounded-sm bg-[#00f3ff]/5"
                >
                  {cmd}
                </span>
              ))}
            </div>
            <button
              onClick={openAgent}
              className="group relative inline-flex items-center gap-3 px-6 py-3 font-orbitron text-sm uppercase tracking-widest overflow-hidden"
            >
              <span className="relative z-10 text-white group-hover:text-[#020202] transition-colors duration-300 flex items-center gap-2">
                <Terminal size={16} />
                Initialize Terminal
              </span>
              <div className="absolute inset-0 border border-[#00f3ff] transition-all duration-300" />
              <div className="absolute inset-0 bg-[#00f3ff] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            </button>
          </div>

          <div className="relative shrink-0 w-full md:w-56 flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 rounded-full border border-[#00f3ff]/40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#00f3ff] animate-ping opacity-20" />
              <Cpu className="text-[#00f3ff]" size={36} />
            </div>
            <div className="flex items-center gap-2 text-xs font-orbitron text-gray-400 uppercase tracking-widest">
              <Zap size={12} className="text-[#ff00ff]" />
              Groq · llama-3.1-8b
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};
