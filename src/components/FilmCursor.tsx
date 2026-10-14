"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isRecruiterPath } from "@/lib/film";

/**
 * Viewfinder cursor: a dot that tracks the pointer exactly and a focus ring that
 * trails behind it. Hovering a link/button (or anything with data-cursor="LABEL")
 * expands the ring and shows a label. Only enabled for fine pointers.
 */
export const FilmCursor = () => {
  const recruiter = isRecruiterPath(usePathname());
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (recruiter || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setEnabled(false);
      return;
    }
    setEnabled(true);
    document.body.classList.add("has-film-cursor");

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { ...pos };
    let frame = 0;

    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("a, button, [data-cursor]");
      setActive(!!target);
      setLabel(target?.dataset.cursor ?? null);
    };

    const loop = () => {
      ring.x += (pos.x - ring.x) * 0.18;
      ring.y += (pos.y - ring.y) * 0.18;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    window.addEventListener("pointermove", move);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.body.classList.remove("has-film-cursor");
    };
  }, [recruiter]);

  if (!enabled || recruiter) return null;

  const size = label ? 84 : active ? 48 : 30;

  return (
    <>
      <div ref={dotRef} className="fixed top-0 left-0 z-[300] pointer-events-none">
        <div className="w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember" />
      </div>
      <div ref={ringRef} className="fixed top-0 left-0 z-[299] pointer-events-none">
        <div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full border flex items-center justify-center transition-[width,height,background-color,border-color] duration-300 ease-out"
          style={{
            width: size,
            height: size,
            borderColor: active ? "var(--ember)" : "rgba(236,232,225,0.4)",
            backgroundColor: label ? "rgba(255,107,53,0.92)" : "transparent",
          }}
        >
          {label && <span className="hud text-ink font-bold tracking-[0.2em]">{label}</span>}
        </div>
      </div>
    </>
  );
};
