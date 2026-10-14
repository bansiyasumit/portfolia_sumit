"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { isRecruiterPath, markFilmStarted, setSoundPreferred } from "@/lib/film";
import { unlockAudio } from "@/lib/voice";
import { setSfxEnabled } from "@/lib/sfx";

const SEEN_KEY = "sb-reel-seen";
const COUNT = [3, 2, 1];
const TICK_MS = 650;

/**
 * Opening "film leader": a 3-2-1 countdown with a sweeping clock hand, then a
 * title card with an "Enter with sound" gate — that click is what lets the
 * trailer audio and the persona's voice play. The frame then splits open like a
 * shutter. Plays once per session; bypassed for reduced-motion users.
 */
export const Preloader = () => {
  const recruiter = isRecruiterPath(usePathname());
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (seen || reduced || recruiter) {
      setVisible(false);
      markFilmStarted();
      return;
    }

    document.documentElement.style.overflow = "hidden";
    const timers: ReturnType<typeof setTimeout>[] = [];
    COUNT.forEach((_, i) => timers.push(setTimeout(() => setStep(i), i * TICK_MS)));
    timers.push(setTimeout(() => setShowTitle(true), COUNT.length * TICK_MS));
    return () => timers.forEach(clearTimeout);
  }, []);

  const enter = (withSound: boolean) => {
    setSoundPreferred(withSound);
    setSfxEnabled(withSound);
    if (withSound) unlockAudio();
    setVisible(false);
  };

  if (recruiter) return null;

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
          data-preloader
          className="fixed inset-0 z-[200] select-none"
          onClick={() => setShowTitle(true)}
          exit={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          aria-label="Intro"
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

            {/* Countdown and title cross-fade in place (no "wait" mode: a stalled exit must never block the Enter button). */}
            <AnimatePresence>
              {!showTitle ? (
                <motion.div
                  key={`n-${step}`}
                  className="absolute w-[min(60vw,320px)] aspect-square rounded-full border border-paper/30 flex items-center justify-center"
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
                  className="absolute text-center px-6"
                  initial={{ opacity: 0, letterSpacing: "0.6em" }}
                  animate={{ opacity: 1, letterSpacing: "0.08em" }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="hud text-ember mb-4">A film by</div>
                  <div className="font-display text-5xl md:text-8xl uppercase text-paper">
                    Sumit Bansiya
                  </div>
                  <motion.div
                    className="mt-10 flex flex-col items-center gap-4"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        enter(true);
                      }}
                      data-cursor="PLAY"
                      className="group inline-flex items-center gap-3 bg-ember text-ink pl-2 pr-6 py-2 rounded-full font-medium hover:bg-paper transition-colors"
                      style={{ letterSpacing: "normal" }}
                    >
                      <span className="w-9 h-9 rounded-full bg-ink text-ember flex items-center justify-center text-xs">▶</span>
                      Enter with sound
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        enter(false);
                      }}
                      className="hud text-paper/50 hover:text-paper transition-colors"
                    >
                      Enter silently
                    </button>
                    <span className="hud text-paper/30 mt-2">Headphones recommended</span>
                    <a href="/recruiter" onClick={(e) => e.stopPropagation()} className="text-sm text-paper/60 hover:text-ember underline underline-offset-4" style={{ letterSpacing: "normal" }}>
                      In a hurry? Recruiter mode →
                    </a>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-8 left-0 right-0 flex justify-between px-6 md:px-10 hud text-muted">
              <span>SB_REEL // 2026</span>
              <span>{showTitle ? "Rated AI for Awesome" : "Click to skip"}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
