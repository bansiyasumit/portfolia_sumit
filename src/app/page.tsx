import { Hero } from "@/components/hero/Hero";
import { OriginSection } from "@/components/OriginSection";
import { WorkReel } from "@/components/WorkReel";
import { PathSection } from "@/components/PathSection";
import { AgentSection } from "@/components/AgentSection";
import { CreditsSection } from "@/components/CreditsSection";

export default function Home() {
  return (
    <>
      <Hero />
      <OriginSection />
      <WorkReel />
      <PathSection />
      <AgentSection />
      <CreditsSection />
    </>
  );
}
