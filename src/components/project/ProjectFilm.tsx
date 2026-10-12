"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { GanSlider } from "../GanSlider";
import { ProjectVisual, type ProjectVisualVariant } from "../ProjectVisual";
import { ScrollWords } from "../ScrollWords";
import { OPEN_AGENT_EVENT } from "@/lib/film";

const SCENES = {
  diffusion: dynamic(() => import("../scenes/DiffusionScene"), { ssr: false }),
  multiview: dynamic(() => import("../scenes/MultiViewScene"), { ssr: false }),
  retrieval: dynamic(() => import("../scenes/RetrievalScene"), { ssr: false }),
  agents: dynamic(() => import("../scenes/AgentOrbitScene"), { ssr: false }),
  features: dynamic(() => import("../scenes/FeatureStackScene"), { ssr: false }),
};

export type Project = {
  id: string;
  weight: string;
  visual: string;
  scene: keyof typeof SCENES;
  title: string;
  institution?: string;
  logline: string;
  description: string;
  metrics: Record<string, string>;
  tags: string[];
  tech_stack?: string[];
  pipeline: { label: string; text: string }[];
};

const ease = [0.16, 1, 0.3, 1] as const;

const Kicker = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-4 hud text-paper/50 mb-8">
    <span className="text-ember">{n}</span>
    <span className="h-px w-16 bg-paper/25" />
    <span>{children}</span>
  </div>
);

