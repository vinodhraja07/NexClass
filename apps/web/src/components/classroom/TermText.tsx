import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpenCheck, Volume2, X } from "lucide-react";
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
 * Phonetic transliteration from Odia unicode range to Devanagari range
 * for browser speech synthesis fallback when native Odia TTS voice is unavailable.
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

/**
 * Renders a transcript with protected technical vocabulary highlighted.
 *
 * Offers floating popover cards with tooltip arrow and terminology definition pill,
 * with high-contrast Indic typography rendering and zero-jump spring animations.
 */
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

  // Dismiss on Escape key or clicking outside
  useEffect(() => {
    if (!selected) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    const handlePointerDown = () => {
      setSelected(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [selected]);

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

  const springTransition = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 30 };

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
          <span key={`term-wrapper-${termId}-${index}`} className="relative inline-block">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelected(isActive ? null : termId);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Technical term ${info.canonical}. ${
                info.localized ? `Local equivalent ${info.localized}.` : ""
              } Show the glossary entry.`}
              aria-expanded={isActive}
              className={clsx(
                "nc-focus mx-0.5 inline rounded px-1 py-0.5 text-left underline decoration-dotted decoration-accent-400/70 underline-offset-4 transition-colors font-medium cursor-pointer",
                isActive
                  ? "bg-accent-400/25 text-accent-200"
                  : "text-ivory-50 hover:bg-accent-400/15",
              )}
            >
              {piece.value}
            </button>

            {/* Floating Popover Card with Tooltip Arrow and Definition Pill */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.95 }}
                  transition={springTransition}
                  onPointerDown={(e) => e.stopPropagation()}
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-40 block w-72 sm:w-80 cursor-default text-left pointer-events-auto"
                >
                  <span className="relative block rounded-xl border border-accent-400/35 bg-[#171527]/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 text-ivory-200">
                    {/* Tooltip downward arrow */}
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-accent-400/35 bg-[#171527]"
                    />

                    {/* Popover Header & Terminology Definition Pill */}
                    <span className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-400/20 px-2 py-0.5 text-3xs font-bold text-accent-300 uppercase tracking-wider shrink-0">
                          <BookOpenCheck className="h-3 w-3" />
                          <span>Glossary</span>
                        </span>
                        <span className="font-semibold text-white text-xs drop-shadow-sm truncate">
                          {info.canonical}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(null);
                        }}
                        className="text-ivory-400 hover:text-white p-0.5 rounded transition-colors"
                        aria-label="Close glossary popover"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>

                    {/* Localized Term & Pronunciation Audio */}
                    {info.localized ? (
                      <span className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-baseline gap-1.5 min-w-0">
                          <span className="text-3xs text-ivory-400 uppercase shrink-0">In {language.toUpperCase()}:</span>
                          <span
                            lang={language}
                            className="font-indic text-sm font-semibold text-accent-300 leading-[1.6] truncate"
                          >
                            {info.localized}
                          </span>
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
                            const textToSpeak = info.localized || info.canonical;
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
                          aria-label={`Listen to pronunciation of ${info.localized}`}
                          className="nc-focus inline-flex items-center gap-1 rounded bg-accent-400/20 px-2 py-0.5 text-3xs font-medium text-accent-300 transition-colors hover:bg-accent-400/30 cursor-pointer shrink-0"
                        >
                          <Volume2 className="h-3 w-3" aria-hidden="true" />
                          <span>Hear</span>
                        </button>
                      </span>
                    ) : null}

                    {/* Definition Text */}
                    {info.definition ? (
                      <span className="block text-2xs leading-relaxed text-ivory-300 font-normal">
                        {info.definition}
                      </span>
                    ) : null}

                    {!info.verified && info.localized ? (
                      <span className="block pt-1 text-3xs italic text-amber-300/80">
                        * Phonetic transliteration for pronunciation
                      </span>
                    ) : null}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}
