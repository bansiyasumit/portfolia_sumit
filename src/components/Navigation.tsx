"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OPEN_AGENT_EVENT, SCENES } from "@/lib/film";

const LINKS = SCENES.filter((s) => s.id !== "home");

export const Navigation = () => {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 40);
      setHidden(y > last && y > 200);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        animate={{ y: hidden && !menuOpen ? "-110%" : "0%" }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
        className={`fixed top-0 inset-x-0 z-[120] transition-colors duration-500 ${
          solid && !menuOpen ? "bg-ink/70 backdrop-blur-md border-b border-paper/5" : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 h-16 md:h-20 flex items-center justify-between">
          <a href="#home" className="flex items-baseline gap-2 group" onClick={() => setMenuOpen(false)}>
            <span className="font-display text-2xl tracking-wide text-paper">SB</span>
            <span className="font-serif italic text-lg text-paper/60 group-hover:text-ember transition-colors hidden sm:inline">
              Sumit Bansiya
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {LINKS.map((link, i) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="group hud text-paper/60 hover:text-paper transition-colors flex items-center gap-1.5"
              >
                <span className="text-ember/70 group-hover:text-ember">{String(i + 1).padStart(2, "0")}</span>
                {link.label}
              </a>
            ))}
            <button
              onClick={() => window.dispatchEvent(new Event(OPEN_AGENT_EVENT))}
              className="hud text-ink bg-paper hover:bg-ember px-4 py-2.5 rounded-full transition-colors"
            >
              Ask my AI
            </button>
          </div>

          <button
            className="md:hidden hud text-paper flex items-center gap-2 py-2"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? "Close" : "Menu"}
            <span className="flex flex-col gap-1">
              <span className={`block w-5 h-px bg-paper transition-transform ${menuOpen ? "translate-y-[2.5px] rotate-45" : ""}`} />
              <span className={`block w-5 h-px bg-paper transition-transform ${menuOpen ? "-translate-y-[2.5px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[110] bg-ink flex flex-col justify-center px-6"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            {LINKS.map((link, i) => (
              <div key={link.id} className="overflow-hidden">
                <motion.a
                  href={`#${link.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline gap-4 py-2"
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="hud text-ember">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-5xl uppercase text-paper">{link.label}</span>
                </motion.a>
              </div>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                window.dispatchEvent(new Event(OPEN_AGENT_EVENT));
              }}
              className="mt-10 self-start hud text-ink bg-ember px-5 py-3 rounded-full"
            >
              Ask my AI
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
