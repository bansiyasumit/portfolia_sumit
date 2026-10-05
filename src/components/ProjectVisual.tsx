"use client";

import { motion } from "framer-motion";
import type { ReactElement } from "react";

export type ProjectVisualVariant = "classifier" | "rag" | "agents" | "vision";
type Variant = ProjectVisualVariant;

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 1.1, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] as const }, opacity: { duration: 0.3, delay: i * 0.12 } },
  }),
};

const fadeIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: 0.3 + i * 0.1 },
  }),
};

/** Multi-view classification diagram: 8 view nodes -> network -> 3 class outputs. */
const ClassifierDiagram = () => {
  const viewNodes = Array.from({ length: 8 }, (_, i) => ({
    x: 30,
    y: 20 + i * 22,
  }));
  const classes = [
    { label: "Normal", y: 40, color: "#3ee6d9" },
    { label: "Benign", y: 88, color: "#ff6b35" },
    { label: "Malignant", y: 136, color: "#f5c26b" },
  ];

  return (
    <svg viewBox="0 0 340 180" className="w-full h-full" fill="none">
      {viewNodes.map((n, i) => (
        <g key={i}>
          <motion.line
            x1={n.x} y1={n.y} x2={165} y2={90}
            stroke="#3ee6d9" strokeOpacity={0.25} strokeWidth={1}
            variants={draw} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
          />
          <motion.circle
            cx={n.x} cy={n.y} r={4} fill="#3ee6d9" fillOpacity={0.7}
            variants={fadeIn} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
          />
        </g>
      ))}

      <motion.circle
        cx={165} cy={90} r={18} fill="#0a0a1a" stroke="#ff6b35" strokeWidth={1.5}
        variants={fadeIn} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
      />
      <motion.text x={165} y={94} textAnchor="middle" fontSize="8" fill="#ff6b35" fontFamily="var(--nf-mono)"
        variants={fadeIn} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        CNN
      </motion.text>

      {classes.map((c, i) => (
        <g key={c.label}>
          <motion.line
            x1={183} y1={90} x2={280} y2={c.y}
            stroke={c.color} strokeOpacity={0.4} strokeWidth={1.5}
            variants={draw} custom={i + 2} initial="hidden" whileInView="visible" viewport={{ once: true }}
          />
          <motion.g variants={fadeIn} custom={i + 4} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <circle cx={288} cy={c.y} r={3} fill={c.color} />
            <text x={296} y={c.y + 3} fontSize="9" fill={c.color} fontFamily="var(--nf-mono)">
              {c.label}
            </text>
          </motion.g>
        </g>
      ))}
    </svg>
  );
};

/** RAG pipeline: query -> hybrid retrieval -> rerank -> LLM -> answer. */
const RagDiagram = () => {
  const stages = [
    { label: "Query", x: 20 },
    { label: "BM25+FAISS", x: 105 },
    { label: "Rerank", x: 200 },
    { label: "LLM", x: 270 },
    { label: "Answer", x: 320 },
  ];

  return (
    <svg viewBox="0 0 340 140" className="w-full h-full" fill="none">
      <motion.line
        x1={20} y1={70} x2={320} y2={70}
        stroke="#3ee6d9" strokeOpacity={0.2} strokeWidth={1}
        variants={draw} initial="hidden" whileInView="visible" viewport={{ once: true }}
      />
      {stages.map((s, i) => (
        <motion.g key={s.label} variants={fadeIn} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <rect x={s.x - 24} y={55} width={48} height={30} rx={4} fill="#0a0a1a" stroke="#ff6b35" strokeOpacity={0.6} strokeWidth={1} />
          <text x={s.x} y={102} textAnchor="middle" fontSize="8" fill="#e0e0e0" fontFamily="var(--nf-mono)">
            {s.label}
          </text>
          {i < stages.length - 1 && (
            <text x={s.x + 24} y={74} fontSize="10" fill="#3ee6d9" opacity={0.7}>
              →
            </text>
          )}
        </motion.g>
      ))}
    </svg>
  );
};

