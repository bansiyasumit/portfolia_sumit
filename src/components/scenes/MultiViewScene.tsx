"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CLASSES = [
  { label: "Normal", color: "var(--teal)" },
  { label: "Benign", color: "var(--gold)" },
  { label: "Malignant", color: "var(--ember)" },
];

// Fixed pseudo-random Grad-CAM hotspots so server and client render identically.
const HOTSPOTS = [
  [0.62, 0.44], [0.55, 0.58], [0.48, 0.4], [0.66, 0.52],
  [0.58, 0.36], [0.5, 0.62], [0.64, 0.6], [0.45, 0.47],
];

/**
 * Multi-view classifier scene: eight views are scanned one after another,
 * Grad-CAM heat blooms where the model looked, every view feeds one network,
 * and a single class lights up. Illustrative only — not a real prediction.
 */
export default function MultiViewScene() {
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= 11) {
          setCycle((c) => c + 1);
          return 0;
        }
        return s + 1;
      });
    }, 520);
    return () => clearInterval(t);
  }, []);

  const predicted = cycle % 3;
  const fused = step >= 9;

  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <svg viewBox="0 0 900 460" className="w-full max-w-[1100px] h-auto" fill="none">
        <defs>
          <radialGradient id="breast" cx="0.35" cy="0.5" r="0.75">
            <stop offset="0%" stopColor="#d9d4cc" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#8b8780" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#050505" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heat">
            <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#f5c26b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3ee6d9" stopOpacity="0" />
          </radialGradient>
        </defs>

        {HOTSPOTS.map(([hx, hy], i) => {
          const col = i % 4, row = Math.floor(i / 4);
          const x = 20 + col * 120, y = 60 + row * 180;
          const scanned = step > i;
          const scanning = step === i;
          return (
            <g key={i}>
              <rect x={x} y={y} width={104} height={150} rx={4} fill="#0c0c0d" stroke={scanning ? "#ff6b35" : "rgba(236,232,225,0.15)"} />
              <ellipse cx={x + (i % 2 ? 70 : 34)} cy={y + 75} rx={58} ry={66} fill="url(#breast)" />
              {scanned && (
                <motion.circle
                  cx={x + hx * 104}
                  cy={y + hy * 150}
                  fill="url(#heat)"
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: 26, opacity: 0.9 }}
                  transition={{ duration: 0.6 }}
                />
              )}
              {scanning && (
                <motion.line
                  x1={x} x2={x + 104}
                  stroke="#3ee6d9" strokeWidth={1.5}
                  initial={{ y1: y, y2: y }}
                  animate={{ y1: y + 150, y2: y + 150 }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              )}
              <text x={x + 6} y={y + 144} fontSize="9" fill="rgba(236,232,225,0.5)" fontFamily="var(--nf-mono)">
                VIEW {String(i + 1).padStart(2, "0")}
              </text>
              {/* feed into the network */}
              <motion.path
                d={`M ${x + 104} ${y + 75} C ${560} ${y + 75}, ${560} 230, 620 230`}
                stroke={scanned ? "#3ee6d9" : "rgba(236,232,225,0.06)"}
                strokeOpacity={scanned ? 0.35 : 1}
                strokeWidth={1}
              />
            </g>
          );
        })}

        <motion.circle
          cx={640} cy={230} r={30}
          fill="#0c0c0d"
          stroke="#ff6b35"
          strokeWidth={1.5}
          animate={{ scale: fused ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 0.6 }}
          style={{ transformOrigin: "640px 230px" }}
        />
        <text x={640} y={234} textAnchor="middle" fontSize="11" fill="#ff6b35" fontFamily="var(--nf-mono)">FUSE</text>

        {CLASSES.map((c, i) => {
          const y = 150 + i * 80;
          const on = fused && i === predicted;
          return (
            <g key={c.label}>
              <path d={`M 670 230 L 730 ${y}`} stroke={on ? c.color : "rgba(236,232,225,0.12)"} strokeWidth={on ? 2 : 1} />
              <rect x={740} y={y - 12} width={140} height={24} rx={12} fill={on ? c.color : "transparent"} fillOpacity={on ? 0.15 : 0} stroke={on ? c.color : "rgba(236,232,225,0.15)"} />
              <text x={756} y={y + 4} fontSize="12" fill={on ? "#ece8e1" : "rgba(236,232,225,0.45)"} fontFamily="var(--nf-mono)">
                {c.label.toUpperCase()}
              </text>
            </g>
          );
        })}
        <text x={740} y={410} fontSize="9" fill="rgba(236,232,225,0.3)" fontFamily="var(--nf-mono)">ILLUSTRATIVE · GRAD-CAM</text>
      </svg>
    </div>
  );
}
