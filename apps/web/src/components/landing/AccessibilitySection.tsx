import {
  Captions,
  Contrast,
  Keyboard,
  ScanEye,
  Type,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow, Lede, Reveal, Section, SectionTitle, Stagger, StaggerItem } from "./Primitives";

interface Item {
  icon: LucideIcon;
  title: string;
  body: string;
}

const ITEMS: Item[] = [
  {
    icon: Captions,
    title: "Captions by default",
    body: "Live captions are a first-class surface, not an add-on, and they carry the same technical vocabulary as the lecture.",
  },
  {
    icon: Type,
    title: "Adjustable caption size",
    body: "Caption text scales independently of the interface, so a student can make the transcript as large as they need.",
  },
  {
    icon: Keyboard,
    title: "Full keyboard navigation",
    body: "Every control — including switching caption language — is reachable and operable without a mouse.",
  },
  {
    icon: ScanEye,
    title: "Screen reader support",
    body: "Caption changes are announced through a live region, and landmarks are labelled so assistive technology can orient quickly.",
  },
  {
    icon: Contrast,
    title: "High contrast surfaces",
    body: "The interface is built on a dark, high-contrast palette that keeps caption text legible in bright rooms and on poor screens.",
  },
];

export function AccessibilitySection() {
  return (
    <Section id="accessibility" label="Accessibility">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <Eyebrow>Accessibility</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <SectionTitle className="mt-5">
                Built so nobody has to guess what was said.
              </SectionTitle>
            </Reveal>
            <Reveal delay={0.1}>
              <Lede className="mt-6 max-w-[460px]">
                NexClass was designed with deaf and hard-of-hearing students in the
                room from the start. A caption that arrives late, too small or
                technically mangled is not an accessibility feature — it is a
                translation failure.
              </Lede>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-[460px] border-l-2 border-accent-400/60 pl-4 text-[13.5px] leading-relaxed text-ivory-300/80">
                Every language in the room gets the same quality of lecture. That is the
                whole point of the product.
              </p>
            </Reveal>
          </div>

          <Stagger className="min-w-0 space-y-3">
            {ITEMS.map((item) => (
              <StaggerItem
                key={item.title}
                className="group flex gap-5 rounded-2xl border border-ink-700/60 bg-ink-850/50 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-500 hover:bg-ink-800/80 hover:shadow-panel sm:gap-6"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-600/70 bg-ink-850 text-accent-300 transition-all duration-200 group-hover:border-accent-400/60 group-hover:bg-accent-400/10 group-hover:shadow-[0_0_20px_-4px_rgba(46,224,168,0.4)]">
                  <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[16px] font-semibold text-ivory-50 transition-colors duration-200 group-hover:text-white sm:text-[17px]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-ivory-300/80 sm:text-[14.5px]">
                    {item.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Container>
    </Section>
  );
}
