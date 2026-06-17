"use client";

import { LocaleProvider } from "@/context/LocaleContext";
import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { DiscoveryConcept } from "./DiscoveryConcept";
import { StatsShowcase } from "./StatsShowcase";
import { HowItWorks } from "./HowItWorks";
import { Screenshots } from "./Screenshots";
import { WhyDifferent } from "./WhyDifferent";
import { FounderStory } from "./FounderStory";
import { WhatsComing } from "./WhatsComing";
import { Waitlist } from "./Waitlist";
import { Footer } from "./Footer";

export function ClientWrapper() {
  return (
    <LocaleProvider>
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
    </LocaleProvider>
  );
}
