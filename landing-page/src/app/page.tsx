import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { DiscoveryConcept } from "@/components/DiscoveryConcept";
import { StatsShowcase } from "@/components/StatsShowcase";
import { HowItWorks } from "@/components/HowItWorks";
import { Screenshots } from "@/components/Screenshots";
import { WhyDifferent } from "@/components/WhyDifferent";
import { FounderStory } from "@/components/FounderStory";
import { WhatsComing } from "@/components/WhatsComing";
import { Waitlist } from "@/components/Waitlist";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <Problem />
      <DiscoveryConcept />
      <StatsShowcase />
      <HowItWorks />
      <Screenshots />
      <WhyDifferent />
      <FounderStory />
      <WhatsComing />
      <Waitlist />
      <Footer />
    </main>
  );
}
