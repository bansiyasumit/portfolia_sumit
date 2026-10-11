"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowUp, Mic, Volume2, VolumeX } from "lucide-react";
import { FILM_START_EVENT, OPEN_AGENT_EVENT, hasFilmStarted } from "@/lib/film";
import { createRecognizer, speak, stopSpeaking, unlockAudio } from "@/lib/voice";
import { personaState } from "./Persona";

const CityScene = dynamic(() => import("./CityScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center hud text-paper/40">
      <span className="animate-pulse">● Rolling camera…</span>
    </div>
  ),
});

const GREETING =
  "Hey, I'm Sumit. Welcome to my portfolio. I'm an AI researcher at NIT Jalandhar, building generative models for medical imaging. Ask me anything, or scroll down and watch the film.";

const CHIPS = ["What's your thesis about?", "What are you best at?", "Show me your projects"];

type Turn = { role: "user" | "agent"; content: string };

/**
 * Cold open: Sumit's 3D persona walks down a neon street toward the camera,
 * stops, waves and introduces himself — then visitors can ask questions by
 * typing or speaking, and he answers out loud with lip-sync and subtitles.
 */
export const CityWalk = () => {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [play, setPlay] = useState(false);
  const [inView, setInView] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [skipWalk, setSkipWalk] = useState(false);
  const [muted, setMuted] = useState(true);
  const [subtitle, setSubtitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const history = useRef<Turn[]>([]);
  const userMuted = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const { scrollYProgress: raw } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const scroll = useTransform(raw, (v) => v); // plain JS mapping (no native scroll-timeline acceleration)
  const uiOpacity = useTransform(scroll, [0, 0.2], [1, 0]);
  // Crane + fade complete while the scene is still pinned.
  const fade = useTransform(scroll, [0.62, 0.98], [0, 1]);

  useEffect(() => {
    setSkipWalk(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setCanListen(!!createRecognizer());
    const start = () => setPlay(true);
    if (hasFilmStarted()) start();
    window.addEventListener(FILM_START_EVENT, start);
    return () => window.removeEventListener(FILM_START_EVENT, start);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "50px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Leaving the scene silences the persona.
  useEffect(() => {
    if (!inView) {
      abortRef.current?.abort();
      stopSpeaking();
      setSubtitle("");
    }
  }, [inView]);

  const say = useCallback(async (text: string, mode: "talk" | "wave", soundOn: boolean) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    personaState.mode = mode;
    let first = true;
    await speak(text, {
      muted: !soundOn,
      signal: ctrl.signal,
      onSentence: (s) => {
        setSubtitle(s);
        if (!first && mode === "wave") personaState.mode = "talk";
        first = false;
      },
    });
    if (!ctrl.signal.aborted) {
      personaState.mode = "idle";
      setTimeout(() => !ctrl.signal.aborted && setSubtitle(""), 1600);
    }
  }, []);

  const onArrive = useCallback(() => setArrived(true), []);

  // Greet once on arrival. Browsers only allow audio after the visitor has interacted.
  useEffect(() => {
    if (!arrived || greeted) return;
    setGreeted(true);
    const activated = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? false;
    setMuted(!activated);
    if (activated) unlockAudio();
    say(GREETING, "wave", activated);
  }, [arrived, greeted, say]);

  const toggleSound = () => {
    unlockAudio();
    const next = !muted;
    setMuted(next);
    userMuted.current = next;
    if (!next && !busy) say(GREETING, "wave", true);
    if (next) stopSpeaking();
  };

  const runActions = (actions: { type: string; href: string }[] = []) => {
    const nav = actions.find((a) => a.type === "navigate");
    if (!nav) return;
    if (nav.href.endsWith(".pdf")) window.open(nav.href, "_blank");
    else if (nav.href.startsWith("/#")) document.getElementById(nav.href.slice(2))?.scrollIntoView({ behavior: "smooth" });
    else router.push(nav.href);
  };

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    unlockAudio();
    setInput("");
    setBusy(true);
    // Asking him something is an interaction, so he can answer out loud — unless the visitor muted him.
    const soundOn = !userMuted.current;
    if (soundOn) setMuted(false);
    abortRef.current?.abort();
    stopSpeaking();
    setSubtitle(`“${q}”`);
    personaState.mode = "think";
    history.current = [...history.current, { role: "user" as const, content: q }].slice(-8);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "voice", messages: history.current }),
      });
      const data = await res.json();
      const reply: string = data.reply || data.error || "Sorry, I lost my train of thought. Try again?";
      history.current = [...history.current, { role: "agent" as const, content: reply }];
      setBusy(false);
      await say(reply, "talk", soundOn);
      runActions(data.actions);
    } catch {
      setBusy(false);
      await say("I can't reach my brain right now. Please try again in a moment.", "talk", soundOn);
    }
  };

  const listen = () => {
    const rec = createRecognizer();
    if (!rec) return;
    unlockAudio();
    // Speaking to the persona implies sound on.
    setMuted(false);
    stopSpeaking();
    setListening(true);
    setSubtitle("Listening…");
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      setListening(false);
      if (text) ask(text);
    };
    rec.onerror = () => {
      setListening(false);
      setSubtitle("I couldn't hear that — try typing instead.");
    };
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <section id="intro" ref={sectionRef} data-scene="Cold open" className="relative h-[190vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
        <div className="absolute inset-0">
          <CityScene play={play} active={inView} scroll={scroll} skipWalk={skipWalk} onArrive={onArrive} />
        </div>

        {/* Letterbox */}
        <div className="absolute top-0 inset-x-0 h-[7vh] bg-ink z-10 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-[7vh] bg-ink z-10 pointer-events-none" />

        <motion.div className="absolute inset-0 z-20 pointer-events-none" style={{ opacity: uiOpacity }}>
          {/* Slug line */}
          <motion.div
            className="absolute top-[10vh] left-5 md:left-10 hud text-paper/60"
            initial={{ opacity: 0 }}
            animate={play ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 1.2 }}
          >
            Scene 00 · <span className="text-paper/85">Ext. Latent Street — night</span>
          </motion.div>

          {/* Title card while he walks in */}
          <AnimatePresence>
            {play && !arrived && (
              <motion.div
                className="absolute left-5 md:left-10 bottom-[16vh] max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.5 } }}
                transition={{ delay: 1, duration: 1.2 }}
              >
                <div className="hud text-ember mb-3">Now walking in</div>
                <div className="font-display uppercase text-5xl md:text-7xl leading-[0.9]">Sumit Bansiya</div>
                <div className="font-serif italic text-xl md:text-2xl text-paper/70 mt-2">AI researcher · IndiaAI Fellow</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subtitles */}
          <div className="absolute inset-x-0 bottom-[calc(7vh+118px)] md:bottom-[calc(7vh+124px)] flex justify-center px-5">
            <AnimatePresence mode="wait">
              {subtitle && (
                <motion.p
                  key={subtitle}
                  className="max-w-3xl text-center text-base md:text-2xl font-medium leading-snug text-paper bg-ink/55 backdrop-blur-sm px-4 py-2 rounded-sm [text-shadow:0_2px_12px_rgba(0,0,0,0.8)]"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  aria-live="polite"
                >
                  {subtitle}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Controls appear once he has arrived */}
          <AnimatePresence>
            {arrived && (
              <motion.div
                className="absolute inset-x-0 bottom-[calc(7vh+20px)] flex flex-col items-center gap-3 px-4 pointer-events-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask(input);
                  }}
                  className="w-full max-w-xl flex items-center gap-2 bg-ink/70 backdrop-blur-md border border-paper/20 focus-within:border-paper/50 rounded-full pl-5 pr-1.5 py-1.5"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={busy ? "Thinking…" : "Ask me anything…"}
                    disabled={busy}
                    maxLength={500}
                    className="flex-1 bg-transparent outline-none text-paper text-sm md:text-base placeholder:text-paper/40 min-w-0"
                  />
                  {canListen && (
                    <button
                      type="button"
                      onClick={listen}
                      disabled={busy || listening}
                      aria-label="Ask with your voice"
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${listening ? "bg-ember text-ink animate-pulse" : "text-paper/70 hover:text-paper hover:bg-paper/10"}`}
                    >
                      <Mic size={17} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!input.trim() || busy}
                    aria-label="Ask"
                    className="w-9 h-9 rounded-full bg-ember text-ink flex items-center justify-center disabled:opacity-30"
                  >
                    <ArrowUp size={17} />
                  </button>
                </form>
                <div className="flex flex-wrap justify-center gap-2">
                  {CHIPS.map((c) => (
                    <button
                      key={c}
                      onClick={() => ask(c)}
                      disabled={busy}
                      className="text-xs md:text-sm text-paper/80 bg-ink/50 backdrop-blur border border-paper/15 hover:border-ember/60 rounded-full px-3 py-1.5 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sound + full chat + skip */}
          <div className="absolute top-[14vh] md:top-[10vh] right-5 md:right-10 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={toggleSound}
              className={`flex items-center gap-2 hud rounded-full px-3 py-2 border transition-colors ${
                muted && arrived ? "border-ember text-ember animate-pulse" : "border-paper/25 text-paper/70 hover:text-paper"
              }`}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {muted ? "Tap for sound" : "Sound on"}
            </button>
            <button
              onClick={() => window.dispatchEvent(new Event(OPEN_AGENT_EVENT))}
              className="hidden md:flex hud rounded-full px-3 py-2 border border-paper/25 text-paper/70 hover:text-paper"
            >
              Text chat
            </button>
          </div>

          <div className="absolute right-5 md:right-10 bottom-[calc(7vh+20px)] hud text-paper/40 hidden lg:flex flex-col items-center gap-2">
            Scroll to enter the film
            <span className="block w-px h-8 bg-gradient-to-b from-paper/60 to-transparent" />
          </div>
        </motion.div>

        {/* Fade to black into the film */}
        <motion.div className="absolute inset-0 bg-ink z-30 pointer-events-none" style={{ opacity: fade }} />
      </div>
    </section>
  );
};
