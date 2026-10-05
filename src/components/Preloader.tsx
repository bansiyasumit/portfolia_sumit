"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { markFilmStarted } from "@/lib/film";

const SEEN_KEY = "sb-reel-seen";
const COUNT = [3, 2, 1];
const TICK_MS = 650;

/**
 * Opening "film leader": a 3-2-1 countdown with a sweeping clock hand, then the
 * frame splits open like a shutter onto the hero. Plays once per session, can be
 * skipped by clicking, and is bypassed entirely for reduced-motion users.
 */
export const Preloader = () => {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (seen || reduced) {
      setVisible(false);
      markFilmStarted();
      return;
    }

    document.documentElement.style.overflow = "hidden";
    const timers: ReturnType<typeof setTimeout>[] = [];
    COUNT.forEach((_, i) => timers.push(setTimeout(() => setStep(i), i * TICK_MS)));
    timers.push(setTimeout(() => setShowTitle(true), COUNT.length * TICK_MS));
    timers.push(setTimeout(() => setVisible(false), COUNT.length * TICK_MS + 1100));
    return () => timers.forEach(clearTimeout);
  }, []);

  const finish = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence
      onExitComplete={() => {
        document.documentElement.style.overflow = "";
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {}
        markFilmStarted();
      }}
    >
      {visible && (
        <motion.div
          key="leader"
          className="fixed inset-0 z-[200] cursor-pointer select-none"
          onClick={finish}
          exit={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          aria-label="Intro — click to skip"
          role="button"
        >
          {/* Shutter halves: they slide apart on exit to reveal the page */}
          <motion.div
            className="absolute inset-x-0 top-0 bg-ink"
            style={{ height: "calc(50% + 2px)" }}
            exit={{ y: "-100%" }}
            transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-ink"
            style={{ height: "calc(50% + 2px)" }}
            exit={{ y: "100%" }}
            transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
          />

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.45 }}
          >
            {/* Crosshair */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-paper/15" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-paper/15" />

            <AnimatePresence mode="wait">
              {!showTitle ? (
                <motion.div
                  key={`n-${step}`}
                  className="relative w-[min(60vw,320px)] aspect-square rounded-full border border-paper/30 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.08 }}
                >
                  <div className="absolute inset-[8%] rounded-full border border-paper/20" />
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "conic-gradient(from 0deg, rgba(255,107,53,0.35) var(--sweep), transparent var(--sweep))",
                    }}
                    initial={{ "--sweep": "0deg" } as never}
                    animate={{ "--sweep": "360deg" } as never}
                    transition={{ duration: TICK_MS / 1000, ease: "linear" }}
                  />
                  <span className="relative font-display text-[min(36vw,190px)] leading-none text-paper">
                    {COUNT[step]}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="title"
                  className="text-center px-6"
                  initial={{ opacity: 0, letterSpacing: "0.6em" }}
                  animate={{ opacity: 1, letterSpacing: "0.08em" }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="hud text-ember mb-4">A film by</div>
                  <div className="font-display text-5xl md:text-8xl uppercase text-paper">
                    Sumit Bansiya
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-8 left-0 right-0 flex justify-between px-6 md:px-10 hud text-muted">
              <span>SB_REEL // 2026</span>
              <span>Click to skip</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
