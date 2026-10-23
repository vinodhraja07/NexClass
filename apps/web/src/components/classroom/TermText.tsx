import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpenCheck } from "lucide-react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { describeTerm, detectTerms } from "@nexclass/terminology";

export interface TermTextProps {
  text: string;
  /** The language the reader is looking at - the gloss is localised for it. */
  language: LanguageCode;
  className?: string;
}

/**
 * Renders a transcript with the protected technical vocabulary highlighted.
 *
 * Every glossary hit keeps the English original visible and offers the
 * localised equivalent next to it, so a Tamil reader can look up "torque"
 * without losing the exact wording the teacher used.
 */
export function TermText({ text, language, className }: TermTextProps) {
  const reduced = useReducedMotion() ?? false;
  const [selected, setSelected] = useState<string | null>(null);

  const detections = useMemo(() => detectTerms(text ?? ""), [text]);

  const pieces = useMemo(() => {
    if (!text) return [];
    if (detections.length === 0) return [{ kind: "text" as const, value: text }];
    const out: Array<{ kind: "text" | "term"; value: string; termId?: string }> = [];
    let cursor = 0;
    detections.forEach((detection) => {
      if (detection.offset > cursor) {
        out.push({ kind: "text", value: text.slice(cursor, detection.offset) });
      }
      out.push({
        kind: "term",
        value: text.slice(detection.offset, detection.offset + detection.length),
        termId: detection.term.id,
      });
      cursor = detection.offset + detection.length;
    });
    if (cursor < text.length) out.push({ kind: "text", value: text.slice(cursor) });
    return out;
  }, [detections, text]);

  const selectedTerm = selected ? describeTerm(selected, language) : null;

  return (
    <span className={className}>
      {pieces.map((piece, index) => {
        if (piece.kind === "text") {
          return <span key={`t-${index}`}>{piece.value}</span>;
        }
        const termId = piece.termId!;
        const info = describeTerm(termId, language);
        const isActive = selected === termId;
        return (
          <button
            key={`k-${termId}-${index}`}
            type="button"
            onClick={() => setSelected(isActive ? null : termId)}
            aria-label={`Technical term ${info.canonical}. ${
              info.localized ? `Local equivalent ${info.localized}.` : ""
            } Show the glossary entry.`}
            className={clsx(
              "nc-focus mx-0.5 inline rounded px-0.5 text-left underline decoration-dotted decoration-accent-400/70 underline-offset-4 transition-colors",
              isActive ? "bg-accent-400/20 text-accent-200" : "text-ivory-50 hover:bg-accent-400/10",
            )}
          >
            {piece.value}
          </button>
        );
      })}

      <AnimatePresence initial={false}>
        {selectedTerm ? (
          <motion.span
            key={selectedTerm.canonical}
            initial={reduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-2 block overflow-hidden"
          >
            <span className="flex items-start gap-2 rounded-lg border border-accent-400/25 bg-accent-400/8 px-2.5 py-2 text-2xs leading-relaxed text-ivory-200">
              <BookOpenCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-300" aria-hidden="true" />
              <span>
                <span className="font-semibold text-ivory-50">{selectedTerm.canonical}</span>
                {selectedTerm.localized ? (
                  <>
                    {" - "}
                    <span lang={language} className="text-accent-200">
                      {selectedTerm.localized}
                    </span>
                    {!selectedTerm.verified ? (
                      <span className="text-ivory-400"> (transliteration, still under review)</span>
                    ) : null}
                  </>
                ) : null}
                {selectedTerm.definition ? (
                  <span className="block text-ivory-400">{selectedTerm.definition}</span>
                ) : null}
              </span>
            </span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
