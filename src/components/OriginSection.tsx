"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useScroll, useTransform } from "framer-motion";
import profileData from "@/data/profile.json";
import { SceneHeader } from "./SceneHeader";
import { ScrollWords } from "./ScrollWords";

const STORY =
  "Born in a village in Agar Malwa, Madhya Pradesh. Somewhere between a pandemic, a long recovery and a lot of late nights, I found my *medium:* machines that learn to *see.* Today I research generative models that make breast-cancer screening *safer,* build LLM systems that hold up in production, and teach the next batch of engineers to do the same.";

const STATS = [
  { value: 8.43, decimals: 2, label: "M.Tech CGPA", sub: "NIT Jalandhar" },
  { value: 8.7, decimals: 1, label: "B.Tech CGPA", sub: "MITS Gwalior" },
  { value: 5, decimals: 0, label: "Flagship systems", sub: "GANs · RAG · Agents" },
  { value: 70, decimals: 0, suffix: "%", label: "Effort cut", sub: "by my agent crew" },
];

const Counter = ({ value, decimals, suffix }: { value: number; decimals: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const [display, setDisplay] = useState((0).toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, value, decimals]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
};

/** One infinite strip of skills; two of these run in opposite directions. */
const Marquee = ({ items, reverse }: { items: string[]; reverse?: boolean }) => (
  <div className="overflow-hidden py-3 border-y border-paper/10 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
    <div
      className="flex w-max gap-10"
      style={{ animation: `marquee ${items.length * 2.6}s linear infinite ${reverse ? "reverse" : ""}` }}
    >
      {[...items, ...items].map((item, i) => (
        <span key={i} className="flex items-center gap-10 font-display uppercase text-3xl md:text-5xl text-paper/80 whitespace-nowrap">
          {item}
          <span className="text-ember text-xl">✦</span>
        </span>
      ))}
    </div>
  </div>
);

export const OriginSection = () => {
  const { about, achievements } = profileData;
  const frameRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: frameRef, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const grade = useTransform(scrollYProgress, [0.1, 0.45], ["grayscale(1) contrast(1.2)", "grayscale(0) contrast(1.05)"]);

  const skills = Object.values(about.skills).flat();
  const half = Math.ceil(skills.length / 2);
  const fellowship = achievements[0];

  return (
    <section id="origin" className="relative py-28 md:py-40 overflow-x-clip">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <SceneHeader number={2} slug="Int. Village to lab — dawn" title="Origin" accent="story" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Film frame portrait */}
          <div ref={frameRef} className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="relative bg-ink-2 p-3 md:p-4 rounded-sm border border-paper/10">
              <div className="flex justify-between mb-3 px-1" aria-hidden="true">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="w-3 h-2 rounded-[2px] bg-paper/15" />
                ))}
              </div>
              <div className="relative aspect-[4/5] overflow-hidden">
                <motion.div className="absolute inset-[-10%]" style={{ y: imageY, filter: grade }}>
                  <Image
                    src="/sumit_portrait.webp"
                    alt="Portrait of Sumit Bansiya"
                    fill
                    sizes="(max-width: 1024px) 90vw, 520px"
                    className="object-cover object-[50%_30%]"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                <div className="absolute left-4 bottom-4 hud text-paper/80">Reel 01 · Agar Malwa, MP</div>
                <div className="absolute right-4 top-4 hud text-ember">● Rec</div>
              </div>
              <div className="flex justify-between mt-3 px-1" aria-hidden="true">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="w-3 h-2 rounded-[2px] bg-paper/15" />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ScrollWords
              text={STORY}
              className="font-medium text-2xl md:text-4xl leading-[1.25] tracking-tight text-paper"
            />

            {fellowship && (
              <motion.div
                className="mt-14 relative overflow-hidden rounded-sm border border-gold/30 bg-gradient-to-br from-gold/10 via-transparent to-transparent p-6 md:p-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="hud text-gold mb-3">★ Award — official selection</div>
                <div className="font-display uppercase text-4xl md:text-5xl text-paper">{fellowship.title}</div>
                <div className="font-serif italic text-xl text-gold/90 mt-1">{fellowship.org}</div>
                <p className="text-paper/60 text-sm md:text-base mt-4 max-w-xl leading-relaxed">{fellowship.description}</p>
                <div className="absolute -right-6 -bottom-10 font-display text-[9rem] leading-none text-gold/5 select-none" aria-hidden="true">
                  AI
                </div>
              </motion.div>
            )}

            <div className="mt-14 grid grid-cols-2 gap-px bg-paper/10 border border-paper/10">
              {STATS.map((s) => (
                <div key={s.label} className="bg-ink p-5 md:p-7">
                  <div className="font-display text-5xl md:text-6xl text-paper">
                    <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
                  </div>
                  <div className="hud text-ember mt-3">{s.label}</div>
                  <div className="text-paper/40 text-xs mt-1">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-24 md:mt-32 flex flex-col gap-2 -rotate-2 scale-105">
        <Marquee items={skills.slice(0, half)} />
        <Marquee items={skills.slice(half)} reverse />
      </div>
    </section>
  );
};
