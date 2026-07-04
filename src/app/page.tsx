import { HeroMuseum } from "@/components/HeroMuseum";
import { AboutSection } from "@/components/AboutSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { AgentSection } from "@/components/AgentSection";
import { ContactSection } from "@/components/ContactSection";
import { AgentSumit } from "@/components/AgentSumit";
import { BlogSection } from "@/components/BlogSection";

export default function Home() {
  return (
    <>
      <HeroMuseum />

      <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-32">
        <AboutSection />
        <ProjectsSection />
        <AgentSection />
        <ContactSection />

        {/* Optional / low-emphasis: latest long-form writing */}
        <BlogSection />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 mt-20 bg-black/50">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
          <p className="font-orbitron text-gray-500 text-xs tracking-[0.2em] uppercase mb-6">
            // End of transmission
          </p>

          <div className="flex gap-6 mb-8 mt-2">
            <a
              href="mailto:bansiyasumit09@gmail.com"
              className="font-orbitron text-sm text-gray-400 hover:text-[#00f3ff] transition-colors border border-white/10 hover:border-[#00f3ff]/50 px-4 py-2 rounded-sm backdrop-blur-sm"
            >
              bansiyasumit09@gmail.com
            </a>
          </div>

          <p className="font-inter text-gray-600 text-xs">
            Built by Sumit Bansiya © 2026.
          </p>
        </div>
      </footer>

      <AgentSumit />
    </>
  );
}
