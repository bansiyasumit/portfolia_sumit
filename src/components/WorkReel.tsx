"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import exhibitsData from "@/data/exhibits.json";
import { GanSlider } from "./GanSlider";
import { ProjectVisual, type ProjectVisualVariant } from "./ProjectVisual";
import { SceneHeader } from "./SceneHeader";

type Exhibit = {
  id: string;
  weight: string;
  visual: string;
  title: string;
  institution?: string;
  description: string;
  metrics?: Record<string, string>;
  tags?: string[];
};

const exhibits = exhibitsData.exhibits as unknown as Exhibit[];

/** Visual panel that tilts toward the pointer in 3D. */
const Tilt = ({ children }: { children: React.ReactNode }) => {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 140, damping: 16 });
  const sry = useSpring(ry, { stiffness: 140, damping: 16 });

  return (
    <div className="[perspective:1200px]">
      <motion.div
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
          rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
        }}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

/** One project, framed like a still from the reel. */
const Frame = ({ exhibit, index }: { exhibit: Exhibit; index: number }) => {
  const isHero = exhibit.weight === "hero";
  return (
    <article className="relative h-full w-full rounded-sm border border-paper/10 bg-ink-2/80 backdrop-blur-sm overflow-hidden">
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 md:px-8 py-4 border-b border-paper/10 hud text-paper/40">
        <span>
          <span className="text-ember">Take {String(index + 1).padStart(2, "0")}</span> · {exhibit.id}
        </span>
        <span>{isHero ? "Flagship — M.Tech thesis" : exhibit.institution ?? "Independent build"}</span>
      </div>

      <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 px-5 md:px-8 pt-20 pb-8 lg:pb-10">
        <div className="flex flex-col min-h-0">
          <div className="font-display text-[5.5rem] md:text-[7rem] leading-none text-outline -mb-2 select-none" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </div>
          <h3 className="font-display uppercase text-3xl md:text-[2.6rem] leading-[1.02] text-paper">{exhibit.title}</h3>
          <p className="mt-4 text-paper/60 text-sm md:text-[15px] leading-relaxed line-clamp-6 lg:line-clamp-none">{exhibit.description}</p>

          {exhibit.tags && (
            <div className="flex flex-wrap gap-2 mt-5">
              {exhibit.tags.map((t) => (
                <span key={t} className="hud !text-[9px] text-teal border border-teal/30 rounded-full px-3 py-1.5">
                  {t}
                </span>
              ))}
            </div>
          )}

          <Link
            href={`/work/${exhibit.id}`}
            data-cursor="OPEN"
            className="group mt-5 self-start inline-flex items-center gap-3 text-sm text-paper hover:text-ember transition-colors"
          >
            <span className="w-8 h-8 rounded-full border border-paper/30 group-hover:border-ember flex items-center justify-center text-[10px]">▶</span>
            Watch the full take
          </Link>

          {exhibit.metrics && (
            <dl className="mt-auto pt-6 grid grid-cols-3 gap-px bg-paper/10 border border-paper/10">
              {Object.entries(exhibit.metrics).map(([k, v]) => (
                <div key={k} className="bg-ink-2 p-3">
                  <dt className="hud !text-[9px] text-paper/40">{k}</dt>
                  <dd className="text-paper text-xs md:text-sm font-medium mt-1 leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex flex-col justify-center min-h-0">
          <Tilt>
            {isHero ? (
              <GanSlider />
            ) : (
              <ProjectVisual
                variant={exhibit.visual as ProjectVisualVariant}
                label={`${exhibit.id.replace(/-/g, " ")} // architecture`}
              />
            )}
          </Tilt>
        </div>
      </div>
    </article>
  );
};

/** Desktop: the scene pins and the frames travel sideways like film through a gate. */
const HorizontalReel = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) setDistance(trackRef.current.scrollWidth - window.innerWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(
    () =>
      scrollYProgress.on("change", (v) =>
        setCurrent(Math.min(exhibits.length - 1, Math.round(v * (exhibits.length - 1))))
      ),
    [scrollYProgress]
  );

  return (
    <div ref={sectionRef} style={{ height: `${exhibits.length * 85 + 15}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        <motion.div ref={trackRef} style={{ x }} className="flex gap-8 pl-10 pr-10 will-change-transform">
          {exhibits.map((e, i) => (
            <div key={e.id} className="shrink-0 w-[min(86vw,1180px)] h-[min(76vh,700px)]">
              <Frame exhibit={e} index={i} />
            </div>
          ))}
        </motion.div>

        <div className="absolute bottom-10 left-10 right-10 flex items-center gap-6 hud text-paper/50">
          <span className="tabular-nums text-paper">
            {String(current + 1).padStart(2, "0")} / {String(exhibits.length).padStart(2, "0")}
          </span>
          <div className="flex-1 h-px bg-paper/15 relative">
            <motion.div className="absolute inset-0 bg-ember origin-left" style={{ scaleX: progressScale }} />
          </div>
          <span>Keep scrolling</span>
        </div>
      </div>
    </div>
  );
};

export const WorkReel = () => {
  const [desktop, setDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <section id="work" data-scene="The Work" className="relative pt-28 md:pt-40">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <SceneHeader
          number={3}
          slug="Int. Research lab — night"
          title="The Work"
          intro="Five systems, from synthetic mammograms to agent crews. Each one began as noise and a question."
        />
      </div>

      {desktop ? (
        <HorizontalReel />
      ) : (
        <div className="px-5 md:px-10 flex flex-col gap-6 pb-10">
          {exhibits.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <Frame exhibit={e} index={i} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};
