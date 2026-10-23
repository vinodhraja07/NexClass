import { Container, Eyebrow, Lede, Reveal, Section, SectionTitle, Stagger, StaggerItem } from "./Primitives";

const FRICTIONS = [
  {
    title: "Live captions barely exist in Indian languages",
    body: "Real-time captioning is common in English. Reliable, low-latency captions in Tamil, Hindi, Bengali, Marathi and Odia are still the exception, so students rely on a classmate, a recording, or nothing at all.",
  },
  {
    title: "Technical vocabulary gets flattened",
    body: "Torque becomes “turning effect”, angular acceleration is dropped, eigenvalue turns into a spelling guess. The student who needs the precise word is the student who already understands the lecture least.",
  },
  {
    title: "Translation replaces the source",
    body: "When a transcript is overwritten by its translation, the authoritative record of what was actually said is gone. Any dispute about the lecture now rests on a machine's second-hand account.",
  },
  {
    title: "Latency decides whether it works at all",
    body: "A caption that arrives three seconds late belongs to the sentence before. In a derivation, being slightly behind means the student is reading yesterday's equation while the board moves on.",
  },
];

export function ProblemSection() {
  return (
    <Section id="problem" label="The problem">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <Eyebrow>The problem</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <SectionTitle className="mt-5">
                The teacher speaks one language.
                <br />
                The class does not.
              </SectionTitle>
            </Reveal>
            <Reveal delay={0.1}>
              <Lede className="mt-6 max-w-[440px]">
                A lecturer is running a live class in front of students whose first
                languages are different from each other and from the lecturer&apos;s.
                Everyone is in the same room. Almost nobody is in the same language.
              </Lede>
            </Reveal>
          </div>

          <div className="min-w-0">
            <Stagger as="ol" className="divide-y divide-ink-700/60 border-y border-ink-700/60">
              {FRICTIONS.map((item, index) => (
                <StaggerItem
                  as="li"
                  key={item.title}
                  className="grid gap-3 py-7 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-6 lg:py-9"
                >
                  <span className="font-mono text-[12px] tracking-[0.16em] text-ivory-400/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold text-ivory-50 sm:text-[19px]">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 max-w-[640px] text-[14.5px] leading-relaxed text-ivory-300/85 sm:text-[15.5px]">
                      {item.body}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </Container>
    </Section>
  );
}
