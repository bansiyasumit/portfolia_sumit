import { CityWalk } from "@/components/city/CityWalk";
import { Hero } from "@/components/hero/Hero";
import { MirrorSection } from "@/components/mirror/MirrorSection";
import { OriginSection } from "@/components/OriginSection";
import { WorkReel } from "@/components/WorkReel";
import { PathSection } from "@/components/PathSection";
import { AgentSection } from "@/components/AgentSection";
import { CreditsSection } from "@/components/CreditsSection";

export default function Home() {
  return (
    <>
      <CityWalk />
      <Hero />
      <MirrorSection />
      <OriginSection />
      <WorkReel />
      <PathSection />
      <AgentSection />
      <CreditsSection />
    </>
  );
}
