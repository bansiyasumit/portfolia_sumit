"use client";

import { GraduationCap, Layers, Award } from "lucide-react";
import profileData from "../data/profile.json";
import { Timeline } from "./Timeline";
import { LibrarySearch } from "./LibrarySearch";
import { Reveal, RevealStagger, RevealItem } from "./Reveal";

const CATEGORY_COLORS = ["#00f3ff", "#7000ff", "#ff00ff", "#00f3ff", "#7000ff", "#ff00ff"];

export const AboutSection = () => {
  const { about, achievements } = profileData as any;

  const timelineItems = [
    ...about.education.map((e: any) => ({
      year: e.period,
      title: e.degree,
      role: e.institution,
      description: e.detail,
    })),
    ...about.experience.map((e: any) => ({
      year: e.period,
      title: e.role,
      role: e.org,
      description: e.description,
      impact: e.impact,
    })),
  ];

  const skillEntries = Object.entries(about.skills) as [string, string[]][];

  return (
    <section id="about" className="scroll-mt-24 relative">
      <Reveal>
        <div className="flex items-center gap-4 mb-3">
          <span className="font-orbitron text-[#7000ff] text-xs tracking-[0.3em] uppercase">Chapter 01</span>
          <div className="h-px flex-1 bg-gradient-to-r from-[#7000ff]/40 to-transparent" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black font-orbitron mb-8 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600 uppercase tracking-tighter">
          About
        </h2>
      </Reveal>

      <Reveal delay={0.1} className="mb-10">
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-3xl font-inter border-l-2 border-[#7000ff]/40 pl-6">
          {about.summary}
        </p>
      </Reveal>

      {achievements?.length > 0 && (
        <Reveal delay={0.12} className="mb-16">
          <div className="grid grid-cols-1 gap-4">
            {achievements.map((a: any) => (
              <div
                key={a.title}
                className="glass-panel rounded-lg p-6 flex items-start gap-4 border border-[#ff00ff]/30 shadow-[0_0_30px_rgba(255,0,255,0.08)]"
              >
                <div className="shrink-0 w-11 h-11 rounded-full border border-[#ff00ff]/40 flex items-center justify-center bg-[#ff00ff]/5">
                  <Award size={20} className="text-[#ff00ff]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                    <h3 className="font-orbitron text-base uppercase tracking-widest text-white">
                      {a.title}
                    </h3>
                    <span className="text-xs font-orbitron uppercase tracking-widest text-[#ff00ff]">
                      {a.org}
                    </span>
                  </div>
                  <p className="text-gray-400 font-inter text-sm leading-relaxed">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal delay={0.15} className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Layers size={18} className="text-[#00f3ff]" />
          <h3 className="font-orbitron text-sm uppercase tracking-widest text-white">Skill Matrix</h3>
        </div>
        <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillEntries.map(([category, skills], i) => {
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            return (
              <RevealItem key={category}>
                <div
                  className="glass-panel rounded-lg p-5 h-full border-t-2"
                  style={{ borderTopColor: color }}
                >
                  <h4
                    className="font-orbitron text-xs uppercase tracking-widest mb-3"
                    style={{ color }}
                  >
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-inter text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealStagger>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <Reveal>
            <div className="flex items-center gap-2 mb-6">
              <GraduationCap size={18} className="text-[#ff00ff]" />
              <h3 className="font-orbitron text-sm uppercase tracking-widest text-white">
                Education &amp; Experience
              </h3>
            </div>
          </Reveal>
          <Timeline items={timelineItems} />
        </div>

        <Reveal delay={0.1}>
          <div className="glass-panel p-6 rounded-lg h-fit border-l-4 border-l-[#7000ff] lg:sticky lg:top-28">
            <h3 className="text-xl font-orbitron font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7000ff] animate-pulse"></span>
              Digital Library
            </h3>
            <LibrarySearch />
          </div>
        </Reveal>
      </div>
    </section>
  );
};