export const ProjectFilm = ({ project, index, total, next }: { project: Project; index: number; total: number; next: Project }) => {
  const Scene = SCENES[project.scene];
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const progress = useTransform(scrollYProgress, (v) => v);
  const sceneScale = useTransform(progress, [0, 1], [1, 1.15]);
  const sceneOpacity = useTransform(progress, [0, 0.8], [1, 0.2]);
  const titleY = useTransform(progress, [0, 1], [0, 120]);
  const take = String(index + 1).padStart(2, "0");
  const stack = [...new Set([...(project.tags ?? []), ...(project.tech_stack ?? [])])];

  return (
    <article>
      {/* Opening shot */}
      <section ref={heroRef} data-scene={`Take ${take} — Opening`} className="relative h-[100svh] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ scale: sceneScale, opacity: sceneOpacity }}>
          <Scene />
        </motion.div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-ink via-ink/30 to-ink/60" />
        <div className="absolute top-0 inset-x-0 bg-ink z-10 anim-letterbox" />
        <div className="absolute bottom-0 inset-x-0 bg-ink z-10 anim-letterbox" />

        <div className="absolute top-[11vh] left-5 md:left-10 right-5 md:right-10 z-20 flex justify-between hud text-paper/60">
          <Link href="/#work" className="hover:text-ember transition-colors">← Back to the reel</Link>
          <span>
            Take <span className="text-ember">{take}</span> / {String(total).padStart(2, "0")}
          </span>
        </div>

        <motion.div className="absolute left-0 right-0 bottom-[11vh] z-20 px-5 md:px-10 pointer-events-none" style={{ y: titleY }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="hud text-ember mb-4 anim-fade-up" style={{ animationDelay: "1.1s" }}>
              {project.weight === "hero" ? "Flagship · " : ""}
              {project.institution ?? "Independent build"}
            </div>
            <h1 className="font-display uppercase leading-[0.9] text-[11vw] md:text-[6.5vw] xl:text-[6rem] max-w-5xl">
              <span className="block overflow-hidden">
                <span className="block anim-rise" style={{ animationDelay: "0.9s" }}>
                  {project.title}
                </span>
              </span>
            </h1>
            <p className="font-serif italic text-xl md:text-3xl text-paper/80 mt-4 max-w-3xl anim-fade-up" style={{ animationDelay: "1.3s" }}>
              {project.logline}
            </p>
          </div>
        </motion.div>
      </section>

      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        {/* Synopsis */}
        <section data-scene={`Take ${take} — Synopsis`} className="py-24 md:py-36 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <Kicker n="01">Synopsis</Kicker>
          </div>
          <ScrollWords text={project.description} className="lg:col-span-8 text-2xl md:text-[2.1rem] leading-[1.3] tracking-tight" />
        </section>

        {/* Numbers */}
        <section data-scene={`Take ${take} — The numbers`} className="py-16 md:py-24 border-t border-paper/10">
          <Kicker n="02">The numbers</Kicker>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-paper/10 border border-paper/10">
            {Object.entries(project.metrics).map(([k, v], i) => (
              <motion.div
                key={k}
                className="bg-ink p-7 md:p-10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01, margin: "0px 0px 12% 0px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease }}
              >
                <div className="hud text-ember mb-4">{k}</div>
                <div className="font-display uppercase text-3xl md:text-5xl leading-[1.05] text-paper">{v}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section data-scene={`Take ${take} — How it works`} className="py-24 md:py-36 border-t border-paper/10">
          <Kicker n="03">How it works</Kicker>
          <ol className="relative grid gap-10 md:gap-6" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(190px, 1fr))` }}>
            {project.pipeline.map((s, i) => (
              <motion.li
                key={s.label}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01, margin: "0px 0px 12% 0px" }}
                transition={{ duration: 0.8, delay: i * 0.12, ease }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-9 h-9 shrink-0 rounded-full border border-ember text-ember font-mono text-xs flex items-center justify-center">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < project.pipeline.length - 1 && (
                    <motion.span
                      className="hidden md:block h-px flex-1 bg-gradient-to-r from-ember/70 to-paper/10 origin-left"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, amount: 0.01, margin: "0px 0px 12% 0px" }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.12, ease }}
                    />
                  )}
                </div>
                <div className="font-display uppercase text-2xl text-paper">{s.label}</div>
                <p className="text-paper/60 text-sm leading-relaxed mt-2">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* Interactive */}
        <section data-scene={`Take ${take} — On the bench`} className="py-16 md:py-24 border-t border-paper/10 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4">
            <Kicker n="04">On the bench</Kicker>
            <p className="text-paper/60 leading-relaxed">
              {project.scene === "diffusion"
                ? "Drag across the frame to compare the low-energy input with the synthesized DES phantom."
                : "The architecture at a glance — every block maps to a stage of the pipeline above."}
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent(OPEN_AGENT_EVENT, { detail: { prompt: `Walk me through "${project.title}" in detail.` } }))}
              className="mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-full border border-paper/25 hover:border-ember hover:text-ember transition-colors text-sm"
            >
              Ask my AI twin about this →
            </button>
          </div>
          <div className="lg:col-span-8">
            {project.scene === "diffusion" ? (
              <GanSlider />
            ) : (
              <ProjectVisual variant={project.visual as ProjectVisualVariant} label={`${project.id.replace(/-/g, " ")} // architecture`} />
            )}
          </div>
        </section>

        {/* Stack */}
        <section className="py-16 border-t border-paper/10">
          <Kicker n="05">Shot on</Kicker>
          <div className="flex flex-wrap gap-3">
            {stack.map((t) => (
              <span key={t} className="font-display uppercase text-2xl md:text-4xl text-paper/80 border border-paper/15 rounded-full px-5 py-2">
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Next take */}
      <section data-scene="Next take" className="mt-16 border-t border-paper/10">
        <Link href={`/work/${next.id}`} data-cursor="NEXT" className="group block px-5 md:px-10 py-20 md:py-32 overflow-hidden">
          <div className="max-w-[1400px] mx-auto">
            <div className="hud text-paper/50 mb-6">Next take →</div>
            <div className="font-display uppercase text-[10vw] md:text-[7vw] leading-[0.9] text-outline group-hover:text-ember transition-colors duration-500 [-webkit-text-stroke-color:rgba(236,232,225,0.35)] group-hover:[-webkit-text-stroke-color:transparent]">
              {next.title}
            </div>
            <div className="font-serif italic text-xl md:text-2xl text-paper/50 mt-4 group-hover:translate-x-3 transition-transform duration-500">
              {next.logline}
            </div>
          </div>
        </Link>
      </section>

      <footer className="max-w-[1400px] mx-auto px-5 md:px-10 pb-20 pt-6 border-t border-paper/10 flex justify-between hud text-paper/40">
        <span>© 2026 Sumit Bansiya</span>
        <Link href="/#credits" className="hover:text-ember">Contact →</Link>
      </footer>
    </article>
  );
};
