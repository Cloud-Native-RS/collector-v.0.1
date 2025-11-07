"use client";

import { NavigationBar } from "./components/navigation-bar";
import { HeroSection } from "./components/hero-section";
import { AboutIntro } from "./components/about-intro";
import { ValuesSection } from "./components/values-section";
import { LeadershipTeam } from "./components/leadership-team";
import { Footer } from "./components/footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <main>
        <HeroSection />
        <AboutIntro />
        <ValuesSection />
        <LeadershipTeam />
      </main>
      <Footer />
    </div>
  );
}






