"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const DOCS = 28;
const QUERY = "Is the indemnity clause enforceable after termination?";
// Fixed so server and client agree. Lexical (BM25) and semantic (FAISS) hits, then the reranked top-3.
const LEXICAL = [3, 9, 14, 22];
const SEMANTIC = [5, 9, 17, 22, 26];
const RERANKED = [9, 22, 17];

type Phase = "query" | "retrieve" | "rerank" | "answer";
const PHASES: [Phase, number][] = [["query", 2200], ["retrieve", 1800], ["rerank", 1600], ["answer", 2600]];

/**
 * RAG scene: a query is typed, hybrid retrieval lights up candidate passages
 * across a field of legal documents (teal = BM25, ember = FAISS), the reranker
 * keeps three, and a grounded answer cites them.
 */
export default function RetrievalScene() {
  const [phase, setPhase] = useState<Phase>("query");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      i = (i + 1) % PHASES.length;
      setPhase(PHASES[i][0]);
      timer = setTimeout(next, PHASES[i][1]);
    };
    timer = setTimeout(next, PHASES[0][1]);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "query") return;
    let c = 0;
    const t = setInterval(() => {
      c++;
      setTyped(QUERY.slice(0, c));
      if (c >= QUERY.length) clearInterval(t);
    }, 32);
    return () => clearInterval(t);
  }, [phase]);

  const stateOf = (i: number) => {
    if (phase === "query") return "idle";
    if (phase === "retrieve") return LEXICAL.includes(i) && SEMANTIC.includes(i) ? "both" : LEXICAL.includes(i) ? "lex" : SEMANTIC.includes(i) ? "sem" : "idle";
    return RERANKED.includes(i) ? "keep" : "dim";
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6">
      <div className="w-full max-w-3xl border border-paper/20 rounded-full px-6 py-3 font-mono text-sm md:text-base text-paper/90 bg-ink/60 backdrop-blur">
        <span className="text-ember mr-3">?</span>
        {typed}
        <span className="inline-block w-2 h-4 bg-ember ml-1 align-middle animate-pulse" />
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-3 w-full max-w-4xl">
        {Array.from({ length: DOCS }).map((_, i) => {
          const s = stateOf(i);
          const border =
            s === "both" || s === "keep" ? "var(--gold)" : s === "lex" ? "var(--teal)" : s === "sem" ? "var(--ember)" : "rgba(236,232,225,0.12)";
          return (
            <motion.div
              key={i}
              className="relative aspect-[3/4] rounded-[3px] border bg-ink-2 p-1.5 md:p-2 flex flex-col gap-1"
              animate={{
                borderColor: border,
                opacity: s === "dim" ? 0.18 : 1,
                scale: s === "keep" ? 1.08 : 1,
                boxShadow: s === "keep" ? "0 0 24px rgba(245,194,107,0.35)" : "0 0 0 rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.5, delay: phase === "retrieve" ? (i % 7) * 0.03 : 0 }}
            >
              {Array.from({ length: 6 }).map((__, l) => (
                <span
                  key={l}
                  className="block h-[2px] md:h-[3px] rounded-full bg-paper/20"
                  style={{ width: `${55 + ((i * 7 + l * 13) % 45)}%` }}
                />
              ))}
              <span className="absolute bottom-1 right-1.5 font-mono text-[7px] md:text-[9px] text-paper/30">§{i + 1}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="h-16 flex items-center hud text-paper/50">
        {phase === "query" && "Query rewriting → structured sub-queries"}
        {phase === "retrieve" && (
          <span>
            <span className="text-teal">■ BM25</span> &nbsp; <span className="text-ember">■ FAISS</span> &nbsp; <span className="text-gold">■ both</span>
          </span>
        )}
        {phase === "rerank" && "Cross-encoder rerank (MiniLM) → top 3"}
        {phase === "answer" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="normal-case tracking-normal font-sans text-sm md:text-base text-paper border border-gold/40 rounded-sm px-5 py-3 bg-ink/70"
          >
            Answer grounded in <span className="text-gold">§10 · §23 · §18</span> — cached for next time.
          </motion.div>
        )}
      </div>
    </div>
  );
}
