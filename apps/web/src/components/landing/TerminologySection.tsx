import type { ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";
import { DEMO_SEGMENTS, languageNativeName, type LanguageCode } from "@nexclass/shared";
import { GLOSSARY_BY_ID, localizedEquivalent } from "@nexclass/terminology";
import { Container, Reveal, Section } from "./Primitives";

const SEGMENT = DEMO_SEGMENTS[1];
const ROWS: LanguageCode[] = ["ta", "hi", "bn", "mr", "or"];

const PROTECTED = /\(([^)]*[A-Za-z][^)]*)\)/g;

/**
 * Renders a translated line, highlighting the glossary terms that were locked
 * before translation and therefore survived it.
 */
function ProtectedLine({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  PROTECTED.lastIndex = 0;
  while ((match = PROTECTED.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    nodes.push(
      <span
        key={`${match.index}-${match[0]}`}
        className="mx-0.5 inline-flex items-center rounded-md border border-accent-500/40 bg-accent-500/10 px-1.5 py-0.5 align-middle font-mono text-[0.82em] font-medium text-accent-700"
      >
        {match[1]}
      </span>,
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <>{nodes}</>;
}

const GLOSSARY_ROWS = [
  { id: "torque", label: "torque" },
  { id: "angular-acceleration", label: "angular acceleration" },
  { id: "eigenvalue", label: "eigenvalue" },
];

const GLOSSARY_COLUMNS: LanguageCode[] = ["ta", "hi", "bn"];

export function TerminologySection() {
  return (
    <Section
      id="terminology"
      label="Terminology protection"
      className="!border-ivory-200 bg-ivory-50 text-ink-900"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            <Reveal>
              <p className="nc-eyebrow flex items-center gap-2.5 !text-ink-600/80">
                <span className="h-px w-6 bg-accent-600" aria-hidden="true" />
                Terminology protection
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <h2 className="mt-5 text-balance text-[30px] leading-[1.08] font-semibold text-ink-950 sm:text-[38px] lg:text-[44px]">
                Technical words survive the translation.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-6 max-w-[620px] text-[15px] leading-relaxed text-ink-700/85 sm:text-[17px]">
                Before anything is translated, the transcript is checked against a
                subject glossary. Matched terms are held in place and carried across
                the language boundary, so a student is never left guessing what the
                teacher meant.
              </p>
            </Reveal>

            {/* original sentence */}
            <Reveal delay={0.14} className="mt-10">
              <div className="rounded-2xl border border-ivory-300 bg-ivory-100/70 p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] tracking-[0.16em] text-ink-600 uppercase">
                    Original · English
                  </p>
                  <span className="rounded-full border border-ink-900/15 px-2.5 py-0.5 font-mono text-[10.5px] text-ink-600">
                    authoritative
                  </span>
                </div>
                <p className="mt-4 text-[19px] leading-snug font-medium text-ink-950 sm:text-[24px]">
                  {SEGMENT.originalText}
                </p>
              </div>
            </Reveal>

            {/* translated rows */}
            <Reveal delay={0.18} className="mt-4">
              <p className="mb-2 flex items-center gap-2 text-[12px] text-ink-600">
                <span className="inline-flex items-center rounded-md border border-accent-500/40 bg-accent-500/10 px-1.5 py-0.5 font-mono text-[10.5px] text-accent-700">
                  torque
                </span>
                <span>glossary terms are held in place and highlighted</span>
              </p>
              <ul className="divide-y divide-ivory-300 overflow-hidden rounded-2xl border border-ivory-300 bg-ivory-100/40">
                {ROWS.map((code) => (
                  <li key={code} className="px-4 py-4 sm:px-6 sm:py-5">
                    <p className="text-[13px] font-semibold text-ink-800">
                      {languageNativeName(code)}
                    </p>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-ink-800 sm:text-[16px]">
                      <ProtectedLine text={SEGMENT.translations[code] ?? ""} />
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.22} className="mt-6">
              <p className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink-700/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
                <span>
                  The original English transcript is always available as the
                  authoritative reference. A translation never replaces it, and every
                  translated sentence links back to the exact segment it came from.
                </span>
              </p>
            </Reveal>
          </div>

          {/* glossary table */}
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <Reveal delay={0.12} className="lg:pt-24">
            <div className="min-w-0 rounded-2xl border border-ivory-300 bg-white/70 p-5 sm:p-6">
              <p className="font-mono text-[11px] tracking-[0.16em] text-ink-600 uppercase">
                Glossary · mechanics &amp; linear algebra
              </p>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-ivory-300">
                      <th scope="col" className="pb-2.5 pr-3 text-[11.5px] font-semibold text-ink-600">
                        Term
                      </th>
                      {GLOSSARY_COLUMNS.map((code) => (
                        <th
                          key={code}
                          scope="col"
                          className="pb-2.5 pr-3 text-[11.5px] font-semibold text-ink-600"
                        >
                          {languageNativeName(code)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GLOSSARY_ROWS.map((row) => {
                      const term = GLOSSARY_BY_ID.get(row.id);
                      if (!term) return null;
                      return (
                        <tr key={row.id} className="border-b border-ivory-200 last:border-b-0">
                          <th scope="row" className="py-3 pr-3 align-top">
                            <span className="font-mono text-[12.5px] font-medium text-ink-900">
                              {term.term}
                            </span>
                          </th>
                          {GLOSSARY_COLUMNS.map((code) => {
                            const equivalent = localizedEquivalent(term, code);
                            return (
                              <td key={code} className="py-3 pr-3 align-top">
                                {equivalent ? (
                                  <span className="flex items-start gap-1.5">
                                    <span className="text-[13px] text-ink-800">
                                      {equivalent.text}
                                    </span>
                                    {equivalent.verified ? (
                                      <Check
                                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600"
                                        aria-label="Verified equivalent"
                                      />
                                    ) : (
                                      <CircleAlert
                                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9A5B00]"
                                        aria-label="Transliteration, under review"
                                      />
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-[13px] text-ink-500">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-ink-600">
                Where a local academic equivalent has not been verified, the English term
                is carried through unchanged rather than approximated — and it is always
                flagged as under review.
              </p>
            </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
