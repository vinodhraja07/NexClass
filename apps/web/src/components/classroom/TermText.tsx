import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpenCheck, Volume2 } from "lucide-react";
import clsx from "clsx";
import { defaultTtsTag, type LanguageCode } from "@nexclass/shared";
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
function odiaToDevanagariPhonetic(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 0x0B71) {
      result += "\u0935";
    } else if (code >= 0x0B00 && code <= 0x0B7F) {
      result += String.fromCharCode(code - 0x0200);
    } else {
      result += text[i];
    }
  }
  return result;
}

export function TermText({ text, language, className }: TermTextProps) {
  const reduced = useReducedMotion() ?? false;
  const [selected, setSelected] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current = null;
                        }
                        const isOdia = language === "or";
                        const textToSpeak = selectedTerm.localized || selectedTerm.canonical;
                        try {
                          const res = await fetch(
                            `/api/demo/speech?lang=${encodeURIComponent(language)}&text=${encodeURIComponent(textToSpeak)}`,
                            { signal: AbortSignal.timeout(6_000) },
                          );
                          if (res.ok) {
                            const data = (await res.json()) as { audioUrl?: string };
                            if (data.audioUrl) {
                              const audio = new Audio(data.audioUrl);
                              audioRef.current = audio;
                              audio.onended = () => {
                                if (audioRef.current === audio) audioRef.current = null;
                              };
                              await audio.play();
                              return;
                            }
                          }
                        } catch {
                          // fallback to local SpeechSynthesis
                        }
                        if (typeof window !== "undefined" && "speechSynthesis" in window) {
                          window.speechSynthesis.cancel();
                          const spoken = isOdia
                            ? odiaToDevanagariPhonetic(textToSpeak)
                            : textToSpeak;
                          const utt = new SpeechSynthesisUtterance(spoken);
                          utt.lang = isOdia ? "hi-IN" : (defaultTtsTag(language) || language);
                          utt.rate = 0.9;
                          window.speechSynthesis.speak(utt);
                        }
                      }}
                      title={`Listen to pronunciation in ${language}`}
                      aria-label={`Listen to pronunciation of ${selectedTerm.localized}`}
                      className="nc-focus ml-1.5 inline-flex items-center gap-1 rounded bg-accent-400/15 px-1.5 py-0.5 text-3xs text-accent-300 transition-colors hover:bg-accent-400/25 cursor-pointer"
                    >
                      <Volume2 className="h-2.5 w-2.5" aria-hidden="true" />
                      <span>Hear</span>
                    </button>
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
