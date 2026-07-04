"use client";

import { Mail, FileDown, ArrowUpRight } from "lucide-react";
import profileData from "../data/profile.json";
import { Reveal } from "./Reveal";

// lucide-react dropped brand/logo glyphs (incl. LinkedIn) — a tiny inline
// SVG keeps the icon set consistent without pulling in another dependency.
const LinkedInIcon = ({ className, size = 22 }: { className?: string; size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.11 20.45H3.56V9h3.55v11.45z" />
  </svg>
);

export const ContactSection = () => {
  const { profile } = profileData as any;

  return (
    <section id="contact" className="scroll-mt-24 relative pb-8">
      <Reveal>
        <div className="flex items-center gap-4 mb-3">
          <span className="font-orbitron text-[#7000ff] text-xs tracking-[0.3em] uppercase">Chapter 04</span>
          <div className="h-px flex-1 bg-gradient-to-r from-[#7000ff]/40 to-transparent" />
        </div>
        <h2 className="text-3xl md:text-5xl font-black font-orbitron mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600 uppercase tracking-tighter">
          Close the Loop
        </h2>
        <p className="text-gray-400 font-inter text-lg max-w-2xl mb-12">
          Open to research collaborations, ML engineering roles, and interesting problems in
          medical imaging or applied generative AI. The fastest way to reach me is email.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href={`mailto:${profile.contact.email}`}
            className="glass-panel rounded-lg p-6 flex flex-col gap-4 group hover:border-[#00f3ff]/50 hover:shadow-[0_0_20px_rgba(0,243,255,0.15)] transition-all border border-transparent"
          >
            <div className="flex items-center justify-between">
              <Mail className="text-[#00f3ff]" size={22} />
              <ArrowUpRight size={16} className="text-gray-500 group-hover:text-[#00f3ff] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
            <div>
              <div className="font-orbitron text-xs uppercase tracking-widest text-gray-500 mb-1">Email</div>
              <div className="text-white font-inter text-sm break-all">{profile.contact.email}</div>
            </div>
          </a>

          <a
            href={profile.contact.linkedin}
            target="_blank"
            rel="noreferrer"
            className="glass-panel rounded-lg p-6 flex flex-col gap-4 group hover:border-[#7000ff]/50 hover:shadow-[0_0_20px_rgba(112,0,255,0.15)] transition-all border border-transparent"
          >
            <div className="flex items-center justify-between">
              <LinkedInIcon className="text-[#7000ff]" size={22} />
              <ArrowUpRight size={16} className="text-gray-500 group-hover:text-[#7000ff] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
            <div>
              <div className="font-orbitron text-xs uppercase tracking-widest text-gray-500 mb-1">LinkedIn</div>
              <div className="text-white font-inter text-sm">Sumit Bansiya</div>
            </div>
          </a>

          <a
            href={profile.resumeUrl}
            download
            className="glass-panel rounded-lg p-6 flex flex-col gap-4 group hover:border-[#ff00ff]/50 hover:shadow-[0_0_20px_rgba(255,0,255,0.15)] transition-all border border-transparent"
          >
            <div className="flex items-center justify-between">
              <FileDown className="text-[#ff00ff]" size={22} />
              <ArrowUpRight size={16} className="text-gray-500 group-hover:text-[#ff00ff] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
            <div>
              <div className="font-orbitron text-xs uppercase tracking-widest text-gray-500 mb-1">Resume</div>
              <div className="text-white font-inter text-sm">Download PDF</div>
            </div>
          </a>
        </div>
      </Reveal>
    </section>
  );
};
