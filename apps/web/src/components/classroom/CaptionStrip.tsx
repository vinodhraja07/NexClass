import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Captions, Globe2, Radio, Sparkles, Volume2 } from "lucide-react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { languageName, languageNativeName } from "@nexclass/shared";
import type { CaptionSegmentPayload } from "@/lib/transport";
import type { InterimCaption } from "@/hooks/useClassroom";
import type { CaptionMode, CaptionScale } from "@/hooks/useClassroomPreferences";
import { describeTranslation, formatTimestamp } from "./CaptionSegmentCard";
import { TermText } from "./TermText";

const SCALE_CLASSES: Record<CaptionScale, string> = {
  sm: "text-[14px] sm:text-[15px] leading-relaxed",
  md: "text-[16px] sm:text-[18px] leading-relaxed",
  lg: "text-[19px] sm:text-[22px] leading-relaxed",
};

export interface CaptionStripProps {
  segments: CaptionSegmentPayload[];
  interim: InterimCaption | null;
  captionLanguage: LanguageCode;
  captionMode: CaptionMode;
  scale: CaptionScale;
  visible: boolean;
}

/**
 * Premium Live Caption Experience.
 *
 * VisionOS-inspired floating caption stage with dual-language clarity,
 * interactive technical glosses, and crystal-clear Indic typography.
 */
export function CaptionStrip({
  segments,
  interim,
  captionLanguage,
  captionMode,
  scale,
  visible,
}: CaptionStripProps) {
  const reduced = useReducedMotion() ?? false;
  const latest = segments.length > 0 ? segments[segments.length - 1] : null;
  const view = latest ? describeTranslation(latest, captionLanguage) : null;

  if (!visible) return null;

  const isTranslatedMode = captionMode !== "original";
  const originalLang = latest?.originalLanguage ?? "en";
  const isCrossLanguage = isTranslatedMode && originalLang !== captionLanguage;

  return (
    <section
      aria-label="Live captions"
      className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface/90 px-4 py-3.5 backdrop-blur-xl shadow-lg transition-all select-text"
    >
      {/* Subtle top primary accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div aria-live="polite" aria-atomic="true" className="min-h-[64px]">
        <AnimatePresence mode="wait" initial={false}>
          {interim ? (
            <motion.div
              key="interim"
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduced ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="space-y-1.5"
            >
              <div className="flex items-center gap-2 text-2xs font-semibold text-primary">
                <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5">
                  <Radio className="h-3 w-3 animate-pulse text-primary" aria-hidden="true" />
                  <span>{interim.speakerName || "Speaker"}</span>
                  <span className="text-text-secondary">• Live transcribing</span>
                </span>
              </div>
              <p className={clsx("italic text-text-primary/80", SCALE_CLASSES[scale])}>
                {interim.text}…
              </p>
            </motion.div>
          ) : latest && view ? (
            <motion.div
              key={latest.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="space-y-2"
            >
              {/* Speaker & Language Routing Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                <div className="flex flex-wrap items-center gap-1.5 text-2xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                    <Captions className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>{latest.speakerName}</span>
                  </span>
                  <span className="font-mono text-text-secondary">
                    {formatTimestamp(latest.startTime)}
                  </span>

                  {isCrossLanguage ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/80 px-2 py-0.5 text-[11px] text-text-secondary">
                      <span>{languageNativeName(originalLang)}</span>
                      <ArrowRight className="h-2.5 w-2.5 text-primary" aria-hidden="true" />
                      <span className="font-semibold text-primary">
                        {languageNativeName(captionLanguage)}
                      </span>
                    </span>
                  ) : (
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {languageNativeName(originalLang)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-2xs text-text-secondary">
                  {view.latencyMs ? (
                    <span className="font-mono text-[10px] text-text-secondary/70">
                      ⚡ {view.latencyMs}ms
                    </span>
                  ) : null}
                  <span className="hidden sm:inline text-[11px] text-text-secondary/80">
                    {captionMode === "original" ? "Original transcription" : "Real-time AI translation"}
                  </span>
                </div>
              </div>

              {/* Main Caption Typography with Indic Unicode legibility */}
              {captionMode === "original" ? (
                <div className={clsx("text-text-primary font-medium tracking-normal", SCALE_CLASSES[scale])}>
                  <TermText text={latest.originalText} language={captionLanguage} />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <motion.div
                    key={view.text || latest.id}
                    initial={reduced ? {} : { opacity: 0.7, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    lang={captionLanguage}
                    className={clsx(
                      "font-display font-medium text-text-primary tracking-normal leading-relaxed drop-shadow-xs",
                      SCALE_CLASSES[scale],
                    )}
                  >
                    {view.status === "complete" && view.text ? (
                      view.text
                    ) : view.status === "failed" ? (
                      <span className="text-sm text-signal-live">
                        Translation temporarily unavailable for this segment.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm text-secondary-accent">
                        <Sparkles className="h-3.5 w-3.5 animate-spin text-secondary-accent" />
                        Translating into {languageNativeName(captionLanguage)}…
                      </span>
                    )}
                  </motion.div>

                  {/* Subtitle cross-reference original for technical learning */}
                  {isCrossLanguage && latest.originalText && (
                    <div className="flex items-start gap-1.5 pt-0.5 text-2xs text-text-secondary/80 border-t border-border/30">
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-text-secondary/60 shrink-0">
                        ORIGINAL:
                      </span>
                      <p className="line-clamp-1 italic text-text-secondary">
                        <TermText text={latest.originalText} language={captionLanguage} />
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0 }}
              className="flex items-center gap-2.5 text-text-secondary py-1"
            >
              <div className="grid h-8 w-8 place-items-center rounded-xl border border-border/60 bg-background/50">
                <Captions className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-primary">
                  Live multilingual captions ready
                </p>
                <p className="text-2xs text-text-secondary">
                  Captions in {languageNativeName(captionLanguage)} will appear here automatically when the teacher speaks.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
