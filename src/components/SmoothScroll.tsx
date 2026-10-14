"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Inertial smooth scrolling — gives every scroll-driven scene a heavier, camera-
 * dolly feel. Native scroll position is kept, so sticky sections and Framer
 * Motion's useScroll keep working unchanged.
 */
export const SmoothScroll = () => {
  useEffect(() => {
    // A reload replays the film from the top, instead of landing mid-page while the
    // 3D scenes are still starting up. Deep links (/#work etc.) are left alone.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (!window.location.hash) window.scrollTo(0, 0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      anchors: { offset: 0 },
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
};
