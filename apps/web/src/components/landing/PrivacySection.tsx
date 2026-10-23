import { Link2, Lock, ScrollText } from "lucide-react";
import { DEMO_SEGMENTS, languageNativeName } from "@nexclass/shared";
import { Container, Eyebrow, Lede, Reveal, Section, SectionTitle } from "./Primitives";

const ORIGINAL = DEMO_SEGMENTS[1];
const NEXT = DEMO_SEGMENTS[2];
const DERIVATIVES = [
  { code: "ta" as const, segment: "014", source: ORIGINAL },
  { code: "hi" as const, segment: "014", source: ORIGINAL },
  { code: "bn" as const, segment: "015", source: NEXT },
];

const GUARANTEES = [
  "The teacher's original transcript is stored as spoken and is never overwritten by a translation.",
  "Every translated sentence points back to the exact original segment it was produced from.",
  "Switching a participant's language never rewrites anything: it only changes what is delivered to them.",
  "Captions are derived output. The source stays the source, whichever language is on screen.",
];

export function PrivacySection() {
  return (
    <Section id="privacy" label="Privacy and original preservation" className="bg-ink-950/60">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
          <div className="min-w-0">
            <Reveal>
              <Eyebrow>Privacy &amp; preservation</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <SectionTitle className="mt-5">The original is never overwritten.</SectionTitle>
            </Reveal>
            <Reveal delay={0.1}>
              <Lede className="mt-6 max-w-[520px]">
                Translation is a delivery decision, not a rewrite. NexClass keeps the
                source transcript intact and treats every language version as a
                derivative that can always be traced home.
              </Lede>
            </Reveal>

            <Reveal delay={0.15} className="mt-9">
              <ul className="space-y-4">
                {GUARANTEES.map((item) => (
                  <li key={item} className="flex gap-3 text-[14px] leading-relaxed text-ivory-200/85">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* trace visual */}
          <Reveal delay={0.12} className="min-w-0">
            <div className="rounded-2xl border border-ink-600/70 bg-ink-850/70 p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-accent-400" aria-hidden="true" />
                <p className="nc-eyebrow">Transcript store</p>
              </div>

              <div className="mt-5 rounded-xl border border-accent-400/30 bg-accent-400/[0.05] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-accent-300 uppercase">
                    Original · English
                  </span>
                  <span className="rounded-full border border-accent-400/30 px-2 py-0.5 font-mono text-[10.5px] text-accent-200">
                    read-only
                  </span>
                </div>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-ivory-50">
                  {ORIGINAL.originalText}
                </p>
                <p className="mt-3 font-mono text-[11px] text-ivory-400">
                  segment 014 · stored verbatim
                </p>
              </div>

              <div className="mt-3 flex items-center gap-3" aria-hidden="true">
                <span className="h-8 w-px bg-ink-600" />
                <span className="font-mono text-[10.5px] tracking-[0.14em] text-ivory-400 uppercase">
                  derived views
                </span>
              </div>

              <ul className="mt-3 space-y-2.5">
                {DERIVATIVES.map((row) => (
                  <li
                    key={row.code}
                    className="rounded-xl border border-ink-700/70 bg-ink-900/70 p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] font-medium text-ivory-100">
                        {languageNativeName(row.code)}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-md border border-ink-600 bg-ink-850 px-2 py-0.5 font-mono text-[10.5px] text-ivory-300">
                        <Link2 className="h-3 w-3" aria-hidden="true" />
                        links to segment {row.segment}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ivory-300/75">
                      {row.source.translations[row.code]}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
