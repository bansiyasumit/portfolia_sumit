"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import profileData from "@/data/profile.json";
import libraryData from "@/data/library.json";
import { SceneHeader } from "./SceneHeader";

type Beat = { period: string; title: string; place: string; detail: string; impact?: string; kind: "Education" | "Experience" };

const beats: Beat[] = [
  ...profileData.about.experience.map((e) => ({
    period: e.period,
    title: e.role,
    place: e.org,
    detail: e.description,
    impact: e.impact,
    kind: "Experience" as const,
  })),
  ...profileData.about.education.map((e) => ({
    period: e.period,
    title: e.degree,
    place: e.institution,
    detail: e.detail,
    kind: "Education" as const,
  })),
];

const ease = [0.16, 1, 0.3, 1] as const;

export const PathSection = () => {
  const lineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: lineRef, offset: ["start 0.7", "end 0.6"] });
  const drawn = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const certs = [...libraryData.library].sort((a, b) => b.year - a.year);

  return (
    <section id="path" data-scene="The Path" className="relative py-28 md:py-40">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <SceneHeader number={5} slug="Montage — 2020 to now" title="The Path" />

        <div ref={lineRef} className="relative">
          {/* The spine draws itself as you scroll */}
          <div className="absolute left-3 md:left-1/2 top-0 bottom-0 w-px bg-paper/10 md:-translate-x-1/2">
            <motion.div className="absolute inset-0 bg-gradient-to-b from-ember via-gold to-teal origin-top" style={{ scaleY: drawn }} />
          </div>

          <ol className="flex flex-col gap-14 md:gap-20">
            {beats.map((b, i) => {
              const right = i % 2 === 1;
              return (
                <li key={b.title} className="relative grid md:grid-cols-2 md:gap-20">
                  <span className="absolute left-3 md:left-1/2 top-2 w-3 h-3 -translate-x-1/2 rounded-full bg-ink border-2 border-ember shadow-[0_0_18px_rgba(255,107,53,0.6)]" />
                  <motion.div
                    className={`pl-10 md:pl-0 ${right ? "md:col-start-2" : "md:text-right"}`}
                    initial={{ opacity: 0, x: right ? 40 : -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.01, margin: "0px 0px 12% 0px" }}
                    transition={{ duration: 0.9, ease }}
                  >
                    <div className="hud text-ember">
                      {b.period} · <span className="text-paper/40">{b.kind}</span>
                    </div>
                    <h3 className="font-display uppercase text-3xl md:text-5xl leading-none mt-3 text-paper">{b.title}</h3>
                    <div className="font-serif italic text-xl md:text-2xl text-paper/70 mt-2">{b.place}</div>
                    <p className="text-paper/55 mt-4 text-sm md:text-base leading-relaxed">{b.detail}</p>
                    {b.impact && (
                      <p className="text-teal/80 mt-3 text-sm leading-relaxed">
                        <span className="hud text-teal mr-2">Impact</span>
                        {b.impact}
                      </p>
                    )}
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Archive: certifications as a film-can index */}
        <div className="mt-28 md:mt-36">
          <div className="flex items-end justify-between mb-6">
            <h3 className="font-display uppercase text-4xl md:text-6xl">
              The <span className="font-serif italic normal-case text-gold">archive</span>
            </h3>
            <span className="hud text-paper/40">{certs.length} reels catalogued</span>
          </div>
          <ul className="border-t border-paper/10">
            {certs.map((c, i) => (
              <motion.li
                key={c.title}
                className="group grid grid-cols-[3rem_1fr_auto] md:grid-cols-[5rem_1fr_16rem_4rem] items-center gap-4 py-5 border-b border-paper/10 hover:bg-paper/[0.03] transition-colors px-2"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01, margin: "0px 0px 12% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.04, ease }}
              >
                <span className="hud text-paper/30 group-hover:text-ember transition-colors">{String(i + 1).padStart(3, "0")}</span>
                <span className="text-paper text-base md:text-xl group-hover:translate-x-2 transition-transform duration-500">{c.title}</span>
                <span className="hidden md:block text-paper/50 text-sm">{c.issuer}</span>
                <span className="hud text-paper/40 text-right">{c.year}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
