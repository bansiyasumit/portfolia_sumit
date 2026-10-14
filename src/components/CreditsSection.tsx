"use client";

import { motion } from "framer-motion";
import profileData from "@/data/profile.json";
import { SceneHeader } from "./SceneHeader";
import { PostCredits } from "./credits/PostCredits";

const CREDITS: [string, string[]][] = [
  ["Directed by", ["Sumit Bansiya"]],
  ["Written & researched by", ["Sumit Bansiya"]],
  ["Research home", ["NIT Jalandhar"]],
  ["Supported by", ["IndiaAI Mission", "MeitY, Government of India"]],
  ["Trained at", ["MITS Gwalior — B.Tech, AI"]],
  ["Starring", ["Seg-CycleGAN", "Multi-View CESM Classifier", "Legal RAG Pipeline", "The Agent Crew", "Car Damage ResNet"]],
  ["Mentoring", ["AI & ML Academy", "Every student I've taught"]],
  ["Shot on", ["Next.js · React Three Fiber", "Framer Motion · Lenis · Tailwind"]],
];

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.11 20.45H3.56V9h3.55v11.45z" />
  </svg>
);

export const CreditsSection = () => {
  const { profile } = profileData;

  return (
    <section id="credits" data-scene="Credits" className="relative pt-28 md:pt-40 pb-20 overflow-x-clip">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <SceneHeader number={7} slug="Fade in — the sequel" title="Let's make" accent="the sequel." />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-paper/60 text-lg leading-relaxed max-w-lg">
              Open to research collaborations, ML engineering roles, and hard problems in medical imaging
              or applied generative AI. The fastest way to reach me is email.
            </p>

            <a
              href={`mailto:${profile.contact.email}`}
              data-cursor="MAIL"
              className="group mt-10 block font-display uppercase text-[9vw] lg:text-[4.6rem] leading-none break-all text-paper hover:text-ember transition-colors"
            >
              {profile.contact.email.split("@")[0]}
              <span className="font-serif italic normal-case text-paper/40 group-hover:text-ember/70">
                @{profile.contact.email.split("@")[1]}
              </span>
            </a>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href={profile.contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-paper/25 hover:border-paper hover:bg-paper hover:text-ink transition-colors text-sm"
              >
                <LinkedInIcon /> LinkedIn
              </a>
              <a
                href={profile.resumeUrl}
                download
                className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-ember text-ink hover:bg-paper transition-colors text-sm font-medium"
              >
                ↓ Download résumé
              </a>
            </div>
          </div>

          {/* Rolling end credits */}
          <div
            className="relative h-[460px] overflow-hidden [mask-image:linear-gradient(transparent,black_18%,black_82%,transparent)]"
            aria-label="Credits"
          >
            <div className="flex flex-col items-center text-center" style={{ animation: "credits-roll 38s linear infinite" }}>
              {[0, 1].map((copy) => (
                <div key={copy} className="flex flex-col gap-10 py-10" aria-hidden={copy === 1}>
                  {CREDITS.map(([role, names]) => (
                    <div key={role}>
                      <div className="hud text-paper/40 mb-2">{role}</div>
                      {names.map((n) => (
                        <div key={n} className="font-serif text-2xl md:text-3xl text-paper/90">
                          {n}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="mt-28 md:mt-40 text-center select-none"
        initial={{ opacity: 0, letterSpacing: "0.5em" }}
        whileInView={{ opacity: 1, letterSpacing: "0em" }}
        viewport={{ once: true, amount: 0.01, margin: "0px 0px 12% 0px" }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="font-serif italic text-[22vw] md:text-[16vw] leading-[0.8] text-paper/90">Fin.</div>
      </motion.div>

      <footer className="max-w-[1400px] mx-auto px-5 md:px-10 mt-16 pt-6 border-t border-paper/10 flex flex-col md:flex-row gap-3 justify-between hud text-paper/40">
        <span>© 2026 Sumit Bansiya — all rights reserved</span>
        <span>No GPUs were harmed in the making of this film</span>
      </footer>
      <p className="text-center hud text-paper/25 mt-10">Stay for the post-credits scene…</p>
      <PostCredits />
    </section>
  );
};
