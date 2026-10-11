"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowUp, Mic, Square, Volume2, VolumeX } from "lucide-react";
import { FILM_START_EVENT, OPEN_AGENT_EVENT, hasFilmStarted, setSoundPreferred, soundPreferred } from "@/lib/film";
import { canRecord, playClip, recordSpeech, speak, stopSpeaking, transcribe, unlockAudio } from "@/lib/voice";
import { braam, hit, impact, riser, setSfxEnabled, whoosh } from "@/lib/sfx";
import voiceLines from "@/data/voiceLines.json";
import { personaState } from "./Persona";

const CityScene = dynamic(() => import("./CityScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center hud text-paper/40">
      <span className="animate-pulse">● Rolling camera…</span>
    </div>
  ),
});

const CHIPS = ["What's your thesis about?", "What are you best at?", "Show me your projects"];

type Turn = { role: "user" | "agent"; content: string };
type Card = { key: string; text: string; kind: "title" | "card" };

/**
 * Cold open, trailer-style: a narrator sets the scene, a comet falls on the
 * street, Sumit's persona lands superhero-style, rises with glowing eyes and
 * walks to camera between title-card slams — then greets the visitor, who can
 * talk to him by voice (Whisper) or text and hear him answer.
 */
export const CityWalk = () => {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [play, setPlay] = useState(false);
  const [inView, setInView] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [skip, setSkip] = useState(0);
  const [muted, setMuted] = useState(true);
  const [narration, setNarration] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [card, setCard] = useState<Card | null>(null);
  const [flash, setFlash] = useState(0);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [canListen, setCanListen] = useState(false);
  const history = useRef<Turn[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const userMuted = useRef(false);
  const recorderRef = useRef<{ stop: () => void } | null>(null);
  const mutedRef = useRef(true);
  mutedRef.current = muted;

  const { scrollYProgress: raw } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const scroll = useTransform(raw, (v) => v); // plain JS mapping (no native scroll-timeline acceleration)
  const uiOpacity = useTransform(scroll, [0, 0.2], [1, 0]);
  const fade = useTransform(scroll, [0.62, 0.98], [0, 1]);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setCanListen(canRecord());
    const start = () => {
      const withSound = soundPreferred();
      setMuted(!withSound);
      setSfxEnabled(withSound);
      setPlay(true);
    };
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
      recorderRef.current?.stop();
      stopSpeaking();
      setSubtitle("");
    }
  }, [inView]);

  const newSignal = () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    return ctrl;
  };

  const finishTalking = (ctrl: AbortController) => {
    if (ctrl.signal.aborted) return;
    personaState.mode = "idle";
    setTimeout(() => !ctrl.signal.aborted && setSubtitle(""), 1600);
  };

  const greet = useCallback(async () => {
    const ctrl = newSignal();
    personaState.mode = "wave";
    let first = true;
    await playClip("/voice/greeting.wav", voiceLines.greeting.text, {
      muted: mutedRef.current,
      signal: ctrl.signal,
      onSentence: (s) => {
        setSubtitle(s);
        if (!first) personaState.mode = "talk";
        first = false;
      },
    });
    finishTalking(ctrl);
  }, []);

  const showCard = (c: Card, ms: number) => {
    setCard(c);
    setTimeout(() => setCard((cur) => (cur?.key === c.key ? null : cur)), ms);
  };

  const narrate = (key: "vo-world" | "vo-one") => {
    const line = voiceLines[key];
    setNarration(line.text);
    playClip(`/voice/${key}.wav`, line.text, { muted: mutedRef.current, narrator: true }).then(() =>
      setTimeout(() => setNarration((n) => (n === line.text ? "" : n)), 500)
    );
  };

  // Trailer beats fired by the 3D director.
  const onBeat = useCallback(
    (beat: string) => {
      switch (beat) {
        case "vo1":
          narrate("vo-world");
          break;
        case "vo2":
          narrate("vo-one");
          break;
        case "riser":
          riser(2.3);
          break;
        case "whoosh":
          whoosh(0.8);
          break;
        case "impact":
          impact();
          setFlash((f) => f + 1);
          break;
        case "braam":
          braam(3);
          break;
        case "title":
          showCard({ key: "title", text: "Sumit Bansiya", kind: "title" }, 1500);
          break;
        case "card1":
          hit();
          showCard({ key: "c1", text: "AI Researcher", kind: "card" }, 950);
          break;
        case "card2":
          hit();
          showCard({ key: "c2", text: "IndiaAI Fellow", kind: "card" }, 1100);
          break;
        case "arrive":
          setNarration("");
          setArrived(true);
          greet();
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [greet]
  );

  const toggleSound = () => {
    unlockAudio();
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    userMuted.current = next;
    setSoundPreferred(!next);
    setSfxEnabled(!next);
    if (next) stopSpeaking();
    else if (arrived && !busy) greet();
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
    // Asking him something is an interaction, so he answers out loud — unless the visitor muted him.
    const soundOn = !userMuted.current;
    if (soundOn) {
      setMuted(false);
      mutedRef.current = false;
    }
    setInput("");
    setBusy(true);
    const ctrl = newSignal();
    stopSpeaking();
    setSubtitle(`“${q}”`);
    personaState.mode = "think";
    history.current = [...history.current, { role: "user" as const, content: q }].slice(-8);

    let reply = "";
    let actions: { type: string; href: string }[] = [];
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "voice", messages: history.current }),
      });
      const data = await res.json();
      reply = data.reply || data.error || "Sorry, I lost my train of thought. Try again?";
      actions = data.actions ?? [];
    } catch {
      reply = "I can't reach my brain right now. Please try again in a moment.";
    }
    history.current = [...history.current, { role: "agent" as const, content: reply }];
    setBusy(false);
    if (ctrl.signal.aborted) return;
    personaState.mode = "talk";
    await speak(reply, { muted: !soundOn, signal: ctrl.signal, onSentence: setSubtitle });
    finishTalking(ctrl);
    runActions(actions);
  };

  const listen = async () => {
    if (listening) {
      recorderRef.current?.stop();
      return;
    }
    unlockAudio();
    abortRef.current?.abort();
    stopSpeaking();
    userMuted.current = false; // speaking to him implies wanting to hear him
    setListening(true);
    setSubtitle("Listening… speak now");
    personaState.mode = "idle";
    try {
      const rec = recordSpeech({ onLevel: setMicLevel });
      recorderRef.current = rec;
      const audio = await rec.promise;
      setListening(false);
      setMicLevel(0);
      if (!audio) {
        setSubtitle("I didn't catch that — tap the mic and try again.");
        return;
      }
      setSubtitle("Transcribing…");
      const text = await transcribe(audio);
      if (text) ask(text);
      else setSubtitle("I didn't catch that — tap the mic and try again.");
    } catch (err) {
      setListening(false);
      setMicLevel(0);
      const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setSubtitle(denied ? "Microphone access is blocked — allow it in the address bar, or type instead." : "Voice input failed — try typing instead.");
    } finally {
      recorderRef.current = null;
    }
  };

  const trailerRunning = play && !arrived;

  return (
    <section id="intro" ref={sectionRef} data-scene="Cold open" className="relative h-[190vh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
        <div className="absolute inset-0">
          <CityScene play={play} active={inView} scroll={scroll} skip={skip} reduced={reduced} onBeat={onBeat} />
        </div>

        {/* Impact flash */}
        <AnimatePresence>
          {flash > 0 && (
            <motion.div
              key={flash}
              className="absolute inset-0 z-[15] bg-[#e9fffd] pointer-events-none mix-blend-screen"
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* Letterbox: wide 2.39:1 during the trailer, opens up when he arrives */}
        <motion.div className="absolute top-0 inset-x-0 bg-ink z-10 pointer-events-none" animate={{ height: trailerRunning ? "12vh" : "7vh" }} transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }} />
        <motion.div className="absolute bottom-0 inset-x-0 bg-ink z-10 pointer-events-none" animate={{ height: trailerRunning ? "12vh" : "7vh" }} transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }} />

        <motion.div className="absolute inset-0 z-20 pointer-events-none" style={{ opacity: uiOpacity }}>
          {/* Slug line */}
          <motion.div
            className="absolute top-[13vh] left-5 md:left-10 hud text-paper/60"
            initial={{ opacity: 0 }}
            animate={play ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 1.2 }}
          >
            Scene 00 · <span className="text-paper/85">Ext. Latent Street — night</span>
          </motion.div>

          {/* Narrator */}
          <div className="absolute inset-x-0 top-[38%] flex justify-center px-6">
            <AnimatePresence mode="wait">
              {narration && (
                <motion.p
                  key={narration}
                  className="font-serif italic text-center text-3xl md:text-6xl text-paper/90 max-w-4xl [text-shadow:0_4px_30px_rgba(0,0,0,0.9)]"
                  initial={{ opacity: 0, filter: "blur(8px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(6px)" }}
                  transition={{ duration: 0.8 }}
                >
                  {narration}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Title-card slams */}
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <AnimatePresence>
              {card && (
                <motion.div
                  key={card.key}
                  className="text-center"
                  initial={{ opacity: 0, scale: card.kind === "title" ? 1.6 : 1.25, letterSpacing: "0.4em" }}
                  animate={{ opacity: 1, scale: 1, letterSpacing: card.kind === "title" ? "0.02em" : "0.12em" }}
                  exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                  transition={{ duration: card.kind === "title" ? 0.55 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {card.kind === "title" ? (
                    <div className="font-display uppercase leading-none text-[16vw] md:text-[10vw] text-transparent bg-clip-text bg-gradient-to-b from-[#fff8ee] via-[#d9d3c7] to-[#7d776c] [filter:drop-shadow(0_0_30px_rgba(62,230,217,0.45))]">
                      {card.text}
                    </div>
                  ) : (
                    <div className="font-display uppercase text-5xl md:text-8xl text-paper [text-shadow:0_0_40px_rgba(255,107,53,0.6)]">{card.text}</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

          {/* Controls once he has arrived */}
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
                    placeholder={busy ? "Thinking…" : listening ? "Listening…" : "Ask me anything…"}
                    disabled={busy || listening}
                    maxLength={500}
                    className="flex-1 bg-transparent outline-none text-paper text-sm md:text-base placeholder:text-paper/40 min-w-0"
                  />
                  {canListen && (
                    <button
                      type="button"
                      onClick={listen}
                      disabled={busy}
                      aria-label={listening ? "Stop listening" : "Ask with your voice"}
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        listening ? "bg-ember text-ink" : "text-paper/70 hover:text-paper hover:bg-paper/10"
                      }`}
                    >
                      {listening && (
                        <span
                          className="absolute inset-0 rounded-full border-2 border-ember"
                          style={{ transform: `scale(${1 + micLevel * 0.9})`, opacity: 0.4 + micLevel * 0.6 }}
                        />
                      )}
                      {listening ? <Square size={13} fill="currentColor" /> : <Mic size={17} />}
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

          {/* Sound, text chat, skip */}
          <div className="absolute top-[17vh] md:top-[13vh] right-5 md:right-10 flex items-center gap-2 pointer-events-auto">
            {trailerRunning && (
              <button
                onClick={() => {
                  stopSpeaking();
                  setNarration("");
                  setCard(null);
                  setSkip((s) => s + 1);
                }}
                className="hud rounded-full px-3 py-2 border border-paper/25 text-paper/70 hover:text-paper"
              >
                Skip intro ⏭
              </button>
            )}
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
