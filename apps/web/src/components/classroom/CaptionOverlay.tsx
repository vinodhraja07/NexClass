import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Captions, Radio, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { LanguageCode } from "@nexclass/shared";
import { languageNativeName } from "@nexclass/shared";
import type { CaptionSegmentPayload } from "@/lib/transport";
import type { InterimCaption } from "@/hooks/useClassroom";
import type { CaptionMode, CaptionScale } from "@/hooks/useClassroomPreferences";
import { describeTranslation } from "./CaptionSegmentCard";
import { TermText } from "./TermText";

const SCALE_CLASSES: Record<CaptionScale, string> = {
  sm: "text-[14px] sm:text-[15px] leading-relaxed",
  md: "text-[16px] sm:text-[18px] leading-relaxed",
  lg: "text-[19px] sm:text-[22px] leading-relaxed",
};

export interface CaptionOverlayProps {
  segments: CaptionSegmentPayload[];
  interim: InterimCaption | null;
  captionLanguage: LanguageCode;
  captionMode: CaptionMode;
  scale: CaptionScale;
  visible: boolean;
  className?: string;
}

/**
 * Google Meet-Style Floating Caption Overlay.
 *
 * Floats directly over the bottom of the video grid like native Google Meet
 * closed captions, with translucent glass background and dual-language clarity.
 */
export function CaptionOverlay({
  segments,
  interim,
  captionLanguage,
  captionMode,
  scale,
  visible,
  className,
}: CaptionOverlayProps) {
  const reduced = useReducedMotion() ?? false;
  const [activeLatest, setActiveLatest] = useState<CaptionSegmentPayload | null>(null);

  // Auto-dismiss after 7 seconds of inactivity
  useEffect(() => {
    if (segments.length === 0) return;
    const item = segments[segments.length - 1];
    setActiveLatest(item);
    const timer = window.setTimeout(() => {
      setActiveLatest(null);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [segments]);

  if (!visible) return null;

  const isTranslatedMode = captionMode !== "original";
  const originalLang = activeLatest?.originalLanguage ?? "en";
  const isCrossLanguage = isTranslatedMode && originalLang !== captionLanguage;
  const view = activeLatest ? describeTranslation(activeLatest, captionLanguage) : null;

  return (
    <div
      className={clsx(
        "pointer-events-none absolute bottom-4 inset-x-0 z-20 flex justify-center px-4",
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {interim ? (
          /* Live interim transcription - aria-hidden to prevent screen reader flood */
          <motion.div
            key="interim"
            aria-hidden="true"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto max-w-3xl rounded-2xl bg-black/75 px-5 py-3 text-white backdrop-blur-xl shadow-2xl border border-white/10"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              <span>{interim.speakerName || "Speaker"}</span>
              <span className="text-white/60 font-normal">• Transcribing live</span>
            </div>
            <p className={clsx("italic text-white/90 font-medium", SCALE_CLASSES[scale])}>
              {interim.text}…
            </p>
          </motion.div>
        ) : activeLatest && view ? (
          /* Finalized caption - aria-live announced once to screen readers */
          <motion.div
            key={activeLatest.id}
            aria-live="polite"
            aria-atomic="true"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="pointer-events-auto max-w-3xl rounded-2xl bg-black/80 px-5 py-3 text-white backdrop-blur-xl shadow-2xl border border-white/10"
          >
            {/* Header: Speaker + Language Routing */}
            <div className="flex items-center gap-2 pb-1 text-xs text-white/70">
              <span className="font-semibold text-white drop-shadow-sm">
                {activeLatest.speakerName}:
              </span>

              {isCrossLanguage && (
                <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
                  <span>{languageNativeName(originalLang)}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-primary" />
                  <span className="font-bold text-primary">
                    {languageNativeName(captionLanguage)}
                  </span>
                </span>
              )}
            </div>

            {/* Captions Body with Indic Font Optimization */}
            {captionMode === "original" ? (
              <div className={clsx("text-white font-medium drop-shadow-sm", SCALE_CLASSES[scale])}>
                <TermText text={activeLatest.originalText} language={captionLanguage} />
              </div>
            ) : (
              <div className="space-y-1">
                <p
                  lang={captionLanguage}
                  className={clsx(
                    "font-display font-medium text-white drop-shadow-sm tracking-normal leading-relaxed",
                    SCALE_CLASSES[scale],
                  )}
                >
                  {view.status === "complete" && view.text ? (
                    view.text
                  ) : view.status === "failed" ? (
                    <span className="text-sm text-rose-300">
                      Translation unavailable for this phrase.
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-amber-200">
                      <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-300" />
                      Translating into {languageNativeName(captionLanguage)}…
                    </span>
                  )}
                </p>

                {/* Subtitle cross-reference original for technical glossary */}
                {isCrossLanguage && activeLatest.originalText && (
                  <p className="line-clamp-1 text-2xs italic text-white/60 pt-0.5 border-t border-white/10">
                    <TermText text={activeLatest.originalText} language={captionLanguage} />
                  </p>
                )}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