/** Multi-agent orchestration: orchestrator + 4 satellite agents. */
const AgentsDiagram = () => {
  const agents = [
    { label: "Research", x: 170, y: 25, color: "#3ee6d9" },
    { label: "Analysis", x: 280, y: 90, color: "#ff6b35" },
    { label: "Fact-Check", x: 220, y: 160, color: "#f5c26b" },
    { label: "Report", x: 90, y: 160, color: "#3ee6d9" },
    { label: "Search API", x: 40, y: 90, color: "#ff6b35" },
  ];

  return (
    <svg viewBox="0 0 340 190" className="w-full h-full" fill="none">
      {agents.map((a, i) => (
        <motion.line
          key={a.label}
          x1={165} y1={95} x2={a.x} y2={a.y}
          stroke={a.color} strokeOpacity={0.35} strokeWidth={1.2}
          variants={draw} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
        />
      ))}
      <motion.circle
        cx={165} cy={95} r={20} fill="#0a0a1a" stroke="#f5c26b" strokeWidth={1.5}
        variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
      />
      <text x={165} y={99} textAnchor="middle" fontSize="7.5" fill="#f5c26b" fontFamily="var(--nf-mono)">
        CREW
      </text>
      {agents.map((a, i) => (
        <motion.g key={a.label} variants={fadeIn} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <circle cx={a.x} cy={a.y} r={5} fill={a.color} />
          <text x={a.x} y={a.y - 10} textAnchor="middle" fontSize="8" fill="#e0e0e0" fontFamily="var(--nf-mono)">
            {a.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
};

/** CNN vision pipeline: input frame -> shrinking conv layers -> class bars. */
const VisionDiagram = () => {
  const layers = [90, 74, 58, 42];
  const bars = [
    { label: "Minor", h: 20, color: "#3ee6d9" },
    { label: "Moderate", h: 42, color: "#ff6b35" },
    { label: "Severe", h: 30, color: "#f5c26b" },
  ];

  return (
    <svg viewBox="0 0 340 160" className="w-full h-full" fill="none">
      <motion.rect x={16} y={30} width={60} height={60} rx={3} fill="#0a0a1a" stroke="#3ee6d9" strokeWidth={1.5}
        variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} />
      <text x={46} y={105} textAnchor="middle" fontSize="8" fill="#3ee6d9" fontFamily="var(--nf-mono)">INPUT</text>

      {layers.map((h, i) => {
        const x = 110 + i * 34;
        return (
          <motion.rect
            key={i}
            x={x} y={60 - h / 2} width={22} height={h} rx={2}
            fill="#0a0a1a" stroke="#ff6b35" strokeOpacity={0.7} strokeWidth={1}
            variants={fadeIn} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
          />
        );
      })}
      <text x={178} y={105} textAnchor="middle" fontSize="8" fill="#ff6b35" fontFamily="var(--nf-mono)">RESNET</text>

      <g transform="translate(250, 0)">
        {bars.map((b, i) => (
          <motion.g key={b.label} variants={fadeIn} custom={i + 5} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <rect x={i * 26} y={90 - b.h} width={16} height={b.h} rx={2} fill={b.color} fillOpacity={0.6} />
            <text x={i * 26 + 8} y={104} textAnchor="middle" fontSize="6.5" fill="#e0e0e0" fontFamily="var(--nf-mono)">
              {b.label}
            </text>
          </motion.g>
        ))}
      </g>
    </svg>
  );
};

const DIAGRAMS: Record<Variant, () => ReactElement> = {
  classifier: ClassifierDiagram,
  rag: RagDiagram,
  agents: AgentsDiagram,
  vision: VisionDiagram,
};

export const ProjectVisual = ({ variant, label }: { variant: Variant; label: string }) => {
  const Diagram = DIAGRAMS[variant] ?? RagDiagram;

  return (
    <div className="rounded-sm glass-panel p-4 h-[220px] md:h-[280px] flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <Diagram />
      </div>
      <div className="text-center font-orbitron text-[9px] tracking-[0.2em] uppercase text-gray-500 mt-2">
        {label}
      </div>
    </div>
  );
};
