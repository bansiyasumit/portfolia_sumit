"use client";

import exhibitsData from "../data/exhibits.json";
import { ExhibitCard } from "./ExhibitCard";
import { GanSlider } from "./GanSlider";
import { ProjectVisual, ProjectVisualVariant } from "./ProjectVisual";
import { Reveal } from "./Reveal";

interface Exhibit {
  id: string;
  weight: string;
  visual: string;
  title: string;
  institution?: string;
  description: string;
  metrics?: Record<string, string>;
  tags?: string[];
  tech_stack?: string[];
  deployment?: string;
  role?: string;
}

export const ProjectsSection = () => {
  const exhibits = exhibitsData.exhibits as unknown as Exhibit[];
  const hero = exhibits.find((e) => e.weight === "hero");
  const rest = exhibits.filter((e) => e.weight !== "hero");

  return (
    <section id="projects" className="scroll-mt-24 relative">
      <Reveal>
        <div className="flex items-center gap-4 mb-3">
          <span className="font-orbitron text-[#00f3ff] text-xs tracking-[0.3em] uppercase">Chapter 02</span>
          <div className="h-px flex-1 bg-gradient-to-r from-[#00f3ff]/40 to-transparent" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black font-orbitron mb-12 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600 uppercase tracking-tighter">
          Projects
        </h2>
      </Reveal>

      {hero && (
        <Reveal delay={0.1} className="mb-16 relative">
          <div className="absolute -left-6 top-0 w-1 h-full bg-gradient-to-b from-[#00f3ff] via-[#7000ff] to-transparent hidden md:block" />
          <span className="font-orbitron text-[10px] tracking-[0.3em] uppercase text-[#ff00ff] mb-3 block pl-1">
            Flagship Research — M.Tech Thesis
          </span>
          <ExhibitCard {...hero} defaultExpanded>
            <GanSlider />
          </ExhibitCard>
        </Reveal>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {rest.map((project, i) => (
          <Reveal key={project.id} delay={i * 0.06} amount={0.1}>
            <ExhibitCard {...project}>
              {project.visual && (
                <ProjectVisual
                  variant={project.visual as ProjectVisualVariant}
                  label={`${project.id.replace(/-/g, " ")} // architecture`}
                />
              )}
            </ExhibitCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
