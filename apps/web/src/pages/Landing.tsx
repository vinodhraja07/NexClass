import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Eye,
  Languages,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import clsx from "clsx";
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
import { TopNav, type LandingNavTab } from "@/components/landing/TopNav";
import { Container } from "@/components/landing/Primitives";
import { Button } from "@/components/ui";

const TABS: Array<{
  id: LandingNavTab;
  label: string;
  badge?: string;
  icon: typeof LayoutGrid;
  description: string;
}> = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutGrid,
    description: "Classroom entry & live engine preview",
  },
  {
    id: "how-it-works",
    label: "How it works",
    icon: Workflow,
    description: "4-step neural audio and WebRTC pipeline",
  },
  {
    id: "features",
    label: "Features",
    icon: Sparkles,
    description: "Classroom tools & terminology dictionary",
  },
  {
    id: "languages",
    label: "Languages",
    badge: "6 Languages",
    icon: Languages,
    description: "Tamil, Hindi, Bengali, Marathi, Odia matrix",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    icon: Eye,
    description: "WCAG 2.2 AAA & assistive contrast",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: ShieldCheck,
    description: "Zero audio storage & student privacy",
  },
];

export default function Landing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reduce = useReducedMotion() ?? false;

  const tabParam = searchParams.get("tab") as LandingNavTab | null;
  const [activeTab, setActiveTabState] = useState<LandingNavTab>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "overview",
  );

  const selectTab = useCallback(
    (tab: LandingNavTab) => {
      setActiveTabState(tab);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "overview") {
            next.delete("tab");
          } else {
            next.set("tab", tab);
          }
          return next;
        },
        { replace: true },
      );
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    },
    [reduce, setSearchParams],
  );

  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTabState(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="relative min-h-screen bg-ink-900 text-ivory-100 flex flex-col justify-between">
      <a
        href="#main"
        className="nc-focus sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-accent-400 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-900"
      >
        Skip to main content
      </a>

      {/* Header TopNav with active tab state sync */}
      <TopNav activeTab={activeTab} onSelectTab={selectTab} />

      {/* Persistent Sticky View Selector Tabs */}
      <div className="sticky top-16 z-40 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur-xl">
        <Container>
          <div
            className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none"
            role="tablist"
            aria-label="Landing page sections"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => selectTab(tab.id)}
                  className={clsx(
                    "nc-focus group relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "border border-accent-400/40 bg-accent-400/15 text-accent-300 shadow-sm font-semibold"
                      : "border border-transparent text-ivory-400 hover:border-ink-700 hover:bg-ink-850 hover:text-ivory-100",
                  )}
                >
                  <Icon
                    className={clsx(
                      "h-3.5 w-3.5 shrink-0 transition-colors",
                      isSelected ? "text-accent-300" : "text-ivory-400 group-hover:text-ivory-200",
                    )}
                    aria-hidden="true"
                  />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={clsx(
                        "rounded-full px-1.5 py-0.5 text-4xs font-bold uppercase tracking-wider",
                        isSelected
                          ? "bg-accent-400/30 text-accent-200"
                          : "bg-ink-750 text-ivory-400",
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {isSelected && (
                    <motion.span
                      layoutId="landing-active-pill"
                      className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-accent-400/10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      {/* Main Tab Views Container */}
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="tab-overview"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {/* Hero Section */}
              <Hero />

              {/* Quick Jump Discovery Cards */}
              <section className="relative py-12 border-t border-ink-800/80 bg-ink-950/40">
                <Container>
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                    <div>
                      <p className="nc-eyebrow">Explore NexClass</p>
                      <h2 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-ivory-50">
                        Everything you need to know, without the long scroll
                      </h2>
                    </div>
                    <p className="text-2xs text-ivory-400 max-w-sm">
                      Select any view above or click the cards below to dive straight into each section.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => selectTab("how-it-works")}
                      className="nc-focus group text-left rounded-2xl border border-ink-700/60 bg-ink-850/40 p-5 hover:border-accent-400/40 hover:bg-ink-850/70 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/10 text-accent-300">
                          <Workflow className="h-4 w-4" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-ivory-400 group-hover:text-accent-300 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-ivory-50 group-hover:text-accent-200 transition-colors">
                        How It Works Pipeline
                      </h3>
                      <p className="mt-1 text-2xs leading-relaxed text-ivory-400">
                        See how microphone speech becomes instant multi-language captions & translated audio under 500ms.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab("features")}
                      className="nc-focus group text-left rounded-2xl border border-ink-700/60 bg-ink-850/40 p-5 hover:border-accent-400/40 hover:bg-ink-850/70 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/10 text-accent-300">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-ivory-400 group-hover:text-accent-300 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-ivory-50 group-hover:text-accent-200 transition-colors">
                        Features & Terminology
                      </h3>
                      <p className="mt-1 text-2xs leading-relaxed text-ivory-400">
                        Preserves scientific terms like &quot;torque&quot; and &quot;angular momentum&quot; without flattening equations.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab("languages")}
                      className="nc-focus group text-left rounded-2xl border border-ink-700/60 bg-ink-850/40 p-5 hover:border-accent-400/40 hover:bg-ink-850/70 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/10 text-accent-300">
                          <Languages className="h-4 w-4" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-ivory-400 group-hover:text-accent-300 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-ivory-50 group-hover:text-accent-200 transition-colors">
                        6 Indian Languages
                      </h3>
                      <p className="mt-1 text-2xs leading-relaxed text-ivory-400">
                        Interactive stage demonstrating English, Tamil, Hindi, Bengali, Marathi, and Odia translation.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab("accessibility")}
                      className="nc-focus group text-left rounded-2xl border border-ink-700/60 bg-ink-850/40 p-5 hover:border-accent-400/40 hover:bg-ink-850/70 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/10 text-accent-300">
                          <Eye className="h-4 w-4" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-ivory-400 group-hover:text-accent-300 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-ivory-50 group-hover:text-accent-200 transition-colors">
                        Accessibility Standard
                      </h3>
                      <p className="mt-1 text-2xs leading-relaxed text-ivory-400">
                        Full screen-reader support, dyslexia-friendly typography, and WCAG 2.2 AAA contrast ratios.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTab("privacy")}
                      className="nc-focus group text-left rounded-2xl border border-ink-700/60 bg-ink-850/40 p-5 hover:border-accent-400/40 hover:bg-ink-850/70 transition-all duration-200 sm:col-span-2 lg:col-span-2"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/10 text-accent-300">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-ivory-400 group-hover:text-accent-300 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-ivory-50 group-hover:text-accent-200 transition-colors">
                        Privacy & Zero Data Retention
                      </h3>
                      <p className="mt-1 text-2xs leading-relaxed text-ivory-400">
                        Audio streams are ephemeral. Raw audio is processed in memory and never saved to disk or model training sets.
                      </p>
                    </button>
                  </div>
                </Container>
              </section>
            </motion.div>
          )}

          {activeTab === "how-it-works" && (
            <motion.div
              key="tab-how-it-works"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <ProblemSection />
              <HowItWorks />
            </motion.div>
          )}

          {activeTab === "features" && (
            <motion.div
              key="tab-features"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <FeaturesSection />
              <TerminologySection />
            </motion.div>
          )}

          {activeTab === "languages" && (
            <motion.div
              key="tab-languages"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <OneRoomManyLanguages />
            </motion.div>
          )}

          {activeTab === "accessibility" && (
            <motion.div
              key="tab-accessibility"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <AccessibilitySection />
            </motion.div>
          )}

          {activeTab === "privacy" && (
            <motion.div
              key="tab-privacy"
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <PrivacySection />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Call to Action & Footer */}
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
