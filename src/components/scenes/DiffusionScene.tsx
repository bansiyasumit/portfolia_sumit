"use client";

import { useEffect, useRef, useState } from "react";

const RES = 220;
const STEPS = 1000;

/**
 * Thesis scene: the low-energy scan dissolves into Gaussian noise, then the
 * synthesized DES phantom is "sampled" back out of it step by step, with a
 * live t-counter like a diffusion/GAN sampling loop. Loops forever.
 */
export default function DiffusionScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<"source" | "noise" | "output">("noise");

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    canvas.width = RES;
    canvas.height = RES;

    const load = (src: string) =>
      new Promise<Uint8ClampedArray>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = RES;
          c.height = RES;
          const cx = c.getContext("2d")!;
          // contain-fit on black so both images share framing
          const s = Math.min(RES / img.width, RES / img.height);
          const w = img.width * s, h = img.height * s;
          cx.fillStyle = "#000";
          cx.fillRect(0, 0, RES, RES);
          cx.drawImage(img, (RES - w) / 2, (RES - h) / 2, w, h);
          resolve(cx.getImageData(0, 0, RES, RES).data);
        };
      });

    let frame = 0;
    let cancelled = false;
    const noise = new Float32Array(RES * RES);
    const reseed = () => {
      for (let i = 0; i < noise.length; i++) {
        const u = 1 - Math.random(), v = Math.random();
        noise[i] = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      }
    };

    Promise.all([load("/low_energy.jpg"), load("/gan_output.jpg")]).then(([src, out]) => {
      if (cancelled) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const out2 = ctx.createImageData(RES, RES);
      const CYCLE = 9000;
      const start = performance.now();
      reseed();

      const draw = (now: number) => {
        // 0-0.22: show source · 0.22-0.4: forward noising · 0.4-0.85: reverse sampling to output · rest: hold output
        const p = reduced ? 0.95 : ((now - start) % CYCLE) / CYCLE;
        let sigma: number, base: Uint8ClampedArray;
        if (p < 0.22) {
          sigma = 0; base = src; setPhase("source");
        } else if (p < 0.4) {
          sigma = (p - 0.22) / 0.18; base = src; setPhase("noise");
        } else if (p < 0.85) {
          const k = (p - 0.4) / 0.45;
          sigma = Math.pow(1 - k, 1.6); base = out; setPhase("output");
        } else {
          sigma = 0; base = out; setPhase("output");
        }
        if (p < 0.01) reseed();
        if (tRef.current) tRef.current.textContent = `t = ${String(Math.round(sigma * STEPS)).padStart(4, "0")}`;

        const d = out2.data;
        const a = Math.sqrt(1 - sigma * sigma);
        for (let i = 0, j = 0; i < noise.length; i++, j += 4) {
          const n = noise[i] * sigma * 110;
          d[j] = base[j] * a + n + 128 * sigma * 0.15;
          d[j + 1] = base[j + 1] * a + n * 0.95 + 128 * sigma * 0.2;
          d[j + 2] = base[j + 2] * a + n * 1.05 + 128 * sigma * 0.22;
          d[j + 3] = 255;
        }
        ctx.putImageData(out2, 0, 0);
        if (!reduced) frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-[min(72vh,620px)] aspect-square">
        <canvas ref={canvasRef} className="w-full h-full rounded-sm [image-rendering:auto] opacity-90" />
        <div className="absolute inset-0 rounded-sm ring-1 ring-paper/10" />
        <div className="absolute -bottom-9 left-0 right-0 flex justify-between hud text-paper/50">
          <span>
            {phase === "source" ? "x₀ · low-energy input" : phase === "noise" ? "forward process · adding noise" : "reverse process · synthesizing DES"}
          </span>
          <span ref={tRef} className="tabular-nums text-ember">t = 1000</span>
        </div>
      </div>
    </div>
  );
}
