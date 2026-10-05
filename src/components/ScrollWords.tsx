"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

const Word = ({ children, progress, range }: { children: React.ReactNode; progress: MotionValue<number>; range: [number, number] }) => {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block mr-[0.25em]">
      {children}
    </motion.span>
  );
};

/**
 * Paragraph whose words light up one by one as it scrolls through the frame,
 * like subtitles being read aloud. Words wrapped in *asterisks* get the accent.
 */
export const ScrollWords = ({ text, className }: { text: string; className?: string }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = text.split(" ");

  return (
    <p ref={ref} className={className}>
      {words.map((raw, i) => {
        const accent = raw.startsWith("*");
        const word = raw.replace(/\*/g, "");
        const start = i / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, start + 1 / words.length]}>
            {accent ? <span className="font-serif italic text-ember">{word}</span> : word}
          </Word>
        );
      })}
    </p>
  );
};
