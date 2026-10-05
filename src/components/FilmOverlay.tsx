"use client";

import { useEffect, useRef, useState } from "react";
import { SCENES, toTimecode } from "@/lib/film";

/** Total "runtime" the page maps onto, so the timecode reads like a real reel. */
const RUNTIME_SECONDS = 4 * 60 + 12;

/**
 * Persistent camera-viewfinder layer: film grain, vignette, a scroll-driven
 * timecode, the current scene slate, and a thin playhead along the bottom.
 * Timecode and playhead are written straight to the DOM each frame to avoid
 * re-rendering React on every scroll tick.
 */
export const FilmOverlay = () => {
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (timecodeRef.current) timecodeRef.current.textContent = toTimecode(p * RUNTIME_SECONDS);
      if (playheadRef.current) playheadRef.current.style.transform = `scaleX(${p})`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = SCENES.findIndex((s) => s.id === entry.target.id);
          if (idx >= 0) setScene(idx);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    SCENES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className="film-grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <div className="fixed bottom-5 left-5 md:left-8 z-[85] pointer-events-none hud text-paper/60 flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-ember" style={{ animation: "rec-blink 1.4s infinite" }} />
        <span ref={timecodeRef} className="tabular-nums">00:00:00:00</span>
        <span className="hidden sm:inline text-paper/30">|</span>
        <span className="hidden sm:inline">
          SC {String(scene + 1).padStart(2, "0")} — {SCENES[scene].label}
        </span>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-px z-[85] bg-paper/10 pointer-events-none">
        <div ref={playheadRef} className="h-full bg-ember origin-left" style={{ transform: "scaleX(0)" }} />
      </div>
    </>
  );
};
