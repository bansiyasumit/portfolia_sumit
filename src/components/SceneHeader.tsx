"use client";

import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Title card that opens each scene: a slate line ("SC 02 — INT. LAB — DAY"),
 * a drawn rule, and an oversized title rising out of a mask.
 */
export const SceneHeader = ({
  number,
  slug,
  title,
  accent,
  intro,
}: {
  number: number;
  slug: string;
  title: string;
  accent?: string;
  intro?: string;
}) => (
  <header className="mb-14 md:mb-20">
    <motion.div
      className="flex items-center gap-4 hud text-paper/50 mb-6"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.8 }}
    >
      <span className="text-ember">SC {String(number).padStart(2, "0")}</span>
      <motion.span
        className="h-px flex-1 max-w-[180px] bg-paper/25 origin-left"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease }}
      />
      <span>{slug}</span>
    </motion.div>

    {/* The trigger sits on the heading: the masked span itself starts fully
        clipped, so an observer on it would never report it as visible. */}
    <motion.h2
      className="font-display uppercase leading-[0.88] text-[16vw] md:text-[9vw] xl:text-[8.5rem] tracking-tight"
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.3 }}
    >
      <span className="block overflow-hidden">
        <motion.span
          className="block"
          variants={{ hidden: { y: "105%" }, shown: { y: "0%" } }}
          transition={{ duration: 1.1, ease }}
        >
          {title}
          {accent && <span className="font-serif italic normal-case text-ember tracking-normal"> {accent}</span>}
        </motion.span>
      </span>
    </motion.h2>

    {intro && (
      <motion.p
        className="mt-6 max-w-2xl text-paper/60 text-base md:text-lg leading-relaxed"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, delay: 0.2, ease }}
      >
        {intro}
      </motion.p>
    )}
  </header>
);
