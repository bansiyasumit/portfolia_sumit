import { HeroMuseum } from "@/components/HeroMuseum";
import { ExhibitCard } from "@/components/ExhibitCard";
import { GanSlider } from "@/components/GanSlider";
import { Timeline } from "@/components/Timeline";
import { LibrarySearch } from "@/components/LibrarySearch";
import { AgentSumit } from "@/components/AgentSumit";
import { BlogSection } from "@/components/BlogSection";
import exhibitsData from "../data/exhibits.json";

export default function Home() {
  const researchData = exhibitsData.exhibits.find(e => e.id === "research-01");
  const engData = exhibitsData.exhibits.find(e => e.id === "engineering-01");
  const engData2 = exhibitsData.exhibits.find(e => e.id === "engineering-02");
  const teachingData = exhibitsData.exhibits.find(e => e.id === "teaching-01");

  return (
    <>
      <HeroMuseum />

      <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col gap-32">
        {/* Exhibit A: Research Vault */}
        <section id="research" className="scroll-mt-24 relative">
          <div className="absolute -left-10 top-0 w-1 h-full bg-gradient-to-b from-transparent via-[#00f3ff]/50 to-transparent hidden md:block"></div>
          <h2 className="text-3xl md:text-5xl font-black font-orbitron mb-8 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600 uppercase tracking-tighter">
            <span className="text-[#00f3ff] mr-4 block md:inline text-xl md:text-3xl">Exhibit_A</span> 
            Research Vault
          </h2>
          
          {researchData && (
            <ExhibitCard {...researchData}>
              <GanSlider />
            </ExhibitCard>
          )}
        </section>

        {/* Exhibit B: Engineering Forge */}
        <section id="engineering" className="scroll-mt-24 relative">
           <div className="absolute -right-10 top-0 w-1 h-full bg-gradient-to-b from-transparent via-[#7000ff]/50 to-transparent hidden md:block"></div>
          <h2 className="text-3xl md:text-5xl font-black font-orbitron mb-8 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600 uppercase tracking-tighter text-right">
            <span className="text-[#7000ff] mr-4 block md:inline text-xl md:text-3xl">Exhibit_B</span> 
            Engineering Forge
          </h2>
          
          {engData && (
            <ExhibitCard {...engData} />
          )}
          {engData2 && (
            <div className="mt-8">
              <ExhibitCard {...engData2} />
            </div>
          )}
        </section>

        {/* Exhibit C: Academy */}
        <section id="academy" className="scroll-mt-24 relative">
          <div className="absolute -left-10 top-0 w-1 h-full bg-gradient-to-b from-transparent via-[#ff00ff]/50 to-transparent hidden md:block"></div>
          <h2 className="text-3xl md:text-5xl font-black font-orbitron mb-8 text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-600 uppercase tracking-tighter">
            <span className="text-[#ff00ff] mr-4 block md:inline text-xl md:text-3xl">Exhibit_C</span> 
            Academy
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              {teachingData && (
                <ExhibitCard {...teachingData} />
              )}
              <div className="mt-8">
                <Timeline items={[
                  {
                    year: "2024",
                    title: "Freelance Instructor",
                    role: "AI & ML Educator",
                    description: teachingData?.philosophy || "Bridging theory and practice through hands-on implementation.",
                    impact: teachingData?.impact || "Taught undergraduate students, faculty, and school programs."
                  }
                ]} />
              </div>
            </div>
            
            <div className="glass-panel p-6 rounded-lg h-fit border-l-4 border-l-[#7000ff]">
              <h3 className="text-xl font-orbitron font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7000ff] animate-pulse"></span>
                Digital Library
              </h3>
              <LibrarySearch />
            </div>
          </div>
        </section>

        {/* Transmission Logs (Blog) */}
        <BlogSection />
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-10 mt-20 bg-black/50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="font-orbitron text-gray-500 text-xs tracking-[0.2em] uppercase">
            // END OF EXHIBITION
          </p>
          <p className="font-inter text-gray-600 text-xs mt-4">
            Built by Sumit Bansiya © 2026. Cyberpunk Framework.
          </p>
        </div>
      </footer>

      <AgentSumit />
    </>
  );
}
