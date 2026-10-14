"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Download, RotateCcw } from "lucide-react";
import { SceneHeader } from "../SceneHeader";
import { sampleFrame, type MirrorData } from "./MirrorParticles";

const MirrorParticles = dynamic(() => import("./MirrorParticles"), { ssr: false });

type Phase = "idle" | "asking" | "framing" | "sampling" | "done" | "error";
const CAPTURE = 640;

/**
 * "Your turn": one frame from the visitor's camera is rebuilt from Gaussian noise
 * as particles — the same process as Sumit's hero portrait. Runs entirely in the
 * browser; the camera stops the moment the frame is taken and nothing is uploaded.
 */
export const MirrorSection = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [count, setCount] = useState(3);
  const [data, setData] = useState<MirrorData | null>(null);
  const [step, setStep] = useState(1000);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const takeRef = useRef<(() => string) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };
  useEffect(() => stopCamera, []);

  const capture = () => {
    if (!streamRef.current) return; // cancelled
    const video = videoRef.current;
    // Camera not delivering frames yet — try again shortly instead of giving up.
    if (!video || !video.videoWidth) {
      setTimeout(capture, 150);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    // Centre square crop, mirrored like a selfie.
    const side = Math.min(video.videoWidth, video.videoHeight);
    const c = document.createElement("canvas");
    c.width = c.height = CAPTURE;
    const ctx = c.getContext("2d")!;
    ctx.translate(CAPTURE, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side, 0, 0, CAPTURE, CAPTURE);
    stopCamera();
    setData(sampleFrame(c, window.innerWidth < 768 ? 120 : 160));
    setStep(1000);
    setPhase("sampling");
  };

  const start = async () => {
    setError("");
    setPhase("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      setCount(3);
      setPhase("framing"); // the effect below attaches the stream once the <video> exists
      boxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {
      stopCamera();
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Camera access was blocked. Allow it from the camera icon in your address bar, then try again."
          : name === "NotFoundError"
            ? "No camera found on this device."
            : "The camera couldn't start. Close other apps using it and try again."
      );
      setPhase("error");
    }
  };

  // Attach the stream after the <video> has rendered, then count down once frames arrive.
  useEffect(() => {
    if (phase !== "framing") return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {});
    const begin = () => {
      let n = 3;
      setCount(n);
      timerRef.current = setInterval(() => {
        n -= 1;
        setCount(n);
        if (n <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          capture();
        }
      }, 1000);
    };
    if (video.readyState >= 2) begin();
    else video.addEventListener("loadeddata", begin, { once: true });
    return () => {
      video.removeEventListener("loadeddata", begin);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const onStep = (k: number) => {
    const t = Math.round((1 - k) * 1000);
    setStep((prev) => (prev === t ? prev : t));
    if (k >= 1) setPhase((p) => (p === "sampling" ? "done" : p));
  };

  const save = async () => {
    const shot = takeRef.current?.();
    if (!shot) return;
    const img = new Image();
    img.src = shot;
    await img.decode();
    const W = 1080, H = 1350;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    const side = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 40, 150, W - 80, W - 80);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff6b35";
    ctx.font = "24px 'JetBrains Mono', monospace";
    ctx.fillText("FIG. 02 — SAMPLED FROM GAUSSIAN NOISE", W / 2, 90);
    ctx.fillStyle = "#ece8e1";
    ctx.font = "italic 54px 'Instrument Serif', Georgia, serif";
    ctx.fillText("Everything starts as noise.", W / 2, H - 120);
    ctx.fillStyle = "rgba(236,232,225,0.5)";
    ctx.font = "22px 'JetBrains Mono', monospace";
    ctx.fillText("portfolia-sumit.vercel.app", W / 2, H - 60);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "sampled-from-noise.png";
    a.click();
  };

  const reset = () => {
    stopCamera();
    setData(null);
    setPhase("idle");
  };

  return (
    <section id="mirror" data-scene="The Mirror" className="relative py-28 md:py-36">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <SceneHeader
          number={2}
          slug="Int. Mirror room — now"
          title="Your"
          accent="turn."
          intro="My research turns noise into images. Let it see you: one frame from your camera, rebuilt from thousands of particles of Gaussian noise."
        />

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4 order-2 lg:order-1 flex flex-col gap-5">
            <ul className="flex flex-col gap-3 text-paper/70 text-sm md:text-base">
              <li><span className="text-ember font-mono mr-2">01</span>Allow your camera when asked.</li>
              <li><span className="text-ember font-mono mr-2">02</span>Look into the oval — one frame is taken after 3 seconds.</li>
              <li><span className="text-ember font-mono mr-2">03</span>Watch yourself denoise from t = 1000 to 0.</li>
            </ul>
            <p className="hud !normal-case !tracking-normal !text-xs text-teal/80 leading-relaxed">
              🔒 Runs entirely in your browser. The camera switches off the instant the frame is taken, and nothing is uploaded or stored.
            </p>
            <p className="text-paper/35 text-xs leading-relaxed">
              A visual metaphor for diffusion sampling — not a model inference.
            </p>
          </div>

          <div className="lg:col-span-8 order-1 lg:order-2">
            <div ref={boxRef} className="relative aspect-square md:aspect-[4/3] max-h-[78vh] w-full rounded-sm border border-paper/10 bg-ink-2 overflow-hidden">
              {/* Live preview with a framing oval */}
              {phase === "framing" && (
                <>
                  <video ref={videoRef} muted playsInline className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-[78%] aspect-[0.92] rounded-[50%] border-2 border-dashed border-teal/80 shadow-[0_0_0_9999px_rgba(5,5,5,0.55)]" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={count}
                        className="font-display text-[22vw] md:text-[10rem] text-paper/80"
                        initial={{ scale: 1.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {count > 0 ? count : ""}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <button
                    onClick={capture}
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 hud bg-ember text-ink rounded-full px-5 py-2.5"
                  >
                    Snap now
                  </button>
                </>
              )}

              {/* Particles */}
              {data && (phase === "sampling" || phase === "done") && (
                <>
                  <MirrorParticles data={data} onStep={onStep} onSnapshot={(take) => (takeRef.current = take)} />
                  <div className="absolute top-4 left-4 hud text-paper/50">
                    {phase === "sampling" ? "reverse process · denoising" : "x₀ · sampled"}
                  </div>
                  <div className="absolute top-4 right-4 hud text-ember tabular-nums">t = {String(step).padStart(4, "0")}</div>
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="hud text-paper/40">fig. 02 — you, from {data.count.toLocaleString("en-US")} particles</span>
                    {phase === "done" && (
                      <span className="flex gap-2">
                        <button onClick={save} className="inline-flex items-center gap-2 hud bg-ember text-ink rounded-full px-4 py-2.5">
                          <Download size={13} /> Save portrait
                        </button>
                        <button onClick={reset} className="inline-flex items-center gap-2 hud border border-paper/25 text-paper/80 hover:text-paper rounded-full px-4 py-2.5">
                          <RotateCcw size={13} /> Again
                        </button>
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Invitation / errors */}
              {(phase === "idle" || phase === "asking" || phase === "error") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
                  <div className="font-serif italic text-3xl md:text-5xl text-paper/90">Want to see how I see you?</div>
                  <button
                    onClick={start}
                    disabled={phase === "asking"}
                    data-cursor="SEE"
                    className="inline-flex items-center gap-3 bg-ember text-ink pl-2 pr-6 py-2 rounded-full font-medium hover:bg-paper transition-colors disabled:opacity-60"
                  >
                    <span className="w-9 h-9 rounded-full bg-ink text-ember flex items-center justify-center">
                      <Camera size={16} />
                    </span>
                    {phase === "asking" ? "Waiting for camera…" : "Turn on camera"}
                  </button>
                  {error && <p className="text-ember text-sm max-w-md">{error}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
