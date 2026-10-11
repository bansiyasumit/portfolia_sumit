"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import profileData from "@/data/profile.json";
import { FILM_START_EVENT, OPEN_AGENT_EVENT, hasFilmStarted } from "@/lib/film";

const PortraitParticles = dynamic(() => import("./PortraitParticles"), { ssr: false });

const ease = [0.16, 1, 0.3, 1] as const;

/** A line of type that rises out of a mask — the title-card reveal. */
const MaskLine = ({ children, delay, play, className }: { children: React.ReactNode; delay: number; play: boolean; className?: string }) => (
  <span className="block overflow-hidden pb-[0.06em]">
    <motion.span
      className={`block ${className ?? ""}`}
      initial={{ y: "110%" }}
      animate={play ? { y: "0%" } : { y: "110%" }}
      transition={{ duration: 1.2, delay, ease }}
    >
      {children}
    </motion.span>
  </span>
);

export const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [filmStarted, setFilmStarted] = useState(false);
  const [inView, setInView] = useState(false);
  const [play, setPlay] = useState(false);
  const [particleCount, setParticleCount] = useState<number | null>(null);
  const achievement = profileData.achievements?.[0];

  const { scrollYProgress: rawProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  // A function mapping opts out of Framer's native ScrollTimeline acceleration,
  // which mis-maps opacity/filter ranges for this pinned section.
  const scrollYProgress = useTransform(rawProgress, (v) => v);
  const scatter = useTransform(scrollYProgress, [0.08, 0.9], [0, 1]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.28], [0, -80]);
  const titleBlur = useTransform(scrollYProgress, [0, 0.28], ["blur(0px)", "blur(8px)"]);
  const lineOpacity = useTransform(scrollYProgress, [0.32, 0.45, 0.72, 0.86], [0, 1, 1, 0]);
  const lineScale = useTransform(scrollYProgress, [0.32, 0.86], [0.92, 1.08]);
  const barHeight = useTransform(scrollYProgress, [0, 0.3], ["0vh", "9vh"]);

  useEffect(() => {
    const start = () => setFilmStarted(true);
    if (hasFilmStarted()) start();
    window.addEventListener(FILM_START_EVENT, start);
    return () => window.removeEventListener(FILM_START_EVENT, start);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "100px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The title card plays the first time the hero comes into view after the intro.
  useEffect(() => {
    if (filmStarted && inView) setPlay(true);
  }, [filmStarted, inView]);

  return (
    <section id="home" data-scene="Opening" ref={sectionRef} className="relative h-[260vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Ambient glow behind the portrait */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-[-10%] top-[10%] w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] rounded-full bg-ember/10 blur-[140px]" />
          <div className="absolute left-[-15%] bottom-[-20%] w-[50vw] h-[50vw] rounded-full bg-teal/10 blur-[140px]" />
        </div>

        <PortraitParticles scatter={scatter} active={inView} onReady={setParticleCount} />

        {/* Letterbox bars close in as the scene ends */}
        <motion.div className="absolute top-0 inset-x-0 bg-ink z-20" style={{ height: barHeight }} />
        <motion.div className="absolute bottom-0 inset-x-0 bg-ink z-20" style={{ height: barHeight }} />

        <motion.div
          className="absolute inset-0 z-10 flex items-end md:items-center px-5 md:px-10 pb-24 md:pb-0 md:pt-16"
          style={{ opacity: titleOpacity, y: titleY, filter: titleBlur }}
        >
          <div className="max-w-[1400px] w-full mx-auto">
            {/* Screenplay slug line */}
            <motion.div
              className="hud text-paper/50 mb-4 md:mb-6"
              initial={{ opacity: 0 }}
              animate={play ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 1 }}
            >
              Scene 01 · <span className="text-paper/80">Ext. Latent space — night</span>
            </motion.div>
            <h1 className="font-display uppercase leading-[0.86] tracking-tight text-[22vw] md:text-[length:min(12vw,21vh)] xl:text-[length:min(11rem,21vh)]">
              <MaskLine delay={0.3} play={play}>Sumit</MaskLine>
              <MaskLine delay={0.42} play={play} className="text-outline">
                Bansiya
              </MaskLine>
            </h1>

            <motion.p
              className="font-serif italic text-3xl md:text-5xl text-paper/90 mt-3 md:mt-5"
              initial={{ opacity: 0, y: 20 }}
              animate={play ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.9, duration: 1, ease }}
            >
              turns <span className="text-teal">noise</span> into <span className="text-ember">signal.</span>
            </motion.p>

            <motion.div
              className="mt-6 md:mt-8 flex flex-col gap-6 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={play ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.15, duration: 1, ease }}
            >
              <p className="text-paper/60 text-sm md:text-base leading-relaxed">
                AI Researcher in Computer Vision &amp; Generative AI — M.Tech, NIT Jalandhar.
                {achievement && (
                  <>
                    {" "}
                    <span className="text-gold">{achievement.title}</span>, {achievement.org}.
                  </>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#work"
                  data-cursor="PLAY"
                  className="group inline-flex items-center gap-3 bg-ember text-ink pl-2 pr-5 py-2 rounded-full font-medium text-sm hover:bg-paper transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-ink text-ember flex items-center justify-center text-[10px]">▶</span>
                  Watch the work
                </a>
                <button
                  onClick={() => window.dispatchEvent(new Event(OPEN_AGENT_EVENT))}
                  className="px-5 py-3 rounded-full border border-paper/25 text-sm text-paper/90 hover:border-paper hover:bg-paper/5 transition-colors"
                >
                  Interview my AI twin
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Mid-scene line that appears while the portrait dissolves */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center px-6 pointer-events-none"
          style={{ opacity: lineOpacity, scale: lineScale }}
        >
          <p className="font-serif italic text-center text-4xl md:text-7xl leading-tight max-w-4xl">
            Everything I build <br className="hidden md:block" />
            starts as <span className="text-teal">noise</span>.
          </p>
        </motion.div>

        {/* Figure caption + scroll cue */}
        <motion.div
          className="absolute bottom-14 md:bottom-12 right-5 md:right-10 z-10 hud text-paper/40 text-right hidden sm:block"
          style={{ opacity: titleOpacity }}
        >
          fig. 01 — portrait sampled from
          <br />
          {particleCount ? particleCount.toLocaleString("en-US") : "—"} particles of gaussian noise
        </motion.div>
        <motion.div
          className="absolute bottom-14 md:bottom-12 left-1/2 -translate-x-1/2 z-10 hud text-paper/50 hidden md:flex flex-col items-center gap-3"
          style={{ opacity: titleOpacity }}
        >
          Scroll to begin
          <span className="block w-px h-10 bg-gradient-to-b from-paper/60 to-transparent" />
        </motion.div>

        {/* No-WebGL / pre-hydration fallback portrait is the real photo, kept for SEO + a11y */}
        <noscript>
          <Image src="/sumit_portrait.webp" alt="Sumit Bansiya" width={480} height={480} className="absolute right-10 top-1/4 opacity-80" />
        </noscript>
      </div>
    </section>
  );
};
