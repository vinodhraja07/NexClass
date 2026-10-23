import {
  Accessibility,
  AudioLines,
  Captions,
  FileText,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow, Lede, Reveal, Section, SectionTitle, Stagger, StaggerItem } from "./Primitives";

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Captions,
    title: "Live multilingual captions",
    body: "Captions arrive while the teacher is still speaking, in the language each student selected.",
  },
  {
    icon: AudioLines,
    title: "Translated voice",
    body: "Hear the lesson spoken in your language. The translated audio is rendered for you alone.",
  },
  {
    icon: ShieldCheck,
    title: "Terminology protection",
    body: "Glossary terms are locked before translation, so torque and eigenvalue are never paraphrased away.",
  },
  {
    icon: SlidersHorizontal,
    title: "Per-participant control",
    body: "Change captions and voice mid-class. It affects your screen and your ears only.",
  },
  {
    icon: Accessibility,
    title: "Accessibility first",
    body: "Built with deaf and hard-of-hearing students in mind: captions, sizing, contrast and keyboard support.",
  },
  {
    icon: FileText,
    title: "Original transcript preserved",
    body: "The teacher's own words are stored verbatim and remain the authoritative record of the class.",
  },
];

export function FeaturesSection() {
  return (
    <Section id="features" label="Features" className="bg-ink-950/60">
      <Container>
        <div className="max-w-[720px]">
          <Reveal>
            <Eyebrow>Features</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionTitle className="mt-5">Everything the room needs, nothing it does not.</SectionTitle>
          </Reveal>
          <Reveal delay={0.1}>
            <Lede className="mt-6">
              NexClass is a live classroom first — not a course platform, not a
              simulation lab. These are the parts that make a single-language lecture
              usable in a multilingual room.
            </Lede>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-12">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title} className="border-t border-ink-700/70 pt-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-600/70 bg-ink-850 text-accent-300">
                <feature.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-[16.5px] font-semibold text-ivory-50">{feature.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-ivory-300/80">{feature.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
