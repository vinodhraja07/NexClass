import { ChevronDown, ChevronRight } from "lucide-react";
import { Container, Eyebrow, Lede, Reveal, Section, SectionTitle } from "./Primitives";

interface Step {
  n: string;
  title: string;
  body: string;
  tag?: string;
}

const CAPTURE: Step[] = [
  {
    n: "01",
    title: "Teacher microphone",
    body: "The teacher's audio is captured inside the live meeting.",
  },
  {
    n: "02",
    title: "Speech recognition",
    body: "Audio is streamed to recognition and turned into text as it is spoken.",
  },
  {
    n: "03",
    title: "Original transcript",
    body: "The recognised source text is stored verbatim as the record of what was said.",
  },
  {
    n: "04",
    title: "Terminology protection",
    body: "Glossary terms are detected and locked before any translation runs.",
  },
  {
    n: "05",
    title: "Translation",
    body: "The protected transcript is translated once per target language.",
  },
];

const CAPTION_LANE: Step[] = [
  {
    n: "06",
    title: "Per-participant caption delivery",
    body: "Each student receives the caption stream only in the language they chose.",
  },
];

const VOICE_LANE: Step[] = [
  {
    n: "07",
    title: "Translated voice",
    body: "The same segment is synthesised as speech in that language.",
  },
  {
    n: "08",
    title: "Individual audio playback",
    body: "Played to that participant alone, mixed under the room audio.",
  },
];

function Connector() {
  return (
    <div className="flex items-center justify-center py-1 lg:px-1 lg:py-0" aria-hidden="true">
      <ChevronDown className="h-4 w-4 text-ink-500 lg:hidden" />
      <ChevronRight className="hidden h-4 w-4 text-ink-500 lg:block" />
    </div>
  );
}

function StepNode({ step, accent = false }: { step: Step; accent?: boolean }) {
  return (
    <div
      className={[
        "flex h-full flex-col rounded-xl border px-4 py-4",
        accent
          ? "border-accent-400/30 bg-accent-400/[0.05]"
          : "border-ink-600/70 bg-ink-850/80",
      ].join(" ")}
    >
      <span
        className={[
          "font-mono text-[11px] tracking-[0.16em]",
          accent ? "text-accent-300" : "text-ivory-400/70",
        ].join(" ")}
      >
        {step.n}
      </span>
      <h3 className="mt-2 text-[14.5px] leading-snug font-semibold text-ivory-50">
        {step.title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-ivory-300/80">{step.body}</p>
    </div>
  );
}

export function HowItWorks() {
  return (
    <Section id="how-it-works" label="How it works" className="bg-ink-950/60">
      <Container>
        <div className="max-w-[720px]">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionTitle className="mt-5">One pipeline. Many outputs.</SectionTitle>
          </Reveal>
          <Reveal delay={0.1}>
            <Lede className="mt-6">
              The teacher speaks once. The transcript is captured once, protected once,
              and translated once per target language. Delivery then happens per
              participant — everyone stays in the same meeting, and nobody joins a
              second room.
            </Lede>
          </Reveal>
        </div>

        {/* ------------------------- capture + protect ----------------------- */}
        <Reveal delay={0.14} className="mt-12 lg:mt-16">
          <p className="nc-eyebrow mb-4">Capture, protect, translate</p>
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            {CAPTURE.map((step, index) => (
              <div key={step.n} className="flex flex-col lg:flex-1 lg:flex-row lg:items-stretch">
                <div className="lg:flex-1">
                  <StepNode step={step} accent={step.n === "04"} />
                </div>
                {index < CAPTURE.length - 1 ? <Connector /> : null}
              </div>
            ))}
          </div>
        </Reveal>

        {/* ------------------------------- fork ------------------------------ */}
        <Reveal delay={0.18} className="mt-10 lg:mt-12">
          <div className="flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-ink-600" />
            <span className="font-mono text-[11px] tracking-[0.16em] text-ivory-400 uppercase">
              two independent lanes
            </span>
            <span className="h-px flex-1 bg-ink-600" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-ink-600/70 bg-ink-850/70 p-4 sm:p-5">
              <p className="nc-eyebrow text-accent-300/80">Caption lane</p>
              <div className="mt-4 flex flex-col">
                {CAPTION_LANE.map((step) => (
                  <StepNode key={step.n} step={step} accent />
                ))}
              </div>
              <p className="mt-4 text-[12.5px] leading-relaxed text-ivory-400">
                Rendered on that student&apos;s screen, in their language only.
              </p>
            </div>

            <div className="rounded-2xl border border-ink-600/70 bg-ink-850/70 p-4 sm:p-5">
              <p className="nc-eyebrow text-lime-300/80">Voice lane</p>
              <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-stretch">
                {VOICE_LANE.map((step, index) => (
                  <div key={step.n} className="flex flex-1 flex-col lg:flex-row lg:items-stretch">
                    <div className="lg:flex-1">
                      <StepNode step={step} />
                    </div>
                    {index < VOICE_LANE.length - 1 ? <Connector /> : null}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[12.5px] leading-relaxed text-ivory-400">
                Heard by that student alone. The room audio is untouched for everyone else.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.22} className="mt-10">
          <div className="rounded-2xl border border-ink-600/70 bg-ink-900/70 px-5 py-5 sm:px-7 sm:py-6">
            <p className="text-[14.5px] leading-relaxed text-ivory-200 sm:text-[16px]">
              The original transcript is the source of truth. Every caption and every
              translated sentence is a derivative of it — never a replacement — so the
              class can always fall back to exactly what the teacher said.
            </p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
