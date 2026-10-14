"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import profileData from "@/data/profile.json";
import voiceLines from "@/data/voiceLines.json";
import { playClip, preloadClips, stopSpeaking } from "@/lib/voice";
import { soundPreferred } from "@/lib/film";
import { personaState } from "../city/Persona";

const PostCreditsScene = dynamic(() => import("./PostCreditsScene"), { ssr: false });

const SEEN_KEY = "sb-post-credits";
const DWELL_MS = 2200;
type Stage = "off" | "card" | "scene" | "return";

/**
 * Marvel-style stinger: linger at the very end of the film and the screen cuts
 * to black, Sumit steps into a spotlight and delivers one last line. Plays once
 * per session; Esc or the close button dismisses it.
 */
export const PostCredits = () => {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>("off");
  const [subtitle, setSubtitle] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(([entry]) => {
      let seen = false;
      try {
        seen = sessionStorage.getItem(SEEN_KEY) === "1";
      } catch {}
      if (entry.isIntersecting && !seen) {
        preloadClips(["/voice/post-credits.wav"]);
        // Only if they actually stay at the end — a fast scroll past doesn't trigger it.
        timer = setTimeout(() => {
          try {
            sessionStorage.setItem(SEEN_KEY, "1");
          } catch {}
          setStage("card");
        }, DWELL_MS);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Stage timeline: title card → the scene + line → "will return".
  useEffect(() => {
    if (stage === "card") {
      document.documentElement.style.overflow = "hidden";
      const t = setTimeout(() => setStage("scene"), 1800);
      return () => clearTimeout(t);
    }
    if (stage === "scene") {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const line = voiceLines["post-credits"];
      const t = setTimeout(async () => {
        await playClip("/voice/post-credits.wav", line.text, {
          muted: !soundPreferred(),
          signal: ctrl.signal,
          onStart: () => (personaState.mode = "talk"),
          onSentence: setSubtitle,
        });
        if (ctrl.signal.aborted) return;
        personaState.mode = "idle";
        setSubtitle("");
        setTimeout(() => !ctrl.signal.aborted && setStage("return"), 600);
      }, 1600);
      return () => {
        clearTimeout(t);
        ctrl.abort();
      };
    }
  }, [stage]);

  const close = () => {
    abortRef.current?.abort();
    stopSpeaking();
    setSubtitle("");
    setStage("off");
    document.documentElement.style.overflow = "";
  };

  useEffect(() => {
    if (stage === "off") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  return (
    <>
      <div ref={sentinel} className="h-px w-full" aria-hidden="true" />
      <AnimatePresence>
        {stage !== "off" && (
          <motion.div
            data-lenis-prevent
            className="fixed inset-0 z-[160] bg-[#030304]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            role="dialog"
            aria-label="Post-credits scene"
          >
            {(stage === "scene" || stage === "return") && (
              <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: stage === "return" ? 0.16 : 1 }} transition={{ duration: 1.6 }}>
                <PostCreditsScene />
              </motion.div>
            )}

            <div className="absolute top-0 inset-x-0 h-[11vh] bg-black" />
            <div className="absolute bottom-0 inset-x-0 h-[11vh] bg-black" />

            <AnimatePresence>
              {stage === "card" && (
                <motion.div
                  key="card"
                  className="absolute inset-0 flex items-center justify-center hud text-paper/70 !text-xs md:!text-sm"
                  initial={{ opacity: 0, letterSpacing: "0.8em" }}
                  animate={{ opacity: 1, letterSpacing: "0.4em" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                >
                  Post-credits scene
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-x-0 bottom-[14vh] flex justify-center px-5">
              <AnimatePresence mode="wait">
                {subtitle && (
                  <motion.p
                    key={subtitle}
                    className="max-w-2xl text-center text-lg md:text-2xl font-medium text-paper bg-ink/60 px-4 py-2 rounded-sm"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {subtitle}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {stage === "return" && (
                <motion.div
                  key="return"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.4 }}
                >
                  <div className="font-display uppercase text-[11vw] md:text-[6.5rem] leading-[0.9] text-paper">
                    Sumit Bansiya
                    <br />
                    <span className="text-ember">will return</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a href={`mailto:${profileData.profile.contact.email}`} className="bg-ember text-ink rounded-full px-6 py-3 font-medium hover:bg-paper transition-colors">
                      Email me
                    </a>
                    <button
                      onClick={() => {
                        close();
                        window.scrollTo({ top: 0 });
                      }}
                      className="rounded-full px-6 py-3 border border-paper/25 text-paper/80 hover:text-paper"
                    >
                      Back to the top
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={close} className="absolute top-[13vh] right-5 md:right-10 hud text-paper/60 hover:text-paper border border-paper/20 rounded-full px-3 py-2">
              Close ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
