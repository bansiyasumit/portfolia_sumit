"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const SECTIONS = [
  { id: "home", label: "Init", color: "#00f3ff" },
  { id: "about", label: "About", color: "#7000ff" },
  { id: "projects", label: "Projects", color: "#ff00ff" },
  { id: "agent", label: "Agent", color: "#00f3ff" },
  { id: "contact", label: "Contact", color: "#7000ff" },
];

/**
 * Fixed left-hand progress rail. Fills as the user scrolls through the page
 * and highlights whichever chapter (section) is currently in view — a small
 * persistent cue that this is one continuous story, not disconnected blocks.
 */
export const ScrollRail = () => {
  const { scrollYProgress } = useScroll();
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const activeColor = SECTIONS.find((s) => s.id === active)?.color ?? "#00f3ff";

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:block h-[46vh] w-4">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-px bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-px"
          style={{ height, background: activeColor, boxShadow: `0 0 10px ${activeColor}` }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col justify-between items-center">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="group relative flex items-center justify-center w-4 h-4"
              aria-label={s.label}
            >
              <span
                className="block w-2 h-2 rounded-full border transition-all duration-300"
                style={{
                  borderColor: isActive ? activeColor : "rgba(255,255,255,0.25)",
                  background: isActive ? activeColor : "transparent",
                  boxShadow: isActive ? `0 0 8px ${activeColor}` : "none",
                  transform: isActive ? "scale(1.5)" : "scale(1)",
                }}
              />
              <span className="absolute left-5 whitespace-nowrap font-orbitron text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-300">
                {s.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
