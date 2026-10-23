import { useEffect } from "react";
import { AccessibilitySection } from "@/components/landing/AccessibilitySection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { OneRoomManyLanguages } from "@/components/landing/OneRoomManyLanguages";
import { PrivacySection } from "@/components/landing/PrivacySection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { TerminologySection } from "@/components/landing/TerminologySection";
import { TopNav } from "@/components/landing/TopNav";

export default function Landing() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollBehavior = previous;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-ink-900">
      <a
        href="#main"
        className="nc-focus sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent-400 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-900"
      >
        Skip to main content
      </a>

      <TopNav />

      <main id="main">
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <OneRoomManyLanguages />
        <FeaturesSection />
        <TerminologySection />
        <AccessibilitySection />
        <PrivacySection />
      </main>

      <FinalCta />
      <SiteFooter />
    </div>
  );
}
